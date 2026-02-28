import os
import re
import pandas as pd
from openai import OpenAI

# Define the file paths for the input and output data.
INPUT_CSV_FILE = "pruned_output.csv"
EVALUATED_CSV_FILE = "evaluated_soap_notes_pruned.csv"

# Replace this with your actual OpenRouter API key.
OPENROUTER_API_KEY = ""

# Initialize the OpenAI client pointing to the OpenRouter base URL.
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

JUDGE_MODEL = "anthropic/claude-opus-4.6"

# Multi-line string template for the judge's instructions.
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

def main():
    print(f"Reading data from {INPUT_CSV_FILE}...")
    
    try:
        input_df = pd.read_csv(INPUT_CSV_FILE)
    except FileNotFoundError:
        print(f"Error: {INPUT_CSV_FILE} not found. Please ensure it is in the same directory.")
        return

    if "input_text" not in input_df.columns or "response" not in input_df.columns:
        print("Error: Required columns ('input_text' or 'response') were not found in the CSV.")
        return

    start_index = 0
    if os.path.exists(EVALUATED_CSV_FILE):
        try:
            existing_df = pd.read_csv(EVALUATED_CSV_FILE)
            start_index = len(existing_df)
            print(f"Found existing progress. Resuming from row {start_index + 1}...")
        except pd.errors.EmptyDataError:
            start_index = 0

    total_rows = len(input_df)

    if start_index < total_rows:
        print("Beginning evaluation process...\n")
        print("=" * 50)

        for index in range(start_index, total_rows):
            print(f"Evaluating Row {index + 1} of {total_rows}...")
            row = input_df.iloc[index]
            
            dialogue_text = str(row["input_text"])
            soap_note_text = str(row["response"])
            
            prompt = JUDGE_PROMPT_TEMPLATE.format(
                dialogue=dialogue_text, 
                soap_note=soap_note_text
            )

            api_response = client.chat.completions.create(
                model=JUDGE_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
            )

            judge_output = api_response.choices[0].message.content
            
            score = None
            summary = "Parsing error: Model did not return the expected format."

            score_match = re.search(r"Score:\s*([1-5])", judge_output, re.IGNORECASE)
            summary_match = re.search(r"Summary:\s*(.*)", judge_output, re.IGNORECASE | re.DOTALL)

            if score_match:
                score = int(score_match.group(1))
            
            if summary_match:
                summary = summary_match.group(1).strip()

            row_dict = row.to_dict()
            row_dict["accuracy_score"] = score
            row_dict["evaluation_summary"] = summary

            row_df = pd.DataFrame([row_dict])
            write_header = not os.path.exists(EVALUATED_CSV_FILE) or os.path.getsize(EVALUATED_CSV_FILE) == 0
            row_df.to_csv(EVALUATED_CSV_FILE, mode='a', header=write_header, index=False)

        print("=" * 50)
        print(f"Evaluation complete. Saved all results to {EVALUATED_CSV_FILE}")
    else:
        print("All rows already processed. Calculating average from existing file...")

    # Load final results to calculate the average
    final_results_df = pd.read_csv(EVALUATED_CSV_FILE)
    
    # Calculate mean while dropping rows where score might be missing (None/NaN)
    if "accuracy_score" in final_results_df.columns:
        valid_scores = final_results_df["accuracy_score"].dropna()
        if not valid_scores.empty:
            avg_score = valid_scores.mean()
            print("\n" + "-" * 30)
            print(f"FINAL METRICS:")
            print(f"Average Accuracy Score: {avg_score:.2f} / 5.0")
            print(f"Total Conversations Evaluated: {len(valid_scores)}")
            print("-" * 30)
        else:
            print("\nNo valid scores found to calculate an average.")

    # --- Final Synthesis ---
    print("\nGenerating final synthesis of model behavior...")

    # Build a compact summary of all rows for the prompt
    synthesis_rows = []
    for _, row in final_results_df.iterrows():
        synthesis_rows.append(
            f"Row {int(row.name) + 1} | Score: {row.get('accuracy_score', 'N/A')} | "
            f"Summary: {row.get('evaluation_summary', 'N/A')}"
        )
    all_evaluations_text = "\n".join(synthesis_rows)

    synthesis_prompt = f"""You are an expert medical AI evaluator tasked with synthesizing the results of a batch evaluation.

Below are the individual evaluation results for a model that generates SOAP notes from doctor-patient dialogues.
Each row contains the row number, the accuracy score (1-5), and a brief evaluation summary.

--- Evaluation Results ---
{all_evaluations_text}
--- End of Results ---

Based on all of the above, provide a thorough behavioral synthesis of the model. Your synthesis should cover:
1. **Overall Performance**: General quality level and consistency across evaluations.
2. **Recurring Strengths**: Patterns of what the model consistently does well.
3. **Recurring Weaknesses**: Patterns of where the model consistently falls short or makes errors.
4. **Score Distribution Insights**: What the spread of scores tells us about the model's reliability.
5. **Recommendations**: Concrete suggestions for how the model or its prompting could be improved.
"""

    synthesis_response = client.chat.completions.create(
        model=JUDGE_MODEL,
        messages=[{"role": "user", "content": synthesis_prompt}],
        temperature=0.3,
    )

    synthesis_text = synthesis_response.choices[0].message.content

    print("\n" + "=" * 50)
    print("FINAL MODEL BEHAVIOR SYNTHESIS")
    print("=" * 50)
    print(synthesis_text)
    print("=" * 50)

    # Save the synthesis to a text file
    synthesis_file = "model_synthesis.txt"
    with open(synthesis_file, "w") as f:
        f.write(synthesis_text)
    print(f"\nSynthesis saved to {synthesis_file}")

if __name__ == "__main__":
    main()