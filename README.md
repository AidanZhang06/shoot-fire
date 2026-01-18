#FireCV: Fire Safety Evacuation Training & Emergency Guidance System

A comprehensive fire safety training and emergency evacuation system combining 3D simulation, computer vision-based indoor localization, and real-time emergency guidance.

## 🌟 Overview

Shoot-Fire is an integrated platform for fire safety education and emergency response, consisting of three main components:

1. **Modelbase** - Interactive 3D fire evacuation training simulator
2. **LocationDetector** - Computer vision service for indoor localization via smartphone cameras
3. **Live-Escape** - Real-time emergency guidance system with video analysis

### Key Features

- 🎮 **Interactive 3D Training**: Practice fire evacuation in a realistic 3D environment
- 📱 **AI-Powered Localization**: Use smartphone cameras to determine indoor location
- 🚨 **Real-Time Emergency Guidance**: Get live evacuation directions during emergencies
- 🏗️ **Building Models**: Accurate 3D models of Carnegie Mellon University buildings
- 🔥 **Dynamic Fire Scenarios**: AI-generated fire scenarios with evolving hazards
- 📊 **Safety Evaluation**: Track performance and provide feedback

## 📁 Project Structure

```
shoot-fire/
├── modelbase/              # 3D Fire Evacuation Training Simulator
│   ├── src/
│   │   ├── App.tsx         # Main React application
│   │   ├── GatesBuilding.tsx
│   │   ├── ai/             # AI scenario generation
│   │   ├── components/     # React components (camera, controls, etc.)
│   │   ├── navigation/     # Pathfinding and navigation graph
│   │   ├── scenario/       # Scenario engine and state management
│   │   └── evaluation/     # Safety evaluation logic
│   ├── package.json
│   └── README.md
│
├── locationDetector/       # Indoor Localization Service
│   ├── src/
│   │   ├── api.py          # FastAPI REST server
│   │   ├── metadata_extractor.py
│   │   ├── overshoot_client.py
│   │   └── models.py       # Pydantic schemas
│   ├── requirements.txt
│   ├── static/             # HTML test interfaces
│   └── README.md
│
└── live-escape/           # Real-Time Emergency Guidance
    ├── src/
    │   ├── server/         # WebSocket server
    │   ├── services/       # Path planning, guidance delivery
    │   ├── visualization/  # 3D map viewer
    │   └── types/          # TypeScript schemas
    ├── package.json
    └── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (for modelbase and live-escape)
- **Python** 3.9+ (for locationDetector)
- **Overshoot API Key** (for computer vision features)
  - Get one at [overshoot.ai](https://overshoot.ai)

### Installation

#### 1. Modelbase (3D Training Simulator)

```bash
cd modelbase
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

#### 2. LocationDetector (Indoor Localization)

```bash
cd locationDetector
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add: OVERSHOOT_API_KEY=your_key_here

# Run server
python -m src.api
```

Server runs on `http://localhost:8000`

#### 3. Live-Escape (Emergency Guidance)

```bash
cd live-escape
npm install

# Create .env file
echo "OVERSHOOT_API_KEY=your_key_here" > .env

# Run development server
npm run dev
```

Server runs on `http://localhost:3000`

## 📖 Component Details

### 1. Modelbase: 3D Fire Evacuation Training Simulator

An interactive web-based training application built with React and Three.js that simulates fire evacuation scenarios in a 3D building environment.

**Features:**
- Realistic 3D building models (Gates Hillman Center, CMU campus)
- AI-generated fire scenarios with dynamic hazard evolution
- First-person and third-person camera views
- Navigation graph with pathfinding
- Safety evaluation and performance feedback
- Scenario-based decision making

**Tech Stack:**
- React 19
- Three.js / React Three Fiber
- TypeScript
- Vite

**Key Components:**
- `GatesBuilding.tsx` - 3D building model with multiple floors
- `ScenarioEngine` - Manages fire scenarios and game state
- `Pathfinder` - A* pathfinding for navigation
- `SafetyEvaluator` - Evaluates player decisions

**Documentation:**
- See `modelbase/README.md` for detailed documentation
- See `modelbase/COORDINATE_SYSTEM_GUIDE.md` for coordinate system details

### 2. LocationDetector: Indoor Localization Service

A Python/FastAPI service that processes smartphone camera frames to extract semantic metadata for indoor localization. Uses Overshoot Vision API to identify scene types, landmarks, and readable text.

**Features:**
- Environment classification (hallway, room, lobby, stairwell, etc.)
- Landmark detection (doors, stairs, elevators, exit signs)
- Text recognition (room numbers, floor indicators)
- Spatial cues (direction and distance)
- Quality metrics (confidence scores, lighting conditions)

**API Endpoints:**
- `POST /extract` - Process single camera frame
- `POST /extract/batch` - Process multiple frames
- `GET /health` - Health check
- `GET /schema` - Get JSON schema

**Example Usage:**

```python
import httpx

async with httpx.AsyncClient() as client:
    with open('camera_frame.jpg', 'rb') as f:
        response = await client.post(
            'http://localhost:8000/extract',
            files={'file': f}
        )
    metadata = response.json()
    print(f"Scene: {metadata['scene_type']}")
    print(f"Landmarks: {metadata['landmarks']}")
```

