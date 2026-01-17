# Prompt Engineering for Overshoot Vision API

This document explains the design principles and specific techniques used in crafting the Overshoot Vision API prompt for indoor metadata extraction.

## Design Goals

The prompt must achieve these objectives:

1. **Structured Output Only** - Return valid JSON with no extra text or markdown
2. **Conservative Extraction** - Only describe what's directly visible
3. **No Position Inference** - Extract observations, not location conclusions
4. **Graceful Degradation** - Handle poor quality images without failing
5. **Confidence Honesty** - Accurate confidence scores reflecting uncertainty
6. **Spatial Awareness** - Provide relative spatial cues from camera perspective

## Core Prompt Structure

### 1. Role Definition

```
You are a visual perception system for indoor navigation.
Your ONLY job is to extract structured observations from a smartphone camera image.
```

**Why This Works**:
- Clear, narrow scope prevents scope creep
- "Perception system" frames it as a sensor, not a decision maker
- "smartphone camera" primes for handheld, imperfect images

### 2. Critical Rules (The Guardrails)

```
CRITICAL RULES:
1. DO NOT infer the user's location or position in a building
2. DO NOT reference or assume knowledge of floor plans
3. ONLY describe what you directly see in the image
4. If something is ambiguous or partially visible, include it with lower confidence
5. Return ONLY valid JSON - no extra text, explanations, or markdown
```

**Why These Matter**:

**Rule 1-2: Prevent Hallucination of Context**
- Bad: "User is probably on Floor 3 near Room 312"
- Good: "Detected text: 'Floor 3', 'Room 312'"

**Rule 3: Ground in Visual Evidence**
- Prevents assumptions based on "typical" buildings
- Forces model to describe actual pixels, not inferred knowledge

**Rule 4: Embrace Uncertainty**
- Traditional systems might reject partial data
- We want partial data with honest confidence
- Example: "Ro...12" is valuable, not garbage

**Rule 5: Strict Output Format**
- LLMs often add "Here's the JSON:" or wrap in markdown
- Critical for API reliability - JSON parsing must never fail

### 3. Task Specification with Examples

Each extraction category includes:
- **Options**: Explicit enumeration of valid values
- **Format**: Exact JSON structure expected
- **Confidence**: Reminder to include scores

Example for Scene Type:
```
1. **Scene Type**: Classify the environment
   - Options: hallway, room, lobby, stairwell, elevator_area,
              corridor_intersection, entrance, unknown
   - Provide confidence (0.0-1.0)
```

**Why Enumerate Options**:
- Prevents creative hallucinations ("grand_ballroom", "secret_passage")
- Ensures consistent vocabulary across API calls
- But includes "unknown" for legitimate edge cases

### 4. Spatial Reasoning Guidelines

```
3. **Landmarks**: Identify physical features with spatial context
   - Direction relative to camera: left, right, ahead, behind
   - Distance estimate: near (< 2m), mid (2-5m), far (> 5m)
```

**Design Choices**:

**Relative Directions (not absolute)**:
- "left" is clear from phone camera perspective
- "north" would require knowing phone orientation
- Simpler, more robust

**Categorical Distance (not metric)**:
- Metric depth estimation from monocular camera is hard and unreliable
- "near/mid/far" is easier and sufficient for localization
- Explicit ranges (< 2m, etc.) calibrate the model's judgment

### 5. Edge Case Handling (The Critical Innovation)

```
HANDLING EDGE CASES:
- Motion blur: Still extract what you can, flag blur, lower confidence
- Partial signage: Include partial text with lower confidence (e.g., "Ro..." → confidence 0.4)
- Occlusions: If you see part of a landmark, include it with reduced confidence
- Poor lighting: Extract visible information, note lighting quality
- Multiple similar objects: List all of them separately with spatial distinctions
- Ambiguous scene: Use "unknown" scene type with low confidence
```

**Why This Section is Crucial**:

Without these explicit instructions, models typically:
- ❌ Reject blurry/partial data entirely
- ❌ Try to "complete" partial text (hallucinating)
- ❌ Give uniform confidence scores (0.9 for everything)

With these instructions:
- ✅ Partial data included with appropriate confidence
- ✅ Flags quality issues explicitly
- ✅ Honest about uncertainty

**Example Impact**:

**Without edge case handling**:
```json
{
  "text_detected": [
    {"text": "Room 312", "confidence": 0.95}  // HALLUCINATED - only saw "Ro...12"
  ]
}
```

**With edge case handling**:
```json
{
  "text_detected": [
    {"text": "Ro", "confidence": 0.35},
    {"text": "12", "confidence": 0.78}
  ],
  "motion_blur_detected": true,
  "processing_notes": "Partial text visible - possible occlusion"
}
```

### 6. Output Format (Reinforcement with Example)

```
OUTPUT FORMAT (strict JSON):
{
  "scene_type": "hallway",
  "scene_confidence": 0.94,
  ...
}
```

**Why Show Full Example**:
- Reinforces JSON-only requirement
- Demonstrates proper field names (snake_case)
- Shows realistic confidence values (not 0.99 for everything)
- Includes null for optional fields (additional_info, processing_notes)

### 7. Closing Reminder (The Anchor)

```
REMEMBER: You are a SENSOR, not a localizer.
Extract observations, not conclusions about position.
```

**Why End Here**:
- Reinforces core constraint one last time
- "Sensor" metaphor is clear and memorable
- Guards against the model's instinct to be "helpful" by inferring location

## Advanced Techniques

### Confidence Calibration Language

Throughout the prompt, specific phrases calibrate confidence scoring:

