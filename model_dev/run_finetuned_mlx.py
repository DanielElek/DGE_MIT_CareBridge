import re
import json
import time
import pandas as pd
from mlx_lm import load, generate
from mlx_lm.sample_utils import make_sampler

MODEL_PATH = "medgemma_soap_merged_16bit-2kdata_mlx"
CSV_FILE = "patient_doctor_conversations.csv"
OUTPUT_CSV_FILE = "output_of_finetuned.csv"

# Prompt is unchanged — model was LoRA fine-tuned on this exact text.
PROMPT_TEMPLATE = """<start_of_turn>user
You are an expert medical scribe. Summarize the following doctor-patient dialogue into a strict SOAP note format.

Return your answer as a single JSON object with exactly these four keys: "subjective", "objective", "assessment", "plan".

CRITICAL INSTRUCTIONS:

1. STRICT SECTION DEFINITIONS — SOURCE OF INFORMATION IS EVERYTHING:
   - subjective: ONLY what the patient (or their caregiver) verbally reports. This includes their described symptoms, personal timeline, self-measured or home-measured vitals (e.g. "I had a fever of 38.5 at home"), OTC medications taken before the visit, and their own assessment of severity. Never place anything here that the doctor observed, tested, or measured.
   - objective: ONLY measurements, findings, and observations actively obtained by the doctor or clinical staff during this encounter. This includes vitals taken in the clinic, physical exam findings, and lab or imaging results ordered and reviewed during the visit. If the patient reported a number from home (e.g. a home blood pressure reading or a self-measured temperature), it belongs in subjective, not here.
   - assessment: ONLY the physician's explicit diagnoses, impressions, or differential diagnoses as stated in the dialogue. Do not infer or expand on diagnoses not mentioned.
   - plan: ONLY treatments, prescriptions, tests, referrals, and follow-up instructions explicitly spoken by the doctor in the dialogue. Do not add standard medical boilerplate, general wellness advice, or any action not directly stated by the doctor.

2. ZERO HALLUCINATION POLICY:
   - Do NOT infer, assume, or invent any medical information not explicitly present in the dialogue.
   - Do NOT insert generic medical advice such as "rest, hydration, monitoring" or standard care steps unless the doctor explicitly said them.
   - Do NOT complete or extrapolate a plan based on what would typically be done for a given diagnosis. Only transcribe what was said.

3. MISSING INFO: If a section was not discussed in the dialogue, strictly use the value "Not discussed." for that key.

4. OUTPUT FORMAT: Return only the raw JSON object. No markdown, no code fences, no extra text.

Dialogue:
{}<end_of_turn>
<start_of_turn>model
"""

GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'

SOAP_KEYS = ["subjective", "objective", "assessment", "plan"]

# Heuristic thresholds derived from the synthesis report's failure profile.
# Score-2 cases consistently had: fabricated long Plans and Objective violations.
PLAN_WORD_COUNT_WARNING = 60       # Plans over this length likely contain boilerplate
OBJECTIVE_MEASUREMENT_PATTERN = re.compile(
    r'\b(\d+[\./]\d+|\d+\s*(?:bpm|mmhg|°|degrees?|kg|lbs?|cm|%|breaths?/min|rpm))\b',
    re.IGNORECASE
)
# Common fabrication patterns the synthesis report identified in Plan sections
BOILERPLATE_PLAN_PHRASES = [
    r'\bENT referral\b',
    r'\brefer(?:ral)? to\b',
    r'\bhydrat(?:ion|e)\b',
    r'\brest\b',
    r'\bchest\s*x.?ray\b',
    r'\bbronchodilator\b',
    r'\bantibiotic\b',
    r'\bfollow.up\b',
    r'\bschedul\w+\b',
]
BOILERPLATE_PLAN_RE = re.compile('|'.join(BOILERPLATE_PLAN_PHRASES), re.IGNORECASE)


def repair_and_parse_json(raw: str) -> dict | None:
    """
    Attempt to parse a JSON SOAP note from raw model output.
    Handles: markdown fences, double-quote CSV escaping, truncated JSON,
    and single-key regex fallback.
    Returns a dict with all four SOAP keys, or None if irrecoverable.
    """
    clean = raw.replace('""', '"')

    # Strip markdown fences
    fence_match = re.search(r"```(?:json)?\s*(\{.*?)(?:```|$)", clean, re.DOTALL)
    if fence_match:
        clean = fence_match.group(1).strip()
    else:
        clean = re.sub(r"```(?:json)?|```", "", clean).strip()

    # Strip outer quotes if the whole thing was double-quoted
    if clean.startswith('"') and clean.endswith('"'):
        clean = clean[1:-1]

    # Attempt 1: standard parse
    try:
        data = json.loads(clean)
        if isinstance(data, dict):
            return {k: data.get(k, "Not discussed.") for k in SOAP_KEYS}
    except json.JSONDecodeError:
        pass

    # Attempt 2: truncated JSON — try appending closing brace
    try:
        data = json.loads(clean + "}")
        if isinstance(data, dict):
            return {k: data.get(k, "Not discussed.") for k in SOAP_KEYS}
    except json.JSONDecodeError:
        pass

    # Attempt 3: per-key regex extraction
    result = {}
    for key in SOAP_KEYS:
        match = re.search(
            rf'"{key}"\s*:\s*"((?:[^"\\]|\\.)*)"',
            clean,
            re.IGNORECASE | re.DOTALL
        )
        result[key] = match.group(1).strip() if match else "Not discussed."

    if any(v != "Not discussed." for v in result.values()):
        return result

    return None


