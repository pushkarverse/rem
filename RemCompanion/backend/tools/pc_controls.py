import os
import subprocess
import datetime
import webbrowser
def open_app(app_name: str) -> str:
    print(f"[TOOL] Opening application: {app_name}")
    try:
        os.system(f"start {app_name}")
        return f"Successfully attempted to open {app_name}."
    except Exception as e:
        return f"Failed to open {app_name}. Error: {e}"
def get_current_time() -> str:
    print("[TOOL] Getting current time.")
    now = datetime.datetime.now()
    return now.strftime("The current date and time is %A, %B %d, %Y at %I:%M %p.")
def search_web(query: str) -> str:
    print(f"[TOOL] Searching the web for: {query}")
    try:
        url = f"https://www.google.com/search?q={query}"
        webbrowser.open(url)
        return f"Successfully opened a web browser to search for '{query}'."
    except Exception as e:
        return f"Failed to search the web. Error: {e}"
AVAILABLE_TOOLS = {
    "open_app": open_app,
    "get_current_time": get_current_time,
    "search_web": search_web
}
GROQ_TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "open_app",
            "description": "Opens a desktop application on the user's Windows PC.",
            "parameters": {
                "type": "object",
                "properties": {
                    "app_name": {
                        "type": "string",
                        "description": "The name of the application to open, e.g., 'chrome', 'notepad', 'spotify', 'explorer'."
                    }
                },
                "required": ["app_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "Gets the current date and time of the user's PC.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Opens the user's web browser to search Google for a specific query.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to look up on Google."
                    }
                },
                "required": ["query"]
            }
        }
    }
]