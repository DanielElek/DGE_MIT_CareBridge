import os
import csv
import time
from openai import OpenAI

# Initialize the OpenAI client pointed at OpenRouter
api_key = os.environ.get("OPENROUTER_API_KEY")
if not api_key:
    raise ValueError("Please set the OPENROUTER_API_KEY environment variable.")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key
)

# Model configuration using OpenRouter's provider/model format
GENERATOR_MODEL = "google/gemini-3-flash-preview"
SOAP_MODEL = "google/gemini-3-flash-preview"

# File paths
CONVO_CSV = "conversations_2.csv"
SOAP_CSV = "generated_training_data.csv"

# Target number of total conversations to generate
TARGET_TOTAL_CONVERSATIONS = 50
SOAP_START_THRESHOLD = 10

# High-fidelity prompt engineering for maximum dataset quality
CONVO_PROMPT = """You are an expert medical scenario designer building a dataset for training clinical AI. 
Generate a highly realistic, multi-turn doctor-patient consultation transcript.

Strict Requirements:
1. Scenario: Choose a random medical specialty and a presenting complaint (ranging from routine to highly complex). Do not state what you chose, just begin the dialogue.
2. Realism: Include natural dialogue features such as patient tangents, hesitations, clarifying questions from the doctor, and implicit symptoms the doctor must actively draw out.
3. Content: The interaction must contain enough detail to form a complete SOAP note later (history of present illness, mentions of past medical history, a physical exam or lab discussion, and a treatment plan).
4. Format: Output strictly the dialogue. Format each line starting with 'Doctor: ' or 'Patient: '. 
5. No fluff: Do not include introductory text, summaries, or concluding remarks outside the transcript."""

SOAP_PROMPT_PREFIX = """You are an expert clinical scribe. Extract a highly accurate SOAP note from the following doctor-patient transcript.

Strict Formatting Requirements:
1. Subjective (S): Write this as a single, cohesive narrative paragraph. Do not use bullet points.
2. Objective (O): Write this as a single narrative paragraph. Do not use bullet points. State 'None explicitly mentioned' if no data exists.
3. Assessment (A): Use a numbered list for the diagnoses.
4. Plan (P): Use a numbered list for the treatment steps.
5. Accuracy: DO NOT hallucinate details, vitals, or tests not explicitly present in the transcript.
6. Headers: Output strictly the SOAP note using the exact headings 'S:', 'O:', 'A:', 'P:'. Do not use markdown bolding (**) on the headers.

Transcript:
"""

def setup_csvs():
    # Use QUOTE_ALL to prevent internal commas and newlines from breaking columns
    if not os.path.exists(CONVO_CSV):
        with open(CONVO_CSV, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f, quoting=csv.QUOTE_ALL)
            writer.writerow(['convo', 'generated_by'])

    if not os.path.exists(SOAP_CSV):
        with open(SOAP_CSV, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f, quoting=csv.QUOTE_ALL)
            writer.writerow(['input', 'output', 'generated_by', 'soaped_by'])

def get_row_count(filepath):
    # Enforce QUOTE_ALL on read to properly count multiline blocks
    if not os.path.exists(filepath):
        return 0
    with open(filepath, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f, quoting=csv.QUOTE_ALL)
        data = list(reader)
        # Account for the header row
        return max(0, len(data) - 1)

def get_convo_at_index(index):
    # Enforce QUOTE_ALL on DictReader to map columns accurately
    with open(CONVO_CSV, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f, quoting=csv.QUOTE_ALL)
        for i, row in enumerate(reader):
            if i == index:
                return row['convo'], row['generated_by']
    return None, None

def call_llm(prompt, model_name, is_extraction=False):
    # Use 0.0 for rigid SOAP formatting, 0.7 for varied dialogue
    req_temp = 0.0 if is_extraction else 0.7
    
    print(f"Calling {model_name} via OpenRouter (Temp: {req_temp})...")
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=req_temp
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"API Error: {e}")
        time.sleep(5) 
        return None

def save_conversation(convo_text, model_name):
    # Append with QUOTE_ALL
    with open(CONVO_CSV, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerow([convo_text, model_name])
    print("Saved new conversation to CSV.")

def save_soap_extract(input_convo, output_soap, gen_model, soap_model):
    # Append with QUOTE_ALL
    with open(SOAP_CSV, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerow([input_convo, output_soap, gen_model, soap_model])
    print("Saved new SOAP extract to CSV.")

def main():
    setup_csvs()
    
    # Track the start time for performance profiling
    session_start_time = time.time()

    while True:
        convo_count = get_row_count(CONVO_CSV)
        soap_count = get_row_count(SOAP_CSV)

        print(f"\n[Status] Conversations: {convo_count}/{TARGET_TOTAL_CONVERSATIONS} | SOAP extracts: {soap_count}/{TARGET_TOTAL_CONVERSATIONS}")

        if convo_count >= TARGET_TOTAL_CONVERSATIONS and soap_count >= TARGET_TOTAL_CONVERSATIONS:
            print("\nDataset generation targets reached.")
            break

        action_taken = False

        # Phase 1: Generate new clinical conversation
        if convo_count < TARGET_TOTAL_CONVERSATIONS:
            new_convo = call_llm(CONVO_PROMPT, GENERATOR_MODEL, is_extraction=False)
            if new_convo:
                save_conversation(new_convo, GENERATOR_MODEL)
                action_taken = True

        # Phase 2: Extract SOAP note if threshold is met and backlog exists
        convo_count_updated = get_row_count(CONVO_CSV) 
        if convo_count_updated >= SOAP_START_THRESHOLD and soap_count < convo_count_updated:
            convo_text, gen_model_used = get_convo_at_index(soap_count)
            
            if convo_text:
                full_soap_prompt = SOAP_PROMPT_PREFIX + convo_text
                # Enforce strict zero-temperature extraction
                new_soap = call_llm(full_soap_prompt, SOAP_MODEL, is_extraction=True)
                if new_soap:
                    save_soap_extract(convo_text, new_soap, gen_model_used, SOAP_MODEL)
                    action_taken = True

        # Safety catch to prevent rapid infinite loops upon API failure
        if not action_taken:
            print("No successful actions taken. Halting to prevent infinite failure cycle.")
            break
            
    # Calculate and display total runtime
    session_end_time = time.time()
    elapsed_seconds = session_end_time - session_start_time
    minutes, seconds = divmod(elapsed_seconds, 60)
    print(f"Session completed. Total execution time: {int(minutes)} minutes and {seconds:.2f} seconds.")

if __name__ == "__main__":
    main()