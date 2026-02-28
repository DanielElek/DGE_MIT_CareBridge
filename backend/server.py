import os
import json
import asyncio
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

app = FastAPI()

# Allow CORS for the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_DIR = Path(__file__).parent.absolute()
AUDIO_FILE_PATH = BACKEND_DIR / "converted_audio.wav"
FINAL_JSON_PATH = BACKEND_DIR / "final_soap_summary.json"

import threading
from transcribe import preload_models as preload_transcription, run_transcription_pipeline
from process_transcript import preload_models as preload_llm, run_process_transcript

def generator_to_queue(generator, queue):
    """Pumps items from a synchronous generator into an asyncio logic via memory queue safely."""
    try:
        for item in generator:
            queue.put(item)
    except Exception as e:
        queue.put(json.dumps({'status': 'error', 'message': f'Exception in worker thread: {str(e)}'}) + "\n")
    finally:
        queue.put(None)  # Signal completion

async def stream_from_queue(queue):
    while True:
        item = queue.get()
        if item is None:
            break
        yield item

preload_lock = threading.Lock()
is_preloading = False

@app.post("/api/preload")
async def preload_models_endpoint():
    """Background-loads ML models sequentially so they are cached in memory."""
    global is_preloading
    
    with preload_lock:
        if is_preloading:
            return {"status": "success", "message": "Preloading already in progress"}
        is_preloading = True

    def _do_preload():
        global is_preloading
        try:
            preload_transcription()
            preload_llm()
        finally:
            with preload_lock:
                is_preloading = False
        
    # We run the preloading off the main loop to avoid blocking FastAPI
    thread = threading.Thread(target=_do_preload)
    thread.start()
    return {"status": "success", "message": "Preloading started in background"}

import shutil

@app.post("/api/process")
async def process_audio(audio: UploadFile = File(...)):
    # Save the uploaded file to a temporary file, preserving extension if possible
    ext = Path(audio.filename).suffix if audio.filename else ".tmp"
    temp_input_path = BACKEND_DIR / f"temp_input{ext}"
    
    with open(temp_input_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)
        
    async def event_generator():
        try:
            yield f"data: {json.dumps({'status': 'start', 'message': f'File received. Normalizing from {ext}...'})}\n\n"
            
            # 0. Normalize audio using ffmpeg to standard 16kHz wav for whisperx
            ffmpeg_cmd = [
                "ffmpeg", "-y", "-i", str(temp_input_path),
                "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le",
                str(AUDIO_FILE_PATH)
            ]
            
            process = await asyncio.create_subprocess_exec(
                *ffmpeg_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await process.communicate()
            
            if process.returncode != 0:
                yield f"data: {json.dumps({'status': 'error', 'message': 'Audio normalization (ffmpeg) failed.'})}\n\n"
                return
                
            yield f"data: {json.dumps({'status': 'info', 'message': 'Audio normalized. Starting transcription...'})}\n\n"
            
            # 1. Run local transcribe pipeline
            import queue
            memory_queue = queue.Queue()
            transcribe_thread = threading.Thread(
                target=generator_to_queue, 
                args=(run_transcription_pipeline(str(AUDIO_FILE_PATH), str(BACKEND_DIR / "transcript.json"), str(BACKEND_DIR / "formatted_dialogue.txt")), memory_queue)
            )
            transcribe_thread.start()
            
            success = False
            while True:
                # We add slight delays and loop inside the async generator so we dont lock uvicorn
                await asyncio.sleep(0.01)
                try:
                    # Get all available items non-blocking
                    data_chunk = memory_queue.get_nowait()
                    if data_chunk is None:
                        transcribe_thread.join()
                        break
                    
                    if '"status": "returncode"' in data_chunk:
                        parsed = json.loads(data_chunk)
                        if parsed["code"] == 0:
                            success = True
                    else:
                        yield f"data: {data_chunk}\n"
                except queue.Empty:
                    pass
                    
            if not success:
                yield f"data: {json.dumps({'status': 'error', 'message': 'Transcription failed.'})}\n\n"
                return
                
            transcript_path = BACKEND_DIR / "formatted_dialogue.txt"
            detailed_transcript_path = BACKEND_DIR / "transcript.json"
            try:
                with open(transcript_path, "r", encoding="utf-8") as f:
                    transcription_text = f.read()
                
                detailed_transcript = []
                if detailed_transcript_path.exists():
                    with open(detailed_transcript_path, "r", encoding="utf-8") as f:
                        detailed_transcript = json.load(f)
                
                yield f"data: {json.dumps({'status': 'transcription_done', 'transcription': transcription_text, 'detailed_transcript': detailed_transcript})}\n\n"
            except Exception:
                pass

            yield f"data: {json.dumps({'status': 'info', 'message': 'Transcription complete. Starting generation and pruning...'})}\n\n"
            
            # 2. Run local process_transcript pipeline
            llm_queue = queue.Queue()
            process_thread = threading.Thread(
                target=generator_to_queue,
                args=(run_process_transcript(str(BACKEND_DIR / "formatted_dialogue.txt"), str(FINAL_JSON_PATH)), llm_queue)
            )
            process_thread.start()
            
            success = False
            while True:
                await asyncio.sleep(0.01)
                try:
                    data_chunk = llm_queue.get_nowait()
                    if data_chunk is None:
                        process_thread.join()
                        break
                        
                    if '"status": "returncode"' in data_chunk:
                        parsed = json.loads(data_chunk)
                        if parsed["code"] == 0:
                            success = True
                    else:
                        yield f"data: {data_chunk}\n"
                except queue.Empty:
                    pass
                    
            if not success:
                yield f"data: {json.dumps({'status': 'error', 'message': 'SOAP processing failed.'})}\n\n"
                return
                
            # 3. Read the final JSON and send it back
            try:
                with open(FINAL_JSON_PATH, "r", encoding="utf-8") as f:
                    final_output = json.load(f)
                # The JSON now has {soap: {...}, quotes: {...}} structure
                final_soap = final_output.get("soap", final_output)
                final_quotes = final_output.get("quotes", {})
                yield f"data: {json.dumps({'status': 'done', 'soap': final_soap, 'quotes': final_quotes})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'status': 'error', 'message': f'Failed to read final JSON: {str(e)}'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': f'Internal backend error: {str(e)}'})}\n\n"
        finally:
            # Cleanup temp file if it exists
            if temp_input_path.exists():
                try:
                    os.remove(temp_input_path)
                except:
                    pass

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
