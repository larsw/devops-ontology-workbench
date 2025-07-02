#!/bin/bash
# Development script - starts both frontend and backend

echo "🚀 Starting DevOps Ontology Workbench in development mode..."
echo "Frontend will be available at: http://localhost:3000"
echo "Backend will be available at: http://localhost:8000"
echo ""

# Check if bun is available
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check if python is available
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Install dependencies if node_modules don't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    bun install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && bun install && cd ..
fi

if [ ! -d "backend/.venv" ] && [ ! -f "backend/.venv/bin/activate" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    python -m venv .venv 2>/dev/null || python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Start development servers
echo "🎯 Starting development servers..."
bun run dev
