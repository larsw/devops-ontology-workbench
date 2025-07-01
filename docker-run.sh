#!/bin/bash

# DevOps Ontology Docker Build and Run Script

set -e

echo "🐳 Building DevOps Ontology Docker image..."
docker build -t devops-ontology:latest .

echo "🚀 Running DevOps Ontology container..."
docker run -d \
  --name devops-ontology \
  -p 8000:8000 \
  -v "$(pwd)/sample.ttl:/app/sample.ttl:ro" \
  devops-ontology:latest

echo "✅ Container started successfully!"
echo "📊 Access the application at: http://localhost:8000"
echo "🩺 Health check at: http://localhost:8000/health"
echo ""
echo "To stop the container: docker stop devops-ontology"
echo "To remove the container: docker rm devops-ontology"
echo "To view logs: docker logs devops-ontology"
