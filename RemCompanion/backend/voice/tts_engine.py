import os
import json
import urllib.request
import io
import soundfile as sf
import sounddevice as sd
OMNIVOICE_API_URL = "http://localhost:8000/v1/audio/speech"
def speak(text: str):
    if not text.strip():
        return
    print(f"Sending voice request to OmniVoice-Studio for: {text}")
    data = {
        "model": "omnivoice", 
        "input": text,
        "voice": "rem" 
    }
    req = urllib.request.Request(
        OMNIVOICE_API_URL, 
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print("Received audio from OmniVoice-Studio. Playing...")
                audio_data, fs = sf.read(io.BytesIO(response.read()))
                sd.play(audio_data, fs)
                sd.wait()
                print("Playback finished.")
            else:
                print(f"OmniVoice-Studio returned an error: {response.status}")
    except Exception as e:
        print(f"Error connecting to OmniVoice-Studio API: {e}")
        print("Please ensure OmniVoice-Studio is running and its API server is active on port 8000.")