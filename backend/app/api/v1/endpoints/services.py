"""Service API endpoints"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.service import (
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
    ServiceListResponse,
    ServiceBulkDelete,
    ServiceBulkUpdate,
)
from app.schemas.common import MessageResponse
from app.services.service import service_service

router = APIRouter()


@router.get("/", response_model=ServiceListResponse)
async def get_services(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    tag_ids: Optional[str] = None,  # Comma-separated tag IDs
    status: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
):
    """Get services with filters and pagination"""
    # Parse tag IDs
    tag_id_list = None
    if tag_ids:
        try:
            tag_id_list = [int(id) for id in tag_ids.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid tag IDs format")
    
    skip = (page - 1) * size
    services, total = await service_service.get_multi_with_relations(
        db,
        skip=skip,
        limit=size,
        category_id=category_id,
        tag_ids=tag_id_list,
        status=status,
        is_active=is_active,
        search=search
    )
    
    return ServiceListResponse(
        total=total,
        page=page,
        size=size,
        items=services
    )


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a single service by ID"""
    service = await service_service.get_with_relations(db, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.post("/", response_model=ServiceResponse)
async def create_service(
    service: ServiceCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new service"""
    return await service_service.create_with_tags(db, obj_in=service)


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a service"""
    service = await service_service.get(db, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return await service_service.update_with_tags(
        db, db_obj=service, obj_in=service_update
    )


@router.delete("/{service_id}", response_model=MessageResponse)
async def delete_service(
    service_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a service"""
    service = await service_service.delete(db, id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return MessageResponse(message="Service deleted successfully")


@router.post("/bulk/delete", response_model=MessageResponse)
async def bulk_delete_services(
    bulk_delete: ServiceBulkDelete,
    db: AsyncSession = Depends(get_db)
):
    """Bulk delete services"""
    count = await service_service.bulk_delete(db, service_ids=bulk_delete.service_ids)
    
    return MessageResponse(
        message=f"Successfully deleted {count} services",
        details={"deleted_count": count}
    )


@router.post("/bulk/update", response_model=List[ServiceResponse])
async def bulk_update_services(
    bulk_update: ServiceBulkUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Bulk update services"""
    update_data = {}
    if bulk_update.category_id is not None:
        update_data["category_id"] = bulk_update.category_id
    if bulk_update.is_active is not None:
        update_data["is_active"] = bulk_update.is_active
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    services = await service_service.bulk_update(
        db,
        service_ids=bulk_update.service_ids,
        update_data=update_data
    )
    
    return services