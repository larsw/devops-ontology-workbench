#!/bin/bash

# DevOps Ontology Workbench - Run Script
# Usage: ./run.sh [option]
# Options:
#   docker     - Run full stack with Docker Compose (production)
#   docker-dev - Run development stack with Docker Compose (with hot reload)
#   local      - Run local development (uses dev.sh)
#   backend    - Run only backend locally
#   frontend   - Run only frontend locally
#   help       - Show this help

set -e

show_help() {
    echo "DevOps Ontology Workbench - Run Script"
    echo ""
    echo "Usage: ./run.sh [option]"
    echo ""
    echo "Options:"
    echo "  docker     - Run full stack with Docker Compose (production)"
    echo "  docker-dev - Run development stack with Docker Compose (with hot reload)"
    echo "  local      - Run local development (uses dev.sh)"
    echo "  backend    - Run only backend locally"
    echo "  frontend   - Run only frontend locally"
    echo "  help       - Show this help"
    echo ""
    echo "Examples:"
    echo "  ./run.sh docker     # Run production stack"
    echo "  ./run.sh local      # Run local development"
    echo "  ./run.sh backend    # Run only backend locally"
}

run_docker() {
    echo "🐳 Starting DevOps Ontology Workbench with Docker Compose..."
    docker compose up --build
}

run_docker_dev() {
    echo "🐳 Starting DevOps Ontology Workbench in development mode with Docker Compose..."
    # Use Docker Compose profiles to run development services
    docker compose --profile dev up --build
}

run_local() {
    echo "💻 Starting local development..."
    if [ -f "dev.sh" ]; then
        ./dev.sh
    else
        echo "❌ dev.sh not found. Please make sure it exists."
        exit 1
    fi
}

run_backend() {
    echo "🐍 Starting backend only..."
    cd backend
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    fi
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}

run_frontend() {
    echo "🌐 Starting frontend only..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        bun install
    fi
    bun run dev
}

# Main script logic
case "${1:-help}" in
    docker)
        run_docker
        ;;
    docker-dev)
        run_docker_dev
        ;;
    local)
        run_local
        ;;
    backend)
        run_backend
        ;;
    frontend)
        run_frontend
        ;;
    help|*)
        show_help
        ;;
esac

