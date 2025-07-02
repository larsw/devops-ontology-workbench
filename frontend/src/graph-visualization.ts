/**
 * Graph visualization using D3.js
 */
import * as d3 from 'd3';
import type { NodeData, LinkData, AppState, NodeClickHandler } from './types.js';
import { colorScheme, getNodeRadius } from './constants.js';

export class GraphVisualization {
  private onNodeClick?: NodeClickHandler;

  /**
   * Set the node click handler
   */
  setNodeClickHandler(handler: NodeClickHandler): void {
    this.onNodeClick = handler;
  }

  /**
   * Draw the main graph visualization
   */
  drawGraph(state: AppState): void {
    console.log('🎨 Starting drawGraph method...');
    console.log('📊 State nodes count:', state.nodes.size);
    console.log('📊 State links count:', state.links.length);
    
    const svg = d3.select("svg");
    console.log('🔍 SVG element found:', !svg.empty());
    
    const graphContainer = document.querySelector('.graph-container') as HTMLElement;
    console.log('🔍 Graph container found:', !!graphContainer);
    
    if (!graphContainer) {
      console.error('❌ Graph container not found!');
      return;
    }
    
    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight;
    console.log('📏 Container dimensions:', width, 'x', height);

    // Update global state
    state.globalSvg = svg;
    state.globalWidth = width;
    state.globalHeight = height;

    // Clear any existing content
    svg.selectAll("*").remove();

    // Create a container group for all graph elements
    const container = svg.append("g").attr("class", "graph-container");
    state.globalContainer = container;

    // Define zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    state.globalZoom = zoom;

    // Apply zoom behavior to the SVG
    svg.call(zoom as any);

    // Add reset zoom button
    this.addResetButton(svg, zoom);

    // Create simulation
    const simulation = this.createSimulation(state, width, height);

    // Create links
    const link = container.selectAll("line")
      .data(state.links)
      .enter().append("line")
      .attr("class", "link");

    // Create nodes
    console.log('🔵 Creating nodes...');
    const node = this.createNodes(container, state);
    console.log('🔵 Nodes created:', node.size());

    // Add labels
    const labels = this.createLabels(container, state);

    // Set up tick function
    this.setupTick(simulation, link, node, labels);

    // Set up drag behavior
    this.setupDragBehavior(node, simulation);

    // Add click handler for empty space
    this.setupEmptySpaceClick(svg, state);
  }

  /**
   * Add reset zoom button
   */
  private addResetButton(svg: any, zoom: any): void {
    const resetButton = svg.append("g")
      .attr("class", "reset-button")
      .attr("transform", "translate(20, 60)")
      .style("cursor", "pointer");

    resetButton.append("rect")
      .attr("width", 80)
      .attr("height", 25)
      .attr("rx", 3)
      .style("fill", "rgba(255, 255, 255, 0.9)")
      .style("stroke", "#333")
      .style("stroke-width", "1px");

    resetButton.append("text")
      .attr("x", 40)
      .attr("y", 17)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", "#333")
      .text("Reset Zoom");

    resetButton.on("click", () => {
      svg.transition()
        .duration(750)
        .call(zoom.transform as any, d3.zoomIdentity);
    });
  }

