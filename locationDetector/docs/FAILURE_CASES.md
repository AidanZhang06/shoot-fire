# Failure Case Analysis & Handling Strategies

This document analyzes common failure modes for phone camera-based indoor metadata extraction and explains how the system handles each case.

## Core Philosophy

**Partial information is better than no information.**

The system is designed to gracefully degrade rather than fail completely. When image quality is poor or features are partially visible, the system:

1. Extracts whatever it can
2. Flags quality issues
3. Reduces confidence scores appropriately
4. Returns valid JSON with helpful diagnostics

## Common Failure Cases

### 1. Motion Blur from Handheld Camera

**Scenario**: User is walking while holding phone, causing motion blur in frames.

**Symptoms**:
- Blurred edges
- Streaky text
- Unclear landmark boundaries

**System Response**:
```json
{
  "scene_type": "hallway",
  "scene_confidence": 0.65,  // Lower confidence
  "motion_blur_detected": true,  // Flagged
  "frame_quality_score": 0.42,  // Reduced quality score
  "text_detected": [
    {"text": "Floor", "confidence": 0.51}  // Partial text, lower confidence
  ],
  "landmarks": [
    {
      "type": "door",
      "direction": "left",
      "distance": "near",
      "confidence": 0.58  // Still usable but lower confidence
    }
  ],
  "processing_notes": "Motion blur detected - consider multiple frames"
}
```

**Handling Strategy**:
- **Still process**: Don't reject blurry frames
- **Flag clearly**: Set `motion_blur_detected = true`
- **Lower confidence**: Reduce all detection confidences by ~20-30%
- **Suggest mitigation**: Processing notes recommend using multiple frames
- **Downstream value**: Localization system can combine multiple observations

---

### 2. Partial or Occluded Signage

**Scenario**: Room number plaque is partially blocked by a person or object.

**Example**: "Room 312" appears as "Ro    12"

**System Response**:
```json
{
  "text_detected": [
    {"text": "Ro", "confidence": 0.35},  // Partial but included
    {"text": "12", "confidence": 0.72}   // Clear portion
  ],
  "processing_notes": "Partial text visible - possible occlusion"
}
```

**Handling Strategy**:
- **Include partial data**: "Ro" alone might seem useless, but with "12" nearby, downstream system could infer "Room 12"
- **Honest confidence**: Very low confidence (0.35) signals uncertainty
- **No guessing**: System doesn't try to complete "Ro" to "Room"
- **Spatial context preserved**: Direction and distance still provided

**Why This Helps**:
- Multiple frames might capture different portions
- Partial text + landmarks can triangulate location
- Floor plan matching can complete partial room numbers

---

### 3. Poor Lighting Conditions

**Scenario**: Dimly lit hallway at night or during power outage.

**System Response**:
```json
{
  "scene_type": "hallway",
  "scene_confidence": 0.58,
  "lighting_quality": "dim",  // or "poor"
  "frame_quality_score": 0.45,
  "text_detected": [],  // May be empty if text unreadable
  "landmarks": [
    {
      "type": "exit_sign",  // Exit signs often illuminated
      "direction": "ahead",
      "distance": "mid",
      "confidence": 0.78
    }
  ],
  "processing_notes": "Poor lighting - limited visibility"
}
```

**Handling Strategy**:
- **Honest assessment**: `lighting_quality = "poor"`
- **Extract what's visible**: Illuminated features (exit signs, elevator buttons)
- **Empty arrays OK**: Better than false detections
- **Quality score reflects issue**: 0.45 signals to downstream that this frame is unreliable

**Edge Case - Backlit**:
```json
{
  "lighting_quality": "backlit",  // Camera facing window/bright light
  "frame_quality_score": 0.28,
  "processing_notes": "Backlit scene - subjects in shadow"
}
```

---

### 4. Variable Camera Angles

**Scenario**: User holds phone at awkward angles - tilted, upside down, or facing floor/ceiling.

**System Response for Ceiling View**:
```json
{
  "scene_type": "unknown",
  "scene_confidence": 0.22,
  "landmarks": [
    {
      "type": "fire_extinguisher",  // Ceiling-mounted
      "direction": "ahead",
      "distance": "near",
      "confidence": 0.65,
      "additional_info": "ceiling-mounted"
    }
  ],
  "processing_notes": "Unusual camera angle detected"
}
```

