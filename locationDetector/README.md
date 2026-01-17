# Indoor Localization Metadata Extraction Service

A visual perception layer for phone-based indoor navigation that extracts structured semantic metadata from smartphone camera frames using Overshoot Vision API.

## Overview

This service acts as a **semantic sensor** for smartphone cameras, converting raw visual input into machine-readable observations suitable for indoor localization systems.

**Key Principle**: This service extracts what the camera sees, NOT where the user is located. Position estimation is handled by downstream systems that match observations against building floor plans.

## What It Does

Processes smartphone camera frames and extracts:

1. **Environment Classification** - hallway, room, lobby, stairwell, elevator area, etc.
2. **Visible Landmarks** - doors, stairs, elevators, exit signs, fire extinguishers, room plaques
3. **Readable Text** - room numbers, floor indicators, directional signage
4. **Spatial Cues** - landmark direction (left/right/ahead) and distance (near/mid/far)
5. **Quality Metrics** - confidence scores, lighting conditions, motion blur detection

## Output Format

Strict JSON only, no extra text:

```json
{
  "scene_type": "hallway",
  "scene_confidence": 0.94,
  "text_detected": [
    {"text": "Floor 3", "confidence": 0.92},
    {"text": "Room 312", "confidence": 0.88}
  ],
  "landmarks": [
    {
      "type": "exit_sign",
      "direction": "ahead",
      "distance": "mid",
      "confidence": 0.91,
      "additional_info": null
    }
  ],
  "lighting_quality": "good",
  "motion_blur_detected": false,
  "frame_quality_score": 0.89,
  "processing_notes": null
}
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and set your Overshoot API key:

```bash
cp .env.example .env
```

Edit `.env`:
```
OVERSHOOT_API_KEY=your_actual_api_key_here
OVERSHOOT_API_URL=https://api.overshoot.ai/v1/vision
```

### 3. Run the Server

```bash
python -m src.api
```

Server will start on `http://localhost:8000`

## API Usage

### Extract Metadata from Single Frame

```bash
curl -X POST "http://localhost:8000/extract" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/camera_frame.jpg"
```

Response:
```json
{
  "scene_type": "hallway",
  "scene_confidence": 0.94,
  "text_detected": [...],
  "landmarks": [...],
  "lighting_quality": "good",
  "motion_blur_detected": false,
  "frame_quality_score": 0.89
}
```

### Process Multiple Frames (Batch)

```bash
curl -X POST "http://localhost:8000/extract/batch" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@frame1.jpg" \
  -F "files=@frame2.jpg" \
  -F "files=@frame3.jpg"
```

### Health Check

```bash
curl http://localhost:8000/health
```

### Get JSON Schema

```bash
curl http://localhost:8000/schema
```

## Client Examples

### Python Client

```python
import httpx

async def process_camera_frame(image_path: str):
    async with httpx.AsyncClient() as client:
        with open(image_path, 'rb') as f:
            files = {'file': ('frame.jpg', f, 'image/jpeg')}
            response = await client.post(
                'http://localhost:8000/extract',
                files=files,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

# Usage
metadata = await process_camera_frame('camera_frame.jpg')
print(f"Scene: {metadata['scene_type']}")
print(f"Detected text: {[t['text'] for t in metadata['text_detected']]}")
```

### JavaScript/TypeScript Client

```typescript
async function processCameraFrame(file: File): Promise<IndoorMetadata> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:8000/extract', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Usage in React Native or mobile web app
const metadata = await processCameraFrame(capturedImage);
console.log('Scene:', metadata.scene_type);
console.log('Landmarks:', metadata.landmarks);
```

### Swift Client (iOS)

```swift
func processCameraFrame(image: UIImage) async throws -> IndoorMetadata {
    guard let imageData = image.jpegData(compressionQuality: 0.8) else {
        throw NSError(domain: "ImageError", code: 1)
    }

    var request = URLRequest(url: URL(string: "http://localhost:8000/extract")!)
    request.httpMethod = "POST"

    let boundary = UUID().uuidString
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

    var body = Data()
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"file\"; filename=\"frame.jpg\"\r\n".data(using: .utf8)!)
    body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
    body.append(imageData)
    body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

    request.httpBody = body

    let (data, response) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(IndoorMetadata.self, from: data)
}
```

## Architecture

### Components

1. **FastAPI REST Server** (`api.py`) - HTTP endpoints for frame submission
2. **Metadata Extractor** (`metadata_extractor.py`) - Orchestration, validation, error handling
3. **Overshoot Client** (`overshoot_client.py`) - API communication and prompt engineering
4. **Data Models** (`models.py`) - Pydantic schemas for strict validation
5. **Configuration** (`config.py`) - Environment-based settings

