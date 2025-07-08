/**
 * SPARQL interface and Yasgui integration
 */
import Yasgui from '@zazuko/yasgui';
import '@zazuko/yasgui/build/yasgui.min.css';

// --- GLOBAL SINGLETON YASR/YASGUI REGISTRATION ---
// Always use the same Yasgui/Yasr instance everywhere
if (typeof window !== 'undefined') {
  (window as any).Yasgui = Yasgui;
  (window as any).Yasr = (Yasgui as any).Yasr;
}
import type { AppState } from './types.js';
import { sampleQueries, defaultQuery } from './constants.js';

export class SparqlInterface {
  private constructHandler?: (constructData: string) => void;
  private restoreHandler?: () => void;

  /**
   * Set handlers for CONSTRUCT query visualization
   */
  setConstructHandlers(constructHandler: (data: string) => void, restoreHandler: () => void): void {
    this.constructHandler = constructHandler;
    this.restoreHandler = restoreHandler;
  }

  /**
   * Initialize SPARQL interface with Yasgui
   */
  initializeSPARQL(state: AppState): void {
    // Check if Yasgui is already initialized
    if (state.yasgui && document.querySelector('#yasgui .yasgui')) {
      console.log("Yasgui already initialized, skipping...");
      return;
    }

    // Clear any existing Yasgui content
    const yasguiContainer = document.getElementById("yasgui");
    if (yasguiContainer) {
      yasguiContainer.innerHTML = '';
    }


    // Always use the global Yasr instance for plugin registration
    const Yasr = (window as any).Yasr;
    // Check if Yasr is available
    console.log('🔍 Yasr availability check (global):', typeof Yasr, Yasr);

    // Register plugins BEFORE initializing Yasgui
    this.registerConstructVisualizationPlugin(Yasr);
    this.registerJsonLdPlugin(Yasr);
    this.registerTurtlePlugin(Yasr);
    this.registerTrigPlugin(Yasr);

    // Initialize Yasgui with proper endpoint and custom configuration
    console.log('🔍 Creating Yasgui instance...');
    state.yasgui = new Yasgui(document.getElementById("yasgui"), {
      requestConfig: {
        endpoint: "http://localhost:8000/sparql",
        method: "POST",
        headers: {
          'Accept': 'application/sparql-results+json',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      },
      copyEndpointOnNewTab: false
    });

    console.log('🔍 Yasgui instance created:', state.yasgui);

    // Set default query
    state.yasgui.getTab().yasqe.setValue(defaultQuery);

    // Set up result handling after query execution
    this.setupResultHandling(state);

    // Add custom tab buttons for sample queries (no automatic tabs)
    setTimeout(() => {
      this.addCustomTabButtons(state);
    }, 500);

    // Make debugging info available globally

    (window as any).yasguiDebug = {
      yasgui: state.yasgui,
      yasr: state.yasgui?.getTab()?.yasr,
      availablePlugins: Yasr && Yasr.plugins ? Object.keys(Yasr.plugins) : 'No plugins object',
      YasrGlobal: Yasr,
      YasguiGlobal: (window as any).Yasgui
    };

    console.log('🔍 Yasgui initialization complete, debug info available at window.yasguiDebug');
  }

  /**
   * Set up result handling for SPARQL queries
   */
  private setupResultHandling(state: AppState): void {
    if (!state.yasgui) return;

    console.log('🔍 Setting up result handling with custom plugin auto-selection');
    
    // Set up event listener for query responses to auto-select custom plugin
    state.yasgui.on('queryResponse', (instance: any, response: any, tabId: string) => {
      console.log('🔍 Query response received:', { response, tabId });
      
      // Get the current tab
      const tab = state.yasgui.getTab(tabId);
      if (!tab || !tab.yasr) {
        console.log('🔍 No tab or yasr found for auto-selection');
        return;
      }
      
      // Check if this is a CONSTRUCT query result
      if (response && response.results && response.results.type === 'construct') {
        console.log('🔍 CONSTRUCT result detected, attempting to auto-select custom plugin');
        
        // Give the plugins a moment to register and detect the results
        setTimeout(() => {
          try {
            // Try to select the custom plugin
            if (tab.yasr.selectPlugin) {
              tab.yasr.selectPlugin('ConstructVisualization');
              console.log('🔍 Auto-selected ConstructVisualization plugin');
            }
          } catch (error) {
            console.error('🔍 Error auto-selecting custom plugin:', error);
          }
        }, 100);
      }
    });
  }

  /**
   * Register a proper CONSTRUCT visualization plugin for Yasr
   */
  private registerConstructVisualizationPlugin(Yasr: any): void {
    console.log('🔍 Starting registerConstructVisualizationPlugin...');
    if (!Yasr) {
      console.error('🔍 Yasr not available!');
      return;
    }
    console.log('🔍 Yasr is available, registering plugin...');
    const self = this;
    // --- DEBUG: Remove any old-style plugin registration ---
    if (Yasr.plugins && typeof Yasr.plugins['ConstructVisualization'] !== 'undefined') {
      console.warn('⚠️ Removing old ConstructVisualization plugin registration (not a class):', Yasr.plugins['ConstructVisualization']);
      delete Yasr.plugins['ConstructVisualization'];
    }
    // --- END DEBUG ---
    class ConstructVisualizationPlugin {
      yasr: any;
      container: HTMLElement;
      config: any;
      static defaults = {
        title: "CONSTRUCT Results Visualizer"
      };
      constructor(yasr: any) {
        console.log('🔍 ConstructVisualizationPlugin constructor called');
        this.yasr = yasr;
        this.config = ConstructVisualizationPlugin.defaults;
        this.container = document.createElement('div');
        this.container.className = 'construct-plugin-container';
        this.container.innerHTML = `<pre class="custom-results"></pre>`;
      }
      draw(): void {
        console.log('🔍 ConstructVisualizationPlugin.draw called');
        try {
          let turtleData = null;
          if (this.yasr.results && this.yasr.results.turtle) {
            turtleData = this.yasr.results.turtle;
          }
          console.log('🔍 Creating graph visualization UI, turtle data length:', turtleData ? turtleData.length : 0);
          const mainDiv = document.createElement('div');
          const pluginContainer = document.createElement('div');
          pluginContainer.style.cssText = `
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          `;
          pluginContainer.innerHTML = `
            <h2 style="margin: 0 0 10px 0;">🎯 CONSTRUCT Query Results</h2>
            <p style="margin: 0 0 20px 0;">Found ${turtleData ? turtleData.split('\\n').length : 0} lines of turtle data</p>
          `;
          const buttonContainer = document.createElement('div');
          buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center; align-items: center;';
          const visualizeButton = document.createElement('button');
          visualizeButton.textContent = 'Visualize in Graph';
          visualizeButton.style.cssText = `
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.2s ease;
          `;
          visualizeButton.onmouseover = () => {
            visualizeButton.style.background = 'rgba(255,255,255,0.3)';
          };
          visualizeButton.onmouseout = () => {
            visualizeButton.style.background = 'rgba(255,255,255,0.2)';
          };
          visualizeButton.onclick = () => {
            if (turtleData && self.constructHandler) {
              console.log('🔍 Visualizing CONSTRUCT results in main graph...');
              self.constructHandler(turtleData);
              self.showButtonFeedback(visualizeButton, '✅ Visualized!', '#4CAF50');
            } else {
              console.error('🔍 No turtle data or handler available');
              self.showButtonFeedback(visualizeButton, '❌ Error', '#f44336');
            }
          };
          const restoreButton = document.createElement('button');
          restoreButton.textContent = 'Restore Full Graph';
          restoreButton.style.cssText = `
            background: rgba(255,255,255,0.1);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.2s ease;
          `;
          restoreButton.onmouseover = () => {
            restoreButton.style.background = 'rgba(255,255,255,0.2)';
          };
          restoreButton.onmouseout = () => {
            restoreButton.style.background = 'rgba(255,255,255,0.1)';
          };
          restoreButton.onclick = () => {
            if (self.restoreHandler) {
              console.log('🔍 Restoring full graph...');
              self.restoreHandler();
              self.showButtonFeedback(restoreButton, '✅ Restored!', '#4CAF50');
            } else {
              console.error('🔍 No restore handler available');
              self.showButtonFeedback(restoreButton, '❌ Error', '#f44336');
            }
          };
          buttonContainer.appendChild(visualizeButton);
          buttonContainer.appendChild(restoreButton);
          pluginContainer.appendChild(buttonContainer);
          if (turtleData) {
            const previewContainer = document.createElement('div');
            previewContainer.style.cssText = `
              margin-top: 20px;
              padding: 15px;
              background: rgba(0,0,0,0.2);
              border-radius: 6px;
              text-align: left;
              max-height: 200px;
              overflow-y: auto;
            `;
            const preview = document.createElement('pre');
            preview.style.cssText = `
              margin: 0;
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              font-size: 12px;
              line-height: 1.4;
              color: #E8F5E8;
              white-space: pre-wrap;
              word-wrap: break-word;
            `;
            const previewText = turtleData.length > 500 
              ? turtleData.substring(0, 500) + '\n\n... (truncated)'
              : turtleData;
            preview.textContent = previewText;
            previewContainer.appendChild(preview);
            pluginContainer.appendChild(previewContainer);
          }
          this.container.innerHTML = '';
          this.container.appendChild(pluginContainer);
          this.yasr.resultsEl.appendChild(this.container);
          console.log('🔍 Plugin UI created and added to container');
        } catch (error) {
          console.error('🔍 Error in draw method:', error);
          this.container.innerHTML = `<div style="color: red; padding: 16px;">Error creating graph visualization: ${error}</div>`;
          this.yasr.resultsEl.appendChild(this.container);
        }
      }
      canHandleResults(): boolean {
        if (!this.yasr || !this.yasr.results) return false;
        if (typeof this.yasr.results.isGraph === 'function') {
          return this.yasr.results.isGraph();
        }
        // Fallback: try to detect CONSTRUCT result by type or presence of turtle data
        if (this.yasr.results.type === 'construct' || this.yasr.results.turtle) {
          return true;
        }
        return false;
      }
      getIcon(): HTMLElement {
        console.log('🔍 ConstructVisualizationPlugin.getIcon called');
        const iconElement = document.createElement('span');
        iconElement.innerHTML = '🎯';
        iconElement.style.fontSize = '16px';
        return iconElement;
      }
      getLabel(): string {
        return 'Graph View';
      }
      destroy(): void {
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
      }
    }
    // Register the plugin with Yasr using the correct method
    try {
      Yasr.registerPlugin('ConstructVisualization', ConstructVisualizationPlugin);
      console.log('🔍 ConstructVisualizationPlugin registered successfully with Yasr.registerPlugin');
      // Debug: log available plugins and the actual plugin value
      console.log('🔍 Available Yasr plugins after registration:', Object.keys(Yasr.plugins || {}));
      console.log('🔍 ConstructVisualizationPlugin actual value:', Yasr.plugins['ConstructVisualization']);
    } catch (error) {
      console.error('🔍 Error registering plugin:', error);
    }
  }

  /**
   * Show visual feedback on buttons
   */
  private showButtonFeedback(button: HTMLButtonElement, text: string, color: string): void {
    const originalText = button.textContent;
    const originalColor = button.style.backgroundColor;
    
    button.textContent = text;
    button.style.backgroundColor = color;
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = originalColor;
    }, 2000);
  }

  /**
   * Add sample queries as tabs (DISABLED - using buttons instead)
   */
  private addSampleQueries(state: AppState): void {
    // Disabled to prevent automatic tab creation
    // Use custom tab buttons instead
    console.log("Sample query tabs disabled - using buttons instead");
  }

  /**
   * Add custom tab buttons as fallback
   */
  private addCustomTabButtons(state: AppState): void {
    console.log("Adding custom tab buttons as fallback");
    
    const yasguiContainer = document.getElementById("yasgui");
    if (!yasguiContainer) {
      console.error("Yasgui container not found");
      return;
    }
    
    // Create a custom tab bar above yasgui
    const customTabBar = document.createElement('div');
    customTabBar.id = 'custom-sample-tabs';
    
    // Create buttons for each sample query
    sampleQueries.forEach((sample) => {
      const button = document.createElement('button');
      button.textContent = sample.name;
      
      button.onclick = () => {
        if (state.yasgui && state.yasgui.getTab() && state.yasgui.getTab().yasqe) {
          state.yasgui.getTab().yasqe.setValue(sample.query);
          console.log(`Loaded sample query: ${sample.name}`);
        } else {
          console.error("Could not load sample query - Yasgui not properly initialized");
        }
      };
      
      customTabBar.appendChild(button);
    });
    
    // Add a reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Query';
    resetButton.className = 'reset';
    
    resetButton.onclick = () => {
      if (state.yasgui && state.yasgui.getTab() && state.yasgui.getTab().yasqe) {
        state.yasgui.getTab().yasqe.setValue(defaultQuery);
        console.log("Reset to default query");
      }
    };
    
    customTabBar.appendChild(resetButton);
    
    // Insert the custom tab bar before the yasgui container
    yasguiContainer.parentNode?.insertBefore(customTabBar, yasguiContainer);
    
    console.log("Custom tab buttons added successfully");
  }

  /**
   * Register JSON-LD plugin for Yasr
   */
  private registerJsonLdPlugin(Yasr: any): void {
    if (!Yasr) return;

    class JsonLdPlugin {
      yasr: any;
      container: HTMLElement;
      static label = "JSON-LD";
      static priority = 5;
      constructor(yasr: any) {
        this.yasr = yasr;
        this.container = document.createElement('div');
      }
      getIcon() {
        const span = document.createElement('span');
        span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
        return span;
      }
      getLabel() {
        return (this.constructor as any).label;
      }
      canHandleResults() {
        return this.yasr && this.yasr.results && this.yasr.results.getBindings;
      }
      draw() {
        try {
          const jsonLd = this.convertSparqlToJsonLd(this.yasr.results);
          const container = this.yasr.getContainer();
          container.innerHTML = '';
          const jsonContainer = document.createElement('div');
          jsonContainer.style.cssText = `
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 16px;
            overflow: auto;
            max-height: 500px;
            white-space: pre-wrap;
            line-height: 1.4;
          `;
          const toolbar = document.createElement('div');
          toolbar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #dee2e6;
          `;
          const title = document.createElement('span');
          title.textContent = 'JSON-LD Output';
          title.style.fontWeight = 'bold';
          title.style.color = '#495057';
          const copyButton = document.createElement('button');
          copyButton.textContent = 'Copy JSON-LD';
          copyButton.style.cssText = `
            background: #007bff;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            cursor: pointer;
          `;
          copyButton.onclick = function() {
            navigator.clipboard.writeText(JSON.stringify(jsonLd, null, 2)).then(() => {
              copyButton.textContent = 'Copied!';
              setTimeout(() => {
                copyButton.textContent = 'Copy JSON-LD';
              }, 1500);
            });
          };
          toolbar.appendChild(title);
          toolbar.appendChild(copyButton);
          jsonContainer.appendChild(toolbar);
          const pre = document.createElement('pre');
          pre.textContent = JSON.stringify(jsonLd, null, 2);
          jsonContainer.appendChild(pre);
          container.appendChild(jsonContainer);
        } catch (e) {
          console.error("Failed to draw JSON-LD plugin", e);
        }
      }
      convertSparqlToJsonLd(results: any) {
        // Basic conversion logic, can be expanded
        const bindings = results.getBindings();
        const context: any = {};
        results.getVariables().forEach((variable: string) => {
          context[variable] = `ex:${variable}`;
        });
        const graph = bindings.map((binding: any) => {
          const obj: any = {};
          for (const key in binding) {
            obj[key] = binding[key].value;
          }
          return obj;
        });
        return {
          "@context": context,
          "@graph": graph
        };
      }
      destroy() {
        // Clean up if needed
      }
    }
    Yasr.registerPlugin("JsonLd", JsonLdPlugin);
  }

  /**
   * Register Turtle plugin for Yasr
   */
  private registerTurtlePlugin(Yasr: any): void {
    if (!Yasr) return;

    class TurtlePlugin {
      yasr: any;
      container: HTMLElement;
      static label = "Turtle";
      static priority = 4;
      constructor(yasr: any) {
        this.yasr = yasr;
        this.container = document.createElement('div');
      }
      getIcon() {
        const span = document.createElement('span');
        span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>';
        return span;
      }
      getLabel() {
        return (this.constructor as any).label;
      }
      canHandleResults() {
        return this.yasr && this.yasr.results && this.yasr.results.getBindings;
      }
      draw() {
        const container = this.yasr.getContainer();
        container.innerHTML = `<pre>${this.yasr.results.turtle}</pre>`;
      }
      destroy() {
        // Clean up if needed
      }
    }
    Yasr.registerPlugin("Turtle", TurtlePlugin);
  }

  /**
   * Register Trig plugin for Yasr
   */
  private registerTrigPlugin(Yasr: any): void {
    if (!Yasr) return;

    class TrigPlugin {
      yasr: any;
      container: HTMLElement;
      static label = "TriG";
      static priority = 3;
      constructor(yasr: any) {
        this.yasr = yasr;
        this.container = document.createElement('div');
      }
      getIcon() {
        const span = document.createElement('span');
        span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/><path d="M12,12H16V14H12V12M12,16H16V18H12V16Z"/></svg>';
        return span;
      }
      getLabel() {
        return (this.constructor as any).label;
      }
      canHandleResults() {
        return this.yasr && this.yasr.results && this.yasr.results.getBindings;
      }
      draw() {
        const container = this.yasr.getContainer();
        container.innerHTML = `<pre>${this.yasr.results.trig}</pre>`;
      }
      destroy() {
        // Clean up if needed
      }
    }
    Yasr.registerPlugin("Trig", TrigPlugin);
  }

  /**
   * Set the callback for handling CONSTRUCT query results
   */
  setConstructHandler(handler: (constructData: string) => void): void {
    this.constructHandler = handler;
  }

  /**
   * Set the callback for restoring the original graph
   */
  setRestoreHandler(handler: () => void): void {
    this.restoreHandler = handler;
  }
}
