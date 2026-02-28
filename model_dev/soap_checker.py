import re
import pandas as pd
from mlx_lm import load, generate
from mlx_lm.sample_utils import make_sampler

MODEL_PATH = "for_backend/medgemma_4b_q4_vanilla_mlx"
INPUT_CSV = "output_of_finetuned.csv"
OUTPUT_CSV = "pruned_output.csv"

GREEN = '\033[92m'
BLUE = '\033[94m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'

# --- IMPROVEMENT 1: Stronger, more explicit section boundary definitions ---
# Previously the Objective rule was too brief, allowing misclassified patient
# self-reports to survive. Each rule now lists explicit inclusion AND exclusion
# criteria, directly addressing the Objective misclassification pattern
# (seen in Rows 2, 6, 7, 9, 10 of the synthesis report).
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

# --- IMPROVEMENT 2: Revised verification prompt ---
# Key changes:
# (a) Added explicit instruction to flag section misplacement as HALLUCINATION,
#     even if the underlying fact is present in the transcript (Rec #2, #5).
# (b) Added the "incomplete encounter" rule: pending exam findings must not be
#     treated as verified observations (Rec #3).
# (c) Added an adverse reaction preservation note to prevent over-pruning of
#     safety-critical details that ARE present (Rec #7).
# (d) Tightened the YES criteria to require both content AND correct placement.
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

SOAP_KEYS = ["subjective", "objective", "assessment", "plan"]
EMPTY_PLACEHOLDERS = {"not discussed", "none", "n/a", "not applicable", "not mentioned", ""}


def split_soap_sections(soap_text: str) -> dict[str, str]:
    """
    Parses a SOAP note from JSON (optionally wrapped in ```json ... ``` fences).
    Handles: double-quote CSV escaping, truncated JSON, duplicate JSON blocks.
    Skips sections whose value is a placeholder like 'Not discussed.'
    Falls back to regex header splitting if JSON parsing fails entirely.
    """
    import json

    clean = soap_text.replace('""', '"')

    fence_match = re.search(r"```(?:json)?\s*(\{.*?)(?:```|$)", clean, re.DOTALL)
    if fence_match:
        clean = fence_match.group(1).strip()
    else:
        clean = re.sub(r"```(?:json)?|```", "", clean).strip()

    if clean.startswith('"') and clean.endswith('"'):
        clean = clean[1:-1]

    data = None
    try:
        data = json.loads(clean)
    except json.JSONDecodeError:
        data = {}
        for key in SOAP_KEYS:
            match = re.search(
                rf'"{key}"\s*:\s*"((?:[^"\\]|\\.)*)"',
                clean,
                re.IGNORECASE | re.DOTALL
            )
            if match:
                data[key] = match.group(1)

    if data:
        sections = {}
        for k in SOAP_KEYS:
            v = data.get(k, "").strip().rstrip(".")
            if v.lower() not in EMPTY_PLACEHOLDERS:
                sections[k.capitalize()] = v
        if sections:
            return sections

    pattern = re.compile(r'((?:subjective|objective|assessment|plan)\s*:)', re.IGNORECASE)
    parts = pattern.split(soap_text)
    sections = {}
    i = 1
    while i < len(parts) - 1:
        header = parts[i].strip().rstrip(':').capitalize()
        content = parts[i + 1].strip()
        if content and content.lower().rstrip('.') not in EMPTY_PLACEHOLDERS:
            sections[header] = content
        i += 2
    return sections


def split_into_sentences(text: str) -> list[str]:
    """
    Split section content into individual sentences, deduplicating repeated ones.

    IMPROVEMENT 3: Also splits on semicolons and bullet/list patterns so that
    compound sentences containing one valid and one hallucinated clause don't
    survive purely because the first clause is grounded. This improves granularity
    of pruning for Plan sections, which often chain multiple items together.
    """
    # Normalize list markers (dashes, bullets, numbers) into sentence breaks
    text = re.sub(r'\n\s*[-•]\s*', '. ', text)
    text = re.sub(r'\n\s*\d+\.\s*', '. ', text)
    # Split on sentence boundaries and semicolons
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
    """Skip sentences that are too short to verify (headers, fragments)."""
    return len(sentence.split()) >= 2


def verify_sentence(model, tokenizer, transcript: str, sentence: str, section: str) -> tuple[bool, str, str]:
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
        # Ambiguous — default to keeping to avoid over-pruning
        verdict = "YES"
        is_supported = True

    # Extract reason for logging
    reason = ""
    reason_match = re.search(r"Reason:\s*(.+)", response, re.IGNORECASE)
    if reason_match:
        reason = reason_match.group(1).strip()

    evidence = "Verified"
    quote_match = re.search(r"Quote:\s*(.+)", response, re.IGNORECASE)
    if quote_match:
        evidence = quote_match.group(1).strip()

    return is_supported, verdict, evidence, reason


def prune_soap(model, tokenizer, transcript: str, soap: str, conv_index: int) -> str:
    """
    For each non-empty SOAP section:
      - Split into sentences
      - Verify each substantive sentence against the transcript
      - Drop only confirmed hallucinations; keep YES and ambiguous
      - Reconstruct section; mark as 'Not discussed.' if nothing survives
    """
    sections = split_soap_sections(soap)

    if not sections:
        print(f"  {YELLOW}[WARN] No SOAP sections found, returning as-is.{RESET}")
        return soap

    pruned_sections = {k.capitalize(): "Not discussed." for k in SOAP_KEYS}

    for section_name, content in sections.items():
        print(f"\n  {CYAN}[{section_name}]{RESET}")

        # IMPROVEMENT 4: Detect and handle "incomplete encounter" Objective sections.
        # If the Objective content looks like a pending exam (no concrete vitals or
        # measurements), log a warning so the output can be reviewed — the pruner
        # will still verify sentence-by-sentence, but the warning flags likely
        # fabricated findings for human review.
        if section_name == "Objective":
            has_concrete_measurement = bool(re.search(
                r'\b(\d+[\./]\d+|\d+\s*(?:bpm|mmhg|°|degrees?|kg|lbs?|cm|%|rpm))\b',
                content, re.IGNORECASE
            ))
            if not has_concrete_measurement:
                print(f"  {YELLOW}[WARN] Objective section contains no concrete measurements. "
                      f"May represent a fabricated or incomplete exam — verify carefully.{RESET}")

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
            pruned_sections[section_name] = " ".join(valid_sentences)
        else:
            pruned_sections[section_name] = "Not discussed."
            print(f"  {RED}[SECTION DROPPED — nothing survived, marked as Not discussed.]{RESET}")

    return "\n".join(
        f"{name}: {content}"
        for name, content in pruned_sections.items()
    )


def main():
    print(f"Loading model from {MODEL_PATH}...")
    model, tokenizer = load(MODEL_PATH)

    df = pd.read_csv(INPUT_CSV)
    pruned_soaps = []

    print(f"\n{YELLOW}Starting Per-Sentence Verification...{RESET}\n")

    for index, row in df.iterrows():
        transcript = str(row["input_text"])
        soap = str(row["response"])

        print(f"\n{YELLOW}{'=' * 70}")
        print(f"Conversation {index + 1} / {len(df)}{RESET}")

        pruned = prune_soap(model, tokenizer, transcript, soap, index)
        pruned_soaps.append(pruned)

    df["pruned_soap"] = pruned_soaps
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"\n{GREEN}Complete! Results saved to {OUTPUT_CSV}{RESET}")


if __name__ == "__main__":
    main()