| Phrase | Effect on Confidence |
|--------|---------------------|
| "If something is ambiguous" | Triggers 0.4-0.6 range |
| "Partially visible" | Suggests 0.3-0.5 range |
| "Directly see" | Implies 0.8+ for clear observations |
| "Reasonable inferable" | Allows 0.6-0.8 for logical deductions |

### Negative Examples (Implicit)

The prompt doesn't say what NOT to do with explicit examples, because:
- Negative examples can anchor the model on bad behavior
- "DO NOT do X" sometimes prompts the model to consider X

Instead, it uses positive framing:
- ✅ "ONLY describe what you directly see"
- Not: ❌ "Don't describe things you don't see"

### Structure as Teaching

The prompt teaches by example:
1. States the rule
2. Shows the format
3. Gives examples
4. Handles exceptions

This mirrors effective human communication.

## Testing and Iteration

### How to Evaluate Prompt Effectiveness

Test on these challenging images:

1. **Motion Blur Test**
   - ✅ Should return data with `motion_blur_detected: true`
   - ✅ Reduced confidence scores
   - ❌ Should not reject entirely

2. **Partial Text Test**
   - Image with sign partially covered
   - ✅ Should include partial text separately
   - ❌ Should not complete text ("Ro" → "Room")
   - ✅ Processing notes should mention partial visibility

3. **Featureless Image Test**
   - Plain wall or empty corridor
   - ✅ Should return valid JSON with empty arrays
   - ✅ Should still classify scene_type
   - ✅ Quality score should be high (good image, just no features)

4. **Ambiguous Scene Test**
   - Doorway between hallway and room
   - ✅ Should use specific types (corridor_intersection) or unknown
   - ✅ Should not force classification if truly ambiguous
   - ✅ Confidence should reflect ambiguity (0.5-0.7 range)

### Prompt Iteration History

**Version 1.0** (Hypothetical baseline):
- Simple: "Extract room numbers and landmarks from this indoor image"
- Problem: Added explanatory text, hallucinated locations

**Version 1.5** (First structured):
- Added: JSON schema, field specifications
- Improvement: Consistent output format
- Remaining issue: Still rejected poor quality images

**Version 2.0** (Current):
- Added: Edge case handling, confidence calibration, sensor metaphor
- Result: Graceful degradation, honest confidence, robust to real-world conditions

## Customization for Your Use Case

### Adjusting for Different Building Types

**For Hospitals** (add more medical landmarks):
```
Landmark types: ..., nurses_station, patient_room_sign,
                medical_equipment_room, oxygen_outlet_sign
```

**For Universities** (add academic landmarks):
```
Landmark types: ..., lecture_hall_door, lab_sign,
                department_placard, building_directory
```

### Adjusting for Different Quality Requirements

**Higher Precision (fewer false positives)**:
```
CONFIDENCE CALIBRATION: Be conservative.
Only report text if you can read it clearly.
Prefer higher confidence thresholds.
```

**Higher Recall (fewer misses)**:
```
CONFIDENCE CALIBRATION: Be inclusive.
Report any text fragments, even if partially visible.
Use lower confidence scores for uncertain observations.
```

### Adjusting for Language/Region

**Multilingual Buildings**:
```
TEXT DETECTION: Detect text in all visible languages and scripts.
Do not translate. Return text exactly as it appears.
Common languages: English, Chinese, Arabic, Spanish, etc.
```

**Region-Specific Features**:
```
For Japanese buildings:
- Room numbers may use Japanese numerals
- Look for 階 (floor) indicators
- Recognize 非常口 (emergency exit) signs
```

## Overshoot API Parameters

These parameters complement the prompt:

```python
payload = {
    "image": image_b64,
    "prompt": EXTRACTION_PROMPT,
    "response_format": "json",     # Force JSON output
    "max_tokens": 2000,            # Enough for complex scenes
    "temperature": 0.1             # Low = consistent, high = creative
}
```

**Temperature = 0.1** is critical:
- Higher temperature → more variation in field names, confidence scores
- Lower temperature → consistent structure, reliable JSON
- For structured extraction, always use low temperature (0.1 - 0.3)

## Troubleshooting

### Problem: Model returns markdown-wrapped JSON

**Solution**: Add to prompt:
```
CRITICAL: Return ONLY the JSON object.
No markdown code blocks (no ```json).
No explanatory text before or after.
Your entire response should parse as JSON.
```

### Problem: Confidence scores all similar (0.9 everywhere)

**Solution**: Add examples with varied confidence:
```
Examples:
- Clear text in good lighting: 0.92
- Slightly blurry text: 0.68
- Partial text: 0.41
- Barely visible text: 0.23
```

### Problem: Model hallucinates text not in image

**Solution**: Emphasize evidence grounding:
```
CRITICAL: Only report text you can actually read in the image.
If you cannot clearly see text, do not guess or infer it.
Partial text is OK (with low confidence), invented text is NOT OK.
```

### Problem: Model refuses to process poor quality images

**Solution**: Explicitly allow degraded output:
```
Even if image quality is poor:
- Still extract what you can see
- Flag quality issues in metadata
- Return valid JSON (do not refuse to process)
```

## Conclusion

The prompt's effectiveness comes from:

1. **Clear role definition** - "sensor not localizer"
2. **Explicit constraints** - What NOT to do
3. **Structured format** - Exact JSON schema
4. **Edge case handling** - Graceful degradation instructions
5. **Confidence calibration** - Language that guides uncertainty quantification
6. **Redundant reinforcement** - Key points repeated multiple times

This design ensures robust, reliable metadata extraction from real-world smartphone camera feeds, even under challenging conditions.
