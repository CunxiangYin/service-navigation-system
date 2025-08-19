# Service Navigation Backend

A robust FastAPI backend service for the internal service navigation system.

## Features

- **Service Management**: Complete CRUD operations for services with categorization and tagging
- **Category Management**: Organize services into logical categories
- **Tag System**: Flexible tagging system for services
- **Health Monitoring**: Automatic health checks with status tracking and uptime calculation
- **Configuration Management**: Import/export configurations with versioning
- **Real-time Updates**: WebSocket support for live status updates
- **Search & Filter**: Advanced search and filtering capabilities
- **Bulk Operations**: Support for bulk updates and deletions

## Tech Stack

- **Framework**: FastAPI
- **Database**: SQLAlchemy with SQLite (dev) / PostgreSQL (prod)
- **Validation**: Pydantic
- **Async Support**: Full async/await implementation
- **WebSocket**: Real-time communication
- **Background Tasks**: APScheduler for periodic health checks

## Installation

### Local Development

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize database:
```bash
python init_db.py
```

5. Run the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. Initialize database (first time only):
```bash
docker-compose exec backend python init_db.py
```

## API Documentation

Once running, access the interactive API documentation at:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## API Endpoints

### Services
- `GET /api/v1/services` - List services with pagination and filters
- `GET /api/v1/services/{id}` - Get service details
- `POST /api/v1/services` - Create new service
- `PUT /api/v1/services/{id}` - Update service
- `DELETE /api/v1/services/{id}` - Delete service
- `POST /api/v1/services/bulk/delete` - Bulk delete services
- `POST /api/v1/services/bulk/update` - Bulk update services

### Categories
- `GET /api/v1/categories` - List all categories
- `GET /api/v1/categories/{id}` - Get category details
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Delete category
- `POST /api/v1/categories/reorder` - Reorder categories

### Tags
- `GET /api/v1/tags` - List all tags
- `GET /api/v1/tags/{id}` - Get tag details
- `POST /api/v1/tags` - Create tag
- `PUT /api/v1/tags/{id}` - Update tag
- `DELETE /api/v1/tags/{id}` - Delete tag
- `POST /api/v1/tags/{source_id}/merge/{target_id}` - Merge tags

### Health Monitoring
- `GET /api/v1/health/statistics` - Get overall health statistics
- `GET /api/v1/health/service/{id}` - Get service health status
- `GET /api/v1/health/history/{id}` - Get health check history
- `POST /api/v1/health/check` - Trigger health check for all services
- `POST /api/v1/health/check/{id}` - Check single service
- `DELETE /api/v1/health/cleanup` - Clean up old records

### Configuration
- `GET /api/v1/config/export` - Export current configuration
- `POST /api/v1/config/import` - Import configuration
- `POST /api/v1/config/import/file` - Import from JSON file
- `GET /api/v1/config/versions` - List configuration versions
- `GET /api/v1/config/versions/{id}` - Get specific version
- `POST /api/v1/config/versions/{id}/load` - Load configuration version
- `DELETE /api/v1/config/versions/{id}` - Delete version

### WebSocket
- `WS /api/v1/ws/health-status` - Real-time health status updates
- `WS /api/v1/ws/notifications` - General notifications

## Configuration

Key configuration options in `.env`:

```env
# Database
DATABASE_URL=sqlite+aiosqlite:///./service_nav.db
# For PostgreSQL: DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/service_nav

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Health Check
HEALTH_CHECK_INTERVAL=300  # seconds
HEALTH_CHECK_TIMEOUT=10  # seconds
HEALTH_CHECK_ENABLED=True

# Security
SECRET_KEY=your-secret-key-here
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/  # API endpoints
│   ├── core/               # Core configuration
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   └── services/           # Business logic
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── init_db.py             # Database initialization
```

## Development

### Running Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black app/
flake8 app/
mypy app/
```

## Production Deployment

1. Update `.env` with production settings
2. Use PostgreSQL instead of SQLite
3. Set `DEBUG=False`
4. Use a proper secret key
5. Configure proper CORS origins
6. Use a reverse proxy (nginx/traefik)
7. Enable HTTPS

## License

MIT