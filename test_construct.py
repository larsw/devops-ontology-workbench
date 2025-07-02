#!/usr/bin/env python3
import json
import requests

# Test the backend CONSTRUCT response
query = '''
PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

CONSTRUCT {
  ?s rdfs:label ?label .
  ?s a ?type .
}
WHERE {
  ?s rdfs:label ?label .
  ?s a ?type .
}
LIMIT 5
'''

try:
    response = requests.post('http://localhost:8000/sparql', 
                           data={'query': query},
                           headers={'Accept': 'application/sparql-results+json'})
    
    print('Status:', response.status_code)
    print('Headers:', dict(response.headers))
    if response.status_code == 200:
        data = response.json()
        print('Response keys:', list(data.keys()))
        if 'turtle' in data:
            print('Turtle data length:', len(data['turtle']))
            print('First 200 chars of turtle:')
            print(data['turtle'][:200])
        else:
            print('No turtle field found')
            print('Full response:')
            print(json.dumps(data, indent=2))
    else:
        print('Error response:')
        print(response.text)
except Exception as e:
    print('Error:', e)
