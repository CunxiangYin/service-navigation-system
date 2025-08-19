"""Service management business logic"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload

from app.models.service import Service, ServiceTag, service_tags
from app.services.base import BaseService
from app.schemas.service import ServiceCreate, ServiceUpdate


class ServiceService(BaseService[Service]):
    """Service management service"""
    
    def __init__(self):
        super().__init__(Service)
    
    async def get_with_relations(self, db: AsyncSession, id: int) -> Optional[Service]:
        """Get service with category and tags"""
        result = await db.execute(
            select(Service)
            .options(selectinload(Service.category))
            .options(selectinload(Service.tags))
            .filter(Service.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_multi_with_relations(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        tag_ids: Optional[List[int]] = None,
        status: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> tuple[List[Service], int]:
        """Get services with filters and pagination"""
        query = select(Service).options(
            selectinload(Service.category),
            selectinload(Service.tags)
        )
        
        # Apply filters
        filters = []
        if category_id is not None:
            filters.append(Service.category_id == category_id)
        if status is not None:
            filters.append(Service.status == status)
        if is_active is not None:
            filters.append(Service.is_active == is_active)
        if search:
            search_filter = or_(
                Service.name.ilike(f"%{search}%"),
                Service.description.ilike(f"%{search}%"),
                Service.url.ilike(f"%{search}%")
            )
            filters.append(search_filter)
        
        if tag_ids:
            # Filter by tags using subquery
            tag_subquery = (
                select(service_tags.c.service_id)
                .where(service_tags.c.tag_id.in_(tag_ids))
                .group_by(service_tags.c.service_id)
                .having(func.count(service_tags.c.tag_id) == len(tag_ids))
                .subquery()
            )
            filters.append(Service.id.in_(select(tag_subquery)))
        
        if filters:
            query = query.filter(and_(*filters))
        
        # Get total count
        count_query = select(func.count()).select_from(Service)
        if filters:
            count_query = count_query.filter(and_(*filters))
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()
        
        # Apply pagination and sorting
        query = query.order_by(Service.sort_order, Service.created_at.desc())
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        services = result.scalars().all()
        
        return services, total
    
    async def create_with_tags(
        self,
        db: AsyncSession,
        *,
        obj_in: ServiceCreate
    ) -> Service:
        """Create service with tags"""
        # Extract tags from input
        tag_ids = obj_in.tags if hasattr(obj_in, 'tags') else []
        service_data = obj_in.model_dump(exclude={'tags'})
        
        # Create service
        db_service = Service(**service_data)
        db.add(db_service)
        await db.flush()
        
        # Add tags
        if tag_ids:
            tags = await db.execute(
                select(ServiceTag).filter(ServiceTag.id.in_(tag_ids))
            )
            db_service.tags = tags.scalars().all()
        
        await db.commit()
        await db.refresh(db_service)
        
        # Load relationships
        result = await db.execute(
            select(Service)
            .options(selectinload(Service.category))
            .options(selectinload(Service.tags))
            .filter(Service.id == db_service.id)
        )
        return result.scalar_one()
    
    async def update_with_tags(
        self,
        db: AsyncSession,
        *,
        db_obj: Service,
        obj_in: ServiceUpdate
    ) -> Service:
        """Update service with tags"""
        update_data = obj_in.model_dump(exclude_unset=True)
        tag_ids = update_data.pop('tags', None)
        
        # Update basic fields
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        # Update tags if provided
        if tag_ids is not None:
            if tag_ids:
                tags = await db.execute(
                    select(ServiceTag).filter(ServiceTag.id.in_(tag_ids))
                )
                db_obj.tags = tags.scalars().all()
            else:
                db_obj.tags = []
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        
        # Load relationships
        result = await db.execute(
            select(Service)
            .options(selectinload(Service.category))
            .options(selectinload(Service.tags))
            .filter(Service.id == db_obj.id)
        )
        return result.scalar_one()
    
    async def bulk_delete(
        self,
        db: AsyncSession,
        *,
        service_ids: List[int]
    ) -> int:
        """Bulk delete services"""
        result = await db.execute(
            select(Service).filter(Service.id.in_(service_ids))
        )
        services = result.scalars().all()
        
        count = len(services)
        for service in services:
            await db.delete(service)
        
        await db.commit()
        return count
    
    async def bulk_update(
        self,
        db: AsyncSession,
        *,
        service_ids: List[int],
        update_data: Dict[str, Any]
    ) -> List[Service]:
        """Bulk update services"""
        result = await db.execute(
            select(Service).filter(Service.id.in_(service_ids))
        )
        services = result.scalars().all()
        
        for service in services:
            for field, value in update_data.items():
                if hasattr(service, field):
                    setattr(service, field, value)
            db.add(service)
        
        await db.commit()
        
        # Reload with relationships
        result = await db.execute(
            select(Service)
            .options(selectinload(Service.category))
            .options(selectinload(Service.tags))
            .filter(Service.id.in_(service_ids))
        )
        return result.scalars().all()
    
    async def update_health_status(
        self,
        db: AsyncSession,
        *,
        service_id: int,
        status: str,
        response_time: Optional[float] = None,
        status_code: Optional[int] = None
    ) -> Service:
        """Update service health status"""
        service = await self.get(db, service_id)
        if service:
            service.status = status
            service.last_check_time = response_time
            service.last_check_status = status_code
            
            db.add(service)
            await db.commit()
            await db.refresh(service)
        
        return service


service_service = ServiceService()