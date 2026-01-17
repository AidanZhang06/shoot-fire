# Project Overview: Indoor Localization Metadata Extraction

## Vision

Enable phone-based indoor navigation by converting raw smartphone camera feeds into structured, machine-readable observations that can be matched against building floor plans.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         SMARTPHONE                              │
│                                                                 │
│  ┌──────────────┐                                              │
│  │   Camera     │  Captures frames while user walks            │
│  │   (Rear)     │  through building                            │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │  Mobile App  │  Sends frames via HTTP POST                  │
│  │  (iOS/Android)                                              │
│  └──────┬───────┘                                              │
└─────────┼───────────────────────────────────────────────────────┘
          │
          │ HTTP POST /extract
          │ (multipart/form-data)
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│               METADATA EXTRACTION SERVICE                       │
│                    (THIS PROJECT)                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FastAPI REST Server (src/api.py)                       │  │
│  │  • Endpoint: POST /extract                              │  │
│  │  • Validation: File type, size                          │  │
│  │  • CORS enabled for mobile apps                         │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Metadata Extractor (src/metadata_extractor.py)         │  │
│  │  • Orchestration logic                                  │  │
│  │  • Retry on failure (3x with backoff)                   │  │
│  │  • Validation & error recovery                          │  │
│  │  • Confidence filtering                                 │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Overshoot Client (src/overshoot_client.py)             │  │
│  │  • Image compression (1024px, JPEG 85%)                 │  │
│  │  • Base64 encoding                                      │  │
│  │  • Carefully engineered prompt                          │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└───────────────────────┼───────────────────────────────────────┘
                        │
                        │ HTTPS POST
                        │ (JSON payload with prompt & image)
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                  OVERSHOOT VISION API                           │
│                   (External Service)                            │
│                                                                 │
│  • Vision-language model inference                             │
│  • OCR and object detection                                    │
│  • Returns JSON with observations                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ JSON Response
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               METADATA EXTRACTION SERVICE                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Validation Layer (src/models.py)                        │  │
│  │  • Pydantic schema validation                            │  │
│  │  • Confidence score clamping [0, 1]                      │  │
│  │  • Field presence checks                                 │  │
│  │  • Fallback data on failure                              │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└───────────────────────┼───────────────────────────────────────┘
                        │
                        │ Validated IndoorMetadata object
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SMARTPHONE                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  HTTP 200 OK - JSON Response                             │  │
│  │  {                                                        │  │
│  │    "scene_type": "hallway",                              │  │
│  │    "scene_confidence": 0.94,                             │  │
│  │    "text_detected": [                                    │  │
│  │      {"text": "Room 312", "confidence": 0.88}            │  │
│  │    ],                                                    │  │
│  │    "landmarks": [                                        │  │
│  │      {                                                   │  │
│  │        "type": "exit_sign",                              │  │
│  │        "direction": "ahead",                             │  │
│  │        "distance": "mid",                                │  │
│  │        "confidence": 0.91                                │  │
│  │      }                                                   │  │
│  │    ],                                                    │  │
│  │    "lighting_quality": "good",                           │  │
│  │    "motion_blur_detected": false,                        │  │
│  │    "frame_quality_score": 0.89                           │  │
│  │  }                                                        │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Localization System (SEPARATE - NOT THIS PROJECT)      │  │
│  │  • Maintains floor plan graph                            │  │
│  │  • Matches observations to floor plan                    │  │
│  │  • Estimates user position                               │  │
│  │  • Fuses with IMU/WiFi/Bluetooth                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Separation of Concerns

**This Service: Visual Perception**
- ✅ Extract: "I see text 'Room 312' ahead"
- ✅ Extract: "I see an exit sign to the left"
- ❌ Infer: "User is at coordinates (10, 5) on Floor 3"

**Downstream System: Position Estimation**
- Takes observations from this service
- Matches against floor plan
- Estimates location

### 2. Graceful Degradation

Traditional approach:
```
Good frame → Process → Return data
Bad frame → Reject → Error
```

