# Live Escape - Real-Time Evacuation Guidance System

## Component Overview

**Live Escape** is an AI-powered emergency evacuation system that provides real-time video analysis and turn-by-turn evacuation guidance during building emergencies.

### What It Does:
- 🎥 **Real-time video analysis** of emergency situations (fire, smoke, obstacles)
- 🧭 **Optimal exit assignment** using Hungarian algorithm
- 🗺️ **Dynamic pathfinding** with A* algorithm (avoids hazards)
- 📱 **AR-style guidance overlay** on camera feed
- 🔊 **Audio directions** with text-to-speech
- 📊 **Real-time coordination** (1-second cycle updates)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                   │
│  • Camera feed capture                                  │
│  • AR guidance overlay (minimap, directions, hazards)   │
│  • Socket.IO client connection                          │
│  • Text-to-speech audio                                 │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket
┌────────────────────▼────────────────────────────────────┐
│                   BACKEND (Node.js)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Evacuation Orchestrator (1s cycles)            │   │
│  │  1. Exit Assignment (Hungarian Algorithm)       │   │
│  │  2. Path Planning (A* with hazard avoidance)    │   │
│  │  3. Guidance Delivery (Socket.IO)               │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Services:                                       │   │
│  │  • ExitAssignmentService                        │   │
│  │  • PathPlannerService                           │   │
│  │  • GuidanceDeliveryService                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
live-escape/
├── public/
│   └── index.html              # Frontend UI (video feed, AR overlay)
├── src/
│   ├── index.ts                # Main server entry point
│   ├── services/
│   │   ├── orchestrator.ts     # Main coordination loop
│   │   ├── exit-assignment.ts  # Hungarian algorithm for exit assignment
│   │   ├── path-planner.ts     # A* pathfinding with hazard avoidance
│   │   └── guidance-delivery.ts # Socket.IO guidance to users
│   ├── mocks/
│   │   └── mock-data-provider.ts # Mock exits & hazards for testing
│   ├── types/
│   │   └── schemas.ts          # TypeScript interfaces
│   ├── utils/
│   │   ├── grid-utils.ts       # Grid calculations
│   │   └── route-utils.ts      # Route generation
│   ├── server/
│   │   └── overshoot-integration.ts # Video analysis integration
│   └── config/
│       └── overshoot-config.ts # API configuration
├── @types/                     # Type definitions
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── README.md                   # Full documentation
```

---

## Quick Start

### 1. Install Dependencies
```bash
cd live-escape
npm install
```

### 2. Build TypeScript
```bash
npm run build
```

### 3. Start Server
```bash
npm run dev
# or
node dist/index.js
```

### 4. Open in Browser
```
http://localhost:3000
```

### 5. Use the System
1. Click **"START CAMERA"**
2. Allow camera permissions
3. View real-time analysis overlay (top-right)
4. Guidance overlay will appear when positioning is enabled

---

## Integration with Other Components

### Socket.IO Events (for Integration)

**Client → Server:**
```javascript
socket.emit('register-user', {
  userId: string,
  position: { x, y, z }
});

socket.emit('update-position', {
  userId: string,
  position: { x, y, z },
  heading: number
});

socket.emit('video-analysis', {
  userId: string,
  analysis: {...},
  latency: number
});
```

**Server → Client:**
```javascript
socket.on('guidance-update', (payload) => {
  // payload.immediateActions - next steps
  // payload.route - distance, ETA
  // payload.hazardWarnings - nearby hazards
  // payload.visualization - minimap data
  // payload.audio - text-to-speech instruction
});

socket.on('hazard-alert', (alert) => {
  // Critical hazard warning
});

socket.on('evacuation-complete', (data) => {
  // User reached exit
});
```

### API Endpoints

```
GET  /                    # Service info
GET  /health              # Health check
GET  /stats               # Video processing stats
GET  /orchestrator-stats  # Orchestrator metrics
```

---

## Configuration

### Enable/Disable Guidance
**File:** `src/services/orchestrator.ts`
```typescript
private readonly ENABLE_GUIDANCE_DELIVERY = false;
// Set to true when accurate positioning is implemented
```

### Adjust Cycle Timing
**File:** `src/services/orchestrator.ts`
```typescript
private readonly CYCLE_INTERVAL = 1000; // 1 second
```

### Audio Debounce
**File:** `public/index.html` (line ~836)
```javascript
if (!forceImmediate && now - lastSpeechTime < 10000) { // 10 seconds
```

### Color Palette
**File:** `public/index.html` (lines 13-74)
```css
:root {
  --orange-50: #f7b267;
  --orange-100: #f79d65;
  --orange-300: #f4845f;
  --orange-500: #f27059;
  --orange-900: #f25c54;
}
```

---

## Key Dependencies

```json
{
  "express": "^4.19.2",           // Web server
  "socket.io": "^4.7.2",          // Real-time communication
  "munkres-js": "^1.2.2",         // Hungarian algorithm
  "typescript": "^5.3.3"          // Type safety
}
```

---

## Next Steps for Integration

### 1. Positioning System (Required for Accuracy)
Currently, user position is hardcoded to `(0, 0, 0)`. To enable accurate guidance:
- Implement GPS/indoor positioning
- Add device compass for heading
- Call `socket.emit('update-position', ...)` with real coordinates
- Set `ENABLE_GUIDANCE_DELIVERY = true` in orchestrator.ts

### 2. Building Map Integration
- Connect to your team's building floor plan system
- Replace mock data in `src/mocks/mock-data-provider.ts`
- Update `buildingDimensions` to match actual building size

### 3. Real Video Analysis (if using Overshoot)
- Add Overshoot API key to `src/config/overshoot-config.ts`
- Enable video processing in `src/server/overshoot-integration.ts`
- Stream analysis results to orchestrator

### 4. Multi-User Coordination
- Already supported! Just register multiple users
- Each user gets optimal exit assignment
- Load balancing prevents exit congestion

---

## Testing

```bash
npm test              # Run unit tests (if added)
npm run build         # Compile TypeScript
npm run dev           # Start with nodemon (auto-reload)
```

---

## Notes

- **Guidance is currently DISABLED** until positioning is accurate
- Mock data includes 4 exits and 445 hazard cells
- Frontend uses shadcn design system with orange/red palette
- Audio speaks directions every 10 seconds (adjustable)
- Backend runs coordination loop every 1 second

---

## Contact & Support

For questions about this component, refer to:
- `README.md` - Full documentation
- `QUICKSTART.md` - Setup guide
- `TESTING.md` - Testing procedures

**Component Author:** Live Escape Team
**Last Updated:** January 2026
