import speech_recognition as sr
import os
audio_path = r"C:\Users\pushk\OneDrive\Desktop\Rem\RemCompanion\backend\voice\rem_voice.wav"
recognizer = sr.Recognizer()
try:
    with sr.AudioFile(audio_path) as source:
        audio = recognizer.record(source, duration=12)
    text = recognizer.recognize_google(audio)
    print("TRANSCRIPTION:", text)
except Exception as e:
    print("Error:", e)