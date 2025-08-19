"""Main FastAPI application"""

from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from datetime import datetime

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import api_router
from app.api.v1.endpoints.websocket import periodic_health_check

# Track application start time
app_start_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("Starting up...")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Start background tasks if enabled
    if settings.HEALTH_CHECK_ENABLED:
        task = asyncio.create_task(periodic_health_check())
    
    yield
    
    # Shutdown
    print("Shutting down...")
    if settings.HEALTH_CHECK_ENABLED:
        task.cancel()


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.APP_VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": f"{settings.API_V1_PREFIX}/docs"
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Application health check"""
    uptime = time.time() - app_start_time
    
    # Check database connection
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return JSONResponse(
        status_code=200 if db_status == "healthy" else 503,
        content={
            "status": "healthy" if db_status == "healthy" else "degraded",
            "version": settings.APP_VERSION,
            "database": db_status,
            "uptime": uptime,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Custom exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )