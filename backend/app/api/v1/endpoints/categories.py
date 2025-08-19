"""Category API endpoints"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
)
from app.schemas.common import MessageResponse
from app.services.category import category_service

router = APIRouter()


@router.get("/", response_model=List[CategoryResponse])
async def get_categories(
    db: AsyncSession = Depends(get_db)
):
    """Get all categories with service counts"""
    categories = await category_service.get_all_with_service_count(db)
    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a single category by ID"""
    category = await category_service.get_with_service_count(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new category"""
    # Check if category name already exists
    existing = await category_service.get_by_name(db, category.name)
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    new_category = await category_service.create(db, obj_in=category.model_dump())
    
    # Return with service count
    return {
        **new_category.__dict__,
        "service_count": 0
    }


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a category"""
    category = await category_service.get(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name conflicts with existing
    if category_update.name and category_update.name != category.name:
        existing = await category_service.get_by_name(db, category_update.name)
        if existing:
            raise HTTPException(status_code=400, detail="Category name already exists")
    
    updated_category = await category_service.update(
        db,
        db_obj=category,
        obj_in=category_update.model_dump(exclude_unset=True)
    )
    
    return await category_service.get_with_service_count(db, updated_category.id)


@router.delete("/{category_id}", response_model=MessageResponse)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a category"""
    category = await category_service.delete(db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return MessageResponse(message="Category deleted successfully")


@router.post("/reorder", response_model=List[CategoryResponse])
async def reorder_categories(
    category_orders: List[dict],
    db: AsyncSession = Depends(get_db)
):
    """Reorder categories"""
    categories = await category_service.reorder(db, category_orders)
    
    # Return with service counts
    response = []
    for category in categories:
        cat_with_count = await category_service.get_with_service_count(db, category.id)
        response.append(cat_with_count)
    
    return response