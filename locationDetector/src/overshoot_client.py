"""
Overshoot Vision API client for indoor environment perception.
Handles API communication and prompt engineering for metadata extraction.
"""

import base64
import json
from typing import Optional
import httpx
from io import BytesIO
from PIL import Image
import structlog

from src.config import Settings

logger = structlog.get_logger()


class OvershootVisionClient:
    """Client for interacting with Overshoot Vision API."""

    # Carefully engineered prompt for indoor localization metadata extraction
    EXTRACTION_PROMPT = """You are a visual perception system for indoor navigation. Your ONLY job is to extract NAVIGATION-CRITICAL observations from a smartphone camera image.

CRITICAL RULES:
1. DO NOT infer the user's location or position in a building
2. DO NOT reference or assume knowledge of floor plans
3. ONLY describe what you directly see in the image
4. FOCUS ONLY on navigation-relevant information (room numbers, arrows, floor signs, landmarks)
5. IGNORE non-navigation text (posters, advertisements, notices, decorative text)
6. Return ONLY valid JSON - no extra text, explanations, or markdown

YOUR TASK:
Analyze this smartphone camera image taken indoors and extract ONLY navigation-critical information:

1. **Scene Type**: Classify the environment
   - Options: hallway, room, lobby, stairwell, elevator_area, corridor_intersection, entrance, unknown
   - Provide confidence (0.0-1.0)

2. **Navigation Text ONLY**: Extract ONLY these types of text

   ✅ EXTRACT (Navigation-Critical):
   - Room/Suite numbers on doors or plaques (e.g., "312", "Suite 401", "Room B-204")
   - Floor level indicators (e.g., "Floor 3", "3F", "Level 2", "3rd Floor")
   - Directional arrows and signs (e.g., "→", "← Rooms 300-350", "EXIT →", "STAIRS ↑")
   - Hallway/wing identifiers (e.g., "Wing A", "South Hall", "300 Block")
   - Emergency exit signs ("EXIT", "EMERGENCY EXIT", "FIRE EXIT")

   ❌ IGNORE (Not Navigation-Critical):
   - Poster text, flyers, advertisements
   - Event announcements, schedules
   - Informational notices, rules, policies
   - Decorative text, artwork descriptions
   - General informational signs that don't help with navigation

   For each navigation text item:
   - Provide exact text as shown
   - Include confidence score
   - Note if it includes directional arrows (→, ←, ↑, ↓)

3. **Navigation Landmarks**: Identify physical features with PRECISE spatial context

   Landmark Types (navigation-relevant only):
   - door (with or without room number visible)
   - staircase, stairs_up, stairs_down
   - elevator, elevator_button_panel
   - exit_sign (illuminated exit signs)
   - room_number_plaque (plaques showing room numbers)
   - hallway_intersection, corridor_junction
   - floor_directory (building directory boards)

   For EACH landmark, provide:
   - Type (from list above)
   - Direction: left, right, ahead, behind
   - Distance with MORE PRECISION:
     * "very_close" (< 5 feet / 1.5m) - almost touching distance
     * "near" (5-10 feet / 1.5-3m) - a few steps away
     * "mid" (10-20 feet / 3-6m) - across the hallway
     * "far" (> 20 feet / 6m+) - down the corridor
   - Confidence score
   - Additional spatial info:
     * "slightly_left", "far_left", "directly_ahead", "far_right", etc.
     * Door state: "open", "closed", "ajar"
     * For intersections: "T-junction", "4-way", "Y-junction"

4. **Relative Position Cues**: Describe spatial relationships
   - "Door 312 is 5 feet to the left"
   - "Exit sign ahead, approximately 15 feet"
   - "Staircase entrance on the right, very close"
   - "Hallway intersection ahead, about 20 feet"

5. **Image Quality Assessment**:
   - Lighting: good, dim, poor, backlit
   - Motion blur: true/false
   - Frame quality score (0.0-1.0)

SPATIAL PRECISION GUIDELINES:
- Use "very_close" when landmark is within arm's reach
- Use "near" when you could reach it in 2-3 steps
- Use "mid" when it's across the hallway or room
- Use "far" when it's down the corridor or across a large space
- Always combine with direction: "very_close on the left", "far ahead and slightly right"

HANDLING EDGE CASES:
- Motion blur: Extract what you can, flag blur, lower confidence
- Partial text: Include if it's navigation-relevant (e.g., "Ro 31" → confidence 0.4)
- Ignore partial poster text or advertisements
- Multiple doors: List each separately with precise spatial distinctions
- Hallway intersections: Note all visible directions

OUTPUT FORMAT (strict JSON):
{
  "scene_type": "hallway",
  "scene_confidence": 0.94,
  "text_detected": [
    {"text": "Floor 3", "confidence": 0.92, "includes_arrow": false},
    {"text": "→ 300-350", "confidence": 0.88, "includes_arrow": true},
    {"text": "312", "confidence": 0.91, "includes_arrow": false}
  ],
  "landmarks": [
    {
      "type": "door",
      "direction": "left",
      "distance": "very_close",
      "confidence": 0.89,
      "additional_info": "closed, room number visible"
    },
    {
      "type": "exit_sign",
      "direction": "ahead",
      "distance": "mid",
      "confidence": 0.91,
      "additional_info": "illuminated"
    }
  ],
  "relative_position_cues": [
    "Door with room number is 5 feet to the left",
    "Exit sign approximately 15 feet ahead"
  ],
  "lighting_quality": "good",
  "motion_blur_detected": false,
  "frame_quality_score": 0.89,
  "processing_notes": null
}

REMEMBER: You are a SENSOR for NAVIGATION. Extract only navigation-critical observations. Ignore everything else."""

    def __init__(self, settings: Settings):
        """Initialize client with configuration."""
        self.settings = settings
        self.api_url = settings.overshoot_api_url
        self.api_key = settings.overshoot_api_key
        self.timeout = settings.overshoot_timeout

        # Validate API URL
        if not self.api_url or not self.api_url.startswith(('http://', 'https://')):
            raise ValueError(f"Invalid OVERSHOOT_API_URL: {self.api_url}. Must be a valid HTTP/HTTPS URL.")
        
        logger.info("overshoot_client_initialized", api_url=self.api_url, has_api_key=bool(self.api_key))

        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def extract_metadata(
        self,
        image_data: bytes,
        compress: bool = True
    ) -> dict:
        """
        Extract indoor metadata from a phone camera image.

        Args:
            image_data: Raw image bytes from smartphone camera
            compress: Whether to compress image before sending (recommended for mobile)

        Returns:
            Dictionary containing extracted metadata matching IndoorMetadata schema

        Raises:
            httpx.HTTPError: If API request fails
            ValueError: If response is invalid
        """
        try:
            # Optionally compress image to reduce mobile data usage
            if compress:
                image_data = await self._compress_image(image_data)

            # Encode image as base64
            image_b64 = base64.b64encode(image_data).decode('utf-8')

            # Construct API request for Overshoot
            # Overshoot API expects video streams with frames array
            # Send single frame as a 1-frame "clip" to simulate video window
            payload = {
                "prompt": self.EXTRACTION_PROMPT,
                "frames": [
                    {
                        "data": image_b64,
                        "timestamp": 0.0
                    }
                ],
                "clip_length_seconds": 1.0,
                "delay_seconds": 1.0,
                "fps": 1,
                "sampling_ratio": 1.0
            }

            # Try different endpoint paths - Overshoot SDK uses streams internally
            # Try multiple endpoints since Overshoot is designed for video streams, not single images
            base_url = self.api_url.rstrip('/')
            
            logger.info("sending_request_to_overshoot", image_size_kb=len(image_data) / 1024, base_url=base_url)

            # Make API request - try /streams first, then base URL as fallback
            response = None
            last_error = None
            
            # Try /streams endpoint first
            endpoints_to_try = [
                f"{base_url}/streams",
                f"{base_url}/analyze", 
                f"{base_url}/frames",
                base_url
            ]
            
            for try_endpoint in endpoints_to_try:
                try:
                    logger.debug("trying_endpoint", endpoint=try_endpoint)
                    response = await self.client.post(
                        try_endpoint,
                        json=payload
                    )
                    response.raise_for_status()
                    logger.info("overshoot_request_success", endpoint=try_endpoint, status=response.status_code)
                    break
                except httpx.HTTPStatusError as e:
                    last_error = e
                    if e.response.status_code == 404:
                        logger.debug("endpoint_not_found", endpoint=try_endpoint, status=404)
                        continue  # Try next endpoint
                    else:
                        # Non-404 error, re-raise
                        raise
                except Exception as e:
                    last_error = e
                    logger.error("overshoot_request_failed", api_url=try_endpoint, error=str(e), error_type=type(e).__name__)
                    if try_endpoint == endpoints_to_try[-1]:
                        # Last endpoint failed, raise
                        raise
            
            if response is None:
                raise httpx.HTTPError(f"All endpoints failed. Last error: {last_error}")

            # Parse response
            result = response.json()

            # Extract the actual metadata from the response
            # Adjust this based on Overshoot API response structure
            if "content" in result:
                metadata_json = result["content"]
            elif "response" in result:
                metadata_json = result["response"]
            else:
                metadata_json = result

            # Handle case where response might be a string
            if isinstance(metadata_json, str):
                metadata_json = json.loads(metadata_json)

            logger.info("metadata_extracted_successfully", scene_type=metadata_json.get("scene_type"))

            return metadata_json

        except httpx.HTTPError as e:
            logger.error("overshoot_api_error", error=str(e))
            raise
        except json.JSONDecodeError as e:
            logger.error("invalid_json_response", error=str(e))
            raise ValueError(f"Overshoot returned invalid JSON: {e}")
        except Exception as e:
            logger.error("unexpected_error", error=str(e))
            raise

    async def _compress_image(
        self,
        image_data: bytes,
        max_dimension: int = 1024,
        quality: int = 85
    ) -> bytes:
        """
        Compress image to reduce bandwidth usage.

        Args:
            image_data: Original image bytes
            max_dimension: Maximum width/height in pixels
            quality: JPEG quality (1-100)

        Returns:
            Compressed image bytes
        """
        try:
            image = Image.open(BytesIO(image_data))

            # Convert RGBA to RGB if needed
            if image.mode == 'RGBA':
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[3])
                image = background

            # Resize if too large
            if max(image.size) > max_dimension:
                image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

            # Save to bytes with compression
            output = BytesIO()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            compressed_data = output.getvalue()

            logger.debug(
                "image_compressed",
                original_kb=len(image_data) / 1024,
                compressed_kb=len(compressed_data) / 1024
            )

            return compressed_data

        except Exception as e:
            logger.warning("image_compression_failed", error=str(e))
            return image_data  # Return original if compression fails