**Handling Strategy**:
- **Scene = unknown**: Can't classify ceiling as hallway/room
- **Still extract features**: Ceiling fixtures, pipes, signage
- **Relative directions maintained**: "ahead" is still meaningful relative to camera
- **Additional context**: Notes unusual angle for downstream processing

---

### 5. Featureless Environments

**Scenario**: Blank wall, generic corridor with no distinguishing features.

**System Response**:
```json
{
  "scene_type": "hallway",
  "scene_confidence": 0.71,  // Can classify type but not much detail
  "text_detected": [],
  "landmarks": [],
  "lighting_quality": "good",
  "motion_blur_detected": false,
  "frame_quality_score": 0.85,  // Good image quality
  "processing_notes": "No distinguishing features detected"
}
```

**Handling Strategy**:
- **Valid response**: Empty arrays are legitimate data
- **High quality score**: Image itself is fine, just lacks features
- **Scene classification still useful**: Knowing "hallway" vs "room" is valuable
- **Downstream interpretation**: Multiple featureless frames suggest long corridor

**Why Not Fail**:
- This IS useful information (user is in a featureless section)
- Helps with dead reckoning / IMU integration
- Next frame might have features

---

### 6. Overshoot API Failures

**Scenario**: Network timeout, API rate limit, or service error.

**System Response After Retries**:
```json
{
  "scene_type": "unknown",
  "scene_confidence": 0.1,
  "text_detected": [],
  "landmarks": [],
  "lighting_quality": "poor",
  "motion_blur_detected": true,
  "frame_quality_score": 0.2,
  "processing_notes": "Extraction failed: API timeout - frame not processed"
}
```

**Handling Strategy**:
- **Retry with backoff**: 3 attempts with exponential delay (1s, 2s, 4s)
- **Fallback response**: Returns minimal valid JSON rather than HTTP error
- **Clear diagnostics**: `processing_notes` explains what happened
- **All confidence values low**: Signals to downstream that this data is unreliable
- **HTTP 200 still returned**: Client receives valid JSON, not error

**Alternative - Graceful Failure**:
```python
# In metadata_extractor.py
except Exception as e:
    return self._create_fallback_metadata(
        error_msg=f"API error: {e}",
        partial_data=None
    )
```

---

### 7. Invalid or Corrupted Images

**Scenario**: Corrupted file, wrong format, or image processing fails.

**System Response**:
```
HTTP 400 Bad Request
{
  "detail": "Invalid file type. Expected image, got application/octet-stream"
}
```

**Or**:
```
HTTP 413 Request Entity Too Large
{
  "detail": "File too large. Maximum size: 10MB"
}
```

**Handling Strategy**:
- **Early validation**: Check file type and size before API call
- **Clear error messages**: Explain exactly what's wrong
- **Fail fast**: Don't waste Overshoot API credits on invalid inputs
- **HTTP semantics**: Use appropriate status codes (400, 413)

---

### 8. Ambiguous Scene Types

**Scenario**: Intersection of hallways, or doorway between hallway and room.

**System Response**:
```json
{
  "scene_type": "corridor_intersection",  // Specific type
  "scene_confidence": 0.81,
  "landmarks": [
    {
      "type": "door",
      "direction": "right",
      "distance": "near",
      "confidence": 0.88,
      "additional_info": "door is open"
    },
    {
      "type": "door",
      "direction": "left",
      "distance": "near",
      "confidence": 0.85
    }
  ],
  "processing_notes": "Intersection - multiple directions visible"
}
```

**Handling Strategy**:
- **Specific categories**: `corridor_intersection` instead of forcing "hallway" or "room"
- **Multiple landmarks**: Describe all visible features
- **Spatial disambiguation**: Directions help distinguish overlapping scenes
- **Context notes**: Explain ambiguity for downstream system

---

### 9. Text in Multiple Languages/Scripts

**Scenario**: Building has signage in English and another language (Chinese, Arabic, etc.).

**System Response**:
```json
{
  "text_detected": [
    {"text": "Room 205", "confidence": 0.91},
    {"text": "会议室", "confidence": 0.87},  // "Meeting Room" in Chinese
    {"text": "EXIT", "confidence": 0.94},
    {"text": "出口", "confidence": 0.89}  // "Exit" in Chinese
  ]
}
```

**Handling Strategy**:
- **Preserve all text**: Don't filter by language
- **No translation**: Return text as-is, downstream system handles language
- **Equal treatment**: Confidence based on OCR quality, not language
- **Downstream value**: Floor plan might have multilingual labels

