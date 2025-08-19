"""Health check record model"""

from sqlalchemy import Column, Integer, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class HealthCheckRecord(BaseModel):
    """Health check record for services"""
    
    __tablename__ = "health_check_records"
    
    service_id = Column(Integer, ForeignKey('services.id', ondelete='CASCADE'), nullable=False)
    status_code = Column(Integer, nullable=True)  # HTTP status code
    response_time = Column(Float, nullable=True)  # Response time in milliseconds
    is_healthy = Column(String(20), nullable=False)  # healthy, unhealthy, timeout
    error_message = Column(Text, nullable=True)
    
    # Relationships
    service = relationship("Service", back_populates="health_checks")
    
    def __repr__(self):
        return f"<HealthCheckRecord(id={self.id}, service_id={self.service_id}, is_healthy={self.is_healthy})>"