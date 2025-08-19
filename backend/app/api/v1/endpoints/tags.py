"""Tag API endpoints"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.tag import (
    TagCreate,
    TagUpdate,
    TagResponse,
)
from app.schemas.common import MessageResponse
from app.services.tag import tag_service

router = APIRouter()


@router.get("/", response_model=List[TagResponse])
async def get_tags(
    db: AsyncSession = Depends(get_db)
):
    """Get all tags with service counts"""
    tags = await tag_service.get_all_with_service_count(db)
    return tags


@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a single tag by ID"""
    tag = await tag_service.get_with_service_count(db, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.post("/", response_model=TagResponse)
async def create_tag(
    tag: TagCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new tag"""
    # Check if tag name already exists
    existing = await tag_service.get_by_name(db, tag.name)
    if existing:
        raise HTTPException(status_code=400, detail="Tag name already exists")
    
    new_tag = await tag_service.create(db, obj_in=tag.model_dump())
    
    # Return with service count
    return {
        **new_tag.__dict__,
        "service_count": 0
    }


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: int,
    tag_update: TagUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a tag"""
    tag = await tag_service.get(db, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if new name conflicts with existing
    if tag_update.name and tag_update.name != tag.name:
        existing = await tag_service.get_by_name(db, tag_update.name)
        if existing:
            raise HTTPException(status_code=400, detail="Tag name already exists")
    
    updated_tag = await tag_service.update(
        db,
        db_obj=tag,
        obj_in=tag_update.model_dump(exclude_unset=True)
    )
    
    return await tag_service.get_with_service_count(db, updated_tag.id)


@router.delete("/{tag_id}", response_model=MessageResponse)
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a tag"""
    tag = await tag_service.delete(db, id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return MessageResponse(message="Tag deleted successfully")


@router.post("/{source_tag_id}/merge/{target_tag_id}", response_model=TagResponse)
async def merge_tags(
    source_tag_id: int,
    target_tag_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Merge source tag into target tag"""
    if source_tag_id == target_tag_id:
        raise HTTPException(status_code=400, detail="Cannot merge tag with itself")
    
    try:
        merged_tag = await tag_service.merge_tags(db, source_tag_id, target_tag_id)
        return await tag_service.get_with_service_count(db, merged_tag.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))