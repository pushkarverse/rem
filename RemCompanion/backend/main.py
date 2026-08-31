from fastapi import FastAPI, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uuid
from brain.llm_engine import generate_rem_response
from voice.tts_engine import speak
from voice.stt_engine import transcribe_audio
app = FastAPI(title="Rem AI Companion API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class ChatRequest(BaseModel):
    message: str
    use_voice: bool = False
@app.get("/")
def read_root():
    return {"status": "Rem is awake!"}
@app.post("/api/chat")
async def chat_with_rem(request: ChatRequest, background_tasks: BackgroundTasks):
    rem_response = generate_rem_response(request.message)
    if request.use_voice and rem_response and "response" in rem_response:
        background_tasks.add_task(speak, rem_response["response"])
    return rem_response
class SpeakRequest(BaseModel):
    text: str
@app.post("/api/speak")
async def trigger_speech(request: SpeakRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(speak, request.text)
    return {"status": "Generating speech"}
@app.post("/api/transcribe")
async def transcribe_voice(file: UploadFile = File(...)):
    temp_file_path = f"temp_{uuid.uuid4()}.webm"
    try:
        content = await file.read()
        with open(temp_file_path, 'wb') as out_file:
            out_file.write(content)
        text = transcribe_audio(temp_file_path)
        return {"text": text}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)