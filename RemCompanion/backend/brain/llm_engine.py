import os
import json
from groq import Groq
from dotenv import load_dotenv
from .personality import REM_SYSTEM_PROMPT
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from tools.pc_controls import GROQ_TOOLS_SCHEMA, AVAILABLE_TOOLS
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)
MODEL_NAME = "qwen/qwen3.6-27b"
import re

def generate_rem_response(user_message: str, chat_history: list = None) -> dict:
    if chat_history is None:
        chat_history = []
    messages = [
        {"role": "system", "content": REM_SYSTEM_PROMPT}
    ]
    messages.extend(chat_history)
    messages.append({"role": "user", "content": user_message})
    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=MODEL_NAME,
            temperature=0.7,
            max_tokens=1024,
            tools=GROQ_TOOLS_SCHEMA,
            tool_choice="auto",
        )
        response_message = chat_completion.choices[0].message
        
        # Did Groq decide to call a tool?
        if response_message.tool_calls:
            messages.append({
                "role": "assistant",
                "tool_calls": [
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": tool_call.function.arguments
                        }
                    } for tool_call in response_message.tool_calls
                ]
            })
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                function_to_call = AVAILABLE_TOOLS.get(function_name)
                if function_to_call:
                    function_args = json.loads(tool_call.function.arguments)
                    print(f"Executing tool: {function_name}({function_args})")
                    function_response = function_to_call(**function_args)
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": function_response,
                    })
            
            # Second call to get the spoken response
            final_completion = client.chat.completions.create(
                messages=messages,
                model=MODEL_NAME,
                temperature=0.7,
                max_tokens=1024,
            )
            raw_text = final_completion.choices[0].message.content or "Done!"
        else:
            raw_text = response_message.content or ""
            
        # Parse emotion tag
        emotion = "neutral"
        match = re.search(r'<emotion>(.*?)</emotion>', raw_text, re.IGNORECASE)
        if match:
            emotion = match.group(1).strip().lower()
            raw_text = re.sub(r'<emotion>.*?</emotion>', '', raw_text, flags=re.IGNORECASE).strip()
            
        if not raw_text:
            raw_text = "..."
            
        return {"response": raw_text, "emotion": emotion}
        
    except Exception as e:
        print(f"Error communicating with Groq: {e}")
        return {"response": "Rem is having trouble thinking right now. Please forgive Rem...", "emotion": "sad"}