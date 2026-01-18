"""
FastAPI REST API for indoor localization metadata extraction.
Provides endpoints for smartphone apps to submit camera frames.
"""

from pathlib import Path
import json
from datetime import datetime
import glob

from fastapi import FastAPI, File, UploadFile, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
import structlog
from typing import Optional
from pydantic import BaseModel

from src.config import get_settings
from src.metadata_extractor import MetadataExtractionService
from src.models import IndoorMetadata

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger()

# Global service instance
extraction_service: Optional[MetadataExtractionService] = None

# Observations directory
OBSERVATIONS_DIR = Path(__file__).resolve().parent.parent / "observations"


class ObservationData(BaseModel):
    """Combined GPS + metadata observation."""
    device_id: str  # Unique device identifier
    timestamp: str
    gps_latitude: float
    gps_longitude: float
    gps_accuracy: float
    metadata: dict  # Overshoot metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for setup and cleanup."""
    global extraction_service

    settings = get_settings()

    # Startup
    logger.info("starting_metadata_extraction_service")
    extraction_service = MetadataExtractionService(settings)

    # Create observations directory if it doesn't exist
    OBSERVATIONS_DIR.mkdir(exist_ok=True)
    logger.info("observations_directory_ready", path=str(OBSERVATIONS_DIR))

    yield

    # Shutdown
    logger.info("shutting_down_metadata_extraction_service")
    if extraction_service:
        await extraction_service.close()


# Initialize FastAPI app
app = FastAPI(
    title="Indoor Localization Metadata Extraction API",
    description="Extract structured metadata from smartphone camera frames for indoor navigation",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for mobile app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def overshoot_livestream_page():
    """Serve the Overshoot live video streaming page."""
    path = Path(__file__).resolve().parent.parent / "static" / "overshoot-livestream.html"
    return FileResponse(path)

@app.get("/dashboard")
async def dashboard_page():
    """Serve the multi-device tracking dashboard."""
    path = Path(__file__).resolve().parent.parent / "static" / "dashboard.html"
    return FileResponse(path)

@app.get("/test-simple")
async def simple_test_page():
    """Serve the simple test page (periodic image capture → /extract)."""
    path = Path(__file__).resolve().parent.parent / "static" / "livestream-test.html"
    return FileResponse(path)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "metadata-extraction",
        "version": "1.0.0"
    }


@app.post(
    "/extract",
    response_model=IndoorMetadata,
    status_code=status.HTTP_200_OK,
    summary="Extract metadata from camera frame",
    description="""
    Upload a single camera frame image and receive structured metadata.

    Supports JPG, PNG image formats.
    Maximum file size: 10MB (configurable).

    Returns strict JSON matching IndoorMetadata schema.
    """
)
async def extract_metadata(
    file: UploadFile = File(..., description="Camera frame image from smartphone")
) -> IndoorMetadata:
    """
    Extract indoor metadata from a smartphone camera frame.

    Args:
        file: Uploaded image file

    Returns:
        IndoorMetadata object with scene classification, landmarks, text, etc.

    Raises:
        HTTPException: If image is invalid or processing fails
    """
    if not extraction_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Extraction service not initialized"
        )

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Expected image, got {file.content_type}"
        )

    try:
        # Read image data
        image_data = await file.read()

        # Validate file size
        settings = get_settings()
        max_size = settings.max_image_size_mb * 1024 * 1024
        if len(image_data) > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {settings.max_image_size_mb}MB"
            )

        logger.info(
            "processing_frame_request",
            filename=file.filename,
            content_type=file.content_type,
            size_kb=len(image_data) / 1024
        )

        # Process frame
        metadata = await extraction_service.process_frame(image_data)

        return metadata

    except HTTPException:
        raise
    except Exception as e:
        logger.error("frame_processing_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process frame: {str(e)}"
        )


@app.post(
    "/extract/batch",
    response_model=list[IndoorMetadata],
    status_code=status.HTTP_200_OK,
    summary="Extract metadata from multiple frames",
    description="""
    Upload multiple camera frames for batch processing.

    Processes frames concurrently for better performance.
    Useful for processing recorded video or multiple simultaneous camera angles.
    """
)
async def extract_metadata_batch(
    files: list[UploadFile] = File(..., description="Multiple camera frame images")
) -> list[IndoorMetadata]:
    """
    Extract metadata from multiple camera frames in batch.

    Args:
        files: List of uploaded image files

    Returns:
        List of IndoorMetadata objects, one per frame

    Raises:
        HTTPException: If processing fails
    """
    if not extraction_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Extraction service not initialized"
        )

    if len(files) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 50 frames per batch request"
        )

    try:
        # Read all files
        frames_data = []
        for file in files:
            if not file.content_type or not file.content_type.startswith("image/"):
                continue  # Skip non-image files
            image_data = await file.read()
            frames_data.append(image_data)

        logger.info("processing_batch_request", frame_count=len(frames_data))

        # Process batch
        results = await extraction_service.process_frame_batch(frames_data)

        return results

    except Exception as e:
        logger.error("batch_processing_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process batch: {str(e)}"
        )


@app.get("/schema")
async def get_schema():
    """
    Get the JSON schema for IndoorMetadata output.

    Useful for client applications to understand the expected response format.
    """
    return IndoorMetadata.model_json_schema()


@app.post("/save_observation")
async def save_observation(observation: ObservationData = Body(...)):
    """
    Save a combined GPS + metadata observation to device-specific JSON file.
    Each device gets its own observations_<device_id>.json file.
    """
    try:
        device_id = observation.device_id
        device_file = OBSERVATIONS_DIR / f"observations_{device_id}.json"

        # Read existing observations or create new list
        observations = []
        if device_file.exists():
            with open(device_file, 'r') as f:
                observations = json.load(f)

        # Append new observation
        observations.append(observation.model_dump())

        # Write back to file
        with open(device_file, 'w') as f:
            json.dump(observations, f, indent=2)

        logger.info("observation_saved", device_id=device_id, count=len(observations))

        return {
            "status": "success",
            "device_id": device_id,
            "total_observations": len(observations)
        }

    except Exception as e:
        logger.error("failed_to_save_observation", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save observation: {str(e)}"
        )


@app.post("/clear_observations/{device_id}")
async def clear_observations(device_id: str):
    """
    Clear observations for a specific device.
    Called when user stops the stream.
    """
    try:
        device_file = OBSERVATIONS_DIR / f"observations_{device_id}.json"
        if device_file.exists():
            device_file.unlink()
            logger.info("observations_cleared", device_id=device_id)

        return {"status": "success", "message": f"Observations cleared for device {device_id}"}

    except Exception as e:
        logger.error("failed_to_clear_observations", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear observations: {str(e)}"
        )


@app.get("/observations/{device_id}")
async def get_observations(device_id: str):
    """
    Get all saved observations for a specific device.
    """
    try:
        device_file = OBSERVATIONS_DIR / f"observations_{device_id}.json"
        if not device_file.exists():
            return {"device_id": device_id, "observations": [], "count": 0}

        with open(device_file, 'r') as f:
            observations = json.load(f)

        return {"device_id": device_id, "observations": observations, "count": len(observations)}

    except Exception as e:
        logger.error("failed_to_get_observations", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get observations: {str(e)}"
        )


@app.get("/devices")
async def list_devices():
    """
    List all active devices (devices with observation files).
    Returns device IDs and their latest GPS coordinates.
    """
    try:
        devices = []
        observation_files = glob.glob(str(OBSERVATIONS_DIR / "observations_*.json"))

        for file_path in observation_files:
            file = Path(file_path)
            device_id = file.stem.replace("observations_", "")

            with open(file, 'r') as f:
                observations = json.load(f)

            if observations:
                latest = observations[-1]
                devices.append({
                    "device_id": device_id,
                    "observation_count": len(observations),
                    "latest_gps": {
                        "latitude": latest.get("gps_latitude"),
                        "longitude": latest.get("gps_longitude"),
                        "accuracy": latest.get("gps_accuracy"),
                        "timestamp": latest.get("timestamp")
                    }
                })

        logger.info("devices_listed", count=len(devices))
        return {"devices": devices, "count": len(devices)}

    except Exception as e:
        logger.error("failed_to_list_devices", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list devices: {str(e)}"
        )


@app.get("/all_observations")
async def get_all_observations():
    """
    Get observations from all devices (for map visualization).
    """
    try:
        all_data = {}
        observation_files = glob.glob(str(OBSERVATIONS_DIR / "observations_*.json"))

        for file_path in observation_files:
            file = Path(file_path)
            device_id = file.stem.replace("observations_", "")

            with open(file, 'r') as f:
                observations = json.load(f)

            all_data[device_id] = observations

        return {"devices": all_data, "device_count": len(all_data)}

    except Exception as e:
        logger.error("failed_to_get_all_observations", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get all observations: {str(e)}"
        )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error("unhandled_exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred",
            "error": str(exc) if get_settings().api_debug else "Internal server error"
        }
    )


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "src.api:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_debug,
        log_level="info"
    )
