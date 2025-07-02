# DevOps Ontology Workbench - Deployment Guide

## Overview
This project is now structured as a modern monorepo with separate frontend and backend services:

```
devops-ontology-workbench/
├── frontend/           # Bun + Vite + TypeScript frontend
│   ├── public/        # Static assets (includes sample.ttl)
│   ├── src/           # Source files
│   └── Dockerfile     # Frontend container
├── backend/           # Python + FastAPI backend  
│   ├── main.py        # API server
│   ├── sample.ttl     # Ontology data
│   └── Dockerfile     # Backend container
├── docker-compose.yml # Multi-service orchestration
└── *.sh              # Run scripts
```

## Quick Start

### 🚀 Production Deployment (Docker)
```bash
./docker-run.sh
# OR
./run.sh docker
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

### 💻 Local Development
```bash
./dev.sh
# OR  
./run.sh local
```
- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend**: http://localhost:8000 (FastAPI with hot reload)

### 🐳 Development with Docker
```bash
./run.sh docker-dev
```
- **Frontend**: http://localhost:5173 (Vite dev server in container)
- **Backend**: http://localhost:8000 (FastAPI with hot reload in container)

## File Access Solutions

### Sample.ttl File Availability

The `sample.ttl` file is made available in multiple ways to ensure compatibility:

1. **Frontend Public Directory**: `/frontend/public/sample.ttl`
   - Served directly by Vite dev server at `/sample.ttl`
   - Bundled into production build

2. **Backend API Endpoint**: `GET /sample.ttl`
   - Served by FastAPI backend
   - Available at `http://localhost:8000/sample.ttl`

3. **Vite Proxy Configuration**: 
   - SPARQL queries proxy to `http://localhost:8000/sparql`
   - API calls proxy to `http://localhost:8000/api`

### How It Works

#### Development Mode
- Frontend dev server serves `sample.ttl` from `public/` directory
- SPARQL queries are proxied to the backend API
- No 404 errors because file is locally available

#### Production Mode  
- Frontend build includes `sample.ttl` in static assets
- Backend serves TTL file via dedicated endpoint
- Docker containers properly mount/copy the file

## Scripts Overview

### `./run.sh [option]`
Main orchestration script with multiple modes:
- `docker` - Production stack with Docker Compose
- `docker-dev` - Development stack with Docker Compose  
- `local` - Local development (uses dev.sh)
- `backend` - Backend only
- `frontend` - Frontend only

### `./dev.sh`
Unified local development:
- Installs dependencies
- Starts both frontend and backend
- Handles virtual environments

### `./docker-run.sh` 
Simple Docker deployment:
- Builds and runs production stack
- One-command deployment

### `./start_server.sh`
Backend-focused script:
- Activates Python virtual environment
- Starts FastAPI server only

## Docker Configuration

### Production (`docker-compose.yml`)
- **backend**: Python/FastAPI container on port 8000
- **frontend**: Nginx container serving built assets on port 3000

### Development (`docker-compose.yml --profile dev`)  
- **backend-dev**: Python/FastAPI with volume mounts and hot reload
- **frontend-dev**: Bun/Vite dev server with volume mounts

## Troubleshooting

### 404 Error for sample.ttl
If you get a 404 error when fetching `sample.ttl`:

1. **Check file exists**: `ls frontend/public/sample.ttl`
2. **For local dev**: Ensure backend is running first: `./start_server.sh`
3. **For Docker**: Use `./run.sh docker` for full stack

### Port Conflicts
If ports are already in use:
- Frontend: Change port in `frontend/vite.config.ts`
- Backend: Change port in `backend/main.py` and `start_server.sh`
- Update proxy configuration accordingly

### Dependencies
- **Frontend**: Requires Bun (`curl -fsSL https://bun.sh/install | bash`)
- **Backend**: Requires Python 3.8+ 
- **Docker**: Requires Docker with Compose plugin

## Architecture Benefits

1. **Separation of Concerns**: Frontend and backend are independently deployable
2. **Modern Tooling**: Bun/Vite for fast frontend development  
3. **Container Ready**: Production-ready Docker configuration
4. **Development Friendly**: Hot reload for both frontend and backend
5. **Multiple Deployment Options**: Local, Docker, or hybrid approaches
