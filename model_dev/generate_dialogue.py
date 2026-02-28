import os
import csv
import requests
import json

# Configuration variables
OPENROUTER_API_KEY = ""
MODEL_NAME = "google/gemini-3-flash-preview" 
CSV_FILE_PATH = "patient_doctor_conversations.csv"
NUM_GENERATIONS = 10  # Set how many conversations to generate in one run

def generate_conversation():
    # Set up the OpenRouter API endpoint
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    # Headers required for authentication and data format
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # The prompt defining the expected output
    prompt = (
        "Write a realistic patient-doctor conversation. "
        "It should be in this format, but longer and more detailed:\n"
        "'Doctor: Hello, how are you today?\n"
        "Patient: Not good.\n"
        "Doctor: What happened?\n"
        "Patient: I have a lot of congestion. I also am coughing a lot. It feels like I am choking on something.'"
    )
    
    # Payload containing the model and the prompt
    data = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    
    # Execute the POST request to OpenRouter
    response = requests.post(url, headers=headers, data=json.dumps(data))
    response.raise_for_status() 
    
    # Parse the JSON response to extract the text
    response_data = response.json()
    conversation_text = response_data['choices'][0]['message']['content']
    
    return conversation_text

def append_to_csv(text, model):
    # Check if the file already exists to determine if we need to write headers
    file_exists = os.path.isfile(CSV_FILE_PATH)
    
    # Open the file in append mode ('a')
    with open(CSV_FILE_PATH, mode='a', newline='', encoding='utf-8') as csv_file:
        writer = csv.writer(csv_file)
        
        # Write the header row only if creating a brand new file
        if not file_exists:
            writer.writerow(["input_text", "model_used"])
            
        # Append the new conversation and the model name
        writer.writerow([text, model])

if __name__ == "__main__":
    print(f"Starting generation of {NUM_GENERATIONS} conversations using {MODEL_NAME}...")
    
    # Loop for the specified number of generations
    for i in range(1, NUM_GENERATIONS + 1):
        print(f"Generating conversation {i}/{NUM_GENERATIONS}...")
        
        try:
            # Generate and save the data
            generated_text = generate_conversation()
            append_to_csv(generated_text, MODEL_NAME)
            print(f"Saved conversation {i}.")
            
        except requests.exceptions.RequestException as e:
            # Catch network or API errors, but allow the loop to continue
            print(f"API Request failed on conversation {i}: {e}")
        except Exception as e:
            # Catch any other unexpected errors
            print(f"An error occurred on conversation {i}: {e}")
            
    print("Run complete.")