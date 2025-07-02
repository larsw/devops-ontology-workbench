/**
 * Event handlers for keyboard shortcuts and interactions
 */
import type { AppState, KeyboardHandler } from './types.js';
import { UIComponents } from './ui-components.js';

export class EventHandlers {
  private uiComponents: UIComponents;

  constructor(uiComponents: UIComponents) {
    this.uiComponents = uiComponents;
  }

  /**
   * Set up global keyboard shortcuts
   */
  setupKeyboardShortcuts(state: AppState): void {
    const keyboardHandler: KeyboardHandler = (event: KeyboardEvent) => {
      // Don't intercept keys when user is typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      console.log(`Key pressed: ${event.key}`);
      
      switch (event.key.toLowerCase()) {
        case 'r':
          this.handleResetZoom(state);
          break;
        case '+':
        case '=':
          this.handleZoomIn(state);
          break;
        case '-':
        case '_':
          this.handleZoomOut(state);
          break;
        case 'h':
          event.preventDefault();
          this.uiComponents.toggleLegend();
          break;
        case '?':
        case '/':
          event.preventDefault();
          this.uiComponents.toggleInstructions();
          break;
        case 'p':
          event.preventDefault();
          this.uiComponents.togglePanel('nodeDetailsPanel');
          break;
        case 'q':
          event.preventDefault();
          this.uiComponents.togglePanel('queryContainer');
          break;
      }
    };

    document.addEventListener('keydown', keyboardHandler);
  }

  /**
   * Handle reset zoom shortcut
   */
  private handleResetZoom(state: AppState): void {
    if (state.globalSvg && state.globalZoom) {
      state.globalSvg.transition()
        .duration(750)
        .call(state.globalZoom.transform as any, (window as any).d3.zoomIdentity);
    }
  }

  /**
   * Handle zoom in shortcut
   */
  private handleZoomIn(state: AppState): void {
    if (state.globalSvg && state.globalZoom) {
      state.globalSvg.transition()
        .duration(200)
        .call(state.globalZoom.scaleBy as any, 1.5);
    }
  }

  /**
   * Handle zoom out shortcut
   */
  private handleZoomOut(state: AppState): void {
    if (state.globalSvg && state.globalZoom) {
      state.globalSvg.transition()
        .duration(200)
        .call(state.globalZoom.scaleBy as any, 1 / 1.5);
    }
  }

  /**
   * Set up window resize handler
   */
  setupWindowResize(onResize: () => void): void {
    window.addEventListener('resize', () => {
      // Debounce resize events
      clearTimeout((window as any).resizeTimeout);
      (window as any).resizeTimeout = setTimeout(onResize, 250);
    });
  }

  /**
   * Clean up event listeners
   */
  cleanup(): void {
    // Remove event listeners if needed
    // This would be called when the component is destroyed
  }
}