**Documentation:**
- See `locationDetector/README.md` for full API documentation
- See `locationDetector/QUICKSTART.md` for quick setup guide

### 3. Live-Escape: Real-Time Emergency Guidance

A real-time emergency evacuation guidance system that processes live video streams to provide optimal evacuation routes. Uses Overshoot API for video analysis and WebSocket for real-time communication.

**Features:**
- Real-time video stream processing
- Obstacle and hazard detection
- Exit load balancing
- Crowd density tracking
- Optimal route calculation
- WebSocket-based guidance delivery

**Architecture:**
```
Mobile Client → Video Stream → Overshoot API → Structured JSON
                                    ↓
                        Emergency Video Processor
                                    ↓
                        Path Planner & Exit Assignment
                                    ↓
                        Guidance Delivery (WebSocket)
```

**WebSocket Events:**
- `register-user` - Register user and start processing
- `update-position` - Update user position
- `video-analysis` - Receive analysis results
- `guidance-update` - Receive evacuation guidance

**Documentation:**
- See `live-escape/README.md` for detailed documentation

## 🔄 Integration Flow

### Training Mode (Modelbase)
1. User starts training scenario in 3D simulator
2. AI generates fire scenario based on difficulty
3. User makes evacuation decisions
4. Safety evaluator provides feedback

### Real-World Mode (LocationDetector + Live-Escape)
1. User opens mobile app in emergency
2. Camera frames sent to LocationDetector
3. Metadata extracted (scene type, landmarks, text)
4. Location matched against building floor plan
5. Live-Escape processes video for hazards/obstacles
6. Optimal evacuation route calculated
7. Guidance delivered in real-time via WebSocket

## 🛠️ Development

### Modelbase Development

```bash
cd modelbase
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build
```

### LocationDetector Development

```bash
cd locationDetector
source venv/bin/activate
python -m src.api    # Run development server

# Enable debug mode
export API_DEBUG=true
python -m src.api
```

### Live-Escape Development

```bash
cd live-escape
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Run production server
```

## 📝 Configuration

### Environment Variables

**LocationDetector** (`.env`):
```bash
OVERSHOOT_API_KEY=your_api_key_here
OVERSHOOT_API_URL=https://api.overshoot.ai/v1/vision
API_PORT=8000
API_DEBUG=false
```

**Live-Escape** (`.env`):
```bash
OVERSHOOT_API_KEY=your_api_key_here
PORT=3000
```

⚠️ **Never commit `.env` files or API keys to git!**

## 🧪 Testing

### Modelbase
- Interactive testing via browser interface
- Scenario testing through ScenarioPanel component
- See `modelbase/TESTING_SUMMARY.md`

### LocationDetector
```bash
# Test with sample image
curl -X POST "http://localhost:8000/extract" \
  -F "file=@test_image.jpg" | jq .

# Health check
curl http://localhost:8000/health
```

### Live-Escape
```bash
# Test WebSocket connection
wscat -c ws://localhost:3000
```

## 📚 Documentation

Each component has its own detailed README:

- **Modelbase**: `modelbase/README.md`
  - Coordinate system guide
  - Testing instructions
  - Component architecture

- **LocationDetector**: `locationDetector/README.md`
  - API documentation
  - Client examples (Python, JavaScript, Swift)
  - Prompt engineering details
  - Failure case handling

- **Live-Escape**: `live-escape/README.md`
  - WebSocket API reference
  - Integration guide
  - Performance considerations

## 🏗️ Architecture Highlights

### Coordinate System
- Right-handed coordinate system
- X: East (+), West (-)
- Y: Up (+), Down (-) / Floor height
- Z: North (+), South (-)
- Origin at building center, ground floor

### Navigation Graph
- Graph-based navigation system
- Nodes represent positions (rooms, hallways, stairs)
- Edges represent navigable paths
- Dynamic path blocking based on fire/smoke

### Scenario Engine
- Time-based fire spread
- Dynamic hazard evolution
- Player position tracking
- Safety evaluation

## 🤝 Contributing

This is a safety-critical system. Contributions should:

1. Include comprehensive tests
2. Maintain performance requirements (sub-3s latency for emergency systems)
3. Follow emergency response best practices
4. Document architectural changes
5. Update relevant README files

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built with [Overshoot AI](https://overshoot.ai) for computer vision
- Uses [Three.js](https://threejs.org/) for 3D visualization
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) for React integration
- Carnegie Mellon University building models

## 🔗 Related Documentation

- `modelbase/COORDINATE_SYSTEM_GUIDE.md` - Coordinate system reference
- `locationDetector/QUICKSTART.md` - Quick setup guide
- `locationDetector/docs/PROMPT_ENGINEERING.md` - AI prompt details
- `live-escape/INTEGRATION_STEPS.md` - Integration guide

---

**⚠️ Safety Note**: This system is designed for training and emergency assistance. In real emergencies, always follow official emergency procedures and building evacuation plans.

