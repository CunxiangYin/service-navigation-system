"""Tag schemas"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class TagBase(BaseModel):
    """Base tag schema"""
    name: str = Field(..., min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class TagCreate(TagBase):
    """Schema for creating a tag"""
    pass


class TagUpdate(BaseModel):
    """Schema for updating a tag"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class TagInDB(TagBase):
    """Tag stored in database"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class TagResponse(TagInDB):
    """Tag response schema"""
    service_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)