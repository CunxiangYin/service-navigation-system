"""Initialize database with sample data"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Category, Service, ServiceTag
from app.services.service import service_service
from app.services.category import category_service
from app.services.tag import tag_service


async def init_categories(db: AsyncSession):
    """Initialize sample categories"""
    categories = [
        {"name": "Development", "icon": "💻", "color": "#3B82F6", "sort_order": 1},
        {"name": "Monitoring", "icon": "📊", "color": "#10B981", "sort_order": 2},
        {"name": "Documentation", "icon": "📚", "color": "#F59E0B", "sort_order": 3},
        {"name": "Communication", "icon": "💬", "color": "#8B5CF6", "sort_order": 4},
        {"name": "Infrastructure", "icon": "🔧", "color": "#EF4444", "sort_order": 5},
    ]
    
    created_categories = {}
    for cat_data in categories:
        existing = await category_service.get_by_name(db, cat_data["name"])
        if not existing:
            category = await category_service.create(db, obj_in=cat_data)
            created_categories[cat_data["name"]] = category.id
            print(f"Created category: {cat_data['name']}")
        else:
            created_categories[cat_data["name"]] = existing.id
            print(f"Category already exists: {cat_data['name']}")
    
    return created_categories


async def init_tags(db: AsyncSession):
    """Initialize sample tags"""
    tags = [
        {"name": "frontend", "color": "#3B82F6"},
        {"name": "backend", "color": "#10B981"},
        {"name": "database", "color": "#F59E0B"},
        {"name": "api", "color": "#8B5CF6"},
        {"name": "monitoring", "color": "#EF4444"},
        {"name": "internal", "color": "#6B7280"},
    ]
    
    created_tags = {}
    for tag_data in tags:
        existing = await tag_service.get_by_name(db, tag_data["name"])
        if not existing:
            tag = await tag_service.create(db, obj_in=tag_data)
            created_tags[tag_data["name"]] = tag.id
            print(f"Created tag: {tag_data['name']}")
        else:
            created_tags[tag_data["name"]] = existing.id
            print(f"Tag already exists: {tag_data['name']}")
    
    return created_tags


async def init_services(db: AsyncSession, categories: dict, tags: dict):
    """Initialize sample services"""
    services = [
        {
            "name": "GitLab",
            "url": "https://gitlab.internal.com",
            "description": "Source code management and CI/CD platform",
            "category": "Development",
            "tags": ["frontend", "backend", "api"],
            "icon": "https://about.gitlab.com/images/press/logo/png/gitlab-icon-rgb.png",
            "sort_order": 1
        },
        {
            "name": "Jenkins",
            "url": "https://jenkins.internal.com",
            "description": "Continuous integration and delivery server",
            "category": "Development",
            "tags": ["backend", "api"],
            "icon": "https://www.jenkins.io/images/logos/jenkins/jenkins.png",
            "sort_order": 2
        },
        {
            "name": "Grafana",
            "url": "https://grafana.internal.com",
            "description": "Metrics visualization and monitoring",
            "category": "Monitoring",
            "tags": ["monitoring", "frontend"],
            "icon": "https://grafana.com/static/img/menu/grafana2.svg",
            "sort_order": 1
        },
        {
            "name": "Prometheus",
            "url": "https://prometheus.internal.com",
            "description": "Time series database for metrics",
            "category": "Monitoring",
            "tags": ["monitoring", "database"],
            "icon": "https://prometheus.io/assets/prometheus_logo_grey.svg",
            "sort_order": 2
        },
        {
            "name": "Confluence",
            "url": "https://confluence.internal.com",
            "description": "Team collaboration and documentation",
            "category": "Documentation",
            "tags": ["internal"],
            "icon": "https://wac-cdn.atlassian.com/dam/jcr:a22c9f02-b225-4e34-9f1d-e5ac0265e543/confluence_rgb_blue.svg",
            "sort_order": 1
        },
        {
            "name": "Slack",
            "url": "https://company.slack.com",
            "description": "Team communication platform",
            "category": "Communication",
            "tags": ["internal"],
            "icon": "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png",
            "sort_order": 1
        },
        {
            "name": "Kubernetes Dashboard",
            "url": "https://k8s.internal.com",
            "description": "Kubernetes cluster management UI",
            "category": "Infrastructure",
            "tags": ["backend", "monitoring"],
            "icon": "https://kubernetes.io/images/kubernetes-icon-color.png",
            "sort_order": 1
        },
    ]
    
    for svc_data in services:
        # Map category name to ID
        category_id = categories.get(svc_data["category"])
        
        # Map tag names to IDs
        tag_ids = [tags[tag_name] for tag_name in svc_data["tags"] if tag_name in tags]
        
        # Create service
        from app.schemas.service import ServiceCreate
        service_create = ServiceCreate(
            name=svc_data["name"],
            url=svc_data["url"],
            description=svc_data["description"],
            category_id=category_id,
            tags=tag_ids,
            icon=svc_data["icon"],
            sort_order=svc_data["sort_order"],
            is_active=True
        )
        
        # Check if service exists
        from sqlalchemy import select
        result = await db.execute(
            select(Service).filter(
                Service.name == svc_data["name"],
                Service.url == svc_data["url"]
            )
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            service = await service_service.create_with_tags(db, obj_in=service_create)
            print(f"Created service: {svc_data['name']}")
        else:
            print(f"Service already exists: {svc_data['name']}")


async def init_db():
    """Initialize database with sample data"""
    print("Initializing database...")
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created")
    
    # Add sample data
    async with AsyncSessionLocal() as db:
        categories = await init_categories(db)
        tags = await init_tags(db)
        await init_services(db, categories, tags)
    
    print("Database initialization complete!")


if __name__ == "__main__":
    asyncio.run(init_db())