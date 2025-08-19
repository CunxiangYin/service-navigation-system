#!/bin/bash

# Service Navigation Backend Startup Script

echo "🚀 Starting Service Navigation Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📚 Installing dependencies..."
pip install -q -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
fi

# Initialize database if it doesn't exist
if [ ! -f "service_nav.db" ]; then
    echo "🗄️ Initializing database with sample data..."
    python init_db.py
fi

# Start the server
echo "✨ Starting FastAPI server..."
echo "📝 API Documentation: http://localhost:8000/api/v1/docs"
echo "🔍 Health Check: http://localhost:8000/health"
echo "Press Ctrl+C to stop the server"
echo "-----------------------------------------"

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000