  /**
   * Create D3 force simulation
   */
  private createSimulation(state: AppState, width: number, height: number): d3.Simulation<NodeData, undefined> {
    return d3.forceSimulation(Array.from(state.nodes.values()))
      .force("link", d3.forceLink(state.links).id((d: any) => d.id).distance(150).strength(0.2))
      .force("charge", d3.forceManyBody().strength(-200).distanceMax(400))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.1))
      .force("collision", d3.forceCollide().radius(18).strength(0.3))
      .alphaDecay(0.005)
      .velocityDecay(0.6);
  }

  /**
   * Create node elements
   */
  private createNodes(container: any, state: AppState): any {
    console.log('🎯 createNodes called with', Array.from(state.nodes.values()).length, 'nodes');
    
    const nodeData = Array.from(state.nodes.values());
    console.log('🎯 First node data:', nodeData[0]);
    
    const selection = container.selectAll("circle")
      .data(nodeData)
      .enter().append("circle")
      .attr("r", (d: NodeData) => {
        const radius = getNodeRadius(d.type);
        console.log('📏 Node radius for', d.type, ':', radius);
        return radius;
      })
      .attr("class", "node")
      .style("fill", (d: NodeData) => colorScheme[d.type] || colorScheme.default)
      .style("stroke", "#333")
      .style("stroke-width", "2px")
      .style("cursor", "grab")
      .style("user-select", "none")
      .on("click", (event: Event, d: NodeData) => {
        event.stopPropagation();
        if (this.onNodeClick) {
          this.onNodeClick(event, d, event.currentTarget);
        }
      });
      
    selection.append("title")
      .text((d: NodeData) => `${d.id.split('/').pop()} (${d.type})`);
      
    console.log('🎯 Node selection size:', selection.size());
    return selection;
  }

  /**
   * Create node labels
   */
  private createLabels(container: any, state: AppState): any {
    return container.selectAll("text.node-label")
      .data(Array.from(state.nodes.values()))
      .enter().append("text")
      .attr("class", "node-label")
      .text((d: NodeData) => {
        const name = d.id.split('/').pop() || '';
        return name.length > 15 ? name.substring(0, 12) + '...' : name;
      })
      .attr("x", 10)
      .attr("y", 3)
      .style("font-size", "9px")
      .style("fill", "#333")
      .style("pointer-events", "none");
  }

  /**
   * Set up simulation tick function
   */
  private setupTick(simulation: any, link: any, node: any, labels: any): void {
    let animationId: number | null = null;
    
    simulation.on("tick", () => {
      if (animationId) return;
      
      animationId = requestAnimationFrame(() => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node
          .attr("cx", (d: NodeData) => d.x)
          .attr("cy", (d: NodeData) => d.y);

        labels
          .attr("x", (d: NodeData) => (d.x || 0) + 12)
          .attr("y", (d: NodeData) => (d.y || 0) + 4);
          
        animationId = null;
      });
    });
  }

  /**
   * Set up drag behavior for nodes
   */
  private setupDragBehavior(node: any, simulation: any): void {
    const dragstarted = (event: any, d: NodeData) => {
      if (!event.active) simulation.alphaTarget(0.1).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(event.sourceEvent.target)
        .classed("dragging", true)
        .style("stroke", "#ff6b6b")
        .style("stroke-width", "3px");
    };

    const dragged = (event: any, d: NodeData) => {
      d.fx = event.x;
      d.fy = event.y;
    };

    const dragended = (event: any, d: NodeData) => {
      if (!event.active) simulation.alphaTarget(0.02);
      setTimeout(() => {
        d.fx = null;
        d.fy = null;
        simulation.alphaTarget(0);
      }, 300);
      
      d3.select(event.sourceEvent.target)
        .classed("dragging", false)
        .style("stroke", "#333")
        .style("stroke-width", "2px");
    };

    node.call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));
  }

  /**
   * Set up click handler for empty space
   */
  private setupEmptySpaceClick(svg: any, state: AppState): void {
    svg.on("click", (event: Event) => {
      if (event.target === svg.node()) {
        if (state.selectedElement) {
          d3.select(state.selectedElement)
            .classed("selected", false)
            .style("stroke", "#333")
            .style("stroke-width", "2px");
        }
        state.selectedNode = null;
        state.selectedElement = null;
        
        const nodeDetailsContent = document.getElementById('nodeDetailsContent');
        if (nodeDetailsContent) {
          nodeDetailsContent.innerHTML = `
            <div class="no-selection">
              Click on a node to view its details
            </div>
          `;
        }
      }
    });
  }

  /**
   * Highlight and select a node by ID
   */
  highlightNode(state: AppState, nodeId: string): void {
    const nodeData = state.nodes.get(nodeId);
    if (nodeData && state.globalContainer && state.globalSvg && state.globalZoom) {
      const nodeElement = state.globalContainer.selectAll("circle")
        .filter((d: NodeData) => d.id === nodeId)
        .node();
      
      if (nodeElement && this.onNodeClick) {
        this.onNodeClick(new Event('click'), nodeData, nodeElement);
        
        // Animate to center the node
        const transform = d3.zoomTransform(state.globalSvg.node());
        const x = nodeData.x || 0;
        const y = nodeData.y || 0;
        
        state.globalSvg.transition()
          .duration(500)
          .call(state.globalZoom.transform as any, 
            d3.zoomIdentity
              .translate(state.globalWidth / 2 - x * transform.k, state.globalHeight / 2 - y * transform.k)
              .scale(transform.k)
          );
      }
    }
  }
}
