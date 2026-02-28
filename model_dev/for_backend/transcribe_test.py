import os
import warnings

# Enable CPU fallback for unsupported MPS operations to prevent crashes
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

# Suppress standard UserWarnings to keep terminal output clean
warnings.filterwarnings("ignore", category=UserWarning)

import whisperx
import torch
import gc
import json
import numpy as np
import time
from whisperx.diarize import DiarizationPipeline

# Path configurations for models and files
model_dir = "whisper-large-v3" 
audio_file = "converted_audio.wav"
output_json = "transcript.json"
output_txt = "formatted_dialogue.txt"
hf_token = ""

# Force transcription to CPU as ctranslate2 lacks MPS support
transcribe_device = "cpu"
transcribe_compute_type = "float32"

# Force alignment to CPU to avoid torchaudio MPS channel limits
align_device = "cpu"

# Route diarization to Apple GPU if available
if torch.backends.mps.is_available():
    diarize_device = "mps"
else:
    diarize_device = "cpu"

speaker_map = {"SPEAKER_00": "Doctor", "SPEAKER_01": "Patient"}

if not os.path.isdir(model_dir):
    print(f"Error: Model directory not found at {model_dir}")
    exit()

# Start the master timer
total_start_time = time.time()

# 1. Transcribe (Forced to CPU)
print(f"Loading transcription model on {transcribe_device}...")
step_start = time.time()
model = whisperx.load_model(model_dir, device=transcribe_device, compute_type=transcribe_compute_type)
print(f"Transcription model loaded in {time.time() - step_start:.2f}s")

print("Transcribing audio...")
step_start = time.time()
audio = whisperx.load_audio(audio_file)

# Normalize audio volume to maximize the signal before processing
max_amp = np.max(np.abs(audio))
if max_amp > 0:
    audio = audio / max_amp

result = model.transcribe(audio, batch_size=16)
print(f"Transcription finished in {time.time() - step_start:.2f}s")

# Clear memory before loading the Wav2Vec2 alignment model
gc.collect()

# 2. Align (word-level timestamps)
print(f"Loading alignment model on {align_device}...")
step_start = time.time()
align_model, metadata = whisperx.load_align_model(language_code=result["language"], device=align_device)
print(f"Alignment model loaded in {time.time() - step_start:.2f}s")

print("Aligning timestamps...")
step_start = time.time()
# Run alignment strictly on CPU
result = whisperx.align(result["segments"], align_model, metadata, audio, align_device)
print(f"Alignment finished in {time.time() - step_start:.2f}s")

# Clear memory and empty the MPS cache before loading Pyannote
gc.collect()
if diarize_device == "mps":
    torch.mps.empty_cache()

# 3. Diarize (MPS supported)
print(f"Loading diarization model on {diarize_device}...")
step_start = time.time()
diarize_model = DiarizationPipeline(token=hf_token, device=diarize_device)
print(f"Diarization model loaded in {time.time() - step_start:.2f}s")

print("Diarizing audio...")
step_start = time.time()
diarize_segments = diarize_model(audio, min_speakers=2, max_speakers=2)
print(f"Diarization finished in {time.time() - step_start:.2f}s")

# 4. Assign speakers to words
print("Assigning speakers...")
step_start = time.time()
result = whisperx.assign_word_speakers(diarize_segments, result)
print(f"Speaker assignment finished in {time.time() - step_start:.2f}s")

# 5. Save as JSON for the UI and TXT for readability
print("Saving outputs...")
step_start = time.time()

# Build the text content while updating the JSON segments
transcript_text_lines = []

for segment in result["segments"]:
    # Map raw speaker IDs to readable labels
    role = speaker_map.get(segment.get("speaker"), "Unknown")
    segment["speaker_label"] = role
    
    # Clean up the text
    text_content = segment.get("text", "").strip()
    
    # Format the line as "Role: Text"
    transcript_text_lines.append(f"{role}: {text_content}")

# Save the JSON file
with open(output_json, "w", encoding="utf-8") as f:
    json.dump(result["segments"], f, indent=2)

# Save the TXT file
with open(output_txt, "w", encoding="utf-8") as f:
    f.write("\n".join(transcript_text_lines))

print(f"Saving finished in {time.time() - step_start:.2f}s")

# Stop the master timer and report total duration
total_time = time.time() - total_start_time
print(f"Done! Saved to {output_json} and {output_txt}")
print(f"Total pipeline execution time: {total_time:.2f}s")