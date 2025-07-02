/**
 * Data loading and parsing functionality
 */
import { Parser } from 'n3';
import type { NodeData, LinkData, AppState } from './types.js';

export class DataLoader {
  private parser: Parser;
  
  constructor() {
    this.parser = new Parser();
  }

  /**
   * Load and parse TTL data from the sample file
   */
  async loadTTLData(state: AppState): Promise<void> {
    try {
      console.log('🔄 Fetching sample.ttl...');
      const response = await fetch('sample.ttl');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sample.ttl: ${response.status} ${response.statusText}`);
      }
      
      const turtle = await response.text();
      console.log(`📄 TTL content length: ${turtle.length} characters`);
      
      return new Promise((resolve, reject) => {
        let quadCount = 0;
        this.parser.parse(turtle, (error, quad) => {
          if (error) {
            console.error('❌ Parser error:', error);
            reject(error);
            return;
          }

          if (quad) {
            quadCount++;
            const s = quad.subject.id;
            const p = quad.predicate.id;
            const o = quad.object.id || quad.object.value;

            // Extract type information when we encounter rdf:type predicates
            if (p === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
              const conceptType = o.split('/').pop()?.split('#').pop() || 'default';
              state.typeMap.set(s, conceptType);
            }

            // Create node if it doesn't exist
            if (!state.nodes.has(s)) {
              state.nodes.set(s, { 
                id: s, 
                type: state.typeMap.get(s) || 'default' 
              });
            }

            // Create target node and link if object is a URI
            if (o.startsWith('http') || o.startsWith('https')) {
              if (!state.nodes.has(o)) {
                state.nodes.set(o, { 
                  id: o, 
                  type: state.typeMap.get(o) || 'default' 
                });
              }
              
              // Create link
              const sourceNode = state.nodes.get(s)!;
              const targetNode = state.nodes.get(o)!;
              
              state.links.push({ 
                source: sourceNode, 
                target: targetNode, 
                label: p 
              });
            }
          } else {
            // Parsing complete - update node types
            console.log(`✅ Parsing complete. Processed ${quadCount} quads`);
            for (const [nodeId, nodeData] of state.nodes) {
              nodeData.type = state.typeMap.get(nodeId) || 'default';
            }
            console.log(`📊 Final counts: ${state.nodes.size} nodes, ${state.links.length} links`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Error loading TTL data:', error);
      throw error;
    }
  }

  /**
   * Parse CONSTRUCT query results and update the graph
   */
  async parseConstructResults(state: AppState, constructData: string): Promise<void> {
    try {
      console.log('🔄 Parsing CONSTRUCT query results...');
      
      // Store original graph data if not already filtered
      if (!state.graphFilter.isFiltered) {
        state.graphFilter.originalNodes = new Map(state.nodes);
        state.graphFilter.originalLinks = [...state.links];
      }
      
      // Clear current graph data
      state.nodes.clear();
      state.links = [];
      
      return new Promise((resolve, reject) => {
        let quadCount = 0;
        this.parser.parse(constructData, (error, quad) => {
          if (error) {
            console.error('❌ CONSTRUCT parser error:', error);
            reject(error);
            return;
          }

          if (quad) {
            quadCount++;
            const s = quad.subject.id;
            const p = quad.predicate.id;
            const o = quad.object.id || quad.object.value;

            // Extract type information when we encounter rdf:type predicates
            if (p === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
              const conceptType = o.split('/').pop()?.split('#').pop() || 'default';
              state.typeMap.set(s, conceptType);
            }

            // Create node if it doesn't exist
            if (!state.nodes.has(s)) {
              state.nodes.set(s, { 
                id: s, 
                type: state.typeMap.get(s) || 'default' 
              });
            }

            // Create target node and link if object is a URI
            if (o.startsWith('http') || o.startsWith('https')) {
              if (!state.nodes.has(o)) {
                state.nodes.set(o, { 
                  id: o, 
                  type: state.typeMap.get(o) || 'default' 
                });
              }
              
              // Create link
              const sourceNode = state.nodes.get(s)!;
              const targetNode = state.nodes.get(o)!;
              
              state.links.push({ 
                source: sourceNode, 
                target: targetNode, 
                label: p 
              });
            }
          } else {
            // Parsing complete - update node types and set filter state
            console.log(`✅ CONSTRUCT parsing complete. Processed ${quadCount} quads`);
            for (const [nodeId, nodeData] of state.nodes) {
              nodeData.type = state.typeMap.get(nodeId) || 'default';
            }
            
            // Mark as filtered
            state.graphFilter.isFiltered = true;
            state.graphFilter.filterSource = 'construct';
            state.graphFilter.filterDescription = 'CONSTRUCT query results';
            
            console.log(`📊 CONSTRUCT result counts: ${state.nodes.size} nodes, ${state.links.length} links`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Error parsing CONSTRUCT results:', error);
      throw error;
    }
  }

  /**
   * Restore the original full graph
   */
  restoreOriginalGraph(state: AppState): void {
    if (!state.graphFilter.isFiltered) {
      console.log('Graph is not filtered, nothing to restore');
      return;
    }
    
    console.log('🔄 Restoring original graph...');
    
    // Restore original data
    state.nodes = new Map(state.graphFilter.originalNodes);
    state.links = [...state.graphFilter.originalLinks];
    
    // Reset filter state
    state.graphFilter.isFiltered = false;
    state.graphFilter.originalNodes.clear();
    state.graphFilter.originalLinks = [];
    state.graphFilter.filterDescription = undefined;
    
    console.log(`📊 Restored graph: ${state.nodes.size} nodes, ${state.links.length} links`);
  }

  /**
   * Get a node by ID
   */
  getNode(state: AppState, nodeId: string): NodeData | undefined {
    return state.nodes.get(nodeId);
  }

  /**
   * Get all nodes as an array
   */
  getNodesArray(state: AppState): NodeData[] {
    return Array.from(state.nodes.values());
  }

  /**
   * Get links for a specific node
   */
  getNodeLinks(state: AppState, nodeId: string): { inbound: LinkData[], outbound: LinkData[] } {
    const inbound: LinkData[] = [];
    const outbound: LinkData[] = [];
    
    state.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : 
                      typeof link.source === 'object' ? (link.source as NodeData).id : String(link.source);
      const targetId = typeof link.target === 'string' ? link.target : 
                      typeof link.target === 'object' ? (link.target as NodeData).id : String(link.target);
      
      if (sourceId === nodeId) {
        outbound.push(link);
      } else if (targetId === nodeId) {
        inbound.push(link);
      }
    });
    
    return { inbound, outbound };
  }

  /**
   * Clear all data
   */
  clearData(state: AppState): void {
    state.nodes.clear();
    state.links.length = 0;
    state.typeMap.clear();
  }
}
