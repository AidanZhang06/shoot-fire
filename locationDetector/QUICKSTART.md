# Quick Start Guide

Get the indoor localization metadata extraction service running in 5 minutes.

## Prerequisites

- Python 3.9 or higher
- Overshoot Vision API key (get one at https://overshoot.ai)
- A smartphone camera image to test with

## Step 1: Clone and Setup

```bash
cd /Users/sujit_uppuluri/nexhacks-winners

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Step 2: Configure API Key

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your Overshoot API key
# (Use your favorite editor: nano, vim, VS Code, etc.)
nano .env
```

Set this value:
```
OVERSHOOT_API_KEY=your_actual_api_key_here
```

Save and exit.

## Step 3: Start the Server

```bash
python -m src.api
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Step 4: Test with Sample Image

Open a new terminal and test the API:

```bash
# Take a photo with your phone of an indoor space (hallway, room, etc.)
# Transfer it to your computer, then:

curl -X POST "http://localhost:8000/extract" \
  -F "file=@/path/to/your/image.jpg" \
  | jq .
```

**Don't have `jq`?** Just remove `| jq .` to see raw JSON.

Expected response:
```json
{
  "scene_type": "hallway",
  "scene_confidence": 0.94,
  "text_detected": [
    {"text": "Room 205", "confidence": 0.91}
  ],
  "landmarks": [
    {
      "type": "door",
      "direction": "left",
      "distance": "near",
      "confidence": 0.87
    }
  ],
  "lighting_quality": "good",
  "motion_blur_detected": false,
  "frame_quality_score": 0.89,
  "processing_notes": null
}
```

## Step 5: Integrate with Your App

### Python Client

```python
import httpx

async with httpx.AsyncClient() as client:
    with open('indoor_image.jpg', 'rb') as f:
        response = await client.post(
            'http://localhost:8000/extract',
            files={'file': f},
            timeout=30.0
        )
    metadata = response.json()
    print(f"Scene: {metadata['scene_type']}")
```

### JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('http://localhost:8000/extract', {
  method: 'POST',
  body: formData
});

const metadata = await response.json();
console.log('Scene:', metadata.scene_type);
```

### curl

```bash
curl -X POST "http://localhost:8000/extract" \
  -F "file=@image.jpg"
```

## Common Issues

### Issue: "Extraction service not initialized"

**Solution**: Make sure `.env` file exists with valid `OVERSHOOT_API_KEY`

### Issue: "Connection refused"

**Solution**: Check server is running on port 8000:
```bash
lsof -i :8000
```

If port is in use, change in `.env`:
```
API_PORT=8001
```

### Issue: "File too large"

**Solution**: Compress image or increase limit in `.env`:
```
MAX_IMAGE_SIZE_MB=20
```

## Next Steps

1. **Read the full README**: `README.md` for comprehensive documentation
2. **Try the Python test client**: `python examples/test_client.py image.jpg`
3. **Learn about failure handling**: `docs/FAILURE_CASES.md`
4. **Understand the prompt**: `docs/PROMPT_ENGINEERING.md`
5. **Deploy to production**: See README.md "Deployment" section

## API Endpoints Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/extract` | POST | Process single frame |
| `/extract/batch` | POST | Process multiple frames |
| `/schema` | GET | Get JSON schema |

## Testing Different Scenarios

```bash
# Test motion blur
curl -X POST "http://localhost:8000/extract" \
  -F "file=@blurry_image.jpg"

# Test poor lighting
curl -X POST "http://localhost:8000/extract" \
  -F "file=@dark_hallway.jpg"

# Test batch processing
curl -X POST "http://localhost:8000/extract/batch" \
  -F "files=@img1.jpg" \
  -F "files=@img2.jpg" \
  -F "files=@img3.jpg"
```

## Performance Tips

1. **Compress images before sending**:
   - Target: 1024px max dimension
   - Quality: 80-85% JPEG
   - Reduces bandwidth and API latency

2. **Batch processing for multiple frames**:
   - Use `/extract/batch` for 5-50 frames
   - Processes concurrently
   - Faster than sequential single requests

3. **Confidence filtering**:
   - Adjust `CONFIDENCE_THRESHOLD` in `.env`
   - Higher = fewer but more reliable detections
   - Lower = more detections but some may be uncertain

## Mobile App Integration

For React Native:
```bash
# See full example in examples/react_native_example.tsx

npm install expo-camera expo-file-system
```

For iOS:
- See README.md for Swift example
- Add camera permission to Info.plist

For Android:
- Add camera permission to AndroidManifest.xml
- Use multipart upload

## Getting Help

- Check logs: Server outputs structured JSON logs
- Enable debug mode: Set `API_DEBUG=true` in `.env`
- Test health: `curl http://localhost:8000/health`
- Validate image: Make sure it's valid JPEG/PNG

## What's Next?

You now have a working metadata extraction service!

This service extracts **observations** from camera frames. To complete your indoor localization system, you'll need:

1. **Floor plan data** - Building layout with rooms, hallways, landmarks
2. **Matching algorithm** - Compare extracted metadata against floor plan
3. **Sensor fusion** - Combine with IMU, WiFi, Bluetooth for robust tracking
4. **Mobile app** - Stream camera frames to this API

This service handles the "what does the camera see?" part. The "where am I?" part is your downstream localization logic.

Good luck with your hackathon! 🚀
