/**
 * Node selection and details panel functionality
 */
import * as d3 from 'd3';
import type { NodeData, AppState } from './types.js';
import { DataLoader } from './data-loader.js';

export class NodeDetails {
  private dataLoader: DataLoader;

  constructor(dataLoader: DataLoader) {
    this.dataLoader = dataLoader;
  }

  /**
   * Select a node and update the details panel
   */
  selectNode(state: AppState, nodeData: NodeData, element: any): void {
    // Clear previous selection
    if (state.selectedElement) {
      d3.select(state.selectedElement)
        .classed("selected", false)
        .style("stroke", "#333")
        .style("stroke-width", "2px");
    }

    // Set new selection
    state.selectedNode = nodeData;
    state.selectedElement = element;
    
    // Highlight selected node
    d3.select(element)
      .classed("selected", true)
      .style("stroke", "#007bff")
      .style("stroke-width", "4px");

    // Populate details panel
    this.populateNodeDetails(state, nodeData);
  }

  /**
   * Populate the node details panel with information
   */
  private populateNodeDetails(state: AppState, nodeData: NodeData): void {
    const panel = document.getElementById('nodeDetailsContent');
    if (!panel) return;
    
    // Extract node name from URI
    const nodeName = nodeData.id.split('/').pop() || nodeData.id;
    
    // Get relations for this node
    const { inbound, outbound } = this.dataLoader.getNodeLinks(state, nodeData.id);
    const inboundRelations: Array<{predicate: string, source: string, sourceId: string}> = [];
    const outboundRelations: Array<{predicate: string, target: string, targetId: string}> = [];
    
    // Process outbound relations
    outbound.forEach(link => {
      const predicateName = link.label ? link.label.split('/').pop()?.split('#').pop() || 'connected to' : 'connected to';
      const targetId = typeof link.target === 'string' ? link.target : 
                      typeof link.target === 'object' ? (link.target as NodeData).id : String(link.target);
      const targetName = targetId.split('/').pop() || targetId;
      
      outboundRelations.push({
        predicate: predicateName,
        target: targetName,
        targetId: targetId
      });
    });
    
    // Process inbound relations
    inbound.forEach(link => {
      const predicateName = link.label ? link.label.split('/').pop()?.split('#').pop() || 'connected to' : 'connected to';
      const sourceId = typeof link.source === 'string' ? link.source : 
                      typeof link.source === 'object' ? (link.source as NodeData).id : String(link.source);
      const sourceName = sourceId.split('/').pop() || sourceId;
      
      inboundRelations.push({
        predicate: predicateName,
        source: sourceName,
        sourceId: sourceId
      });
    });

    // Generate HTML for the panel
    let html = `
      <h3>${nodeName}</h3>
      <div class="property-item">
        <span class="property-label">Type:</span>
        <span class="property-value">${nodeData.type}</span>
      </div>
      <div class="property-item">
        <span class="property-label">URI:</span>
        <span class="property-value" style="font-size: 11px; word-break: break-all;">${nodeData.id}</span>
      </div>
    `;

    if (outboundRelations.length > 0) {
      html += '<h4>Outbound Relations</h4><div class="property-list">';
      outboundRelations.forEach(rel => {
        html += `
          <div class="relation-item" data-target-id="${rel.targetId}">
            <span class="relation-predicate">${rel.predicate}</span>
            <span class="relation-target">→ ${rel.target}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    if (inboundRelations.length > 0) {
      html += '<h4>Inbound Relations</h4><div class="property-list">';
      inboundRelations.forEach(rel => {
        html += `
          <div class="relation-item" data-target-id="${rel.sourceId}">
            <span class="relation-predicate">${rel.predicate}</span>
            <span class="relation-target">${rel.source} →</span>
          </div>
        `;
      });
      html += '</div>';
    }

    if (outboundRelations.length === 0 && inboundRelations.length === 0) {
      html += '<h4>Relations</h4><div class="no-selection">No relations found</div>';
    }

    panel.innerHTML = html;
    
    // Add event listeners for relation items
    panel.querySelectorAll('.relation-item').forEach(item => {
      item.addEventListener('click', () => {
        const targetId = item.getAttribute('data-target-id');
        if (targetId && window.highlightNode) {
          console.log('Clicking relation to navigate to:', targetId);
          window.highlightNode(targetId);
        }
      });
    });
  }

  /**
   * Clear node selection
   */
  clearSelection(state: AppState): void {
    if (state.selectedElement) {
      d3.select(state.selectedElement)
        .classed("selected", false)
        .style("stroke", "#333")
        .style("stroke-width", "2px");
    }
    
    state.selectedNode = null;
    state.selectedElement = null;
    
    const panel = document.getElementById('nodeDetailsContent');
    if (panel) {
      panel.innerHTML = `
        <div class="no-selection">
          Click on a node to view its details
        </div>
      `;
    }
  }

  /**
   * Get currently selected node
   */
  getSelectedNode(state: AppState): NodeData | null {
    return state.selectedNode;
  }
}
