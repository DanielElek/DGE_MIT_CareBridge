import subprocess
import urllib.request

# Verify FFmpeg environment paths and versions
print("--- Checking FFmpeg ---")
try:
    print(subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True).stdout.split('\n')[0])
except Exception as e:
    print("FFmpeg not found in PATH:", e)

try:
    import torchaudio
    print("Torchaudio FFmpeg versions:", torchaudio.utils.ffmpeg_utils.get_versions())
except Exception as e:
    print("Torchaudio FFmpeg error:", e)

# Verify the network connection to Hugging Face
print("\n--- Checking Hugging Face Network ---")
try:
    print("HTTP Status Code:", urllib.request.urlopen("https://huggingface.co/Systran").getcode())
except Exception as e:
    print("Network check failed:", e)