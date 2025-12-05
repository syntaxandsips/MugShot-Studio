from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, Union
from pydantic import AnyHttpUrl, validator
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "Tmughsot studio"
    API_V1_STR: str = "/api/v1"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            if isinstance(v, str) and v.startswith("["):
                return json.loads(v)
            return v
        raise ValueError(v)

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

    # Redis/Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    
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