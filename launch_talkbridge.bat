@echo off
TITLE TalkBridge - Premium Launcher
COLOR 0B

echo ===================================================
echo [TalkBridge] Voice UI Recognition Environment
echo ===================================================

:: 1. Validation Checks
echo [*] Phase 1/3: Environment Audit...

:: 1.1 Check Port 8000 (NEW: Cleanly kill any zombie backend instances)
echo [*] Checking for zombie backend on Port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo [!] Process %%a is blocking Port 8000. Terminating...
    taskkill /F /PID %%a >nul 2>&1
)

:: 1.2 Check FFmpeg
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] WARNING: FFmpeg not detected in PATH.
    echo [!] Recognition backend will FAIL to process audio conversion.
    echo [!] Install via 'choco install ffmpeg' or scoop or manually.
    echo.
) else (
    echo [V] FFmpeg detected.
)

:: 1.3 Check Backend Virtual Env
if not exist "recognition-service\venv" (
    echo [!] Backend virtual environment missing.
    echo [!] Creating venv and installing requirements...
    cd recognition-service
    python -m venv venv
    venv\Scripts\pip install -r requirements.txt
    cd ..
) else (
    echo [V] Backend venv detected.
)

:: 1.4 Check Frontend Dependencies
if not exist "node_modules" (
    echo [!] node_modules missing. Installing dependencies...
    call npm install
) else (
    echo [V] Frontend node_modules detected.
)

:: 2. Launch Services
echo.
echo [*] Phase 2/3: Launching Services...

:: 2.1 Backend (Start in new titled window)
echo [1/2] Starting Recognition Service (FastAPI) on Port 8000...
start "TalkBridge Backend (Port 8000)" cmd /k "cd recognition-service && venv\Scripts\python main.py"

:: 2.2 Frontend
echo [2/2] Starting TalkBridge UI (Expo)...
echo.
echo [HELP] Using --lan for instant startup on your current WiFi
echo [HELP] 1. Your phone and PC must be on the same WiFi
echo [HELP] 2. Leave EXPO_PUBLIC_RECOGNITION_API_URL as localhost for desktop use
echo [HELP] 3. Expo LAN host detection will be used automatically on phone
echo.

npx expo start --lan

echo ===================================================
echo [TalkBridge] Launcher script finished.
echo ===================================================
pause
