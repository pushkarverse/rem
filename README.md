# Rem Companion AI

Rem Companion is an AI desktop companion featuring a React/Vite/Electron frontend and a FastAPI backend with wake-word detection. Rem can listen for her name, process voice inputs, and interact with you on your desktop.

## Project Structure

- **`RemCompanion/backend/`**: A Python (FastAPI) server that handles voice processing, LLM integration, and wake-word detection. 
- **`RemCompanion/frontend/`**: A React application bundled with Vite and wrapped in Electron for a seamless desktop experience.
- **`start_rem.bat`**: A convenient startup script that launches the backend server, the wake-word listener, and the Electron frontend simultaneously.

## Prerequisites

- **Node.js** & **pnpm**: Required for running the React/Electron frontend.
- **Python 3.x**: Required for the FastAPI backend and wake-word daemon.
- **Virtual Environment**: A Python virtual environment (`.venv` or `venv`) with dependencies installed from `backend/requirements.txt`.

## Getting Started

1. **Setup Backend:**
   Navigate to `RemCompanion/backend`, create a virtual environment, and install dependencies:
   ```bash
   cd RemCompanion/backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```
   *Note: Ensure your API keys are configured in `RemCompanion/backend/.env`.*

2. **Setup Frontend:**
   Navigate to `RemCompanion/frontend` and install packages via pnpm:
   ```bash
   cd RemCompanion/frontend
   pnpm install
   ```

3. **Launch the Companion:**
   Run the `start_rem.bat` file in the root directory to automatically start all services:
   ```bash
   start_rem.bat
   ```
   This script will launch:
   - The FastAPI backend server (`0.0.0.0:8080`)
   - The Wake Word Daemon (Listening for the word "Rem")
   - The Electron desktop app wrapper for the UI

## Environment Variables

Make sure to create a `.env` file in the `RemCompanion/backend/` directory to store your API keys safely (e.g., Groq API Keys). This file is ignored by Git to keep your secrets secure.
