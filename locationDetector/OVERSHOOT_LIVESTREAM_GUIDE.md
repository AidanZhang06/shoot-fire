# 🎥 Overshoot Live Video Streaming Guide

## What This Does

Uses the **Overshoot SDK directly in the browser** to stream live video from your phone/laptop camera and extract indoor localization metadata in real-time.

## How It Works

```
Phone Camera
    ↓ (WebRTC stream)
Overshoot SDK (in browser)
    ↓ (WebRTC connection)
Overshoot AI Service
    ↓ (results every 3 seconds)
Your Browser (displays metadata)
```

## 🚀 Quick Start

### 1. Start the Server

```bash
cd /Users/sujit_uppuluri/nexhacks-winners
./run_server.sh
```

Server will start on `http://localhost:8000`

### 2. Open in Browser

**On your computer:**
```
http://localhost:8000
```

**On your phone (same WiFi):**
```
http://YOUR_COMPUTER_IP:8000
```

To find your IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Result example: 192.168.1.100
# Use: http://192.168.1.100:8000
```

### 3. Use the App

1. Click **"Start Live Stream"**
2. Grant camera permission when prompted
3. Point camera at indoor environment
4. Watch metadata appear every ~3 seconds!

## 📊 What You'll See

The app displays:

- **Scene Type**: hallway, room, lobby, stairwell, etc.
- **Detected Text**: Room numbers, floor signs, EXIT signs
- **Landmarks**: Doors, stairs, elevators with direction & distance
- **Quality Info**: Lighting conditions, motion blur detection
- **Raw Response**: Full text from Overshoot AI

### Example Output

```
Scene: HALLWAY

Detected Text (2):
  "Room 312" [88%]
  "Floor 3" [92%]

Landmarks (3):
  door: left / near [85%]
  exit_sign: ahead / mid [91%]
  staircase: right / far [78%]

Quality:
  Lighting: good
  Motion Blur: NO ✓
```

## ⚙️ Configuration

### Update Results Frequency

Edit `overshoot-livestream.html` line ~190:

```javascript
clip_length_seconds: 2.0,  // Analyze 2-second clips
delay_seconds: 3.0,        // Get results every 3 seconds (change this!)
```

**Options:**
- `delay_seconds: 1.0` - Very frequent (expensive, 1 result/sec)
- `delay_seconds: 3.0` - Balanced (recommended)
- `delay_seconds: 5.0` - Less frequent (cheaper)
- `delay_seconds: 10.0` - Occasional updates

### Improve Quality vs Speed

```javascript
fps: 30,              // Capture rate (keep at 30)
sampling_ratio: 0.2,  // Send 20% of frames (adjust this)
```

**sampling_ratio options:**
- `0.1` (10%) - Faster, cheaper, less context
- `0.2` (20%) - **Recommended balance**
- `0.3` (30%) - More context, slower, more expensive
- `0.5` (50%) - High quality, expensive

### Change Camera

```javascript
source: {
  type: 'camera',
  cameraFacing: 'environment'  // 'environment' = back, 'user' = front
}
```

## 🐛 Troubleshooting

### "Failed to start: Permission denied"
- Browser needs camera permission
- Click the permission prompt when it appears
- On iOS: Settings → Safari → Camera → Allow

### "Cannot connect to Overshoot"
- Check your API key in `overshoot-livestream.html` line ~140
- Verify it matches your `.env` file
- Check internet connection (Overshoot is a cloud service)

### No video showing
- Check camera is not being used by another app
- Try refreshing the page
- Try switching camera: change `cameraFacing` to `'user'`

### Metadata not updating
- Check browser console (F12) for errors
- Verify API key is valid
- Check if you have Overshoot API credits

### On phone: "localhost" doesn't work
- Use your computer's IP address instead
- Make sure phone and computer are on same WiFi
- Example: `http://192.168.1.100:8000`

## 📱 Mobile Testing

### Best Practices

1. **Use back camera** (already default)
2. **Hold phone steady** for better quality
3. **Good lighting** helps detection
4. **Walk slowly** through building for consistent results

### iOS Safari

Works great! Just grant camera permission.

### Android Chrome

Works great! Just grant camera permission.

## 🔧 Technical Details

### Architecture

- **Frontend**: Overshoot SDK handles all WebRTC complexity
- **Backend**: Not used for streaming (Overshoot is direct)
- **Connection**: Browser ↔ Overshoot Cloud (WebRTC)

### Why Not Use Backend?

Overshoot is designed for **WebRTC video streaming** which requires:
- SDP (Session Description Protocol) negotiation
- WebRTC peer connection setup
- Binary video frame transmission
- WebSocket for real-time results

The SDK handles all this complexity in the browser.

### Data Flow

1. Browser captures video from camera
2. Overshoot SDK sends frames via WebRTC
3. Overshoot AI processes video in cloud
4. Results stream back via WebSocket
5. Browser displays metadata

## 💡 Integration with Your App

### Get Metadata in JavaScript

```javascript
vision = new RealtimeVision({
  // ... config ...
  onResult: (result) => {
    const metadata = parseOvershootResult(result);

    // Send to your localization system
    sendToLocalizationAPI(metadata);

    // Or store locally
    storeMetadata(metadata);

    // Or send to backend
    fetch('/save-metadata', {
      method: 'POST',
      body: JSON.stringify(metadata)
    });
  }
});
```

### Extract Specific Data

```javascript
onResult: (result) => {
  const data = parseOvershootResult(result);

  // Room numbers
  const roomNumbers = data.text_detected
    .filter(t => /room\s*\d+/i.test(t.text))
    .map(t => t.text);

  // Floor indicators
  const floors = data.text_detected
    .filter(t => /floor\s*\d+/i.test(t.text))
    .map(t => t.text);

  // Nearby landmarks
  const nearLandmarks = data.landmarks
    .filter(l => l.distance === 'near');

  console.log('Rooms:', roomNumbers);
  console.log('Floors:', floors);
  console.log('Near:', nearLandmarks);
}
```

## 🎯 Next Steps

1. ✅ **Test the live stream** - Make sure it works
2. → **Walk through a building** - Test with real indoor spaces
3. → **Tune the prompt** - Adjust for your specific needs
4. → **Integrate with localization** - Send metadata to your floor plan matcher
5. → **Add data logging** - Save results for later analysis

## 📊 Cost Estimates

Overshoot pricing (approximate):
- Per-second of video processing
- At `delay_seconds: 3.0` → ~1200 results/hour
- Check your Overshoot dashboard for exact pricing

## 🆘 Need Help?

1. Check browser console (F12 → Console)
2. Look for error messages
3. Verify API key is correct
4. Test with `http://localhost:8000/health` to check server
5. Check Overshoot dashboard for API status

## 🎉 You're Ready!

Start the server, open the page, and start streaming!

```bash
./run_server.sh
# Then open: http://localhost:8000
```

Happy hacking! 🚀
