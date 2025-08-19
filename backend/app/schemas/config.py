"""Configuration schemas"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ServiceExport(BaseModel):
    """Service export schema"""
    name: str
    url: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    icon: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class CategoryExport(BaseModel):
    """Category export schema"""
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0


class ConfigExport(BaseModel):
    """Configuration export schema"""
    version: str
    exported_at: str
    categories: List[CategoryExport]
    services: List[ServiceExport]
    description: Optional[str] = None


class ConfigImport(BaseModel):
    """Configuration import schema"""
    categories: List[CategoryExport]
    services: List[ServiceExport]
    merge_mode: str = "replace"  # replace, merge, append


class ConfigVersionResponse(BaseModel):
    """Configuration version response"""
    id: int
    version: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)