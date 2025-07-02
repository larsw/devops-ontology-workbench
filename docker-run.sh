#!/bin/bash

# DevOps Ontology Workbench - Docker Run Script
# Simplified script to run the application with Docker Compose

set -e

echo "🐳 DevOps Ontology Workbench - Docker Deploy"
echo "============================================="

# Check if Docker and Docker Compose are available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available"
    echo "💡 Make sure you have Docker with Compose plugin installed"
    exit 1
fi

# Build and run the services
echo "🔨 Building and starting services..."
docker compose up --build

echo "✅ Services are running:"
echo "   - Backend API: http://localhost:8000"
echo "   - Frontend:    http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