Our approach:
```
Good frame → Process → High confidence data
Bad frame → Process → Low confidence data + quality flags
```

Benefits:
- No lost frames
- Partial data is useful
- Quality metrics inform downstream decisions

### 3. Modular Architecture

Each component has a single responsibility:

| Component | Responsibility |
|-----------|---------------|
| `api.py` | HTTP handling, request/response |
| `metadata_extractor.py` | Orchestration, retry logic |
| `overshoot_client.py` | API communication |
| `models.py` | Data validation |
| `config.py` | Configuration management |

Benefits:
- Easy to test each component
- Easy to swap Overshoot for another vision API
- Easy to add caching, rate limiting, etc.

## Data Flow

### Normal Flow (Happy Path)

1. **Capture**: Phone camera captures frame (JPEG, ~500KB)
2. **Upload**: App sends via POST to `/extract`
3. **Validate**: Server checks file type, size
4. **Compress**: Resize to 1024px, JPEG 85% (~150KB)
5. **Encode**: Convert to base64
6. **Prompt**: Combine with engineered prompt
7. **API Call**: Send to Overshoot Vision API
8. **Parse**: Extract JSON from response
9. **Validate**: Check against Pydantic schema
10. **Filter**: Remove low-confidence items
11. **Return**: Send IndoorMetadata JSON to client

Total latency: ~1-3 seconds (mostly API call)

### Error Flow (Failure Handling)

1. **API Error**: Overshoot API times out
2. **Retry**: Wait 1s, try again
3. **Retry**: Wait 2s, try again
4. **Retry**: Wait 4s, try again
5. **Fallback**: Return minimal valid JSON with error notes
6. **Return**: HTTP 200 with low-quality data (not HTTP 500)

Client receives valid JSON even on failure.

## Configuration

All configurable via environment variables (`.env`):

```bash
# External API
OVERSHOOT_API_KEY=sk-...
OVERSHOOT_API_URL=https://api.overshoot.ai/v1/vision
OVERSHOOT_TIMEOUT=30

# Server
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=false

# Processing
MAX_IMAGE_SIZE_MB=10
CONFIDENCE_THRESHOLD=0.5
ENABLE_CACHING=true

# Reliability
MAX_RETRIES=3
RETRY_DELAY=1.0
```

## Performance Characteristics

### Latency

| Operation | Typical Time |
|-----------|-------------|
| Image compression | 50-200ms |
| Network upload | 100-500ms |
| Overshoot API | 800-2000ms |
| Validation | 5-20ms |
| **Total** | **1-3 seconds** |

### Throughput

| Mode | Throughput |
|------|-----------|
| Single frame | ~1 frame/sec (limited by API latency) |
| Batch (10 frames) | ~3 frames/sec (parallel processing) |
| Multiple instances | Scales linearly with instances |

### Cost

Assuming Overshoot API costs $0.01 per request:
- 1 frame/sec continuous = $36/hour = $864/day
- 1 frame every 5 sec = $7.20/hour = $173/day
- Batch optimization saves ~40% vs sequential

## Scalability

### Vertical Scaling
- Single instance handles ~5-10 concurrent requests
- CPU: Minimal (mostly I/O bound)
- Memory: ~50MB per worker process
- Network: ~150KB upload + ~10KB download per request

### Horizontal Scaling
- Stateless service → trivially scalable
- Deploy behind load balancer
- Each instance independent
- No shared state or coordination needed

### Bottleneck
- **Overshoot API latency**: 1-2 seconds per call
- **Solution**: Batch processing, caching, or on-device inference

## Testing Strategy

### Unit Tests
```python
# Test prompt engineering
def test_prompt_prevents_location_inference():
    # Ensure prompt doesn't cause hallucination

# Test validation
def test_invalid_confidence_clamped():
    # Confidence values outside [0,1] are clamped

# Test error recovery
def test_partial_data_preserved():
    # Missing fields filled with defaults
```

### Integration Tests
```python
# Test full pipeline
async def test_extract_metadata_e2e():
    # Upload image → receive valid JSON

# Test failure modes
async def test_api_failure_returns_fallback():
    # Mock API failure → returns valid JSON with notes
```

