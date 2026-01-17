# Emergency Evacuation System 🚨

Real-time emergency guidance system that uses video analysis to direct users safely during emergencies (fires, disasters, evacuations).

## Overview

This system processes live video streams from user devices using the Overshoot API to detect:
- **Obstacles** - Debris, furniture, blocked paths
- **Hazards** - Fire, smoke, flooding
- **People density** - Crowd tracking for preventing bottlenecks
- **Exit status** - Real-time exit accessibility

The video data is translated into structured text/JSON that feeds into a coordination server for optimal route calculation.

## Architecture

```
[Mobile Client] → [Video Stream] → [Overshoot API] → [Structured JSON]
                                          ↓
                              [Emergency Video Processor]
                                          ↓
                          [Situational Map Manager] (TODO)
                                          ↓
                          [Route Optimization Engine] (TODO)
                                          ↓
                          [User Guidance Delivery]
```

## Current Implementation Status

✅ **Completed:**
- Project structure and TypeScript configuration
- Overshoot API integration (`EmergencyVideoProcessor`)
- Comprehensive type definitions for all data structures
- Real-time WebSocket server for user connections
- Adaptive configuration based on user load (1-50 users)

🚧 **In Progress:**
- WebRTC video streaming infrastructure
- Situational map manager (spatial grid aggregation)

📋 **TODO:**
- Route optimization engine (A* pathfinding)
- Exit load balancing algorithm
- 3D visualization with Three.js
- Floor plan processing from PDF/JPG
- Client-side mobile web app
- Testing and simulation scenarios

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Configuration

The Overshoot API is configured in `src/config/overshoot-config.ts`:

```typescript
{
  apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
  apiKey: 'ovs_4488f728fc52c4d2ca6f8972c7cc53e3',
  clip_length_seconds: 0.5,   // Fast processing
  delay_seconds: 0.5,          // Minimal latency
  sampling_ratio: 0.15,        // 15% frame sampling
  fps: 30
}
```

**Adaptive Configuration:**
- Standard config for 1-30 users
- High-load config activates automatically at 30+ users
  - Increases clip_length to 1.0s
  - Reduces sampling_ratio to 0.1 (10%)

## How It Works

### 1. Video-to-Text Translation

The Overshoot API receives video frames with this prompt:

```
Analyze this emergency evacuation video frame and identify:
1. OBSTACLES: Physical blockages (debris, furniture, doors)
2. HAZARDS: Fire (intensity 1-5), smoke (density 1-5), water/flooding
3. PEOPLE: Count, positions, density, movement direction
4. EXITS: Visible exits, status (clear/blocked), direction in degrees
```

### 2. Structured JSON Output

Overshoot returns structured data matching the schema in `src/types/schemas.ts`:

```typescript
{
  timestamp: 1737123456789,
  confidence: 0.87,
  obstacles: [{ type: "furniture", severity: "passable", ... }],
  hazards: {
    fire: { present: true, intensity: 3, direction: "right", ... },
    smoke: { present: true, density: 4, ... }
  },
  people: { count: 7, density: "moderate", ... },
  exits: [{ visible: true, status: "clear", direction: 45, ... }]
}
```

### 3. Data Enrichment

The `EmergencyVideoProcessor` enriches each result with:
- User ID and position
- Processing latency
- User context (near exit, in hazard zone, etc.)

### 4. Latency Budget

Target: **1-3 seconds** from video capture to guidance delivery

- Video capture → stream: 100-200ms
- Network transmission: 100-200ms
- Overshoot processing: 500-800ms
- Coordination compute: 100-200ms
- Guidance delivery: 100-200ms
- **Total: 900-1600ms** ✓

## API Usage

### WebSocket Events

**Client → Server:**

```javascript
// Register user and start processing
socket.emit('register-user', {
  userId: 'user-123',
  position: { x: 10, y: 20, z: 0 }
});

// Update position (send every 100ms)
socket.emit('update-position', {
  userId: 'user-123',
  position: { x: 11, y: 21, z: 0 },
  heading: 45,  // degrees
  speed: 1.2    // m/s
});

// Stop processing
socket.emit('stop-processing', {
  userId: 'user-123'
});
```

**Server → Client:**

```javascript
// Processing started confirmation
socket.on('processing-started', (data) => {
  console.log('Video processing active:', data);
});

// Video analysis results (every 0.5-1s)
socket.on('video-analysis', (result) => {
  console.log('Analysis:', result);
  // result contains: obstacles, hazards, people, exits
});

// Error handling
socket.on('processing-error', (error) => {
  console.error('Processing error:', error);
});
```

### HTTP Endpoints

```bash
# Service info
GET /

# Health check
GET /health

# System statistics
GET /stats
```

Response from `/stats`:
```json
{
  "activeSessions": 5,
  "trackedUsers": 5,
  "usingHighLoadConfig": false
}
```

## Project Structure

```
shoot-fire/
├── src/
│   ├── server/
│   │   └── overshoot-integration.ts    # Overshoot API integration
│   ├── client/                         # (TODO) Mobile web app
│   ├── types/
│   │   └── schemas.ts                  # TypeScript type definitions
│   ├── config/
│   │   └── overshoot-config.ts         # API configuration & schemas
│   ├── utils/                          # (TODO) Helper utilities
│   └── index.ts                        # Main server entry point
├── dist/                               # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Key Classes

### EmergencyVideoProcessor

Main class for managing Overshoot API sessions:

```typescript
const processor = new EmergencyVideoProcessor((result) => {
  // Handle video analysis results
  console.log('Analysis:', result);
});

// Start processing for a user
await processor.startProcessingForUser('user-123', videoStream);

// Update user state
processor.updateUserState('user-123', {
  position: { x: 10, y: 20, z: 0 },
  heading: 45,
  nearExit: false
});

// Update prompt dynamically
await processor.updateUserPrompt('user-123', 'Focus on exit accessibility');

// Stop processing
await processor.stopProcessingForUser('user-123');
```

## Testing

```bash
# Run tests (when implemented)
npm test

# Start development server
npm run dev
```

### Manual Testing

1. Start the server:
```bash
npm run dev
```

2. Connect with a WebSocket client (e.g., using [wscat](https://github.com/websockets/wscat)):
```bash
npm install -g wscat
wscat -c ws://localhost:3000
```

3. Send registration event:
```json
{
  "event": "register-user",
  "userId": "test-user-1",
  "position": { "x": 0, "y": 0, "z": 0 }
}
```

## Performance Considerations

- **Standard config (1-30 users)**: 0.5s clips, 15% sampling = ~2.25 frames per clip
- **High-load config (30-50 users)**: 1.0s clips, 10% sampling = ~3 frames per clip
- Automatic adaptation prevents API overload
- Target latency maintained under both configurations

## Security & Privacy

⚠️ **Important:** This system processes live video during emergencies

- Video is **not stored** - processed in-memory only
- Results are anonymized after processing
- WebSocket connections should use TLS in production
- API key should be stored in environment variables

## Next Steps

1. **Install dependencies**: `npm install`
2. **Run the server**: `npm run dev`
3. **Implement situational map manager** for spatial aggregation
4. **Add route optimization** engine with A* pathfinding
5. **Build mobile client** with WebRTC and 3D visualization
6. **Add floor plan processing** from PDF/JPG files

## Contributing

This is a safety-critical system. All contributions should:
- Include comprehensive tests
- Maintain sub-3-second latency requirements
- Follow emergency response best practices
- Document any architectural changes

## License

MIT

---

Built with [Overshoot SDK](https://docs.overshoot.ai/) for real-time video analysis
