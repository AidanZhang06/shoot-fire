"""
Configuration management for the metadata extraction service.
Loads settings from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Overshoot API Configuration
    overshoot_api_key: str
    overshoot_api_url: str = "https://cluster1.overshoot.ai/api/v0.2"
    overshoot_timeout: int = 30  # seconds

    # API Server Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_debug: bool = False

    # Processing Configuration
    max_image_size_mb: int = 10
    confidence_threshold: float = 0.5
    enable_caching: bool = True

    # Retry configuration
    max_retries: int = 3
    retry_delay: float = 1.0  # seconds

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses lru_cache to avoid reloading from environment on every call.
    """
    return Settings()
