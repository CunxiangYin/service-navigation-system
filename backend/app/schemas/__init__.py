"""Pydantic schemas for request/response validation"""

from app.schemas.service import (
    ServiceBase,
    ServiceCreate,
    ServiceUpdate,
    ServiceInDB,
    ServiceResponse,
    ServiceListResponse,
    ServiceBulkDelete,
    ServiceBulkUpdate,
)
from app.schemas.category import (
    CategoryBase,
    CategoryCreate,
    CategoryUpdate,
    CategoryInDB,
    CategoryResponse,
)
from app.schemas.tag import (
    TagBase,
    TagCreate,
    TagUpdate,
    TagInDB,
    TagResponse,
)
from app.schemas.health_check import (
    HealthCheckRecordBase,
    HealthCheckRecordCreate,
    HealthCheckRecordResponse,
    HealthCheckStatistics,
)
from app.schemas.config import (
    ConfigExport,
    ConfigImport,
    ConfigVersionResponse,
)
from app.schemas.common import (
    PaginationParams,
    MessageResponse,
    HealthResponse,
)

__all__ = [
    # Service
    "ServiceBase",
    "ServiceCreate",
    "ServiceUpdate",
    "ServiceInDB",
    "ServiceResponse",
    "ServiceListResponse",
    "ServiceBulkDelete",
    "ServiceBulkUpdate",
    # Category
    "CategoryBase",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryInDB",
    "CategoryResponse",
    # Tag
    "TagBase",
    "TagCreate",
    "TagUpdate",
    "TagInDB",
    "TagResponse",
    # Health Check
    "HealthCheckRecordBase",
    "HealthCheckRecordCreate",
    "HealthCheckRecordResponse",
    "HealthCheckStatistics",
    # Config
    "ConfigExport",
    "ConfigImport",
    "ConfigVersionResponse",
    # Common
    "PaginationParams",
    "MessageResponse",
    "HealthResponse",
]