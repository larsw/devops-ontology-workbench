/**
 * Lazy loading utilities for dynamic imports
 */

export class LazyLoader {
  private static loadedModules = new Map<string, any>();

  /**
   * Dynamically load a module and cache it
   */
  static async loadModule(moduleId: string, importFn: () => Promise<any>): Promise<any> {
    if (this.loadedModules.has(moduleId)) {
      return this.loadedModules.get(moduleId);
    }

    try {
      const module = await importFn();
      this.loadedModules.set(moduleId, module);
      return module;
    } catch (error) {
      console.error(`Failed to load module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Load graph layouts dynamically
   */
  static async loadGraphLayouts() {
    return this.loadModule('graph-layouts', () => import('./graph-layouts.js'));
  }

  /**
   * Load SPARQL interface dynamically
   */
  static async loadSparqlInterface() {
    return this.loadModule('sparql-interface', () => import('./sparql-interface.js'));
  }

  /**
   * Preload critical modules
   */
  static async preloadCritical() {
    const promises = [
      this.loadModule('data-loader', () => import('./data-loader.js')),
      this.loadModule('graph-visualization', () => import('./graph-visualization.js')),
      this.loadModule('ui-components', () => import('./ui-components.js'))
    ];

    await Promise.all(promises);
  }

  /**
   * Preload non-critical modules in the background
   */
  static preloadNonCritical() {
    // Use requestIdleCallback if available, otherwise setTimeout
    const scheduleWork = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(callback);
      } else {
        setTimeout(callback, 100);
      }
    };

    scheduleWork(() => {
      this.loadGraphLayouts().catch(console.error);
    });

    scheduleWork(() => {
      this.loadSparqlInterface().catch(console.error);
    });
  }
}