### Processing Pipeline

```
Smartphone Camera Frame
    ↓
FastAPI Endpoint (/extract)
    ↓
Metadata Extractor Service
    ↓
Overshoot Vision API Client
    ↓ (with engineered prompt)
Overshoot Vision API
    ↓
Raw JSON Response
    ↓
Validation & Error Recovery
    ↓
Confidence Filtering
    ↓
Structured IndoorMetadata
    ↓
JSON Response to Client
```

## Handling Edge Cases

### Motion Blur
- **Detection**: Frame quality score and motion_blur_detected flag
- **Strategy**: Extract what's visible, flag blur, reduce confidence scores
- **No rejection**: Partial information is better than no information

### Partial/Occluded Signage
- **Strategy**: Include partial text with lower confidence (e.g., "Ro..." → confidence 0.4)
- **Rationale**: Downstream systems can combine multiple observations

### Poor Lighting
- **Detection**: lighting_quality field (good/dim/poor/backlit)
- **Strategy**: Extract visible features, document lighting conditions
- **Confidence adjustment**: Lower scores for ambiguous detections

### Variable Camera Angles
- **Prompt engineering**: Specifically designed for handheld phone cameras
- **Spatial cues**: Relative directions (left/right/ahead) rather than absolute coordinates

### API Failures
- **Retry logic**: Configurable retries with exponential backoff
- **Fallback**: Returns minimal valid response rather than failing completely
- **Logging**: Structured logs for debugging and monitoring

## Configuration Options

Edit `.env` or set environment variables:

```bash
# API Configuration
OVERSHOOT_API_KEY=your_key
OVERSHOOT_API_URL=https://api.overshoot.ai/v1/vision
OVERSHOOT_TIMEOUT=30

# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=false

# Processing
MAX_IMAGE_SIZE_MB=10
CONFIDENCE_THRESHOLD=0.5  # Filter out detections below this
ENABLE_CACHING=true

# Retry Configuration
MAX_RETRIES=3
RETRY_DELAY=1.0
```

## Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY .env .env

EXPOSE 8000
CMD ["python", "-m", "src.api"]
```

Build and run:
```bash
docker build -t indoor-localization-api .
docker run -p 8000:8000 --env-file .env indoor-localization-api
```

### Production Considerations

1. **CORS Configuration**: Update CORS settings in `api.py` for production domains
2. **Rate Limiting**: Add rate limiting middleware for API protection
3. **Monitoring**: Integrate with logging services (Datadog, CloudWatch, etc.)
4. **Caching**: Consider caching identical frames to reduce API costs
5. **Load Balancing**: Deploy multiple instances behind a load balancer

## Testing

Run tests:
```bash
pytest tests/
```

Test with sample image:
```bash
curl -X POST "http://localhost:8000/extract" \
  -F "file=@test_images/hallway_sample.jpg" \
  | jq .
```

## Prompt Engineering Details

The Overshoot Vision API prompt is carefully engineered for:

- **Clarity**: Explicit instructions on what to extract and what NOT to infer
- **Robustness**: Handles edge cases (blur, occlusion, poor lighting)
- **Strictness**: Enforces JSON-only output with no extra text
- **Context**: Designed specifically for handheld smartphone cameras
- **Conservative**: Prefers lower confidence over false positives

See `src/overshoot_client.py:EXTRACTION_PROMPT` for the full prompt.

## Common Issues

### "Extraction service not initialized"
- Ensure `.env` file exists with valid `OVERSHOOT_API_KEY`
- Check server logs for startup errors

### "File too large" error
- Reduce image size or increase `MAX_IMAGE_SIZE_MB` in `.env`
- Client-side image compression recommended

### Low confidence scores
- Check image quality (lighting, blur, focus)
- Ensure camera is relatively stable when capturing
- Review `lighting_quality` and `frame_quality_score` in response

### Empty landmarks/text arrays
- May indicate featureless scene or very poor image quality
- Check `processing_notes` field for hints
- Verify image contains indoor features (not outdoor, blank walls, etc.)

## Future Enhancements

- WebSocket streaming for real-time continuous processing
- On-device edge processing option for offline operation
- Multi-camera fusion for improved accuracy
- Historical tracking for temporal consistency
- Integration with specific floor plan formats

## License

[Your License Here]

## Support

For issues and questions:
- GitHub Issues: [Your repo]
- Documentation: [Your docs site]
- Contact: [Your contact]
