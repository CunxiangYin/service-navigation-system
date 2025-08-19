"""Service schemas"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field, ConfigDict


class ServiceBase(BaseModel):
    """Base service schema"""
    name: str = Field(..., min_length=1, max_length=200)
    url: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    category_id: Optional[int] = None
    icon: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class ServiceCreate(ServiceBase):
    """Schema for creating a service"""
    tags: Optional[List[int]] = []


class ServiceUpdate(BaseModel):
    """Schema for updating a service"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    url: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    category_id: Optional[int] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    tags: Optional[List[int]] = None


class ServiceBulkDelete(BaseModel):
    """Schema for bulk delete"""
    service_ids: List[int] = Field(..., min_length=1)


class ServiceBulkUpdate(BaseModel):
    """Schema for bulk update"""
    service_ids: List[int] = Field(..., min_length=1)
    category_id: Optional[int] = None
    is_active: Optional[bool] = None


class TagInService(BaseModel):
    """Tag info in service response"""
    id: int
    name: str
    color: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class CategoryInService(BaseModel):
    """Category info in service response"""
    id: int
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ServiceInDB(ServiceBase):
    """Service stored in database"""
    id: int
    status: str
    last_check_time: Optional[float] = None
    last_check_status: Optional[int] = None
    uptime_percentage: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ServiceResponse(ServiceInDB):
    """Service response schema"""
    category: Optional[CategoryInService] = None
    tags: List[TagInService] = []
    
    model_config = ConfigDict(from_attributes=True)


class ServiceListResponse(BaseModel):
    """Service list response with pagination"""
    total: int
    page: int
    size: int
    items: List[ServiceResponse]