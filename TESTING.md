# Testing the Emergency Evacuation System 🧪

Complete guide to test your video-to-text emergency evacuation system with real camera input.

## Quick Start (2 Minutes)

### 1. Start the Server

```bash
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║   Emergency Evacuation System - Server Started            ║
╚═══════════════════════════════════════════════════════════╝
🚀 Server running on port 3000
```

### 2. Open the Web Client

Open your browser and go to:
```
http://localhost:3000
```

### 3. Allow Camera Access

1. Click **"Start Camera"**
2. Your browser will ask for camera permission - **click "Allow"**
3. Point your camera at your environment
4. Watch real-time analysis appear on the right side!

### 4. Watch the Magic ✨

Every 0.5-1 seconds, you'll see:
- **Obstacles detected** (furniture, objects, blockages)
- **Hazard analysis** (fire, smoke, water)
- **People counting** and density
- **Exit detection** and status
- **Processing latency** (should be under 1 second)

## What to Test

### Scenario 1: Normal Environment
**Point your camera at:**
- Empty space → Should show "0 obstacles", "No hazards"
- Furniture → Should detect obstacles
- People → Should count visible people

**Expected results:**
```
🚧 Obstacles: 1-3 detected (chair, desk, etc.)
🔥 Fire: None
💨 Smoke: None
💧 Water: None
👥 People: 1-2 (you and anyone else visible)
🚪 Exits: None (unless you have exit signs)
```

### Scenario 2: Testing Hazard Detection
**Try to simulate hazards:**
- Show red/orange objects (may be detected as fire)
- Show smoke/steam (may be detected as smoke)
- Show water on floor

**Note:** Real fire/smoke detection will be most accurate, but the AI can sometimes identify orange/red objects.

### Scenario 3: People Density
**Test crowd detection:**
- Stand alone → Should show "1 person, clear density"
- Show a photo/video of crowd → Should count multiple people
- Move around → Should update person positions (left/center/right)

### Scenario 4: Exit Signs
**If you have exit signs:**
- Point camera at exit sign → Should detect "door/sign visible, status: clear"
- Block the exit → Status may change to "blocked"
- Show direction (degrees from center)

## Understanding the Results

### Analysis Card Layout

Each result card shows:

```
┌─────────────────────────────────────────┐
│ 12:34:56 PM         Confidence: 87%     │ ← Timestamp & AI confidence
├─────────────────────────────────────────┤
│ 🚧 Obstacles: 2 detected                │ ← Physical blockages
│ 🔥 Fire: Intensity 3/5 (growing)        │ ← Fire hazards (if present)
│ 💨 Smoke: Density 4/5 (reduced)         │ ← Smoke hazards (if present)
│ 💧 Water: None                          │ ← Water/flooding
│ 👥 People: 7 (moderate)                 │ ← People count & density
│ 🚪 Exits: door: clear (45°)            │ ← Visible exits & direction
│ ⏱️ Processing Time: 750ms               │ ← Total latency
└─────────────────────────────────────────┘
```

### Hazard Alert Cards

If hazards are detected, the card turns RED with:
```
⚠️ HAZARDS DETECTED

Shows intensity levels and growth rates for immediate action
```

## Server-Side Monitoring

While testing, watch your server terminal. You'll see:

```bash
[Server] Client connected: xyz123
[Server] User registered: user-1234567890

[Client Analysis] User user-1234567890:
  Obstacles: 2
  Fire: No
  Smoke: No
  People: 1
  Exits visible: 0
  Latency: 650ms
```

This shows the server is receiving and processing your video analysis!

## Performance Metrics

### Target Metrics
- **Latency**: Should be 500-1000ms per result
- **Update frequency**: New analysis every 0.5-1 seconds
- **Confidence**: Should be >70% for good lighting
- **Frame rate**: 30 FPS camera capture, 15% sampled = ~4.5 frames/analysis

### What Affects Performance?
1. **Lighting** - Better lighting = higher confidence
2. **Camera quality** - Higher resolution = better detection
3. **Movement** - Shaky camera = lower confidence
4. **Internet speed** - Affects Overshoot API latency
5. **Scene complexity** - More objects = slightly slower

## Troubleshooting

### "Camera not starting"
**Problem:** Browser can't access camera

**Solutions:**
1. Check browser permissions (Settings → Privacy → Camera)
2. Use **HTTPS or localhost only** (browsers block camera on HTTP)
3. Try a different browser (Chrome/Edge work best)
4. Close other apps using camera (Zoom, Teams, etc.)

### "No analysis results appearing"
**Problem:** Overshoot API not responding

