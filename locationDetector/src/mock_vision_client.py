"""
Mock vision client for quick testing without external API.
Returns realistic-looking fake metadata for testing the UI.
"""

import random
import structlog
from PIL import Image
from io import BytesIO

logger = structlog.get_logger()


class MockVisionClient:
    """Mock client that returns fake but realistic metadata."""

    def __init__(self, settings):
        self.settings = settings
        logger.info("mock_vision_client_initialized", mode="MOCK")

    async def close(self):
        """No cleanup needed for mock."""
        pass

    async def extract_metadata(self, image_data: bytes, compress: bool = True) -> dict:
        """Return mock metadata based on randomization."""

        # Analyze image to determine quality
        try:
            image = Image.open(BytesIO(image_data))
            width, height = image.size
            is_small = width < 400 or height < 400
            is_large = width > 1920 or height > 1920
        except:
            width, height = 640, 480
            is_small, is_large = False, False

        # Randomly select scene type
        scene_types = ["hallway", "room", "lobby", "stairwell", "elevator_area", "corridor_intersection"]
        scene_type = random.choice(scene_types)

        # Generate mock text detections
        text_options = [
            {"text": f"Room {random.randint(100, 999)}", "confidence": random.uniform(0.75, 0.95)},
            {"text": f"Floor {random.randint(1, 10)}", "confidence": random.uniform(0.80, 0.98)},
            {"text": "EXIT", "confidence": random.uniform(0.85, 0.99)},
            {"text": f"Suite {random.randint(200, 500)}", "confidence": random.uniform(0.70, 0.90)},
            {"text": "STAIRS →", "confidence": random.uniform(0.65, 0.88)},
        ]

        num_texts = random.randint(0, 3)
        selected_texts = random.sample(text_options, min(num_texts, len(text_options)))

        # Generate mock landmarks
        landmark_options = [
            {
                "type": "door",
                "direction": random.choice(["left", "right", "ahead"]),
                "distance": random.choice(["near", "mid", "far"]),
                "confidence": random.uniform(0.75, 0.95)
            },
            {
                "type": "exit_sign",
                "direction": "ahead",
                "distance": "mid",
                "confidence": random.uniform(0.80, 0.98)
            },
            {
                "type": "staircase",
                "direction": random.choice(["left", "right"]),
                "distance": random.choice(["near", "mid"]),
                "confidence": random.uniform(0.70, 0.92)
            },
            {
                "type": "elevator",
                "direction": random.choice(["left", "right", "ahead"]),
                "distance": "mid",
                "confidence": random.uniform(0.75, 0.95)
            },
            {
                "type": "fire_extinguisher",
                "direction": random.choice(["left", "right"]),
                "distance": "near",
                "confidence": random.uniform(0.65, 0.90)
            }
        ]

        num_landmarks = random.randint(1, 4)
        selected_landmarks = random.sample(landmark_options, min(num_landmarks, len(landmark_options)))

        # Determine quality factors
        lighting_options = ["good", "dim", "poor", "backlit"]
        lighting_weights = [0.6, 0.2, 0.1, 0.1]  # Bias toward "good"
        lighting = random.choices(lighting_options, weights=lighting_weights)[0]

        motion_blur = random.random() < 0.2  # 20% chance of blur

        # Calculate frame quality
        base_quality = 0.85
        if is_small:
            base_quality -= 0.15
        if lighting in ["poor", "backlit"]:
            base_quality -= 0.20
        if lighting == "dim":
            base_quality -= 0.10
        if motion_blur:
            base_quality -= 0.15

        frame_quality = max(0.2, min(0.99, base_quality + random.uniform(-0.05, 0.05)))

        # Build response
        metadata = {
            "scene_type": scene_type,
            "scene_confidence": random.uniform(0.80, 0.96),
            "text_detected": selected_texts,
            "landmarks": selected_landmarks,
            "lighting_quality": lighting,
            "motion_blur_detected": motion_blur,
            "frame_quality_score": round(frame_quality, 2),
            "processing_notes": "⚠️ MOCK DATA - Using mock vision client for testing"
        }

        logger.info("mock_metadata_generated", scene_type=scene_type, landmarks=len(selected_landmarks))

        return metadata

    async def _compress_image(self, image_data: bytes, max_dimension: int = 1024, quality: int = 85) -> bytes:
        """Mock compression - just return the data."""
        return image_data
