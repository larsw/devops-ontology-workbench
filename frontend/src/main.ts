/**
 * Main application entry point
 * DevOps Ontology Workbench
 */
import type { AppState } from './types.js';
import { LazyLoader } from './lazy-loader.js';
import { defaultPhysicsConfig } from './constants.js';
// Core components loaded immediately
import { DataLoader } from './data-loader.js';
import { GraphVisualization } from './graph-visualization.js';
import { UIComponents } from './ui-components.js';
import { NodeDetails } from './node-details.js';
import { EventHandlers } from './event-handlers.js';
import { ResizeHandlers } from './resize-handlers.js';

/**
 * Main Application Class
 */
export class DevOpsOntologyWorkbench {
  private state: AppState;
  private dataLoader: DataLoader;
  private graphViz: GraphVisualization;
  private uiComponents: UIComponents;
  private nodeDetails: NodeDetails;
  private sparqlInterface: any; // Loaded dynamically
  private eventHandlers: EventHandlers;
  private resizeHandlers: ResizeHandlers;

  constructor() {
    // Initialize state
    this.state = {
      nodes: new Map(),
      links: [],
      typeMap: new Map(),
      yasgui: null,
      globalSvg: null,
      globalContainer: null,
      globalZoom: null,
      globalWidth: 0,
      globalHeight: 0,
      selectedNode: null,
      selectedElement: null,
      currentLayout: 'force-directed',
      physicsConfig: { ...defaultPhysicsConfig },
      graphFilter: {
        isFiltered: false,
        originalNodes: new Map(),
        originalLinks: [],
        filterSource: 'custom'
      }
    };

    // Initialize components
    this.dataLoader = new DataLoader();
    this.graphViz = new GraphVisualization();
    this.uiComponents = new UIComponents();
    this.nodeDetails = new NodeDetails(this.dataLoader);
    this.sparqlInterface = null; // Will be loaded dynamically
    this.eventHandlers = new EventHandlers(this.uiComponents);
    this.resizeHandlers = new ResizeHandlers();

    // Set up component interactions
    this.setupComponentInteractions();
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    const debugDiv = document.getElementById('debug-info');
    try {
      console.log('🚀 Initializing DevOps Ontology Workbench...');
      if (debugDiv) debugDiv.innerHTML += '<br>🚀 Starting init...';

      // Start preloading non-critical modules in background
      LazyLoader.preloadNonCritical();

      // Load data
      console.log('🔄 Starting data load...');
      if (debugDiv) debugDiv.innerHTML += '<br>📊 Loading data...';
      await this.dataLoader.loadTTLData(this.state);
      console.log(`📊 Loaded ${this.state.nodes.size} nodes and ${this.state.links.length} links`);
      if (debugDiv) debugDiv.innerHTML += `<br>📊 ${this.state.nodes.size} nodes, ${this.state.links.length} links`;
      
      // Debug: Log first few nodes
      const nodeArray = Array.from(this.state.nodes.values());
      console.log('🔍 First 5 nodes:', nodeArray.slice(0, 5));

      // Draw graph
      console.log('🎨 Starting graph rendering...');
      if (debugDiv) debugDiv.innerHTML += '<br>🎨 Rendering graph...';
      this.graphViz.drawGraph(this.state);
      console.log('🎨 Graph visualization rendered');
      if (debugDiv) debugDiv.innerHTML += '<br>🎨 Graph rendered';
      
      // Debug: Check if SVG has content
      const svg = document.querySelector('svg');
      const circles = svg?.querySelectorAll('circle');
      console.log(`🔍 SVG circles found: ${circles?.length || 0}`);
      if (debugDiv) debugDiv.innerHTML += `<br>🔍 ${circles?.length || 0} circles`;

      // Add UI components
      if (this.state.globalSvg) {
        this.uiComponents.createLegend(this.state.globalSvg);
        this.uiComponents.addInstructions(this.state.globalSvg);
        this.uiComponents.createLayoutSelector(this.state.globalSvg, this.state.currentLayout, this.state.physicsConfig);
        console.log('🎛️ UI components added');
        if (debugDiv) debugDiv.innerHTML += '<br>🎛️ UI added';
      }

      // Initialize SPARQL interface dynamically
      console.log('🔍 Loading SPARQL interface...');
      if (debugDiv) debugDiv.innerHTML += '<br>🔍 Loading SPARQL...';
      
      const sparqlModule = await LazyLoader.loadSparqlInterface();
      this.sparqlInterface = new sparqlModule.SparqlInterface();
      this.sparqlInterface.initializeSPARQL(this.state);
      
      // Set up SPARQL handlers after initialization
      this.setupSparqlHandlers();
      
      console.log('🔍 SPARQL interface initialized');
      if (debugDiv) debugDiv.innerHTML += '<br>🔍 SPARQL ready';

      // Set up event handlers
      this.eventHandlers.setupKeyboardShortcuts(this.state);
      this.eventHandlers.setupWindowResize(() => this.handleWindowResize());
      console.log('⌨️ Event handlers set up');

      // Initialize resize functionality
      this.resizeHandlers.initializeResize();
      console.log('📏 Resize handlers initialized');

      // Set up global functions
      this.setupGlobalFunctions();
      console.log('🌐 Global functions exposed');

      console.log('✅ DevOps Ontology Workbench initialized successfully!');

    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      if (debugDiv) debugDiv.innerHTML += `<br>❌ Error: ${error}`;
      this.showError('Failed to load data. Please check the console for details.');
    }
  }

