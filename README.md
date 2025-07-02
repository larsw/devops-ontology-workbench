# DevOps Infrastructure Ontology Visualization

A comprehensive web-based visualization and query interface for DevOps infrastructure ontologies, featuring interactive graph visualization and SPARQL query capabilities.

## Project Structure

```
devops-ontology-workbench/
├── frontend/              # Vite + TypeScript frontend
│   ├── src/
│   ├── index.html
│   ├── script.ts
│   ├── styles.css
│   ├── vite.config.ts
│   └── package.json
├── backend/               # FastAPI Python backend
│   ├── main.py
│   ├── requirements.txt
│   ├── sample.ttl
│   └── package.json
├── docker-compose.yml     # Docker configuration
├── README.md
└── package.json           # Root workspace configuration
```

## Overview

This project demonstrates how to work with DevOps infrastructure data using semantic web technologies. It provides:

- **Interactive Graph Visualization**: Color-coded nodes representing different DevOps concepts
- **SPARQL Query Interface**: Professional query editor powered by Yasgui
- **Comprehensive Sample Data**: Real-world DevOps infrastructure examples
- **FastAPI Backend**: High-performance Python backend with rdflib
- **Modern Frontend**: Vite + TypeScript for fast development

## Features

### 🎨 **Interactive Visualization**
- **Color-coded concepts**: Different colors for Applications, Servers, Databases, Networks, etc.
- **Zoom & Pan**: Mouse wheel zoom, click-and-drag panning
- **Node manipulation**: Drag nodes to reposition them
- **Keyboard shortcuts**: `R` to reset zoom, `+/-` to zoom in/out, `H` for legend, `?` for help
- **Resizable panels**: Adjust graph and query panel sizes
- **Panel management**: Collapsible panels with keyboard shortcuts (`P`, `Q`)

### 🔍 **SPARQL Query Interface**
- **Professional editor**: Syntax highlighting and auto-completion
- **Multiple result formats**: Table, JSON, CSV export
- **Sample queries**: Pre-loaded examples for common use cases
- **Real-time execution**: Instant query results against in-memory RDF store
- **Error handling**: Clear feedback for invalid queries

### 📊 **DevOps Ontology Sample Data**
The sample includes comprehensive DevOps infrastructure concepts:
- **Applications & Services**: Web apps, APIs, microservices
- **Infrastructure**: Physical/virtual servers, containers, databases
- **Network Components**: Load balancers, firewalls, IP addresses
- **Deployment & CI/CD**: Workflows, deployments, environments
- **Monitoring & Operations**: Monitoring agents, log aggregators, incidents
- **Security**: Digital certificates, firewall rules
- **Storage & Backup**: Storage systems, backup policies

## Quick Start

### Prerequisites
- **Bun** (for frontend)
- **Python 3.8+** (for backend)
- **Node.js** (for concurrently)

### Development Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd devops-ontology-workbench
```

2. **Install all dependencies:**
```bash
bun install
bun run install:all
```

3. **Start both frontend and backend in development mode:**
```bash
bun run dev
```

This will start:
- Backend: http://localhost:8000 (FastAPI + SPARQL endpoint)
- Frontend: http://localhost:3000 (Vite dev server)

### Individual Development

**Backend only:**
```bash
cd backend
pip install -r requirements.txt
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend only:**
```bash
cd frontend
bun install
bun run dev
```

## Installation Options

### Option 1: Docker (Alternative)

**Prerequisites:**
- Docker
- Docker Compose (optional)

**Quick Start with Docker:**
```bash
# Build and run with the provided script
./docker-run.sh
```

**Or manually:**
```bash
# Build the Docker image
docker build -t devops-ontology:latest .

# Run the container
docker run -d \
  --name devops-ontology \
  -p 8000:8000 \
  -v "$(pwd)/sample.ttl:/app/sample.ttl:ro" \
  devops-ontology:latest

# Check if it's running
docker logs devops-ontology
```

**Using Docker Compose:**
```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Option 2: Local Python Installation

**Prerequisites:**
- Python 3.8+ 
- pip (Python package manager)

1. **Clone or download the project files**
   ```bash
   cd devops_ontology_sample
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```
   
   Or if you prefer using a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Start the server**
   ```bash
   # Using the provided script (Linux/Mac)
   chmod +x start_server.sh
   ./start_server.sh
   
   # Or manually
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Open your browser**
   ```
   http://localhost:8000
   ```

## Usage

### Graph Visualization
- **Navigate**: Use mouse wheel to zoom, click and drag to pan
- **Interact**: Drag nodes to reposition them
- **Reset**: Click "Reset Zoom" button or press `R` key
- **Keyboard**: Use `+` and `-` keys for zoom control

### SPARQL Queries

