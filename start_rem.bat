@echo off
echo Starting Rem Companion Backend...
start cmd /k "cd RemCompanion\backend && .\.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8080"

echo Starting Wake Word Daemon (Listening for "Rem")...
start cmd /k "cd RemCompanion\backend && .\.venv\Scripts\python.exe wake_word_daemon.py"

echo Starting Rem Companion Frontend (React)...
start cmd /k "cd RemCompanion\frontend && pnpm run dev"

echo Starting Rem Companion Window (Electron)...
timeout /t 3 /nobreak
start cmd /k "cd RemCompanion\frontend && pnpm run electron:start"

echo Rem is waking up!
