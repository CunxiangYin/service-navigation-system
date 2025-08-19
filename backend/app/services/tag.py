"""Tag management business logic"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.service import ServiceTag, service_tags
from app.services.base import BaseService


class TagService(BaseService[ServiceTag]):
    """Tag management service"""
    
    def __init__(self):
        super().__init__(ServiceTag)
    
    async def get_with_service_count(
        self,
        db: AsyncSession,
        id: int
    ) -> Optional[dict]:
        """Get tag with service count"""
        tag = await self.get(db, id)
        if not tag:
            return None
        
        # Count services using this tag
        count_result = await db.execute(
            select(func.count(service_tags.c.service_id))
            .filter(service_tags.c.tag_id == id)
        )
        service_count = count_result.scalar_one()
        
        return {
            **tag.__dict__,
            "service_count": service_count
        }
    
    async def get_all_with_service_count(
        self,
        db: AsyncSession
    ) -> List[dict]:
        """Get all tags with service counts"""
        # Get tags with services loaded
        result = await db.execute(
            select(ServiceTag)
            .options(selectinload(ServiceTag.services))
            .order_by(ServiceTag.name)
        )
        tags = result.scalars().all()
        
        # Build response with counts
        response = []
        for tag in tags:
            response.append({
                **tag.__dict__,
                "service_count": len(tag.services)
            })
        
        return response
    
    async def get_by_name(
        self,
        db: AsyncSession,
        name: str
    ) -> Optional[ServiceTag]:
        """Get tag by name"""
        result = await db.execute(
            select(ServiceTag).filter(ServiceTag.name == name)
        )
        return result.scalar_one_or_none()
    
    async def get_or_create(
        self,
        db: AsyncSession,
        name: str,
        color: Optional[str] = None
    ) -> ServiceTag:
        """Get existing tag or create new one"""
        tag = await self.get_by_name(db, name)
        if not tag:
            tag = ServiceTag(name=name, color=color)
            db.add(tag)
            await db.commit()
            await db.refresh(tag)
        return tag
    
    async def merge_tags(
        self,
        db: AsyncSession,
        source_tag_id: int,
        target_tag_id: int
    ) -> ServiceTag:
        """Merge source tag into target tag"""
        source_tag = await self.get(db, source_tag_id)
        target_tag = await self.get(db, target_tag_id)
        
        if not source_tag or not target_tag:
            raise ValueError("Source or target tag not found")
        
        # Update all services with source tag to use target tag
        await db.execute(
            service_tags.update()
            .where(service_tags.c.tag_id == source_tag_id)
            .values(tag_id=target_tag_id)
        )
        
        # Delete source tag
        await db.delete(source_tag)
        await db.commit()
        
        return target_tag


tag_service = TagService()