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
