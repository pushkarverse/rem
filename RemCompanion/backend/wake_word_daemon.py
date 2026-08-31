import os
import time
import requests
import speech_recognition as sr
from dotenv import load_dotenv
load_dotenv()
API_URL = "http://localhost:8000/api/chat"
WAKE_WORDS = ["rem", "ram", "ren", "rim"]
def process_command(recognizer, audio):
    try:
        text = recognizer.recognize_google(audio).lower()
        print(f"[Ear] Heard: {text}")
        if any(word in text for word in WAKE_WORDS):
            print(f"[Wake Word] Detected! Processing command...")
            try:
                response = requests.post(API_URL, json={"message": text, "use_voice": True})
                if response.status_code == 200:
                    rem_response = response.json().get("response", "")
                    print(f"Rem says: {rem_response}")
            except Exception as e:
                print(f"Failed to reach Rem backend: {e}")
    except sr.UnknownValueError:
        pass
    except sr.RequestError as e:
        print(f"Could not request results; {e}")
def start_listening():
    recognizer = sr.Recognizer()
    microphone = sr.Microphone()
    with microphone as source:
        print("Calibrating background noise... please wait.")
        recognizer.adjust_for_ambient_noise(source, duration=2)
        print(f"Listening for wake words: {WAKE_WORDS}...")
    stop_listening = recognizer.listen_in_background(microphone, process_command)
    try:
        while True:
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("Stopping wake word daemon.")
        stop_listening(wait_for_stop=False)
if __name__ == "__main__":
    start_listening()