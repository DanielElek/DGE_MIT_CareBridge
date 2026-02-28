import time
import os
import re
import pandas as pd
from mlx_lm import load, generate
from openai import OpenAI

# --- Configuration: Paths & API ---
MODEL_PATH = "medgemma_4b_q4_vanilla_mlx"
INPUT_CSV = "patient_doctor_conversations.csv"
INFERENCE_OUTPUT_CSV = "output_of_finetuned.csv"
FINAL_EVAL_CSV = "evaluated_soap_notes.csv"

# OpenRouter Config
OPENROUTER_API_KEY = ""
JUDGE_MODEL = "anthropic/claude-opus-4.6"

# --- Templates ---
# Removed the second {} and <end_of_turn> so the model can generate the output
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

JUDGE_PROMPT_TEMPLATE = """You are an expert medical scribe evaluator.
Review the following doctor-patient dialogue and the generated SOAP note.

Dialogue:
{dialogue}

Generated SOAP Note:
{soap_note}

Evaluate the generated SOAP note based on its accuracy, completeness, and adherence to the strict SOAP format.
Provide your evaluation in the following exact format:
Score: [An integer from 1 to 5]
Summary: [A brief 1-2 sentence summary of what it did well or missed]
"""

def run_inference():
    """Stage 1: Process local MLX model inference."""
    print(f"\n--- STAGE 1: MLX INFERENCE ---")
    print(f"Loading model from {MODEL_PATH}...")
    model, tokenizer = load(MODEL_PATH)
    
    # Import the sampler utility required by recent mlx_lm versions
    from mlx_lm.sample_utils import make_sampler
    
    # Read original CSV containing the conversations
    df = pd.read_csv(INPUT_CSV)
    if "input_text" not in df.columns or "model_used" not in df.columns:
        print("Error: Required columns missing from input CSV.")
        return False
        
    results = []
    num_conversations = len(df)
    start_time = time.perf_counter()
    
    # Create a deterministic sampler to enforce strict JSON extraction
    sampler = make_sampler(temp=0.0)
    
    for index, row in df.iterrows():
        input_text = str(row["input_text"])
        model_used = str(row["model_used"])
        prompt = PROMPT_TEMPLATE.format(input_text)
        
        print(f"Inference: Row {index + 1} of {num_conversations}")
        
        # Pass the sampler object to control the generation temperature
        response = generate(
            model, 
            tokenizer, 
            prompt=prompt, 
            max_tokens=1024, 
            sampler=sampler,
            verbose=True
        )
        
        results.append({
            "input_text": input_text,
            "response": response,
            "model_used": model_used
        })
        print("=" * 50)

    total_time = time.perf_counter() - start_time
    conv_per_sec = num_conversations / total_time if total_time > 0 else 0
    
    output_df = pd.DataFrame(results)
    output_df.to_csv(INFERENCE_OUTPUT_CSV, index=False)
    
    print(f"Inference complete. Speed: {conv_per_sec:.4f} conv/s")
    return True

def run_evaluation():
    """Stage 2: Evaluate via OpenRouter Judge."""
    print(f"\n--- STAGE 2: OPENROUTER EVALUATION ---")
    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENROUTER_API_KEY)

    try:
        input_df = pd.read_csv(INFERENCE_OUTPUT_CSV)
    except FileNotFoundError:
        print(f"Error: {INFERENCE_OUTPUT_CSV} not found.")
        return

    # Restartable logic: check existing progress in the final CSV
    start_index = 0
    if os.path.exists(FINAL_EVAL_CSV):
        try:
            existing_df = pd.read_csv(FINAL_EVAL_CSV)
            start_index = len(existing_df)
            print(f"Resuming evaluation from row {start_index + 1}...")
        except pd.errors.EmptyDataError:
            start_index = 0

    total_rows = len(input_df)
    if start_index >= total_rows:
        print("Evaluation already finished.")
    else:
        for index in range(start_index, total_rows):
            print(f"Judge: Row {index + 1} of {total_rows}")
            row = input_df.iloc[index]
            
            prompt = JUDGE_PROMPT_TEMPLATE.format(
                dialogue=str(row["input_text"]), 
                soap_note=str(row["response"])
            )

            api_response = client.chat.completions.create(
                model=JUDGE_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
            )

            judge_output = api_response.choices[0].message.content
            score = None
            summary = "Parsing error: Format mismatch."

            # Regex parsing for score and summary
            score_match = re.search(r"Score:\s*([1-5])", judge_output, re.IGNORECASE)
            summary_match = re.search(r"Summary:\s*(.*)", judge_output, re.IGNORECASE | re.DOTALL)

            if score_match: score = int(score_match.group(1))
            if summary_match: summary = summary_match.group(1).strip()

            # Prepare row and append to CSV immediately for data safety
            row_dict = row.to_dict()
            row_dict["accuracy_score"] = score
            row_dict["evaluation_summary"] = summary

            row_df = pd.DataFrame([row_dict])
            write_header = not os.path.exists(FINAL_EVAL_CSV) or os.path.getsize(FINAL_EVAL_CSV) == 0
            row_df.to_csv(FINAL_EVAL_CSV, mode='a', header=write_header, index=False)

    # Final Average Score Summary
    final_df = pd.read_csv(FINAL_EVAL_CSV)
    if "accuracy_score" in final_df.columns:
        # Calculate average while ignoring rows where score might be null/NaN
        average_score = final_df["accuracy_score"].mean()
        print("\n" + "=" * 50)
        print("FINAL EVALUATION SUMMARY")
        print("=" * 50)
        print(f"Total rows evaluated: {len(final_df)}")
        print(f"Average Accuracy Score: {average_score:.2f} / 5.00")
        print("=" * 50)

if __name__ == "__main__":
    # Stage 1: Local Inference
    if run_inference():
        # Stage 2: External Judge Evaluation
        run_evaluation()
    else:
        print("Aborting: Stage 1 did not complete successfully.")