"""Health check schemas"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class HealthCheckRecordBase(BaseModel):
    """Base health check record schema"""
    service_id: int
    status_code: Optional[int] = None
    response_time: Optional[float] = None
    is_healthy: str
    error_message: Optional[str] = None


class HealthCheckRecordCreate(HealthCheckRecordBase):
    """Schema for creating a health check record"""
    pass


class HealthCheckRecordResponse(HealthCheckRecordBase):
    """Health check record response schema"""
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ServiceHealthStatus(BaseModel):
    """Service health status"""
    service_id: int
    service_name: str
    url: str
    status: str
    last_check_time: Optional[float] = None
    last_check_status: Optional[int] = None
    uptime_percentage: float
    recent_checks: List[HealthCheckRecordResponse] = []


class HealthCheckStatistics(BaseModel):
    """Health check statistics"""
    total_services: int
    healthy_services: int
    unhealthy_services: int
    unknown_services: int
    average_response_time: float
    services: List[ServiceHealthStatus] = []