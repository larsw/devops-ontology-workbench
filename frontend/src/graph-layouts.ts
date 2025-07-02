/**
 * Graph layout implementations for different visualization types
 */
import * as d3 from 'd3';
import type { NodeData, LinkData, GraphLayoutType, PhysicsConfig } from './types.js';

export class GraphLayouts {
  
  /**
   * Create a force simulation based on layout type
   */
  static createLayoutSimulation(
    layoutType: GraphLayoutType,
    nodes: NodeData[],
    links: LinkData[],
    width: number,
    height: number,
    physicsConfig: PhysicsConfig
  ): d3.Simulation<NodeData, undefined> {
    
    switch (layoutType) {
      case 'force-directed':
        return this.createForceDirectedLayout(nodes, links, width, height, physicsConfig);
      
      case 'manual':
        return this.createManualLayout(nodes, links, width, height, physicsConfig);
      
      case 'circular':
        return this.createCircularLayout(nodes, links, width, height, physicsConfig);
      
      case 'hierarchical':
        return this.createHierarchicalLayout(nodes, links, width, height, physicsConfig);
      
      case 'grid':
        return this.createGridLayout(nodes, links, width, height, physicsConfig);
      
      case 'radial':
        return this.createRadialLayout(nodes, links, width, height, physicsConfig);
      
      case 'tree':
        return this.createTreeLayout(nodes, links, width, height, physicsConfig);
      
      default:
        return this.createForceDirectedLayout(nodes, links, width, height, physicsConfig);
    }
  }

