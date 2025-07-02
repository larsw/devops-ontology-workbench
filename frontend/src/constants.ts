/**
 * Constants and configuration for the DevOps Ontology Workbench
 */
import type { ColorScheme, GraphConfig } from './types.js';

// Color scheme for different concept types
export const colorScheme: ColorScheme = {
  'Application': '#ff6b6b',
  'Service': '#4ecdc4',
  'Container': '#45b7d1',
  'Database': '#96ceb4',
  'DatabaseSchema': '#a8e6cf',
  'VirtualServer': '#feca57',
  'PhysicalServer': '#ff9ff3',
  'ServerHardware': '#54a0ff',
  'DataCenter': '#5f27cd',
  'IPAddress': '#00d2d3',
  'NetworkSegment': '#ff6348',
  'NetworkCard': '#dda0dd',
  'Disk': '#c44569',
  'DigitalCertificate': '#40407a',
  'DNSDomain': '#706fd3',
  'ResourceGroup': '#f8b500',
  'Department': '#2c2c54',
  'Scope': '#1dd1a1',
  'MonitoringAgent': '#ff5722',
  'LogAggregator': '#ff9800',
  'Deployment': '#795548',
  'Workflow': '#607d8b',
  'WorkflowStep': '#9e9e9e',
  'Environment': '#4caf50',
  'User': '#e91e63',
  'Team': '#9c27b0',
  'Event': '#ff5252',
  'Incident': '#f44336',
  'LoadBalancer': '#3f51b5',
  'Firewall': '#009688',
  'FirewallRule': '#00bcd4',
  'Backup': '#8bc34a',
  'Storage': '#cddc39',
  'default': '#69b3a2'
};

// Default graph configuration
export const defaultGraphConfig: GraphConfig = {
  width: 800,
  height: 600,
  nodeRadius: 8,
  linkDistance: 150,
  chargeStrength: -200
};

// Node size mapping based on type
export const getNodeRadius = (type: string): number => {
  if (['DataCenter', 'Environment'].includes(type)) return 12;
  if (['PhysicalServer', 'VirtualServer'].includes(type)) return 10;
  if (['Application', 'Service', 'Database'].includes(type)) return 9;
  return 8;
};

// Sample SPARQL queries
export const sampleQueries = [
  {
    name: "Servers & VMs",
    query: `PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?server ?type ?identifier WHERE {
  ?server a ?type .
  ?server dct:identifier ?identifier .
  FILTER(CONTAINS(STR(?type), "Server"))
}`
  },
  {
    name: "Applications",
    query: `PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?app ?identifier ?version WHERE {
  ?app a devops:Application .
  ?app dct:identifier ?identifier .
  OPTIONAL { ?app devops:hasVersion ?version }
}`
  },
  {
    name: "Dependencies",
    query: `PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?source ?target ?relation WHERE {
  ?source ?relation ?target .
  FILTER(?relation IN (devops:dependsOn, devops:deployedOn, devops:hostedOn))
}`
  }
];

// Default SPARQL query
export const defaultQuery = `PREFIX dct: <http://purl.org/dc/terms/>
PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>

SELECT ?subject ?type ?identifier WHERE {
  ?subject a ?type .
  OPTIONAL { ?subject dct:identifier ?identifier }
} 
LIMIT 20`;

// Instructions data
export const instructionItems = [
  "🔍 Scroll to zoom in/out",
  "🖱️ Click and drag to pan",
  "🎯 Drag nodes to reposition", 
  "📍 Click 'Reset Zoom' or press R",
  "⌨️ Use +/- keys to zoom",
  "📊 Use SPARQL panel below to query data",
  " Press P to toggle details panel",
  "🔍 Press Q to toggle query panel"
];

// Common prefixes for URI shortening
export const commonPrefixes = {
  'xsd': 'http://www.w3.org/2001/XMLSchema#',
  'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
  'owl': 'http://www.w3.org/2002/07/owl#',
  'dc': 'http://purl.org/dc/elements/1.1/',
  'dct': 'http://purl.org/dc/terms/',
  'foaf': 'http://xmlns.com/foaf/0.1/',
  'skos': 'http://www.w3.org/2004/02/skos/core#'
};