#### Sample Queries
The interface includes several pre-loaded sample queries:

1. **All Resources**: Lists all entities with their types and identifiers
2. **Servers & VMs**: Shows server infrastructure components
3. **Applications**: Displays applications with versions
4. **Dependencies**: Shows relationships between components

#### Writing Custom Queries
Use standard SPARQL syntax with these prefixes:
```sparql
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>
```

#### Example Queries

**Find all monitoring relationships:**
```sparql
PREFIX devops: <https://w3id.org/devops-infra/>
SELECT ?monitor ?target WHERE {
  ?monitor devops:monitors ?target .
}
```

**Show deployment chains:**
```sparql
PREFIX devops: <https://w3id.org/devops-infra/>
SELECT ?app ?server ?environment WHERE {
  ?app devops:deployedOn ?server .
  ?server devops:locatedIn ?datacenter .
  ?deployment devops:deploys ?app ;
              devops:targetEnvironment ?environment .
}
```

**Find all containers and their images:**
```sparql
PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT ?container ?image ?server WHERE {
  ?container a devops:Container ;
             devops:hasImage ?image ;
             devops:runningOn ?server .
}
```

## File Structure

```
devops_ontology_sample/
├── README.md                 # This file
├── requirements.txt          # Python dependencies
├── main.py                   # FastAPI backend server
├── start_server.sh          # Server startup script
├── docker-run.sh            # Docker build and run script
├── Dockerfile               # Docker container definition
├── docker-compose.yml       # Docker Compose configuration
├── .gitignore               # Git ignore patterns
├── .dockerignore            # Docker ignore patterns
├── index.html               # Main web interface
├── script.js                # Frontend JavaScript
├── sample.ttl               # DevOps ontology sample data
└── start_webserver.sh       # Legacy simple server (not needed)
```

## Technology Stack

### Backend
- **FastAPI**: Modern, fast Python web framework
- **rdflib**: Python library for RDF manipulation and SPARQL queries
- **uvicorn**: ASGI server for FastAPI

### Frontend
- **D3.js**: Data visualization library for interactive graphs
- **N3.js**: JavaScript library for RDF data parsing
- **Yasgui**: Professional SPARQL query interface
- **Vanilla JavaScript**: No heavy frontend frameworks

### Data Format
- **Turtle (TTL)**: RDF serialization format for ontology data
- **DevOps Infrastructure Ontology**: Based on https://oeg-upm.github.io/devops-infra/

## API Endpoints

- `GET /`: Main web interface
- `POST /sparql`: SPARQL query endpoint
- `GET /stats`: RDF data statistics
- `GET /{filename}`: Static file serving (CSS, JS, TTL)

## Development

### Adding New Data
Edit `sample.ttl` to add more DevOps infrastructure entities. The server will reload automatically in development mode.

### Customizing Visualization
Modify `script.js` to:
- Add new node colors for different concept types
- Adjust force simulation parameters
- Add new interaction features

### Extending Queries
Add new sample queries in the `addSampleQueries()` function in `script.js`.

## Troubleshooting

### Common Issues

**Server won't start:**
- Check Python version: `python --version` (requires 3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Check port availability: Another service might be using port 8000

**SPARQL queries not working:**
- Ensure the server is running: Check console for "Application startup complete"
- Verify TTL data loaded: Look for "Loaded X triples" message
- Check browser console for JavaScript errors

**Graph not displaying:**
- Clear browser cache and reload
- Check browser console for errors
- Ensure all static files are accessible

### Docker Troubleshooting

**Container won't start:**
```bash
# Check container logs
docker logs devops-ontology

# Ensure port 8000 is not in use
docker ps | grep 8000
```

**Health check failing:**
```bash
# Check health status
docker inspect devops-ontology | grep Health

# Manual health check
curl http://localhost:8000/health
```

**Container cleanup:**
```bash
# Stop and remove container
docker stop devops-ontology
docker rm devops-ontology

# Remove image if needed
docker rmi devops-ontology:latest
```

### Performance Notes
- The in-memory RDF store can handle thousands of triples efficiently
- For larger datasets, consider using a persistent triple store
- Query complexity affects response time

## Contributing

Feel free to extend this example with:
- Additional DevOps ontology concepts
- More sophisticated SPARQL queries
- Enhanced visualization features
- Integration with real DevOps tools

## License

This is a sample project for educational and demonstration purposes.

## References

- [DevOps Infrastructure Ontology](https://oeg-upm.github.io/devops-infra/)
- [SPARQL Query Language](https://www.w3.org/TR/sparql11-query/)
- [RDF Turtle Format](https://www.w3.org/TR/turtle/)
- [D3.js Documentation](https://d3js.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [rdflib Documentation](https://rdflib.readthedocs.io/)
