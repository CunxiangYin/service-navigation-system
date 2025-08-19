"""Category model"""

from sqlalchemy import Column, String, Integer, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Category(BaseModel):
    """Service category model"""
    
    __tablename__ = "categories"
    
    name = Column(String(100), nullable=False, unique=True, index=True)
    icon = Column(String(50), nullable=True)  # Icon class or emoji
    color = Column(String(7), nullable=True)  # Hex color code
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    
    # Relationships
    services = relationship("Service", back_populates="category", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"