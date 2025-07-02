/**
 * SPARQL interface and Yasgui integration
 */
import Yasgui from '@zazuko/yasgui';
import Yasr from '@zazuko/yasr';
import '@zazuko/yasgui/build/yasgui.min.css';
import type { AppState } from './types.js';
import { sampleQueries, defaultQuery } from './constants.js';

export class SparqlInterface {
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

    // Register plugins before initializing Yasgui (re-enabled)
    this.registerJsonLdPlugin();
    this.registerTurtlePlugin();
    this.registerTrigPlugin();

    // Initialize Yasgui with proper endpoint
    state.yasgui = new Yasgui(document.getElementById("yasgui"), {
      requestConfig: {
        endpoint: "http://localhost:8000/sparql",
        method: "POST"
      },
      copyEndpointOnNewTab: false
    });

    // Set default query
    state.yasgui.getTab().yasqe.setValue(defaultQuery);

    // Add custom tab buttons for sample queries (no automatic tabs)
    setTimeout(() => {
      this.addCustomTabButtons(state);
    }, 500);
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
      Yasr.plugins.jsonld = JsonLdPlugin;
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
      Yasr.plugins.turtle = TurtlePlugin;
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
      Yasr.plugins.trig = TrigPlugin;
    }
  }
}
