from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, Union
from pydantic import AnyHttpUrl, validator
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "MugShot Studio"
    API_V1_STR: str = "/api/v1"

    # CORS - Get directly from environment without Pydantic parsing
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "")
        # Remove surrounding quotes if present
        if cors_origins.startswith('"') and cors_origins.endswith('"'):
            cors_origins = cors_origins[1:-1]
        # Return as list with single URL
        return [cors_origins] if cors_origins else []

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str = None
    PROFILE_PHOTOS_BUCKET: str = "profile_photos"
    USER_ASSETS_BUCKET: str = "user_assets"
    RENDERS_BUCKET: str = "renders"
    JWT_SECRET: str

    # Providers
    GEMINI_API_KEY: str
    BYTEDANCE_API_KEY: str
    FAL_KEY: str
    IMAGEROUTER_API_KEY: Union[str, None] = None

    # Upstash Redis (Serverless-compatible)
    UPSTASH_REDIS_REST_URL: Union[str, None] = None
    UPSTASH_REDIS_REST_TOKEN: Union[str, None] = None
    
    # Sentry
    SENTRY_DSN: Union[str, None] = None

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()