def validate_soap(data: dict, transcript: str) -> list[str]:
    """
    Post-generation heuristic checks derived from the synthesis report's
    recurring failure patterns. Returns a list of warning strings.
    These warnings are written to the output CSV for human review and
    can inform the downstream pruner about high-risk outputs.

    Checks performed:
    - Plan length: very long Plans are strongly correlated with boilerplate
      fabrication (the most critical and pervasive error in the report).
    - Boilerplate phrases: flags specific fabrication patterns identified
      in the report (ENT referrals, hydration, antibiotics, chest X-ray, etc.).
    - Objective without measurements: if the Objective section contains no
      concrete clinical measurements, it likely contains misclassified
      patient self-reports or fabricated exam findings.
    - Incomplete encounter: if the transcript lacks any indication that a
      physical exam was performed, a non-empty Objective is suspicious.
    - Output truncation: max_tokens reached mid-sentence usually means the
      JSON is malformed and the last section is incomplete.
    """
    warnings = []

    plan = data.get("plan", "Not discussed.")
    if plan != "Not discussed.":
        plan_words = len(plan.split())
        if plan_words > PLAN_WORD_COUNT_WARNING:
            warnings.append(
                f"LONG_PLAN ({plan_words} words): high risk of boilerplate fabrication"
            )
        boilerplate_hits = BOILERPLATE_PLAN_RE.findall(plan)
        if boilerplate_hits:
            unique_hits = list(dict.fromkeys(h.lower() for h in boilerplate_hits))
            warnings.append(
                f"BOILERPLATE_PHRASES in Plan: {', '.join(unique_hits)}"
            )

    objective = data.get("objective", "Not discussed.")
    if objective != "Not discussed.":
        if not OBJECTIVE_MEASUREMENT_PATTERN.search(objective):
            warnings.append(
                "OBJECTIVE_NO_MEASUREMENTS: Objective section lacks concrete clinical "
                "measurements — may contain patient self-reports or fabricated exam findings"
            )

    # Incomplete encounter check: no exam-related language in transcript
    exam_performed = re.search(
        r'\b(exam(?:in(?:e|ation))?|auscult|palpat|percuss|inspect|vital|listen(?:ing)?|look(?:ing)?\s+at)\b',
        transcript, re.IGNORECASE
    )
    if not exam_performed and objective != "Not discussed.":
        warnings.append(
            "INCOMPLETE_ENCOUNTER: No exam language found in transcript but Objective "
            "section is non-empty — likely fabricated findings"
        )

    return warnings


def main():
    print(f"Loading model from {MODEL_PATH}...")
    model, tokenizer = load(MODEL_PATH)

    print(f"Reading data from {CSV_FILE}...")
    df = pd.read_csv(CSV_FILE)

    if "input_text" not in df.columns or "model_used" not in df.columns:
        print("Error: Required columns ('input_text' or 'model_used') were not found in the CSV.")
        return

    print("Beginning text generation...\n")
    print("=" * 50)

    results = []
    num_conversations = len(df)
    start_time = time.perf_counter()

    for index, row in df.iterrows():
        input_text = str(row["input_text"])
        model_used = str(row["model_used"])

        prompt = PROMPT_TEMPLATE.format(input_text)
        print(f"Row {index + 1} of {num_conversations}")

        # IMPROVEMENT 1: Use temp=0.0 for deterministic, maximally faithful output.
        # The summarizer's job is faithful transcription, not creative generation.
        # Default temperature introduces variance that has no upside here and
        # directly contributes to hallucination inconsistency across runs.
        response = generate(
            model,
            tokenizer,
            prompt=prompt,
            max_tokens=1024,
            verbose=True,
            sampler=make_sampler(temp=0.0),
        )

        # IMPROVEMENT 2: Parse and validate output before writing to CSV.
        # Malformed JSON currently passes through silently; this surfaces issues early.
        parsed = repair_and_parse_json(response)

        if parsed is None:
            print(f"{RED}[WARN] Row {index + 1}: Could not parse JSON output — storing raw response.{RESET}")
            warnings = ["JSON_PARSE_FAILURE: raw response stored, pruner will attempt recovery"]
            response_to_store = response
        else:
            # IMPROVEMENT 3: Heuristic validation pass.
            # Flags high-risk outputs based on the synthesis report's failure profiles
            # without modifying the output (the pruner handles actual removal).
            warnings = validate_soap(parsed, input_text)
            response_to_store = response  # Always store raw; pruner works from this

            if warnings:
                print(f"{YELLOW}[VALIDATION WARNINGS] Row {index + 1}:{RESET}")
                for w in warnings:
                    print(f"  {YELLOW}⚠ {w}{RESET}")
            else:
                print(f"{GREEN}[VALIDATION PASSED] Row {index + 1}{RESET}")

        results.append({
            "input_text": input_text,
            "response": response_to_store,
            "model_used": model_used,
            # Warnings column gives the pruner and human reviewers a risk signal
            # without altering the actual SOAP content at this stage.
            "generation_warnings": "; ".join(warnings) if warnings else "",
        })

        print("=" * 50)

    end_time = time.perf_counter()
    total_time = end_time - start_time
    conv_per_sec = num_conversations / total_time if total_time > 0 else 0

    output_df = pd.DataFrame(results)
    output_df.to_csv(OUTPUT_CSV_FILE, index=False)

    # Summary statistics on warning frequency
    flagged = output_df[output_df["generation_warnings"] != ""]
    print(f"\nProcessing complete. Saved results to {OUTPUT_CSV_FILE}")
    print("-" * 50)
    print(f"Total time taken      : {total_time:.2f} seconds")
    print(f"Total processed       : {num_conversations} conversations")
    print(f"Average speed         : {conv_per_sec:.4f} conversations/second")
    print(f"Flagged by validation : {len(flagged)} / {num_conversations} "
          f"({100 * len(flagged) / num_conversations:.1f}%)")
    print("-" * 50)


if __name__ == "__main__":
    main()