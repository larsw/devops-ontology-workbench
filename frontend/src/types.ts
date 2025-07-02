/**
 * Type definitions for the DevOps Ontology Workbench
 */
import * as d3 from 'd3';

// Global types for Yasgui (loaded via CDN)
declare global {
  interface Window {
    Yasgui: any;
    Yasr: any;
    highlightNode: (nodeId: string) => void;
    togglePanel: (panelId: string) => void;
    toggleLegend: () => void;
    toggleInstructions: () => void;
  }
}

// Node data structure for the graph
export interface NodeData extends d3.SimulationNodeDatum {
  id: string;
  type: string;
  x?: number;
  y?: number;
}

// Link data structure for the graph
export interface LinkData extends d3.SimulationLinkDatum<NodeData> {
  label: string;
  source: NodeData;
  target: NodeData;
}

// Global state type
export interface AppState {
  nodes: Map<string, NodeData>;
  links: LinkData[];
  typeMap: Map<string, string>;
  yasgui: any;
  globalSvg: any;
  globalContainer: any;
  globalZoom: any;
  globalWidth: number;
  globalHeight: number;
  selectedNode: NodeData | null;
  selectedElement: any;
  currentLayout: GraphLayoutType;
  physicsConfig: PhysicsConfig;
  graphFilter: GraphFilter;
}

// Event handler function types
export type NodeClickHandler = (event: Event, nodeData: NodeData, element: any) => void;
export type KeyboardHandler = (event: KeyboardEvent) => void;
export type ResizeHandler = (event: MouseEvent) => void;

// SPARQL result types
export interface SparqlResults {
  head: {
    vars: string[];
  };
  results: {
    bindings: Array<{
      [key: string]: {
        type: string;
        value: string;
      };
    }>;
  };
}

// Configuration types
export interface GraphConfig {
  width: number;
  height: number;
  nodeRadius: number;
  linkDistance: number;
  chargeStrength: number;
}

export interface ColorScheme {
  [key: string]: string;
}

// Graph layout types
export type GraphLayoutType = 
  | 'force-directed'
  | 'manual'
  | 'circular' 
  | 'hierarchical' 
  | 'grid' 
  | 'radial'
  | 'tree';

export interface LayoutConfig {
  type: GraphLayoutType;
  name: string;
  description: string;
}

// Physics configuration for force-directed layouts
export interface PhysicsConfig {
  linkDistance: number;
  linkStrength: number;
  chargeStrength: number;
  centerStrength: number;
  collisionRadius: number;
  collisionStrength: number;
  alphaDecay: number;
  velocityDecay: number;
}

export interface PhysicsControl {
  key: keyof PhysicsConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

// Graph filtering and restoration
export interface GraphFilter {
  isFiltered: boolean;
  originalNodes: Map<string, NodeData>;
  originalLinks: LinkData[];
  filterSource: 'construct' | 'custom';
  filterDescription?: string;
}
