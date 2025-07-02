#!/bin/bash

# DevOps Ontology Workbench - Start Server Script
# This script starts the backend FastAPI server

set -e

echo "🐍 Starting DevOps Ontology Workbench Backend Server..."

# Change to backend directory
cd "$(dirname "$0")/backend"

# Check if virtual environment exists
if [ -d ".venv" ]; then
    echo "📦 Activating virtual environment..."
    source .venv/bin/activate
else
    echo "⚠️  No virtual environment found at backend/.venv"
    echo "💡 Consider creating one with: python -m venv backend/.venv"
    echo "🔄 Continuing with system Python..."
fi

# Check if requirements are installed
if [ -f "requirements.txt" ]; then
    echo "🔍 Checking dependencies..."
    pip install -r requirements.txt
fi

# Start the FastAPI server
echo "🚀 Starting FastAPI server on http://localhost:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
