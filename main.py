#!/usr/bin/env python3
"""
FastAPI backend for DevOps Ontology SPARQL queries
"""

from typing import Dict, Any, Union, Optional
from fastapi import FastAPI, HTTPException, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
import rdflib
from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.plugins.sparql import prepareQuery
from rdflib.query import Result
import json
import os
from pathlib import Path

app = FastAPI(title="DevOps Ontology SPARQL Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create an in-memory RDF graph
graph = Graph()

# Define namespaces
DEVOPS = Namespace("https://w3id.org/devops-infra/")
EX = Namespace("https://example.org/devops/")
DCT = Namespace("http://purl.org/dc/terms/")

# Bind namespaces to the graph
graph.bind("devops", DEVOPS)
graph.bind("ex", EX)
graph.bind("dct", DCT)

def load_ttl_data() -> None:
    """Load the TTL file into the RDF graph"""
    ttl_file = Path("sample.ttl")
    if ttl_file.exists():
        try:
            graph.parse(ttl_file, format="turtle")
            print(f"Loaded {len(graph)} triples from {ttl_file}")
        except Exception as e:
            print(f"Error loading TTL file: {e}")
    else:
        print(f"TTL file {ttl_file} not found")

@app.on_event("startup")
async def startup_event():
    """Load RDF data on startup"""
    load_ttl_data()

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {"status": "healthy", "triples": len(graph)}

@app.get("/", response_class=HTMLResponse)
async def serve_index() -> HTMLResponse:
    """Serve the main HTML file"""
    with open("index.html", "r") as f:
        content = f.read()
    return HTMLResponse(content=content)

@app.get("/favicon.ico")
async def favicon():
    """Serve an empty favicon.ico to prevent 404 errors"""
    # Return an empty 1x1 pixel transparent ICO file
    # This is a minimal valid ICO file structure
    ico_content = bytes([
        0x00, 0x00,  # Reserved
        0x01, 0x00,  # Type: ICO
        0x01, 0x00,  # Number of images
        0x01, 0x01,  # Width: 1, Height: 1
        0x00,        # Color count
        0x00,        # Reserved
        0x01, 0x00,  # Planes
        0x01, 0x00,  # Bits per pixel
        0x16, 0x00, 0x00, 0x00,  # Size of image data
        0x16, 0x00, 0x00, 0x00   # Offset to image data
    ]) + bytes([0x00] * 22)  # 22 bytes of empty image data
    
    return Response(content=ico_content, media_type="image/x-icon")

@app.get("/{filename}")
async def serve_static_files(filename: str) -> HTMLResponse:
    """Serve static files (CSS, JS, etc.)"""
    file_path = Path(filename)
    if file_path.exists():
        if filename.endswith('.js'):
            with open(file_path, "r") as f:
                content = f.read()
            return HTMLResponse(content=content, media_type="application/javascript")
        elif filename.endswith('.css'):
            with open(file_path, "r") as f:
                content = f.read()
            return HTMLResponse(content=content, media_type="text/css")
        elif filename.endswith('.ttl'):
            with open(file_path, "r") as f:
                content = f.read()
            return HTMLResponse(content=content, media_type="text/turtle")
    
    raise HTTPException(status_code=404, detail="File not found")

@app.post("/sparql")
async def sparql_endpoint(request: Request) -> JSONResponse:
    """SPARQL endpoint for executing queries"""
    try:
        # Handle different content types
        content_type = request.headers.get("content-type", "")
        query: Optional[str] = None
        
        if "application/x-www-form-urlencoded" in content_type:
            # Handle form-encoded data (typical from Yasgui)
            form_data = await request.form()
            query_value = form_data.get("query")
            query = str(query_value) if query_value is not None else None
        elif "application/sparql-query" in content_type:
            # Handle direct SPARQL query
            query_bytes = await request.body()
            query = query_bytes.decode("utf-8")
        else:
            # Try to get JSON data
            try:
                json_data = await request.json()
                query = json_data.get("query")
            except:
                # Fallback to form data
                form_data = await request.form()
                query_value = form_data.get("query")
                query = str(query_value) if query_value is not None else None
        
        if not query or not isinstance(query, str):
            raise HTTPException(status_code=400, detail="No valid query provided")
        
        # Execute the SPARQL query
        results = execute_sparql_query(query)
        
        # Return results in SPARQL JSON format
        return JSONResponse(content=results, headers={
            "Content-Type": "application/sparql-results+json"
        })
        
    except Exception as e:
        print(f"SPARQL execution error: {e}")
        return JSONResponse(
            content={
                "error": {
                    "message": str(e)
                }
            },
            status_code=400
        )

def execute_sparql_query(query_string: str) -> Dict[str, Any]:
    """Execute a SPARQL query against the RDF graph"""
    try:
        # Execute the query
        results = graph.query(query_string)
        
        # Convert results to SPARQL JSON format
        if hasattr(results, 'vars') and results.vars:
            # SELECT query
            bindings = []
            for row in results:
                # Check if row is a tuple/list (SELECT results)
                if hasattr(row, '__len__') and hasattr(row, '__getitem__'):
                    binding = {}
                    row_length = len(row)  # type: ignore
                    for i, var in enumerate(results.vars):
                        if i < row_length and row[i] is not None:  # type: ignore
                            binding[str(var)] = format_sparql_value(row[i])  # type: ignore
                    bindings.append(binding)
            
            return {
                "head": {
                    "vars": [str(var) for var in results.vars]
                },
                "results": {
                    "bindings": bindings
                }
            }
        else:
            # ASK query or other types
            return {
                "head": {},
                "boolean": bool(results) if hasattr(results, '__bool__') else True
            }
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SPARQL query error: {str(e)}")

def format_sparql_value(value: Union[URIRef, Literal, Any]) -> Dict[str, Any]:
    """Format an RDF value for SPARQL JSON results"""
    if isinstance(value, URIRef):
        return {
            "type": "uri",
            "value": str(value)
        }
    elif isinstance(value, Literal):
        result: Dict[str, Any] = {
            "type": "literal",
            "value": str(value)
        }
        if value.datatype:
            result["datatype"] = str(value.datatype)
        if value.language:
            result["xml:lang"] = value.language
        return result
    else:
        # Blank node or other
        return {
            "type": "bnode",
            "value": str(value)
        }

@app.get("/stats")
async def get_stats() -> Dict[str, Any]:
    """Get statistics about the loaded RDF data"""
    return {
        "total_triples": len(graph),
        "namespaces": {prefix: str(namespace) for prefix, namespace in graph.namespaces()},
        "subjects": len(set(graph.subjects())),
        "predicates": len(set(graph.predicates())),
        "objects": len(set(graph.objects()))
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