  /**
   * Set up interactions between components
   */
  private setupComponentInteractions(): void {
    // Set up node click handler
    this.graphViz.setNodeClickHandler((event, nodeData, element) => {
      this.nodeDetails.selectNode(this.state, nodeData, element);
    });

    // Set up layout change handler
    this.uiComponents.setLayoutChangeHandler((newLayout) => {
      this.graphViz.changeLayout(this.state, newLayout);
      this.uiComponents.updateLayoutSelector(this.state.globalSvg, newLayout, this.state.physicsConfig);
    });

    // Set up physics change handler
    this.uiComponents.setPhysicsChangeHandler((newConfig) => {
      this.state.physicsConfig = newConfig;
      // Re-apply the current layout with new physics
      this.graphViz.changeLayout(this.state, this.state.currentLayout);
    });

    // Note: SPARQL handlers will be set up after SPARQL interface is initialized
  }

  /**
   * Handle window resize
   */
  private handleWindowResize(): void {
    if (this.state.globalSvg) {
      // Redraw graph with new dimensions
      this.graphViz.drawGraph(this.state);
      
      // Re-add UI components
      this.uiComponents.createLegend(this.state.globalSvg);
      this.uiComponents.addInstructions(this.state.globalSvg);
      this.uiComponents.createLayoutSelector(this.state.globalSvg, this.state.currentLayout, this.state.physicsConfig);
    }
  }

  /**
   * Set up global functions for external access
   */
  private setupGlobalFunctions(): void {
    // Expose functions to window for external access
    window.highlightNode = (nodeId: string) => {
      this.graphViz.highlightNode(this.state, nodeId);
    };

    window.togglePanel = (panelId: string) => {
      this.uiComponents.togglePanel(panelId);
    };

    window.toggleLegend = () => {
      this.uiComponents.toggleLegend();
    };

    window.toggleInstructions = () => {
      this.uiComponents.toggleInstructions();
    };
  }

  /**
   * Show error message to user
   */
  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #f8d7da;
      color: #721c24;
      padding: 12px 20px;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  /**
   * Get current application state (for debugging)
   */
  getState(): AppState {
    return this.state;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.eventHandlers.cleanup();
    this.resizeHandlers.cleanup();
  }

