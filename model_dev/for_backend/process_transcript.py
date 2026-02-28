import re
import json
import time
import gc
from mlx_lm import load, generate
from mlx_lm.sample_utils import make_sampler

# Define both models for their specific tasks
MODEL_PATH_LORA = "medgemma_soap_merged_16bit-2kdata_mlx"
MODEL_PATH_VANILLA = "medgemma_4b_q4_vanilla_mlx"

INPUT_FILE = "formatted_dialogue.txt"
OUTPUT_FILE = "final_soap_summary.json"

GREEN = '\033[92m'
BLUE = '\033[94m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'

# --- Prompt Templates ---

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

VERIFY_SENTENCE_PROMPT = """<start_of_turn>user
Original Transcript:
{transcript}

SOAP Section Being Evaluated: {section}
Section Rule: {section_rule}

Claim to verify: "{sentence}"

TASK: Determine whether this claim should be KEPT or flagged as a HALLUCINATION.

ANSWER YES (KEEP) only if ALL of the following are true:
  1. The underlying information is directly stated in the transcript, or is a legitimate clinical
     paraphrase of transcript content (e.g. "rhinorrhea" for "runny nose").
  2. The claim is placed in the correct SOAP section per the Section Rule above.
  3. If the claim is in the Objective section, it reflects a finding the clinician actually
     observed or measured during the encounter — NOT a patient self-report, NOT a planned
     exam step, and NOT a finding from a prior visit unless re-confirmed today.

ANSWER HALLUCINATION if ANY of the following are true:
  1. The claim introduces details not present in the transcript (fabricated medications,
     referrals, diagnostics, follow-up instructions, or exam findings not mentioned).
  2. The claim misrepresents transcript content (e.g. states "no fever" when the transcript
     describes a resolved fever).
  3. The claim is in the wrong SOAP section — e.g. a patient self-report in the Objective
     section, or a planned action in the Assessment section.
  4. The claim is an Objective finding but the physical exam had not yet been performed
     in the transcript. In that case, fabricated exam findings are hallucinations.

IMPORTANT: Adverse reactions or medication intolerances explicitly mentioned by the patient
(e.g. "decongestant made my heart race") must be KEPT if they appear in the transcript,
regardless of which section they are in — flag only if misplaced in Objective.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
Answer: [YES or HALLUCINATION]
Reason: [one sentence explaining why]
Quote: [EXACT QUOTE FROM TRANSCRIPT supporting the claim, if Answer is YES | None if HALLUCINATION]
<end_of_turn>
<start_of_turn>model
"""

# --- Rules and Constants ---

SOAP_KEYS = ["subjective", "objective", "assessment", "plan"]

SOAP_SECTION_RULES = {
    "Subjective": (
        "patient-reported symptoms, history, complaints, and concerns described in the patient's own words. "
        "Includes: symptom onset, duration, severity ratings, positional effects, sleep disruption, "
        "failed self-treatments, adverse reactions to medications, and sensations (e.g. 'choking feeling', "
        "'bowling ball sensation'). "
        "DOES NOT INCLUDE: clinician-measured findings or diagnostic test results."
    ),
    "Objective": (
        "ONLY findings directly observed or measured by the clinician during this encounter: "
        "physical exam findings, vital signs taken in-office, and test results already available. "
        "MUST NOT INCLUDE: (a) patient self-reports or home measurements presented as clinical findings, "
        "(b) symptoms the patient described — those belong in Subjective, "
        "(c) planned exam steps not yet performed, "
        "(d) any information from before this encounter unless re-confirmed by the clinician today. "
        "If the physical exam had not yet been performed at the time of the dialogue, "
        "the only acceptable Objective content is 'Physical examination pending' or equivalent."
    ),
    "Assessment": (
        "the clinician's diagnostic impression or differential diagnosis, synthesized from the subjective "
        "and objective findings. Must reflect what the clinician expressed during the encounter, "
        "not inferred standard-of-care conclusions."
    ),
    "Plan": (
        "ONLY treatments, medications, referrals, diagnostics, or follow-up steps that were explicitly "
        "discussed or ordered by the clinician during this specific encounter. "
        "MUST NOT INCLUDE actions that represent standard-of-care defaults not mentioned in the dialogue "
        "(e.g. ENT referrals, hydration advice, antibiotic prescriptions, chest X-rays, or follow-up "
        "scheduling unless the clinician explicitly mentioned them). "
        "If a plan element cannot be traced to a direct statement in the transcript, it is a hallucination."
    ),
}

PLAN_WORD_COUNT_WARNING = 60
OBJECTIVE_MEASUREMENT_PATTERN = re.compile(
    r'\b(\d+[\./]\d+|\d+\s*(?:bpm|mmhg|°|degrees?|kg|lbs?|cm|%|breaths?/min|rpm))\b',
    re.IGNORECASE
)
BOILERPLATE_PLAN_PHRASES = [
    r'\bENT referral\b', r'\brefer(?:ral)? to\b', r'\bhydrat(?:ion|e)\b', r'\brest\b',
    r'\bchest\s*x.?ray\b', r'\bbronchodilator\b', r'\bantibiotic\b', r'\bfollow.up\b', r'\bschedul\w+\b',
]
BOILERPLATE_PLAN_RE = re.compile('|'.join(BOILERPLATE_PLAN_PHRASES), re.IGNORECASE)
EMPTY_PLACEHOLDERS = {"not discussed.", "not discussed", "none", "n/a", "not applicable", "not mentioned", ""}