**Solutions:**
1. Check your API key is correct in `public/index.html`
2. Check internet connection
3. Look for errors in browser console (F12)
4. Check server terminal for error messages

### "Connection status shows disconnected"
**Problem:** Can't connect to server

**Solutions:**
1. Make sure server is running (`npm run dev`)
2. Check URL is `http://localhost:3000`
3. Check firewall isn't blocking port 3000
4. Try restarting the server

### "Low confidence scores (<50%)"
**Problem:** Poor detection quality

**Solutions:**
1. Improve lighting (turn on lights, avoid backlighting)
2. Stabilize camera (don't move too fast)
3. Point at clear, unambiguous objects
4. Move closer to objects

### "Browser console errors"
**Problem:** JavaScript errors

Open browser console (F12) and look for:
- CORS errors → Check server CORS settings
- Module loading errors → Check internet connection
- API errors → Check Overshoot API status

## Advanced Testing

### Test Multiple Users

1. Open **multiple browser tabs/windows** to `http://localhost:3000`
2. Each gets a unique user ID
3. Watch server terminal to see all users tracked
4. Adaptive config kicks in at 30+ users

### Test Load Handling

Watch the server switch configurations:
```bash
# At 30+ concurrent users, you'll see:
[Overshoot] Using HIGH_LOAD config
```

This means:
- Clip length increases to 1.0s
- Sampling ratio drops to 10%
- System maintains performance under load

### Simulate Emergency Scenarios

**Scenario: Fire Evacuation**
1. Show red/orange objects to simulate fire
2. Show multiple people (photos/videos)
3. Block some exits
4. Watch how system tracks all variables

**Scenario: Crowded Exit**
1. Show many people near an exit
2. System should detect high density
3. In full implementation, would route to alternate exit

### API Testing with cURL

Test server endpoints:

```bash
# Check server status
curl http://localhost:3000/

# Health check
curl http://localhost:3000/health

# System statistics
curl http://localhost:3000/stats
```

## Data Flow Visualization

```
┌─────────────────┐
│  Your Camera    │
│  (Browser)      │
└────────┬────────┘
         │ Video frames (30 FPS)
         ↓
┌─────────────────┐
│ Overshoot API   │ ← 15% of frames analyzed
│ (Cloud)         │
└────────┬────────┘
         │ JSON results every 0.5-1s
         ↓
┌─────────────────┐
│ Browser Client  │ ← Displays in UI
│ (Your Screen)   │
└────────┬────────┘
         │ Send results via WebSocket
         ↓
┌─────────────────┐
│ Your Server     │ ← Logs and aggregates
│ (Node.js)       │
└─────────────────┘
```

## Example Session Output

### Browser Console (F12)
```
✅ Connected to server
🎥 Processing started: {userId: "user-1737...", success: true}
📊 Analysis result: {confidence: 0.85, obstacles: [...], ...}
📊 Analysis result: {confidence: 0.87, obstacles: [...], ...}
📊 Analysis result: {confidence: 0.89, obstacles: [...], ...}
```

### Server Terminal
```
[Server] Client connected: abc123
[Server] User registered: user-1737148260000

[Client Analysis] User user-1737148260000:
  Obstacles: 1
  Fire: No
  Smoke: No
  People: 1
  Exits visible: 0
  Latency: 620ms

[Client Analysis] User user-1737148260000:
  Obstacles: 2
  Fire: No
  Smoke: No
  People: 2
  Exits visible: 1
  Latency: 580ms
```

## Success Criteria

Your test is successful if you see:

✅ Camera feed appears in browser
✅ "Connected to Server" status shows green
✅ Analysis results appear every 0.5-1 seconds
✅ Latency is under 1000ms
✅ Obstacles are detected when visible
✅ People count is accurate (±1)
✅ Server logs show analysis data
✅ Confidence scores are >70%

## What's Next?

After successful testing, you've validated the **video-to-text translation** foundation!

Next steps to build the full evacuation system:

1. **Situational Map Manager** - Aggregate data from multiple users into spatial grid
2. **Route Optimization** - Calculate safe paths avoiding hazards
3. **Exit Load Balancing** - Prevent bottlenecks by distributing users
4. **Floor Plan Integration** - Load building layouts
5. **3D Visualization** - Show routes in AR overlay

See the main [README.md](README.md) for architecture details!

## Need Help?

- **Overshoot API Issues**: https://docs.overshoot.ai/
- **Server Issues**: Check `npm run dev` terminal output
- **Browser Issues**: Open DevTools (F12) and check Console tab
- **Performance Issues**: Reduce `sampling_ratio` in `public/index.html`

---

🎯 **Goal**: Validate that video is being converted to actionable text data in real-time with sub-second latency!
