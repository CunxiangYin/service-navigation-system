"""Service model"""

from sqlalchemy import Column, String, Text, Integer, ForeignKey, Table, Boolean, Float
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.core.database import Base

# Association table for many-to-many relationship between services and tags
service_tags = Table(
    'service_tags',
    Base.metadata,
    Column('service_id', Integer, ForeignKey('services.id', ondelete='CASCADE')),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'))
)


class Service(BaseModel):
    """Service model"""
    
    __tablename__ = "services"
    
    name = Column(String(200), nullable=False, index=True)
    url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey('categories.id', ondelete='SET NULL'), nullable=True)
    status = Column(String(20), default='unknown', nullable=False)  # active, inactive, unknown
    is_active = Column(Boolean, default=True, nullable=False)
    icon = Column(String(500), nullable=True)  # Icon URL or class
    sort_order = Column(Integer, default=0, nullable=False)
    
    # Health check related
    last_check_time = Column(Float, nullable=True)  # Last response time in ms
    last_check_status = Column(Integer, nullable=True)  # HTTP status code
    uptime_percentage = Column(Float, default=100.0, nullable=True)
    
    # Relationships
    category = relationship("Category", back_populates="services")
    tags = relationship("ServiceTag", secondary=service_tags, back_populates="services")
    health_checks = relationship("HealthCheckRecord", back_populates="service", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Service(id={self.id}, name='{self.name}', url='{self.url}')>"


class ServiceTag(BaseModel):
    """Tag model for services"""
    
    __tablename__ = "tags"
    
    name = Column(String(50), nullable=False, unique=True, index=True)
    color = Column(String(7), nullable=True)  # Hex color code
    
    # Relationships
    services = relationship("Service", secondary=service_tags, back_populates="tags")
    
    def __repr__(self):
        return f"<ServiceTag(id={self.id}, name='{self.name}')>"