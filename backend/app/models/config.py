"""Configuration version model"""

from sqlalchemy import Column, String, Text, Integer
from app.models.base import BaseModel


class ConfigVersion(BaseModel):
    """Configuration version model for tracking config changes"""
    
    __tablename__ = "config_versions"
    
    version = Column(String(50), nullable=False, unique=True)
    description = Column(String(500), nullable=True)
    config_data = Column(Text, nullable=False)  # JSON string
    is_active = Column(Integer, default=0, nullable=False)  # Boolean as Integer for SQLite
    
    def __repr__(self):
        return f"<ConfigVersion(id={self.id}, version='{self.version}')>"