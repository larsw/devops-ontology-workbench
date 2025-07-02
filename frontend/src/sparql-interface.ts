/**
 * SPARQL interface and Yasgui integration
 */
import Yasgui from '@zazuko/yasgui';
import Yasr from '@zazuko/yasr';
import '@zazuko/yasgui/build/yasgui.min.css';
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

    // Register plugins before initializing Yasgui
    this.registerJsonLdPlugin();
    this.registerTurtlePlugin();
    this.registerTrigPlugin();
    this.registerConstructVisualizationPlugin();

    // Initialize Yasgui with proper endpoint and custom configuration
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

    // Set default query
    state.yasgui.getTab().yasqe.setValue(defaultQuery);

    // Set up result handling after query execution
    this.setupResultHandling(state);

    // Add custom tab buttons for sample queries (no automatic tabs)
    setTimeout(() => {
      this.addCustomTabButtons(state);
    }, 500);
  }

  /**
   * Set up result handling for SPARQL queries
   */
  private setupResultHandling(state: AppState): void {
    if (!state.yasgui) return;

    console.log('🔍 Result handling setup - relying on plugin system');
    // The ConstructVisualizationPlugin will handle CONSTRUCT results automatically
  }

  /**
   * Register a proper CONSTRUCT visualization plugin for Yasr
   */
  private registerConstructVisualizationPlugin(): void {
    console.log('🔍 Starting registerConstructVisualizationPlugin...');
    
    if (!Yasr) {
      console.error('🔍 Yasr not available!');
      return;
    }

    console.log('🔍 Yasr is available:', Yasr);
    console.log('🔍 Yasr.plugins before registration:', Yasr.plugins);

    const self = this;
    
    // Create a proper Yasr plugin following the standard structure
    const ConstructVisualizationPlugin = {
      // Required: Plugin identification
      getIcon(): string {
        console.log('🔍 ConstructVisualizationPlugin.getIcon called');
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0ZM1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828ZM7.5 2.734v9.746c.935-.53 2.12-.603 3.213-.493 1.18.12 2.37.461 3.287.811V2.828c-.885-.37-2.154-.769-3.388-.893-.114-.01-.227-.018-.339-.025v.025c-.14 0-.333.024-.773.024Z"/>
        </svg>`;
      },

      // Required: Plugin name/label
      label: "Graph View",

      // Required: Priority (higher = appears first in tabs)
      priority: 15,

      // Required: Determine if this plugin can handle the current results
      canHandleResults(yasr: any): boolean {
        console.log('🔍 ConstructVisualizationPlugin.canHandleResults called with yasr:', yasr);
        
        try {
          // Check if we have turtle data in the results
          let hasTurtleData = false;
          let isConstructType = false;
          
          if (yasr && yasr.results) {
            // Check if this is a construct result with turtle data
            hasTurtleData = yasr.results.turtle && typeof yasr.results.turtle === 'string';
            isConstructType = yasr.results.type === 'construct';
            
            console.log('🔍 Plugin detection:', { 
              hasTurtleData, 
              isConstructType, 
              resultType: yasr.results.type,
              turtleLength: yasr.results.turtle ? yasr.results.turtle.length : 0
            });
          }
          
          // This plugin can handle results if we have turtle data from a CONSTRUCT query
          const canHandle = hasTurtleData && isConstructType;
          console.log('🔍 Plugin can handle results:', canHandle);
          
          return canHandle;
        } catch (error) {
          console.error('🔍 Error in canHandleResults:', error);
          return false;
        }
      },

      // Required: Draw/render the results
      draw(yasr: any): HTMLElement {
        console.log('🔍 ConstructVisualizationPlugin.draw called with yasr:', yasr);
        
        try {
          const container = yasr.getContainer();
          if (!container) {
            console.error('🔍 No container found in yasr');
            return document.createElement('div');
          }

          // Clear the container
          container.innerHTML = '';

          // Get turtle data from results
          let turtleData = null;
          if (yasr.results && yasr.results.turtle) {
            turtleData = yasr.results.turtle;
          }

          console.log('🔍 Creating graph visualization UI, turtle data length:', turtleData ? turtleData.length : 0);

          // Create the plugin container
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

          // Add buttons
          const buttonContainer = document.createElement('div');
          buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center; align-items: center;';

          // Visualize in Graph button
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

          // Restore Full Graph button
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

          // Show a preview of the turtle data
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
            
            // Show first 500 characters
            const previewText = turtleData.length > 500 
              ? turtleData.substring(0, 500) + '\\n\\n... (truncated)'
              : turtleData;
            preview.textContent = previewText;
            
            previewContainer.appendChild(preview);
            pluginContainer.appendChild(previewContainer);
          }

          // Add to container
          container.appendChild(pluginContainer);

          console.log('🔍 Plugin UI created and added to container');
          return pluginContainer;
        } catch (error) {
          console.error('🔍 Error in draw method:', error);
          const errorDiv = document.createElement('div');
          errorDiv.textContent = `Error creating graph visualization: ${error}`;
          errorDiv.style.cssText = 'color: red; padding: 16px;';
          return errorDiv;
        }
      }
    };

    // Register the plugin with Yasr
    try {
      if (Yasr.plugins) {
        (Yasr.plugins as any).ConstructVisualization = ConstructVisualizationPlugin;
        console.log('🔍 ConstructVisualizationPlugin registered successfully');
        console.log('🔍 Yasr.plugins after registration:', Object.keys(Yasr.plugins));
      } else {
        console.error('🔍 Yasr.plugins not available');
      }
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
  private registerJsonLdPlugin(): void {
    if (!Yasr) return;

    const JsonLdPlugin = {
      getIcon: function() {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
      },
      label: "JSON-LD",
      priority: 5,
      canHandleResults: function(yasr: any) {
        return yasr && yasr.results && yasr.results.getBindings;
      },
      draw: function(yasr: any) {
        try {
          const jsonLd = this.convertSparqlToJsonLd(yasr.results);
          const container = yasr.getContainer();
          
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
          
          const jsonContent = document.createElement('div');
          jsonContent.textContent = JSON.stringify(jsonLd, null, 2);
          jsonContent.style.color = '#212529';
          
          jsonContainer.appendChild(toolbar);
          jsonContainer.appendChild(jsonContent);
          container.appendChild(jsonContainer);
          
          return jsonContainer;
        } catch (error) {
          console.error('Error rendering JSON-LD:', error);
          const errorDiv = document.createElement('div');
          errorDiv.textContent = `Error generating JSON-LD: ${(error as Error).message}`;
          errorDiv.style.color = 'red';
          errorDiv.style.padding = '16px';
          yasr.getContainer().appendChild(errorDiv);
          return errorDiv;
        }
      },
      convertSparqlToJsonLd: function(results: any): any {
        return { "@context": {}, "@graph": [] };
      }
    };
    
    if (Yasr.plugins) {
      (Yasr.plugins as any).jsonld = JsonLdPlugin;
    }
  }

  /**
   * Register Turtle plugin for Yasr
   */
  private registerTurtlePlugin(): void {
    if (!Yasr) return;

    const TurtlePlugin = {
      getIcon: function() {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>';
      },
      label: "Turtle",
      priority: 4,
      canHandleResults: function(yasr: any) {
        return yasr && yasr.results && yasr.results.getBindings;
      },
      draw: function(yasr: any) {
        const turtle = "# Turtle output placeholder";
        const container = yasr.getContainer();
        container.innerHTML = `<pre style="font-family: monospace; padding: 16px;">${turtle}</pre>`;
        return container.firstChild;
      }
    };
    
    if (Yasr.plugins) {
      (Yasr.plugins as any).turtle = TurtlePlugin;
    }
  }

  /**
   * Register TriG plugin for Yasr
   */
  private registerTrigPlugin(): void {
    if (!Yasr) return;

    const TrigPlugin = {
      getIcon: function() {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/><path d="M12,12H16V14H12V12M12,16H16V18H12V16Z"/></svg>';
      },
      label: "TriG",
      priority: 3,
      canHandleResults: function(yasr: any) {
        return yasr && yasr.results && yasr.results.getBindings;
      },
      draw: function(yasr: any) {
        const trig = "# TriG output placeholder";
        const container = yasr.getContainer();
        container.innerHTML = `<pre style="font-family: monospace; padding: 16px;">${trig}</pre>`;
        return container.firstChild;
      }
    };
    
    if (Yasr.plugins) {
      (Yasr.plugins as any).trig = TrigPlugin;
    }
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
