"""API v1 routes"""

from fastapi import APIRouter
from app.api.v1.endpoints import services, categories, tags, health_check, config, websocket

api_router = APIRouter()

# Include routers
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(tags.router, prefix="/tags", tags=["tags"])
api_router.include_router(health_check.router, prefix="/health", tags=["health"])
api_router.include_router(config.router, prefix="/config", tags=["config"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])