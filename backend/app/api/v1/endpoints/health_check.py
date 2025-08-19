"""Health check API endpoints"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.health_check import (
    HealthCheckRecordResponse,
    HealthCheckStatistics,
    ServiceHealthStatus,
)
from app.schemas.common import MessageResponse
from app.services.health_check import health_check_service

router = APIRouter()


@router.get("/statistics", response_model=HealthCheckStatistics)
async def get_health_statistics(
    db: AsyncSession = Depends(get_db)
):
    """Get overall health statistics"""
    stats = await health_check_service.get_health_statistics(db)
    return stats


@router.get("/service/{service_id}", response_model=ServiceHealthStatus)
async def get_service_health(
    service_id: int,
    hours: int = 24,
    db: AsyncSession = Depends(get_db)
):
    """Get health status for a specific service"""
    from app.services.service import service_service
    
    service = await service_service.get(db, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    history = await health_check_service.get_service_health_history(db, service_id, hours)
    uptime = await health_check_service.calculate_uptime(db, service_id, hours)
    
    return ServiceHealthStatus(
        service_id=service.id,
        service_name=service.name,
        url=service.url,
        status=service.status,
        last_check_time=service.last_check_time,
        last_check_status=service.last_check_status,
        uptime_percentage=uptime,
        recent_checks=history[:10]
    )


@router.get("/history/{service_id}", response_model=List[HealthCheckRecordResponse])
async def get_service_health_history(
    service_id: int,
    hours: int = 24,
    db: AsyncSession = Depends(get_db)
):
    """Get health check history for a service"""
    history = await health_check_service.get_service_health_history(db, service_id, hours)
    return history


@router.post("/check", response_model=MessageResponse)
async def trigger_health_check(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Trigger health check for all services"""
    background_tasks.add_task(health_check_service.check_all_services, db)
    return MessageResponse(message="Health check started in background")


@router.post("/check/{service_id}", response_model=dict)
async def check_single_service(
    service_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Check health of a single service"""
    from app.services.service import service_service
    
    service = await service_service.get(db, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    result = await health_check_service.check_service_health(service)
    
    # Save result
    from app.models.health_check import HealthCheckRecord
    record = HealthCheckRecord(**result)
    db.add(record)
    
    # Update service status
    service.status = "active" if result["is_healthy"] == "healthy" else "inactive"
    service.last_check_time = result["response_time"]
    service.last_check_status = result["status_code"]
    
    db.add(service)
    await db.commit()
    
    return result


@router.delete("/cleanup", response_model=MessageResponse)
async def cleanup_old_records(
    days: int = 30,
    db: AsyncSession = Depends(get_db)
):
    """Clean up old health check records"""
    deleted_count = await health_check_service.cleanup_old_records(db, days)
    return MessageResponse(
        message=f"Deleted {deleted_count} old health check records",
        details={"deleted_count": deleted_count}
    )