"""
Example client for testing the metadata extraction API.
"""

import asyncio
import httpx
import json
from pathlib import Path


async def process_single_frame(image_path: str, api_url: str = "http://localhost:8000"):
    """
    Process a single camera frame and print results.

    Args:
        image_path: Path to image file
        api_url: Base URL of the API server
    """
    print(f"\n{'='*60}")
    print(f"Processing: {image_path}")
    print(f"{'='*60}\n")

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            with open(image_path, 'rb') as f:
                files = {'file': (Path(image_path).name, f, 'image/jpeg')}
                response = await client.post(
                    f'{api_url}/extract',
                    files=files
                )
                response.raise_for_status()

            metadata = response.json()

            # Pretty print results
            print(f"Scene Type: {metadata['scene_type']} (confidence: {metadata['scene_confidence']:.2f})")
            print(f"Frame Quality: {metadata['frame_quality_score']:.2f}")
            print(f"Lighting: {metadata['lighting_quality']}")
            print(f"Motion Blur: {metadata['motion_blur_detected']}")

            if metadata['text_detected']:
                print(f"\nDetected Text ({len(metadata['text_detected'])} items):")
                for text_item in metadata['text_detected']:
                    print(f"  - '{text_item['text']}' (confidence: {text_item['confidence']:.2f})")
            else:
                print("\nNo text detected")

            if metadata['landmarks']:
                print(f"\nLandmarks ({len(metadata['landmarks'])} items):")
                for landmark in metadata['landmarks']:
                    print(f"  - {landmark['type']}: {landmark['direction']} / {landmark['distance']} (confidence: {landmark['confidence']:.2f})")
                    if landmark.get('additional_info'):
                        print(f"    Info: {landmark['additional_info']}")
            else:
                print("\nNo landmarks detected")

            if metadata.get('processing_notes'):
                print(f"\nNotes: {metadata['processing_notes']}")

            # Save full JSON
            output_file = Path(image_path).stem + "_metadata.json"
            with open(output_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            print(f"\nFull metadata saved to: {output_file}")

        except httpx.HTTPStatusError as e:
            print(f"HTTP Error: {e.response.status_code}")
            print(f"Response: {e.response.text}")
        except Exception as e:
            print(f"Error: {e}")


async def process_batch(image_paths: list[str], api_url: str = "http://localhost:8000"):
    """
    Process multiple frames in batch.

    Args:
        image_paths: List of image file paths
        api_url: Base URL of the API server
    """
    print(f"\n{'='*60}")
    print(f"Batch Processing: {len(image_paths)} frames")
    print(f"{'='*60}\n")

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            files = []
            for path in image_paths:
                with open(path, 'rb') as f:
                    files.append(
                        ('files', (Path(path).name, f.read(), 'image/jpeg'))
                    )

            response = await client.post(
                f'{api_url}/extract/batch',
                files=files
            )
            response.raise_for_status()

            results = response.json()

            print(f"Processed {len(results)} frames\n")

            for i, metadata in enumerate(results):
                print(f"Frame {i+1}: {image_paths[i]}")
                print(f"  Scene: {metadata['scene_type']} ({metadata['scene_confidence']:.2f})")
                print(f"  Text items: {len(metadata['text_detected'])}")
                print(f"  Landmarks: {len(metadata['landmarks'])}")
                print(f"  Quality: {metadata['frame_quality_score']:.2f}\n")

        except httpx.HTTPStatusError as e:
            print(f"HTTP Error: {e.response.status_code}")
            print(f"Response: {e.response.text}")
        except Exception as e:
            print(f"Error: {e}")


async def health_check(api_url: str = "http://localhost:8000"):
    """Check if the API server is running."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{api_url}/health")
            response.raise_for_status()
            print(f"✓ Server is healthy: {response.json()}")
            return True
        except Exception as e:
            print(f"✗ Server health check failed: {e}")
            return False


async def main():
    """Main test function."""
    import sys

    api_url = "http://localhost:8000"

    # Check server health
    if not await health_check(api_url):
        print("\nMake sure the API server is running:")
        print("  python -m src.api")
        return

    # Check command line arguments
    if len(sys.argv) < 2:
        print("\nUsage:")
        print("  Single frame: python test_client.py /path/to/image.jpg")
        print("  Batch:        python test_client.py /path/to/img1.jpg /path/to/img2.jpg ...")
        return

    image_paths = sys.argv[1:]

    # Validate files exist
    for path in image_paths:
        if not Path(path).exists():
            print(f"Error: File not found: {path}")
            return

    # Process
    if len(image_paths) == 1:
        await process_single_frame(image_paths[0], api_url)
    else:
        await process_batch(image_paths, api_url)


if __name__ == "__main__":
    asyncio.run(main())