### Manual Testing
```bash
# Test with real images
python examples/test_client.py test_images/hallway.jpg
python examples/test_client.py test_images/blurry.jpg
python examples/test_client.py test_images/dark.jpg
```

## Deployment Options

### Development
```bash
python -m src.api
# or
./run_server.sh
```

### Docker
```bash
docker build -t indoor-localization .
docker run -p 8000:8000 --env-file .env indoor-localization
```

### Cloud (AWS, GCP, Azure)
- Deploy as container to ECS/Cloud Run/App Service
- Use environment variables for configuration
- Add load balancer for multiple instances
- Use managed logging (CloudWatch, Stackdriver, etc.)

### Serverless
Not recommended due to:
- Cold start latency (adds 1-5s)
- Timeout limits (may be insufficient for slow APIs)
- Better suited for always-warm instances

## Security Considerations

### API Key Protection
- ✅ Never commit `.env` to git (in `.gitignore`)
- ✅ Use environment variables
- ✅ Rotate keys periodically

### Input Validation
- ✅ File type checking (images only)
- ✅ File size limits (10MB default)
- ✅ No arbitrary code execution

### CORS Configuration
- ⚠️ Currently allows all origins (`*`)
- 🔒 Production: Configure specific allowed origins
```python
allow_origins=["https://yourdomain.com"]
```

### Rate Limiting
- ⚠️ Not currently implemented
- 🔒 Production: Add rate limiting middleware
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)
@app.post("/extract")
@limiter.limit("10/minute")
```

## Monitoring and Observability

### Structured Logging
All logs are JSON for easy parsing:
```json
{
  "event": "frame_processed_successfully",
  "scene_type": "hallway",
  "landmarks_count": 3,
  "text_count": 2,
  "frame_quality": 0.89,
  "timestamp": "2025-01-17T14:30:45.123Z",
  "level": "info"
}
```

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API latency (p95) | < 3s | > 5s |
| Error rate | < 1% | > 5% |
| Frame quality score avg | > 0.7 | < 0.5 |
| Overshoot API failures | < 0.5% | > 2% |

### Health Checks
```bash
curl http://localhost:8000/health
```

Returns:
```json
{
  "status": "healthy",
  "service": "metadata-extraction",
  "version": "1.0.0"
}
```

## Limitations and Future Work

### Current Limitations

1. **No temporal coherence**: Each frame processed independently
   - Future: Track features across multiple frames

2. **No on-device inference**: Requires network connectivity
   - Future: Edge deployment with TensorFlow Lite / ONNX

3. **Single camera**: Only uses rear camera
   - Future: Multi-camera fusion

4. **No active sensing**: Passive observation only
   - Future: Guide user to point camera at specific features

### Future Enhancements

1. **WebSocket Streaming**
   - Real-time bidirectional communication
   - Lower latency for continuous tracking

2. **Caching Layer**
   - Cache identical/similar frames
   - Reduce API costs by 30-50%

3. **Historical Smoothing**
   - Combine observations from recent frames
   - Improve confidence scores via temporal consistency

4. **Active Learning**
   - Collect failure cases
   - Fine-tune prompt or model

5. **Multi-modal Fusion**
   - Integrate IMU, WiFi, Bluetooth at API level
   - Return fused observations

## Contributing

This is a hackathon project, but contributions welcome!

Areas for improvement:
- [ ] Unit tests (see `tests/` directory)
- [ ] Prometheus metrics export
- [ ] Docker Compose for easy deployment
- [ ] Swagger/OpenAPI documentation
- [ ] Example floor plan matching algorithm
- [ ] Benchmark on standard indoor datasets

## License

[Your License Here]

## Acknowledgments

- Overshoot Vision API for visual perception
- FastAPI for excellent Python web framework
- Pydantic for data validation
- The indoor localization research community

---

**Remember**: This service is a **semantic sensor**, not a complete localization system. It answers "What do I see?" not "Where am I?" Position estimation is the responsibility of downstream systems that match these observations against known floor plans.
