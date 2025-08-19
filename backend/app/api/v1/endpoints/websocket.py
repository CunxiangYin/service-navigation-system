"""WebSocket endpoints for real-time updates"""

from typing import List, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import json
import asyncio
from datetime import datetime

from app.core.database import get_db
from app.services.health_check import health_check_service

router = APIRouter()


class ConnectionManager:
    """WebSocket connection manager"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Connection might be closed, remove it
                self.active_connections.remove(connection)


manager = ConnectionManager()


@router.websocket("/health-status")
async def websocket_health_status(websocket: WebSocket):
    """WebSocket endpoint for real-time health status updates"""
    await manager.connect(websocket)
    
    try:
        while True:
            # Wait for any message from client (ping/pong)
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_text("pong")
            elif data == "get_status":
                # Get current health status from database
                async with AsyncSessionLocal() as db:
                    stats = await health_check_service.get_health_statistics(db)
                    
                    message = {
                        "type": "health_update",
                        "timestamp": datetime.utcnow().isoformat(),
                        "data": {
                            "total_services": stats["total_services"],
                            "healthy_services": stats["healthy_services"],
                            "unhealthy_services": stats["unhealthy_services"],
                            "average_response_time": stats["average_response_time"],
                            "services": [
                                {
                                    "id": svc["service_id"],
                                    "name": svc["service_name"],
                                    "status": svc["status"],
                                    "response_time": svc["last_check_time"],
                                    "uptime": svc["uptime_percentage"]
                                }
                                for svc in stats["services"]
                            ]
                        }
                    }
                    
                    await websocket.send_text(json.dumps(message))
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/notifications")
async def websocket_notifications(websocket: WebSocket):
    """WebSocket endpoint for general notifications"""
    await manager.connect(websocket)
    
    try:
        # Send initial connection message
        await websocket.send_text(json.dumps({
            "type": "connection",
            "message": "Connected to notification service",
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        while True:
            # Keep connection alive and handle messages
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def broadcast_health_update(update_data: Dict):
    """Broadcast health update to all connected clients"""
    message = {
        "type": "health_update",
        "timestamp": datetime.utcnow().isoformat(),
        "data": update_data
    }
    await manager.broadcast(json.dumps(message))


async def broadcast_service_update(service_data: Dict):
    """Broadcast service update to all connected clients"""
    message = {
        "type": "service_update",
        "timestamp": datetime.utcnow().isoformat(),
        "data": service_data
    }
    await manager.broadcast(json.dumps(message))


# Background task for periodic health checks
async def periodic_health_check():
    """Run periodic health checks and broadcast updates"""
    while True:
        try:
            async with AsyncSessionLocal() as db:
                # Run health check
                results = await health_check_service.check_all_services(db)
                
                # Get statistics
                stats = await health_check_service.get_health_statistics(db)
                
                # Broadcast update
                await broadcast_health_update({
                    "check_results": len(results),
                    "statistics": stats
                })
                
        except Exception as e:
            print(f"Error in periodic health check: {e}")
        
        # Wait for next check interval
        await asyncio.sleep(settings.HEALTH_CHECK_INTERVAL)


# Import at the end to avoid circular imports
from app.core.database import AsyncSessionLocal
from app.core.config import settings