"""Health check service"""

import asyncio
import time
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc

from app.models.service import Service
from app.models.health_check import HealthCheckRecord
from app.services.base import BaseService
from app.core.config import settings


class HealthCheckService(BaseService[HealthCheckRecord]):
    """Health check service for monitoring service availability"""
    
    def __init__(self):
        super().__init__(HealthCheckRecord)
        self.timeout = settings.HEALTH_CHECK_TIMEOUT
    
    async def check_service_health(
        self,
        service: Service
    ) -> Dict:
        """Check single service health"""
        start_time = time.time()
        status_code = None
        is_healthy = "unhealthy"
        error_message = None
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(service.url, follow_redirects=True)
                status_code = response.status_code
                
                if 200 <= status_code < 400:
                    is_healthy = "healthy"
                elif 400 <= status_code < 500:
                    is_healthy = "unhealthy"
                    error_message = f"Client error: {status_code}"
                else:
                    is_healthy = "unhealthy"
                    error_message = f"Server error: {status_code}"
                    
        except httpx.TimeoutException:
            is_healthy = "timeout"
            error_message = "Request timeout"
        except httpx.ConnectError:
            is_healthy = "unhealthy"
            error_message = "Connection failed"
        except Exception as e:
            is_healthy = "unhealthy"
            error_message = str(e)
        
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        return {
            "service_id": service.id,
            "status_code": status_code,
            "response_time": response_time,
            "is_healthy": is_healthy,
            "error_message": error_message
        }
    
    async def check_all_services(
        self,
        db: AsyncSession
    ) -> List[Dict]:
        """Check health of all active services"""
        # Get all active services
        result = await db.execute(
            select(Service).filter(Service.is_active == True)
        )
        services = result.scalars().all()
        
        # Check each service concurrently
        tasks = [self.check_service_health(service) for service in services]
        results = await asyncio.gather(*tasks)
        
        # Save results to database
        for check_result in results:
            record = HealthCheckRecord(**check_result)
            db.add(record)
            
            # Update service status
            service = next((s for s in services if s.id == check_result["service_id"]), None)
            if service:
                service.status = "active" if check_result["is_healthy"] == "healthy" else "inactive"
                service.last_check_time = check_result["response_time"]
                service.last_check_status = check_result["status_code"]
                
                # Calculate uptime percentage (last 24 hours)
                uptime = await self.calculate_uptime(db, service.id, hours=24)
                service.uptime_percentage = uptime
                
                db.add(service)
        
        await db.commit()
        
        return results
    
    async def calculate_uptime(
        self,
        db: AsyncSession,
        service_id: int,
        hours: int = 24
    ) -> float:
        """Calculate service uptime percentage for given period"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Get total checks
        total_result = await db.execute(
            select(func.count(HealthCheckRecord.id))
            .filter(
                and_(
                    HealthCheckRecord.service_id == service_id,
                    HealthCheckRecord.created_at >= cutoff_time
                )
            )
        )
        total_checks = total_result.scalar_one()
        
        if total_checks == 0:
            return 100.0
        
        # Get healthy checks
        healthy_result = await db.execute(
            select(func.count(HealthCheckRecord.id))
            .filter(
                and_(
                    HealthCheckRecord.service_id == service_id,
                    HealthCheckRecord.created_at >= cutoff_time,
                    HealthCheckRecord.is_healthy == "healthy"
                )
            )
        )
        healthy_checks = healthy_result.scalar_one()
        
        return (healthy_checks / total_checks) * 100
    
    async def get_service_health_history(
        self,
        db: AsyncSession,
        service_id: int,
        hours: int = 24
    ) -> List[HealthCheckRecord]:
        """Get health check history for a service"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        result = await db.execute(
            select(HealthCheckRecord)
            .filter(
                and_(
                    HealthCheckRecord.service_id == service_id,
                    HealthCheckRecord.created_at >= cutoff_time
                )
            )
            .order_by(desc(HealthCheckRecord.created_at))
        )
        
        return result.scalars().all()
    
    async def get_health_statistics(
        self,
        db: AsyncSession
    ) -> Dict:
        """Get overall health statistics"""
        # Get service counts by status
        result = await db.execute(
            select(
                Service.status,
                func.count(Service.id)
            )
            .group_by(Service.status)
        )
        status_counts = dict(result.all())
        
        # Get average response time
        avg_result = await db.execute(
            select(func.avg(Service.last_check_time))
            .filter(Service.last_check_time.isnot(None))
        )
        avg_response_time = avg_result.scalar_one() or 0
        
        # Get services with their latest health status
        services_result = await db.execute(
            select(Service)
            .filter(Service.is_active == True)
            .order_by(Service.sort_order)
        )
        services = services_result.scalars().all()
        
        service_statuses = []
        for service in services:
            # Get recent checks
            recent_checks = await self.get_service_health_history(db, service.id, hours=1)
            
            service_statuses.append({
                "service_id": service.id,
                "service_name": service.name,
                "url": service.url,
                "status": service.status,
                "last_check_time": service.last_check_time,
                "last_check_status": service.last_check_status,
                "uptime_percentage": service.uptime_percentage or 100.0,
                "recent_checks": recent_checks[:5]  # Last 5 checks
            })
        
        return {
            "total_services": len(services),
            "healthy_services": status_counts.get("active", 0),
            "unhealthy_services": status_counts.get("inactive", 0),
            "unknown_services": status_counts.get("unknown", 0),
            "average_response_time": avg_response_time,
            "services": service_statuses
        }
    
    async def cleanup_old_records(
        self,
        db: AsyncSession,
        days: int = 30
    ):
        """Clean up old health check records"""
        cutoff_time = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(HealthCheckRecord)
            .filter(HealthCheckRecord.created_at < cutoff_time)
        )
        old_records = result.scalars().all()
        
        for record in old_records:
            await db.delete(record)
        
        await db.commit()
        
        return len(old_records)


health_check_service = HealthCheckService()