# --- Generation and Validation Functions ---

def repair_and_parse_json(raw: str) -> dict | None:
    # Clean output to ensure JSON decode works
    clean = raw.replace('""', '"')
    fence_match = re.search(r"```(?:json)?\s*(\{.*?)(?:```|$)", clean, re.DOTALL)
    if fence_match:
        clean = fence_match.group(1).strip()
    else:
        clean = re.sub(r"```(?:json)?|```", "", clean).strip()

    if clean.startswith('"') and clean.endswith('"'):
        clean = clean[1:-1]

    try:
        data = json.loads(clean)
        if isinstance(data, dict):
            return {k: data.get(k, "Not discussed.") for k in SOAP_KEYS}
    except json.JSONDecodeError:
        pass

    try:
        data = json.loads(clean + "}")
        if isinstance(data, dict):
            return {k: data.get(k, "Not discussed.") for k in SOAP_KEYS}
    except json.JSONDecodeError:
        pass

    # Regex extraction fallback
    result = {}
    for key in SOAP_KEYS:
        match = re.search(rf'"{key}"\s*:\s*"((?:[^"\\]|\\.)*)"', clean, re.IGNORECASE | re.DOTALL)
        result[key] = match.group(1).strip() if match else "Not discussed."

    if any(v != "Not discussed." for v in result.values()):
        return result

    return None

def validate_soap(data: dict, transcript: str) -> list[str]:
    # Check for boilerplate and structural issues
    warnings = []
    plan = data.get("plan", "Not discussed.")
    
    if plan.lower() not in EMPTY_PLACEHOLDERS:
        plan_words = len(plan.split())
        if plan_words > PLAN_WORD_COUNT_WARNING:
            warnings.append(f"LONG_PLAN ({plan_words} words): high risk of boilerplate fabrication")
        
        boilerplate_hits = BOILERPLATE_PLAN_RE.findall(plan)
        if boilerplate_hits:
            unique_hits = list(dict.fromkeys(h.lower() for h in boilerplate_hits))
            warnings.append(f"BOILERPLATE_PHRASES in Plan: {', '.join(unique_hits)}")

    objective = data.get("objective", "Not discussed.")
    if objective.lower() not in EMPTY_PLACEHOLDERS:
        if not OBJECTIVE_MEASUREMENT_PATTERN.search(objective):
            warnings.append("OBJECTIVE_NO_MEASUREMENTS: Objective section lacks concrete clinical measurements")

    exam_performed = re.search(
        r'\b(exam(?:in(?:e|ation))?|auscult|palpat|percuss|inspect|vital|listen(?:ing)?|look(?:ing)?\s+at)\b',
        transcript, re.IGNORECASE
    )
    if not exam_performed and objective.lower() not in EMPTY_PLACEHOLDERS:
        warnings.append("INCOMPLETE_ENCOUNTER: No exam language found in transcript but Objective section is non-empty")

    return warnings

# --- Pruning Functions ---

def split_into_sentences(text: str) -> list[str]:
    # Split text into granular verification chunks
    text = re.sub(r'\n\s*[-•]\s*', '. ', text)
    text = re.sub(r'\n\s*\d+\.\s*', '. ', text)
    sentences = re.split(r'(?<=[.!?])\s+|;\s*', text)
    
    seen = set()
    result = []
    for s in sentences:
        s = s.strip().strip(';')
        if s and s not in seen:
            seen.add(s)
            result.append(s)
    return result

def is_substantive(sentence: str) -> bool:
    return len(sentence.split()) >= 2

def verify_sentence(model, tokenizer, transcript: str, sentence: str, section: str) -> tuple[bool, str, str, str]:
    prompt = VERIFY_SENTENCE_PROMPT.format(
        transcript=transcript,
        sentence=sentence,
        section=section,
        section_rule=SOAP_SECTION_RULES.get(section, ""),
    )
    
    response = generate(
        model, tokenizer, prompt=prompt, max_tokens=160, verbose=False,
        sampler=make_sampler(temp=0.0)
    )

    response_upper = response.upper()

    if "HALLUCINATION" in response_upper:
        verdict = "HALLUCINATION"
        is_supported = False
    elif "YES" in response_upper:
        verdict = "YES"
        is_supported = True
    else:
        verdict = "YES"
        is_supported = True

    reason = ""
    reason_match = re.search(r"Reason:\s*(.+)", response, re.IGNORECASE)
    if reason_match:
        reason = reason_match.group(1).strip()

    evidence = "Verified"
    quote_match = re.search(r"Quote:\s*(.+)", response, re.IGNORECASE)
    if quote_match:
        evidence = quote_match.group(1).strip()

    return is_supported, verdict, evidence, reason

