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
model_dir = "distil-large-v35-ct2" 
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

# Global variables to hold models
transcribe_model = None
align_model = None
align_metadata = None
diarize_model = None

import threading
_model_lock = threading.Lock()

def preload_models():
    """Load transcription, alignment, and diarization models into global memory if not already loaded."""
    global transcribe_model, align_model, align_metadata, diarize_model
    
    with _model_lock:
        if transcribe_model is not None and diarize_model is not None:
            print("Transcription and Diarization models already loaded.")
            return

        if transcribe_model is None:
            print(f"Loading transcription model on {transcribe_device}...")
            transcribe_model = whisperx.load_model(model_dir, device=transcribe_device, compute_type=transcribe_compute_type)
            
        if diarize_model is None:
            print(f"Loading diarization model on {diarize_device}...")
            diarize_model = DiarizationPipeline(token=hf_token, device=diarize_device)
        
    # We will load the alignment model right before alignment using the detected language.
    # However we could pre-load an English one. For now, since alignment is fast, we'll keep
    # the whisper alignment loading dynamic based on language.

def format_yield(status, message):
    """Helper to yield JSON formatted string logs"""
    return json.dumps({"status": status, "message": message}) + "\n"

def run_transcription_pipeline(audio_file_path="converted_audio.wav", out_json="transcript.json", out_txt="formatted_dialogue.txt"):
    """
    Runs the complete transcription and diarization pipeline, yielding status updates.
    Assumes `preload_models()` was called beforehand.
    """
    global transcribe_model, align_model, align_metadata, diarize_model

    if transcribe_model is None or diarize_model is None:
        yield format_yield("info", "Models not preloaded. Loading now...")
        preload_models()

    total_start_time = time.time()

    # 1. Transcribe (Forced to CPU)
    yield format_yield("info", "Started transcription...")
    step_start = time.time()
    # We use global loaded model
    yield format_yield("info", "Loading audio file...")
    audio = whisperx.load_audio(audio_file_path)

    # Normalize audio volume to maximize the signal before processing
    max_amp = np.max(np.abs(audio))
    if max_amp > 0:
        audio = audio / max_amp

    result = transcribe_model.transcribe(audio, batch_size=16)
    yield format_yield("info", f"Transcription finished in {time.time() - step_start:.2f}s")

    # Clear memory before loading the Wav2Vec2 alignment model
    gc.collect()

    # 2. Align (word-level timestamps)
    yield format_yield("info", f"Loading alignment model for language: {result['language']}...")
    step_start = time.time()
    align_model, align_metadata = whisperx.load_align_model(language_code=result["language"], device=align_device)
    yield format_yield("info", f"Alignment model loaded in {time.time() - step_start:.2f}s")

    yield format_yield("info", "Aligning timestamps...")
    step_start = time.time()
    # Run alignment strictly on CPU
    result = whisperx.align(result["segments"], align_model, align_metadata, audio, align_device)
    yield format_yield("info", f"Alignment finished in {time.time() - step_start:.2f}s")

    # Clear memory and empty the MPS cache before loading Pyannote
    gc.collect()
    if diarize_device == "mps":
        torch.mps.empty_cache()

    # 3. Diarize (MPS supported)
    yield format_yield("info", "Diarizing audio...")
    step_start = time.time()
    diarize_segments = diarize_model(audio, min_speakers=2, max_speakers=2)
    yield format_yield("info", f"Diarization finished in {time.time() - step_start:.2f}s")

    # 4. Assign speakers to words
    yield format_yield("info", "Assigning speakers...")
    step_start = time.time()
    result = whisperx.assign_word_speakers(diarize_segments, result)
    yield format_yield("info", f"Speaker assignment finished in {time.time() - step_start:.2f}s")

    # 5. Save as JSON for the UI and TXT for readability
    yield format_yield("info", "Saving outputs...")
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
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(result["segments"], f, indent=2)

    # Save the TXT file
    with open(out_txt, "w", encoding="utf-8") as f:
        f.write("\n".join(transcript_text_lines))

    yield format_yield("info", f"Saving finished in {time.time() - step_start:.2f}s")

    # Stop the master timer and report total duration
    total_time = time.time() - total_start_time
    yield json.dumps({"status": "returncode", "code": 0, "message": f"Done! Saved to {out_json} and {out_txt}. Total time: {total_time:.2f}s"}) + "\n"

# Maintain standalone execution compatibility
if __name__ == "__main__":
    for msg in run_transcription_pipeline():
        print(msg, end="")