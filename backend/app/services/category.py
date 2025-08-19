"""Category management business logic"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.service import Service
from app.services.base import BaseService


class CategoryService(BaseService[Category]):
    """Category management service"""
    
    def __init__(self):
        super().__init__(Category)
    
    async def get_with_service_count(
        self,
        db: AsyncSession,
        id: int
    ) -> Optional[dict]:
        """Get category with service count"""
        category = await self.get(db, id)
        if not category:
            return None
        
        # Count services
        count_result = await db.execute(
            select(func.count(Service.id))
            .filter(Service.category_id == id)
        )
        service_count = count_result.scalar_one()
        
        return {
            **category.__dict__,
            "service_count": service_count
        }
    
    async def get_all_with_service_count(
        self,
        db: AsyncSession
    ) -> List[dict]:
        """Get all categories with service counts"""
        # Get categories with services loaded
        result = await db.execute(
            select(Category)
            .options(selectinload(Category.services))
            .order_by(Category.sort_order, Category.name)
        )
        categories = result.scalars().all()
        
        # Build response with counts
        response = []
        for category in categories:
            response.append({
                **category.__dict__,
                "service_count": len(category.services)
            })
        
        return response
    
    async def get_by_name(
        self,
        db: AsyncSession,
        name: str
    ) -> Optional[Category]:
        """Get category by name"""
        result = await db.execute(
            select(Category).filter(Category.name == name)
        )
        return result.scalar_one_or_none()
    
    async def reorder(
        self,
        db: AsyncSession,
        category_orders: List[dict]
    ) -> List[Category]:
        """Reorder categories"""
        updated_categories = []
        
        for order_item in category_orders:
            category = await self.get(db, order_item["id"])
            if category:
                category.sort_order = order_item["sort_order"]
                db.add(category)
                updated_categories.append(category)
        
        await db.commit()
        
        # Return all categories in new order
        result = await db.execute(
            select(Category).order_by(Category.sort_order, Category.name)
        )
        return result.scalars().all()


category_service = CategoryService()