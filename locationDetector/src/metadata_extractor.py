"""
Metadata extraction service that orchestrates the perception pipeline.
Handles validation, error recovery, and quality assurance of extracted metadata.
"""

from typing import Optional
import asyncio
from pydantic import ValidationError
import structlog

from src.models import IndoorMetadata, TextDetection, Landmark
from src.overshoot_client import OvershootVisionClient
from src.config import Settings

logger = structlog.get_logger()


class MetadataExtractionService:
    """
    Service for extracting structured metadata from phone camera frames.
    Implements robust error handling and quality assurance.
    """

    def __init__(self, settings: Settings):
        """Initialize the extraction service."""
        self.settings = settings
        self.overshoot_client = OvershootVisionClient(settings)
        self.confidence_threshold = settings.confidence_threshold

    async def close(self):
        """Clean up resources."""
        await self.overshoot_client.close()

    async def process_frame(
        self,
        image_data: bytes,
        retry_on_failure: bool = True
    ) -> IndoorMetadata:
        """
        Process a single camera frame and extract indoor metadata.

        Args:
            image_data: Raw image bytes from smartphone
            retry_on_failure: Whether to retry on transient failures

        Returns:
            Validated IndoorMetadata object

        Raises:
            ValueError: If image is invalid or extraction fails
            ValidationError: If extracted data doesn't match schema
        """
        attempt = 0
        last_error = None

        while attempt < self.settings.max_retries:
            try:
                # Extract metadata using Overshoot API
                raw_metadata = await self.overshoot_client.extract_metadata(
                    image_data=image_data,
                    compress=True
                )

                # Validate and parse into structured model
                metadata = self._validate_and_parse(raw_metadata)

                # Apply quality filters
                metadata = self._apply_confidence_filtering(metadata)

                # Log extraction success
                logger.info(
                    "frame_processed_successfully",
                    scene_type=metadata.scene_type,
                    landmarks_count=len(metadata.landmarks),
                    text_count=len(metadata.text_detected),
                    frame_quality=metadata.frame_quality_score
                )

                return metadata

            except ValidationError as e:
                logger.error("validation_error", error=str(e), raw_data=raw_metadata)
                # Try to create a fallback response
                return self._create_fallback_metadata(
                    error_msg=f"Validation failed: {e}",
                    partial_data=raw_metadata
                )

            except Exception as e:
                last_error = e
                attempt += 1

                if attempt < self.settings.max_retries and retry_on_failure:
                    logger.warning(
                        "extraction_failed_retrying",
                        attempt=attempt,
                        max_retries=self.settings.max_retries,
                        error=str(e)
                    )
                    await asyncio.sleep(self.settings.retry_delay * attempt)
                else:
                    logger.error("extraction_failed", error=str(e))
                    raise

        # If all retries failed
        raise ValueError(f"Failed to extract metadata after {self.settings.max_retries} attempts: {last_error}")

    def _validate_and_parse(self, raw_metadata: dict) -> IndoorMetadata:
        """
        Validate raw metadata against schema and parse into structured model.

        Args:
            raw_metadata: Dictionary from Overshoot API

        Returns:
            Validated IndoorMetadata instance

        Raises:
            ValidationError: If data doesn't match schema
        """
        try:
            # Pydantic will validate all fields and constraints
            metadata = IndoorMetadata(**raw_metadata)
            return metadata

        except ValidationError as e:
            logger.warning("validation_error_attempting_recovery", error=str(e))

            # Attempt to fix common issues
            fixed_metadata = self._attempt_fix_validation_errors(raw_metadata)

            # Try again with fixed data
            return IndoorMetadata(**fixed_metadata)

    def _attempt_fix_validation_errors(self, raw_data: dict) -> dict:
        """
        Attempt to fix common validation errors in raw data.

        Args:
            raw_data: Raw metadata dictionary

        Returns:
            Fixed metadata dictionary
        """
        fixed = raw_data.copy()

        # Ensure required fields exist
        if "scene_type" not in fixed:
            fixed["scene_type"] = "unknown"
            fixed["scene_confidence"] = 0.3

        if "scene_confidence" not in fixed:
            fixed["scene_confidence"] = 0.5

        if "frame_quality_score" not in fixed:
            fixed["frame_quality_score"] = 0.5

        # Clamp confidence values to [0, 1]
        if "scene_confidence" in fixed:
            fixed["scene_confidence"] = max(0.0, min(1.0, fixed["scene_confidence"]))

        if "frame_quality_score" in fixed:
            fixed["frame_quality_score"] = max(0.0, min(1.0, fixed["frame_quality_score"]))

        # Fix text detections
        if "text_detected" in fixed:
            fixed_texts = []
            for text_item in fixed["text_detected"]:
                if isinstance(text_item, dict) and "text" in text_item:
                    if "confidence" not in text_item:
                        text_item["confidence"] = 0.5
                    text_item["confidence"] = max(0.0, min(1.0, text_item["confidence"]))
                    fixed_texts.append(text_item)
            fixed["text_detected"] = fixed_texts

        # Fix landmarks
        if "landmarks" in fixed:
            fixed_landmarks = []
            for landmark in fixed["landmarks"]:
                if isinstance(landmark, dict) and all(k in landmark for k in ["type", "direction", "distance"]):
                    if "confidence" not in landmark:
                        landmark["confidence"] = 0.5
                    landmark["confidence"] = max(0.0, min(1.0, landmark["confidence"]))
                    fixed_landmarks.append(landmark)
            fixed["landmarks"] = fixed_landmarks

        return fixed

    def _apply_confidence_filtering(self, metadata: IndoorMetadata) -> IndoorMetadata:
        """
        Filter out low-confidence detections based on threshold.

        Args:
            metadata: Original metadata

        Returns:
            Filtered metadata with only high-confidence detections
        """
        # Filter text detections
        filtered_texts = [
            text for text in metadata.text_detected
            if text.confidence >= self.confidence_threshold
        ]

        # Filter landmarks
        filtered_landmarks = [
            landmark for landmark in metadata.landmarks
            if landmark.confidence >= self.confidence_threshold
        ]

        # Create new metadata with filtered data
        filtered = metadata.model_copy()
        filtered.text_detected = filtered_texts
        filtered.landmarks = filtered_landmarks

        if len(filtered_texts) < len(metadata.text_detected):
            logger.debug(
                "filtered_low_confidence_texts",
                original=len(metadata.text_detected),
                filtered=len(filtered_texts)
            )

        if len(filtered_landmarks) < len(metadata.landmarks):
            logger.debug(
                "filtered_low_confidence_landmarks",
                original=len(metadata.landmarks),
                filtered=len(filtered_landmarks)
            )

        return filtered

    def _create_fallback_metadata(
        self,
        error_msg: str,
        partial_data: Optional[dict] = None
    ) -> IndoorMetadata:
        """
        Create a minimal fallback metadata object when extraction fails.

        Args:
            error_msg: Description of what went wrong
            partial_data: Any partial data that was extracted

        Returns:
            Minimal valid IndoorMetadata
        """
        logger.warning("creating_fallback_metadata", error=error_msg)

        return IndoorMetadata(
            scene_type="unknown",
            scene_confidence=0.1,
            text_detected=[],
            landmarks=[],
            lighting_quality="poor",
            motion_blur_detected=True,
            frame_quality_score=0.2,
            processing_notes=f"Extraction failed: {error_msg}"
        )

    async def process_frame_batch(
        self,
        frames: list[bytes],
        max_concurrent: int = 5
    ) -> list[IndoorMetadata]:
        """
        Process multiple frames concurrently.

        Args:
            frames: List of image byte arrays
            max_concurrent: Maximum concurrent API requests

        Returns:
            List of extracted metadata for each frame
        """
        semaphore = asyncio.Semaphore(max_concurrent)

        async def process_with_semaphore(frame_data: bytes) -> IndoorMetadata:
            async with semaphore:
                return await self.process_frame(frame_data)

        tasks = [process_with_semaphore(frame) for frame in frames]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Convert exceptions to fallback metadata
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error("batch_frame_processing_failed", frame_index=i, error=str(result))
                processed_results.append(
                    self._create_fallback_metadata(f"Batch processing error: {result}")
                )
            else:
                processed_results.append(result)

        return processed_results
