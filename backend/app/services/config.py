"""Configuration management service"""

import json
from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.config import ConfigVersion
from app.models.service import Service, ServiceTag
from app.models.category import Category
from app.schemas.config import ConfigExport, ConfigImport
from app.services.base import BaseService
from app.services.service import service_service
from app.services.category import category_service
from app.services.tag import tag_service


class ConfigService(BaseService[ConfigVersion]):
    """Configuration management service"""
    
    def __init__(self):
        super().__init__(ConfigVersion)
    
    async def export_config(
        self,
        db: AsyncSession,
        version: Optional[str] = None,
        description: Optional[str] = None
    ) -> ConfigExport:
        """Export current configuration"""
        # Get all categories
        categories_result = await db.execute(
            select(Category).order_by(Category.sort_order)
        )
        categories = categories_result.scalars().all()
        
        # Get all services with relations
        services_result = await db.execute(
            select(Service).order_by(Service.sort_order)
        )
        services = services_result.scalars().all()
        
        # Build export data
        category_exports = []
        for category in categories:
            category_exports.append({
                "name": category.name,
                "icon": category.icon,
                "color": category.color,
                "description": category.description,
                "sort_order": category.sort_order
            })
        
        service_exports = []
        for service in services:
            # Get category name
            category_name = None
            if service.category_id:
                category = next((c for c in categories if c.id == service.category_id), None)
                if category:
                    category_name = category.name
            
            # Get tag names
            tags_result = await db.execute(
                select(ServiceTag)
                .join(ServiceTag.services)
                .filter(Service.id == service.id)
            )
            tags = tags_result.scalars().all()
            tag_names = [tag.name for tag in tags]
            
            service_exports.append({
                "name": service.name,
                "url": service.url,
                "description": service.description,
                "category": category_name,
                "tags": tag_names,
                "icon": service.icon,
                "sort_order": service.sort_order,
                "is_active": service.is_active
            })
        
        # Create version if specified
        if version:
            config_data = {
                "version": version,
                "exported_at": datetime.utcnow().isoformat(),
                "categories": category_exports,
                "services": service_exports,
                "description": description
            }
            
            config_version = ConfigVersion(
                version=version,
                description=description,
                config_data=json.dumps(config_data),
                is_active=0
            )
            db.add(config_version)
            await db.commit()
        
        return ConfigExport(
            version=version or datetime.utcnow().strftime("%Y%m%d_%H%M%S"),
            exported_at=datetime.utcnow().isoformat(),
            categories=category_exports,
            services=service_exports,
            description=description
        )
    
    async def import_config(
        self,
        db: AsyncSession,
        config: ConfigImport
    ) -> Dict:
        """Import configuration"""
        imported_categories = 0
        imported_services = 0
        errors = []
        
        # Handle merge mode
        if config.merge_mode == "replace":
            # Delete all existing data
            await db.execute(select(Service).delete())
            await db.execute(select(Category).delete())
            await db.execute(select(ServiceTag).delete())
            await db.commit()
        
        # Import categories
        category_map = {}  # Map old names to new IDs
        for cat_data in config.categories:
            try:
                existing = await category_service.get_by_name(db, cat_data.name)
                
                if existing and config.merge_mode == "merge":
                    # Update existing category
                    for field, value in cat_data.dict().items():
                        if hasattr(existing, field):
                            setattr(existing, field, value)
                    db.add(existing)
                    category_map[cat_data.name] = existing.id
                elif not existing:
                    # Create new category
                    new_category = Category(**cat_data.dict())
                    db.add(new_category)
                    await db.flush()
                    category_map[cat_data.name] = new_category.id
                    imported_categories += 1
                    
            except Exception as e:
                errors.append(f"Category '{cat_data.name}': {str(e)}")
        
        await db.commit()
        
        # Import services
        for svc_data in config.services:
            try:
                # Get category ID
                category_id = None
                if svc_data.category:
                    category_id = category_map.get(svc_data.category)
                
                # Get or create tags
                tag_objects = []
                for tag_name in svc_data.tags:
                    tag = await tag_service.get_or_create(db, tag_name)
                    tag_objects.append(tag)
                
                # Check if service exists
                existing = await db.execute(
                    select(Service).filter(
                        Service.name == svc_data.name,
                        Service.url == svc_data.url
                    )
                )
                existing_service = existing.scalar_one_or_none()
                
                if existing_service and config.merge_mode == "merge":
                    # Update existing service
                    existing_service.description = svc_data.description
                    existing_service.category_id = category_id
                    existing_service.icon = svc_data.icon
                    existing_service.sort_order = svc_data.sort_order
                    existing_service.is_active = svc_data.is_active
                    existing_service.tags = tag_objects
                    db.add(existing_service)
                elif not existing_service:
                    # Create new service
                    new_service = Service(
                        name=svc_data.name,
                        url=svc_data.url,
                        description=svc_data.description,
                        category_id=category_id,
                        icon=svc_data.icon,
                        sort_order=svc_data.sort_order,
                        is_active=svc_data.is_active,
                        status="unknown"
                    )
                    new_service.tags = tag_objects
                    db.add(new_service)
                    imported_services += 1
                    
            except Exception as e:
                errors.append(f"Service '{svc_data.name}': {str(e)}")
        
        await db.commit()
        
        return {
            "imported_categories": imported_categories,
            "imported_services": imported_services,
            "errors": errors,
            "success": len(errors) == 0
        }
    
    async def load_version(
        self,
        db: AsyncSession,
        version_id: int
    ) -> Dict:
        """Load a specific configuration version"""
        version = await self.get(db, version_id)
        if not version:
            raise ValueError("Version not found")
        
        # Parse config data
        config_data = json.loads(version.config_data)
        
        # Import the configuration
        config_import = ConfigImport(
            categories=config_data["categories"],
            services=config_data["services"],
            merge_mode="replace"
        )
        
        result = await self.import_config(db, config_import)
        
        # Mark this version as active
        await db.execute(
            select(ConfigVersion).update().values(is_active=0)
        )
        version.is_active = 1
        db.add(version)
        await db.commit()
        
        return result
    
    async def get_versions(
        self,
        db: AsyncSession
    ) -> List[ConfigVersion]:
        """Get all configuration versions"""
        result = await db.execute(
            select(ConfigVersion).order_by(ConfigVersion.created_at.desc())
        )
        return result.scalars().all()


config_service = ConfigService()