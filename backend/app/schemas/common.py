"""Common schemas used across the application"""

from typing import Optional, Any, Dict
from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="Page size")


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    details: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    database: str
    uptime: float
    timestamp: str