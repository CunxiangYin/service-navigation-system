.PHONY: help install run dev test clean docker-up docker-down init-db

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make run        - Run the application"
	@echo "  make dev        - Run in development mode with reload"
	@echo "  make test       - Run API tests"
	@echo "  make init-db    - Initialize database with sample data"
	@echo "  make clean      - Clean up cache files"
	@echo "  make docker-up  - Start with Docker Compose"
	@echo "  make docker-down - Stop Docker Compose"

install:
	pip install -r requirements.txt

run:
	python run.py

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	python test_api.py

init-db:
	python init_db.py

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f backend

docker-build:
	docker-compose build --no-cache