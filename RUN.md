# TalkBridge Startup Guide

To run the TalkBridge application, you must start both the **Recognition Backend** (FastAPI) and the **Expo Frontend**.

## Step 1: Start the Recognition Backend
This service handles vocal training and audio matching using MFCC.

1.  **Open Terminal** in the `recognition-service` folder:
    ```powershell
    cd recognition-service
    ```
2.  **Activate Virtual Environment**:
    ```powershell
    .\venv\Scripts\activate
    ```
3.  **Run Service**:
    ```powershell
    python main.py
    ```
    *Keep this terminal open while using the app.*

## Step 2: Start the Expo App
This launches the mobile client.

1.  **Open a New Terminal** in the root `TalkBridge` folder:
    ```powershell
    cd ..
    ```
2.  **Start Expo**:
    ```powershell
    npx expo start
    ```
3.  **Open on Device**:
    - **Physical Phone**: Scan the QR code using the **Expo Go** app (Android) or Camera app (iOS).
    - **Simulator**: Press `i` for iOS or `a` for Android.

---

## ⚡ Important Notes
### 1. Networking (Physical Device)
Your phone and laptop **must** be on the same Wi-Fi network. The app connects to the recognition server via your local IP address.
- **Current Backend URL**: `http://192.168.29.106:8000`
- **To Update IP**: If your IP changes, modify the `EXPO_PUBLIC_RECOGNITION_API_URL` value in your `.env.local` file.

### 2. Audio Normalization
The backend requires `ffmpeg.exe` to be present in the `recognition-service/` folder for audio processing to work correctly.

### 3. Debugging
- If recognition fails, check the backend terminal for logs.
- Ensure the `samples/` directory exists inside `recognition-service/` if you are training new cards.
