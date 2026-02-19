import sys
from pathlib import Path
import cloudinary.uploader

# Add parent directory to path so we can import cloudinary_config
sys.path.insert(0, str(Path(__file__).parent.parent))
import cloudinary_config  # This configures cloudinary with API keys


def upload_video(file_path: str, folder: str = "presentation_ai"):

    response = cloudinary.uploader.upload(
        file_path,
        resource_type="video",
        folder=folder
    )

    return response["secure_url"]