---

### 10. Reflective Surfaces and Mirrors

**Scenario**: Camera captures reflection in glass door or mirror, showing duplicate features.

**System Response**:
```json
{
  "scene_type": "hallway",
  "scene_confidence": 0.68,
  "landmarks": [
    {
      "type": "door",
      "direction": "ahead",
      "distance": "near",
      "confidence": 0.82
    },
    {
      "type": "exit_sign",
      "direction": "ahead",
      "distance": "far",
      "confidence": 0.71,
      "additional_info": "possibly reflected"
    }
  ],
  "processing_notes": "Reflective surface detected - some features may be duplicated"
}
```

**Handling Strategy**:
- **Annotate uncertainty**: `additional_info` flags possible reflection
- **Lower confidence**: Reduce confidence for suspected reflections
- **Still include**: Downstream fusion algorithms can handle outliers
- **Diagnostic notes**: Help debugging if localization goes wrong

---

## Confidence Score Guidelines

The system applies these confidence scoring rules:

| Condition | Typical Confidence Range |
|-----------|-------------------------|
| Clear, well-lit, stable | 0.85 - 0.98 |
| Good but imperfect | 0.70 - 0.84 |
| Usable but uncertain | 0.50 - 0.69 |
| Barely visible/partial | 0.30 - 0.49 |
| Highly uncertain | 0.10 - 0.29 |

### Confidence Adjustments

| Factor | Confidence Modifier |
|--------|-------------------|
| Motion blur | -0.15 to -0.25 |
| Poor lighting | -0.20 to -0.35 |
| Partial occlusion | -0.25 to -0.40 |
| Unusual angle | -0.10 to -0.20 |
| Reflective surface | -0.10 to -0.15 |
| Backlit | -0.30 to -0.45 |

## Configuration for Failure Tolerance

Adjust these settings in `.env`:

```bash
# Lower threshold to keep more detections during poor conditions
CONFIDENCE_THRESHOLD=0.3  # Default: 0.5

# More retries for unreliable networks
MAX_RETRIES=5  # Default: 3

# Longer retry delay for rate-limited APIs
RETRY_DELAY=2.0  # Default: 1.0
```

## Testing Failure Modes

Create test images for each failure case:

```bash
# Test motion blur
python examples/test_client.py test_images/blurry_hallway.jpg

# Test poor lighting
python examples/test_client.py test_images/dark_corridor.jpg

# Test partial occlusion
python examples/test_client.py test_images/occluded_sign.jpg
```

Expected behavior:
- ✅ Returns valid JSON (not HTTP error)
- ✅ Includes quality indicators
- ✅ Reduces confidence scores appropriately
- ✅ Provides diagnostic notes
- ✅ Extracts any visible features

## Downstream Integration Recommendations

When consuming this API's output:

1. **Check `frame_quality_score` first**
   - < 0.3: Consider frame unreliable, wait for next one
   - 0.3 - 0.6: Use with caution, require multiple confirmations
   - > 0.6: Good quality, use normally

2. **Implement confidence filtering**
   ```python
   high_confidence_text = [
       t for t in metadata['text_detected']
       if t['confidence'] >= 0.7
   ]
   ```

3. **Temporal fusion**
   - Combine observations from multiple frames
   - Partial text in frame N might complete partial text in frame N+1

4. **Cross-validate with other sensors**
   - Use IMU data to filter out impossible observations
   - WiFi/Bluetooth beacons can validate room numbers

5. **Handle empty arrays gracefully**
   ```python
   if not metadata['landmarks']:
       # Fall back to IMU dead reckoning
       use_inertial_navigation()
   ```

## Future Improvements

Potential enhancements for failure handling:

1. **Multi-frame fusion at API level**
   - Accept sequence of frames
   - Track features across frames
   - Return consolidated observations

2. **Active quality feedback**
   - Return "please recapture" signal if quality too low
   - Suggest camera adjustments (stabilize, improve lighting)

3. **Confidence calibration**
   - Train confidence estimator on labeled failure cases
   - More accurate confidence scores for edge cases

4. **Adaptive processing**
   - Adjust Overshoot API parameters based on detected conditions
   - Use different prompts for low-light vs normal conditions

5. **On-device pre-filtering**
   - Detect blur/darkness on phone before upload
   - Save bandwidth and API costs
