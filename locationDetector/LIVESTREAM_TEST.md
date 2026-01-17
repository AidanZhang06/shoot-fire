# Livestream Metadata Test

Browser-based test: point your phone or laptop camera at indoor surroundings and see metadata extracted every ~2 seconds via the Overshoot API.

## Setup

1. **Copy env and add your Overshoot API key**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   ```
   OVERSHOOT_API_KEY=your_actual_overshoot_api_key
   ```

2. **Install dependencies and run the server**
   ```bash
   pip install -r requirements.txt
   python -m src.api
   ```
   Or use `./run_server.sh` (creates venv, installs deps, checks `.env`).

   The server listens on `http://0.0.0.0:8000`.

## Test on your phone

1. **Same Wi-Fi:** Phone and computer on the same network.
2. **Your computer’s IP:** e.g. `ifconfig | grep "inet " | grep -v 127.0.0.1` on Mac, or System Settings → Network. Example: `192.168.1.5`.
3. **On the phone:** Open `http://192.168.1.5:8000/` in the browser.
4. **Camera:** Allow camera when prompted. Tap **Start**. The page captures a frame every ~2 seconds, sends it to `/extract`, and shows the metadata (scene, landmarks, text, quality). Tap **Stop** to pause.

## Test on your laptop

Open `http://localhost:8000/` in a browser, allow camera, and use **Start** / **Stop** as above.

## If it doesn’t work

- **Firewall:** Allow inbound TCP on port 8000.
- **Camera / HTTP:** Try another browser (e.g. Chrome on Android) if one blocks `getUserMedia` or non-HTTPS.
- **API errors:** Check server logs and ensure `OVERSHOOT_API_KEY` in `.env` is valid.