def prune_soap(model, tokenizer, transcript: str, parsed_sections: dict) -> dict:
    # Build final validated SOAP note dictionary
    pruned_sections = {k: "Not discussed." for k in SOAP_KEYS}

    for key in SOAP_KEYS:
        section_name = key.capitalize()
        content = parsed_sections.get(key, "Not discussed.")

        if content.lower() in EMPTY_PLACEHOLDERS:
            continue

        print(f"\n  {CYAN}[{section_name}]{RESET}")

        if section_name == "Objective":
            has_concrete_measurement = bool(OBJECTIVE_MEASUREMENT_PATTERN.search(content))
            if not has_concrete_measurement:
                print(f"  {YELLOW}[WARN] Objective lacks concrete measurements. May be fabricated/incomplete.{RESET}")

        sentences = split_into_sentences(content)
        valid_sentences = []

        for sent in sentences:
            if not is_substantive(sent):
                valid_sentences.append(sent)
                print(f"  {YELLOW}[SKIP] {sent}{RESET}  (too short to verify)")
                continue

            is_supported, verdict, evidence, reason = verify_sentence(
                model, tokenizer, transcript, sent, section_name
            )

            if verdict == "YES":
                valid_sentences.append(sent)
                print(f"  {GREEN}[KEEP] {sent}{RESET}")
                if reason:
                    print(f"         ↳ Reason: {reason}")
                print(f"         ↳ Quote: \"{evidence}\"")
            else:
                print(f"  {RED}[DROP/HALLUCINATION] {sent}{RESET}")
                if reason:
                    print(f"         ↳ Reason: {reason}")

        if valid_sentences:
            pruned_sections[key] = " ".join(valid_sentences)
        else:
            pruned_sections[key] = "Not discussed."
            print(f"  {RED}[SECTION DROPPED — nothing survived, marked as Not discussed.]{RESET}")

    return pruned_sections

# --- Main Execution Flow ---

def main():
    print(f"Reading transcript from {INPUT_FILE}...")
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as file:
            transcript = file.read()
    except FileNotFoundError:
        print(f"{RED}Error: Could not find {INPUT_FILE}. Please ensure the file exists.{RESET}")
        return

    # Start total timer
    start_time_total = time.perf_counter()

    print("=" * 70)
    print("STEP 1: Generating Initial SOAP Note...")
    print(f"Loading LoRA model from {MODEL_PATH_LORA}...")
    
    # Load generation model
    model_lora, tokenizer_lora = load(MODEL_PATH_LORA)
    
    # Start generation timer
    start_time_gen = time.perf_counter()
    prompt = PROMPT_TEMPLATE.format(transcript)
    
    raw_response = generate(
        model_lora,
        tokenizer_lora,
        prompt=prompt,
        max_tokens=1024,
        verbose=True,
        sampler=make_sampler(temp=0.0),
    )
    # End generation timer
    end_time_gen = time.perf_counter()
    time_gen = end_time_gen - start_time_gen

    # Clean up generation model to free memory
    print(f"\n{YELLOW}Unloading LoRA model to free memory...{RESET}")
    del model_lora
    del tokenizer_lora
    gc.collect()

    print("\nSTEP 2: Validating Generated Content...")
    parsed_soap = repair_and_parse_json(raw_response)
    
    if parsed_soap is None:
        print(f"{RED}[WARN] Could not parse JSON output. Halting pruning.{RESET}")
        return

    warnings = validate_soap(parsed_soap, transcript)
    if warnings:
        for w in warnings:
            print(f"  {YELLOW}[!] {w}{RESET}")
    else:
        print(f"  {GREEN}[!] Validation passed with no preliminary warnings.{RESET}")

    print("\nSTEP 3: Per-Sentence Verification and Pruning...")
    print(f"Loading Vanilla model from {MODEL_PATH_VANILLA}...")
    
    # Load verification model
    model_vanilla, tokenizer_vanilla = load(MODEL_PATH_VANILLA)
    
    print("=" * 70)
    
    # Start pruning timer
    start_time_prune = time.perf_counter()
    final_soap_dict = prune_soap(model_vanilla, tokenizer_vanilla, transcript, parsed_soap)
    # End pruning timer
    end_time_prune = time.perf_counter()
    time_prune = end_time_prune - start_time_prune

    # Write Final Output as JSON
    final_soap_json = json.dumps(final_soap_dict, indent=4)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out_file:
        out_file.write(final_soap_json)

    # End total timer
    end_time_total = time.perf_counter()
    time_total = end_time_total - start_time_total
    
    print("=" * 70)
    print(f"\n{GREEN}Processing Complete!{RESET}")
    print(f"Time - Generation Phase : {time_gen:.2f} seconds")
    print(f"Time - Pruning Phase    : {time_prune:.2f} seconds")
    print(f"Time - Total Execution  : {time_total:.2f} seconds")
    print(f"Final JSON output saved to: {OUTPUT_FILE}\n")
    print(f"{BLUE}--- Final Pruned SOAP Note (JSON) ---{RESET}")
    print(final_soap_json)

if __name__ == "__main__":
    main()