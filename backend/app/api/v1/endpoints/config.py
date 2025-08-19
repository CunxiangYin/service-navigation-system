"""Configuration management API endpoints"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.core.database import get_db
from app.schemas.config import (
    ConfigExport,
    ConfigImport,
    ConfigVersionResponse,
)
from app.schemas.common import MessageResponse
from app.services.config import config_service

router = APIRouter()


@router.get("/export", response_model=ConfigExport)
async def export_config(
    version: str = None,
    description: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Export current configuration"""
    return await config_service.export_config(db, version, description)


@router.post("/import", response_model=MessageResponse)
async def import_config(
    config: ConfigImport,
    db: AsyncSession = Depends(get_db)
):
    """Import configuration"""
    result = await config_service.import_config(db, config)
    
    if not result["success"]:
        return MessageResponse(
            message="Configuration imported with errors",
            details=result
        )
    
    return MessageResponse(
        message="Configuration imported successfully",
        details=result
    )


@router.post("/import/file", response_model=MessageResponse)
async def import_config_file(
    file: UploadFile = File(...),
    merge_mode: str = "merge",
    db: AsyncSession = Depends(get_db)
):
    """Import configuration from JSON file"""
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be a JSON file")
    
    try:
        content = await file.read()
        config_data = json.loads(content)
        
        # Validate and import
        config_import = ConfigImport(
            categories=config_data.get("categories", []),
            services=config_data.get("services", []),
            merge_mode=merge_mode
        )
        
        result = await config_service.import_config(db, config_import)
        
        if not result["success"]:
            return MessageResponse(
                message="Configuration imported with errors",
                details=result
            )
        
        return MessageResponse(
            message="Configuration imported successfully",
            details=result
        )
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/versions", response_model=List[ConfigVersionResponse])
async def get_config_versions(
    db: AsyncSession = Depends(get_db)
):
    """Get all configuration versions"""
    versions = await config_service.get_versions(db)
    return versions


@router.get("/versions/{version_id}", response_model=ConfigExport)
async def get_config_version(
    version_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific configuration version"""
    version = await config_service.get(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    config_data = json.loads(version.config_data)
    return ConfigExport(**config_data)


@router.post("/versions/{version_id}/load", response_model=MessageResponse)
async def load_config_version(
    version_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Load a specific configuration version"""
    try:
        result = await config_service.load_version(db, version_id)
        
        if not result["success"]:
            return MessageResponse(
                message="Configuration loaded with errors",
                details=result
            )
        
        return MessageResponse(
            message="Configuration version loaded successfully",
            details=result
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/versions/{version_id}", response_model=MessageResponse)
async def delete_config_version(
    version_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a configuration version"""
    version = await config_service.delete(db, id=version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return MessageResponse(message="Configuration version deleted successfully")