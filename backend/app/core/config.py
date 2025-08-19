"""Application configuration"""

from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator
import secrets


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Service Navigation API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Service Navigation"
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./service_nav.db"
    DATABASE_ECHO: bool = False
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Health Check
    HEALTH_CHECK_INTERVAL: int = 300  # seconds
    HEALTH_CHECK_TIMEOUT: int = 10  # seconds
    HEALTH_CHECK_ENABLED: bool = True
    
    # Redis
    REDIS_URL: Optional[str] = None
    
    # Pagination
    PAGINATION_LIMIT: int = 100
    DEFAULT_PAGE_SIZE: int = 20
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()