  /**
   * Force-directed layout (default)
   */
  private static createForceDirectedLayout(
    nodes: NodeData[],
    links: LinkData[],
    width: number,
    height: number,
    physicsConfig: PhysicsConfig
  ): d3.Simulation<NodeData, undefined> {
    return d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id)
        .distance(physicsConfig.linkDistance)
        .strength(physicsConfig.linkStrength))
      .force("charge", d3.forceManyBody()
        .strength(physicsConfig.chargeStrength)
        .distanceMax(400))
      .force("center", d3.forceCenter(width / 2, height / 2)
        .strength(physicsConfig.centerStrength))
      .force("collision", d3.forceCollide()
        .radius(physicsConfig.collisionRadius)
        .strength(physicsConfig.collisionStrength))
      .alphaDecay(physicsConfig.alphaDecay)
      .velocityDecay(physicsConfig.velocityDecay);
  }

  /**
   * Manual layout - initial force-directed positioning, then allow manual drag
   */
  private static createManualLayout(
    nodes: NodeData[],
    links: LinkData[],
    width: number,
    height: number,
    physicsConfig: PhysicsConfig
  ): d3.Simulation<NodeData, undefined> {
    // Run a short force-directed simulation to get initial positions
    const initialSimulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id)
        .distance(physicsConfig.linkDistance)
        .strength(physicsConfig.linkStrength))
      .force("charge", d3.forceManyBody()
        .strength(physicsConfig.chargeStrength)
        .distanceMax(400))
      .force("center", d3.forceCenter(width / 2, height / 2)
        .strength(physicsConfig.centerStrength))
      .force("collision", d3.forceCollide()
        .radius(physicsConfig.collisionRadius)
        .strength(physicsConfig.collisionStrength))
      .alphaDecay(0.02) // Faster decay for initial positioning
      .velocityDecay(physicsConfig.velocityDecay);

    // Let it run for a short time to establish positions
    for (let i = 0; i < 100; ++i) initialSimulation.tick();
    
    // Stop the initial simulation
    initialSimulation.stop();
    
    // Create a minimal simulation that only handles links but allows manual positioning
    return d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id)
        .distance(physicsConfig.linkDistance)
        .strength(0.1)) // Very weak link force to maintain some connection
      .force("collision", d3.forceCollide()
        .radius(physicsConfig.collisionRadius)
        .strength(0.2)) // Light collision to prevent overlap
      .alphaDecay(0.001) // Very slow decay to keep simulation responsive
      .velocityDecay(0.9); // High decay for stability during manual moves
  }

  /**
   * Circular layout - arranges nodes in a circle
   */
  private static createCircularLayout(
    nodes: NodeData[],
    links: LinkData[],
    width: number,
    height: number,
    physicsConfig: PhysicsConfig
  ): d3.Simulation<NodeData, undefined> {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    // Position nodes in a circle
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });

    return d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100).strength(0.1))
      .force("collision", d3.forceCollide().radius(physicsConfig.collisionRadius).strength(0.5))
      .alphaDecay(0.02)
      .velocityDecay(0.8);
  }

  /**
   * Hierarchical layout - arranges nodes in layers
   */
  private static createHierarchicalLayout(
    nodes: NodeData[],
    links: LinkData[],
    width: number,
    height: number,
    physicsConfig: PhysicsConfig
  ): d3.Simulation<NodeData, undefined> {
    // Group nodes by type for hierarchy
    const typeGroups = new Map<string, NodeData[]>();
    nodes.forEach(node => {
      if (!typeGroups.has(node.type)) {
        typeGroups.set(node.type, []);
      }
      typeGroups.get(node.type)!.push(node);
    });

    const types = Array.from(typeGroups.keys());
    const layerHeight = height / (types.length + 1);
    
    // Position nodes by type in horizontal layers
    types.forEach((type, typeIndex) => {
      const nodesInType = typeGroups.get(type)!;
      const layerY = (typeIndex + 1) * layerHeight;
      const nodeSpacing = width / (nodesInType.length + 1);
      
      nodesInType.forEach((node, nodeIndex) => {
        node.x = (nodeIndex + 1) * nodeSpacing;
        node.y = layerY;
      });
    });

    return d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80).strength(0.3))
      .force("collision", d3.forceCollide().radius(20).strength(0.7))
      .force("y", d3.forceY((d: NodeData) => d.y!).strength(0.3))
      .alphaDecay(0.02)
      .velocityDecay(0.7);
  }

  /**
   * Grid layout - arranges nodes in a regular grid
   */
  private static createGridLayout(
    nodes: NodeData[],
    links: LinkData[],
    width: number,
    height: number,
    physicsConfig: PhysicsConfig
  ): d3.Simulation<NodeData, undefined> {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    nodes.forEach((node, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      node.x = (col + 0.5) * cellWidth;
      node.y = (row + 0.5) * cellHeight;
    });

    return d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100).strength(0.1))
      .force("collision", d3.forceCollide().radius(15).strength(0.5))
      .force("x", d3.forceX((d: NodeData) => d.x!).strength(0.2))
      .force("y", d3.forceY((d: NodeData) => d.y!).strength(0.2))
      .alphaDecay(0.02)
      .velocityDecay(0.8);
  }

  /**
   * Radial layout - arranges nodes in concentric circles by type
   */
  private static createRadialLayout(
    nodes: NodeData[],
    links: LinkData[],
    width: number,
    height: number,
    physicsConfig: PhysicsConfig
  ): d3.Simulation<NodeData, undefined> {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;
    
    // Group nodes by type
    const typeGroups = new Map<string, NodeData[]>();
    nodes.forEach(node => {
      if (!typeGroups.has(node.type)) {
        typeGroups.set(node.type, []);
      }
      typeGroups.get(node.type)!.push(node);
    });

    const types = Array.from(typeGroups.keys());
    
    // Position nodes in concentric circles by type
    types.forEach((type, typeIndex) => {
      const nodesInType = typeGroups.get(type)!;
      const radius = (typeIndex + 1) * (maxRadius / types.length);
      
      nodesInType.forEach((node, nodeIndex) => {
        const angle = (nodeIndex / nodesInType.length) * 2 * Math.PI;
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
      });
    });

    return d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80).strength(0.2))
      .force("collision", d3.forceCollide().radius(18).strength(0.5))
      .alphaDecay(0.02)
      .velocityDecay(0.8);
  }

  /**
   * Tree layout - arranges nodes in a tree structure
   */
  private static createTreeLayout(
    nodes: NodeData[],
    links: LinkData[],
    width: number,
    height: number,
    physicsConfig: PhysicsConfig
  ): d3.Simulation<NodeData, undefined> {
    // Create a hierarchical structure from the nodes and links
    const hierarchyData = this.createHierarchyFromLinks(nodes, links);
    
    // Use D3's tree layout
    const treeLayout = d3.tree<any>()
      .size([width - 100, height - 100]);
    
    const root = d3.hierarchy(hierarchyData);
    treeLayout(root);
    
    // Apply tree positions to nodes
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    
    function applyPositions(treeNode: any) {
      const graphNode = nodeMap.get(treeNode.data.id);
      if (graphNode) {
        graphNode.x = treeNode.x + 50;
        graphNode.y = treeNode.y + 50;
      }
      if (treeNode.children) {
        treeNode.children.forEach(applyPositions);
      }
    }
    
    applyPositions(root);

    return d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(60).strength(0.3))
      .force("collision", d3.forceCollide().radius(15).strength(0.5))
      .force("x", d3.forceX((d: NodeData) => d.x!).strength(0.3))
      .force("y", d3.forceY((d: NodeData) => d.y!).strength(0.3))
      .alphaDecay(0.02)
      .velocityDecay(0.7);
  }

  /**
   * Create a hierarchy structure from nodes and links for tree layout
   */
  private static createHierarchyFromLinks(nodes: NodeData[], links: LinkData[]): any {
    const nodeMap = new Map(nodes.map(node => [node.id, { ...node, children: [] as any[] }]));
    const rootCandidates = new Set(nodes.map(node => node.id));
    
    // Build parent-child relationships
    links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      const sourceNode = nodeMap.get(sourceId);
      const targetNode = nodeMap.get(targetId);
      
      if (sourceNode && targetNode) {
        sourceNode.children.push(targetNode);
        rootCandidates.delete(targetId);
      }
    });
    
    // Find the best root (node with most connections or first remaining candidate)
    const rootId = rootCandidates.size > 0 ? 
      Array.from(rootCandidates)[0] : 
      nodes[0]?.id;
    
    return nodeMap.get(rootId) || { id: 'root', children: Array.from(nodeMap.values()) };
  }
}
