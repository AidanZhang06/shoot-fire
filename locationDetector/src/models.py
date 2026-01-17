"""
Data models for indoor localization metadata extraction.
Defines the strict JSON schema for observations extracted from phone camera frames.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


class TextDetection(BaseModel):
    """Detected text from camera frame with confidence score."""
    text: str = Field(..., description="Detected text content")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence (0-1)")
    includes_arrow: bool = Field(
        default=False,
        description="Whether text includes directional arrows (→, ←, ↑, ↓)"
    )

    @field_validator('text')
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Text cannot be empty")
        return v.strip()


class Landmark(BaseModel):
    """Physical landmark detected in camera view with spatial context."""
    type: Literal[
        "door",
        "staircase",
        "stairs_up",
        "stairs_down",
        "elevator",
        "exit_sign",
        "fire_extinguisher",
        "room_number_plaque",
        "elevator_button_panel",
        "emergency_exit_door",
        "restroom_sign",
        "water_fountain",
        "floor_directory",
        "hallway_intersection",
        "corridor_junction"
    ] = Field(..., description="Type of landmark detected")

    direction: Literal["left", "right", "ahead", "behind"] = Field(
        ..., description="Landmark direction relative to camera view"
    )

    distance: Literal["very_close", "near", "mid", "far"] = Field(
        ..., description="Precise distance category: very_close (<5ft), near (5-10ft), mid (10-20ft), far (>20ft)"
    )

    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence (0-1)")

    additional_info: Optional[str] = Field(
        None,
        description="Optional additional context (e.g., door state, spatial details)"
    )


class IndoorMetadata(BaseModel):
    """
    Complete metadata extracted from a single phone camera frame.
    This is the strict output format returned by the perception layer.
    """

    scene_type: Literal[
        "hallway",
        "room",
        "lobby",
        "stairwell",
        "elevator_area",
        "corridor_intersection",
        "entrance",
        "unknown"
    ] = Field(..., description="Classified environment type")

    scene_confidence: float = Field(
        ..., ge=0.0, le=1.0,
        description="Confidence in scene classification"
    )

    text_detected: list[TextDetection] = Field(
        default_factory=list,
        description="All text detected in frame (room numbers, signage, etc.)"
    )

    landmarks: list[Landmark] = Field(
        default_factory=list,
        description="Physical landmarks visible in frame with spatial cues"
    )

    relative_position_cues: list[str] = Field(
        default_factory=list,
        description="Natural language descriptions of spatial relationships (e.g., 'Door 312 is 5 feet to the left')"
    )

    lighting_quality: Literal["good", "dim", "poor", "backlit"] = Field(
        "good", description="Lighting conditions affecting detection quality"
    )

    motion_blur_detected: bool = Field(
        False, description="Whether significant motion blur was detected"
    )

    frame_quality_score: float = Field(
        ..., ge=0.0, le=1.0,
        description="Overall frame quality for processing (1.0 = excellent)"
    )

    processing_notes: Optional[str] = Field(
        None,
        description="Optional notes about processing issues or ambiguities"
    )

    class Config:
        json_schema_extra = {
            "example": {
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
                        "confidence": 0.91
                    },
                    {
                        "type": "staircase",
                        "direction": "left",
                        "distance": "near",
                        "confidence": 0.85
                    }
                ],
                "lighting_quality": "good",
                "motion_blur_detected": False,
                "frame_quality_score": 0.89
            }
        }