  /**
   * Handle CONSTRUCT query results by updating the graph
   */
  private async handleConstructResults(constructData: string): Promise<void> {
    try {
      console.log('🎯 Handling CONSTRUCT query results...');
      
      // Parse the CONSTRUCT results and update the graph
      await this.dataLoader.parseConstructResults(this.state, constructData);
      
      // Redraw the graph with the new data
      if (this.state.globalSvg) {
        this.graphViz.drawGraph(this.state);
        
        // Re-add UI components
        this.uiComponents.createLegend(this.state.globalSvg);
        this.uiComponents.addInstructions(this.state.globalSvg);
        this.uiComponents.createLayoutSelector(this.state.globalSvg, this.state.currentLayout, this.state.physicsConfig);
      }
      
      console.log('✅ Graph updated with CONSTRUCT results');
    } catch (error) {
      console.error('❌ Error handling CONSTRUCT results:', error);
      this.showError('Failed to visualize CONSTRUCT results. Please check the console for details.');
    }
  }

  /**
   * Handle restoring the original graph
   */
  private handleRestoreGraph(): void {
    try {
      console.log('🔄 Restoring original graph...');
      
      // Restore the original graph data
      this.dataLoader.restoreOriginalGraph(this.state);
      
      // Redraw the graph with the restored data
      if (this.state.globalSvg) {
        this.graphViz.drawGraph(this.state);
        
        // Re-add UI components
        this.uiComponents.createLegend(this.state.globalSvg);
        this.uiComponents.addInstructions(this.state.globalSvg);
        this.uiComponents.createLayoutSelector(this.state.globalSvg, this.state.currentLayout, this.state.physicsConfig);
      }
      
      console.log('✅ Original graph restored');
    } catch (error) {
      console.error('❌ Error restoring graph:', error);
      this.showError('Failed to restore original graph. Please check the console for details.');
    }
  }

  /**
   * Set up SPARQL interface handlers after initialization
   */
  private setupSparqlHandlers(): void {
    if (!this.sparqlInterface) {
      console.error('Cannot setup SPARQL handlers: SPARQL interface not initialized');
      return;
    }

    // Set up CONSTRUCT query handler
    this.sparqlInterface.setConstructHandlers(
      (constructData: string) => {
        this.handleConstructResults(constructData);
      },
      () => {
        this.handleRestoreGraph();
      }
    );

    console.log('🔗 SPARQL handlers set up');
  }
}

/**
 * Initialize the application when DOM is ready
 */
function initializeApp(): void {
  console.log('🚀 Starting app initialization...');
  
  // Add debug info to page
  const debugDiv = document.createElement('div');
  debugDiv.id = 'debug-info';
  debugDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    z-index: 9999;
    max-width: 300px;
    border-radius: 4px;
  `;
  debugDiv.innerHTML = 'Initializing...';
  document.body.appendChild(debugDiv);
  
  const app = new DevOpsOntologyWorkbench();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      debugDiv.innerHTML += '<br>DOM loaded, starting init...';
      app.initialize().then(() => {
        debugDiv.innerHTML += '<br>✅ Init complete!';
        // Fade out after 3 seconds
        setTimeout(() => {
          debugDiv.style.transition = 'opacity 1s ease-out';
          debugDiv.style.opacity = '0';
          setTimeout(() => debugDiv.remove(), 1000);
        }, 3000);
      }).catch(error => {
        debugDiv.innerHTML += `<br>❌ Error: ${error.message}`;
      });
    });
  } else {
    debugDiv.innerHTML += '<br>DOM ready, starting init...';
    app.initialize().then(() => {
      debugDiv.innerHTML += '<br>✅ Init complete!';
      // Fade out after 3 seconds
      setTimeout(() => {
        debugDiv.style.transition = 'opacity 1s ease-out';
        debugDiv.style.opacity = '0';
        setTimeout(() => debugDiv.remove(), 1000);
      }, 3000);
    }).catch(error => {
      debugDiv.innerHTML += `<br>❌ Error: ${error.message}`;
    });
  }

  // Expose app instance globally for debugging
  (window as any).devOpsApp = app;
  (window as any).debugDiv = debugDiv;
}

// Start the application
initializeApp();
