/**
 * Panel resize functionality
 */
import type { ResizeHandler } from './types.js';

export class ResizeHandlers {
  private isResizing = false;
  private isVerticalResizing = false;

  /**
   * Initialize resize functionality for panels
   */
  initializeResize(): void {
    this.setupHorizontalResize();
    this.setupVerticalResize();
  }

  /**
   * Set up horizontal resize for bottom panel
   */
  private setupHorizontalResize(): void {
    const resizeHandle = document.getElementById('resizeHandle');
    const graphContainer = document.querySelector('.graph-container') as HTMLElement;
    const queryContainer = document.querySelector('.query-container') as HTMLElement;

    if (!resizeHandle || !graphContainer || !queryContainer) return;

    const handleMouseDown = (e: MouseEvent) => {
      this.isResizing = true;
      document.addEventListener('mousemove', this.handleHorizontalResize);
      document.addEventListener('mouseup', this.stopHorizontalResize);
      e.preventDefault();
    };

    resizeHandle.addEventListener('mousedown', handleMouseDown);
  }

  /**
   * Handle horizontal resize movement
   */
  private handleHorizontalResize: ResizeHandler = (e: MouseEvent) => {
    if (!this.isResizing) return;
    
    const graphContainer = document.querySelector('.graph-container') as HTMLElement;
    const queryContainer = document.querySelector('.query-container') as HTMLElement;
    const resizeHandle = document.getElementById('resizeHandle') as HTMLElement;
    
    if (!graphContainer || !queryContainer || !resizeHandle) return;
    
    const containerHeight = document.querySelector('.container')?.clientHeight || 0;
    const newGraphHeight = e.clientY;
    const newQueryHeight = containerHeight - newGraphHeight - resizeHandle.clientHeight;
    
    if (newGraphHeight > 200 && newQueryHeight > 100) {
      graphContainer.style.flex = `0 0 ${newGraphHeight}px`;
      queryContainer.style.flex = `0 0 ${newQueryHeight}px`;
    }
  };

  /**
   * Stop horizontal resize
   */
  private stopHorizontalResize = () => {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.handleHorizontalResize);
    document.removeEventListener('mouseup', this.stopHorizontalResize);
  };

  /**
   * Set up vertical resize for right panel
   */
  private setupVerticalResize(): void {
    const verticalResizeHandle = document.getElementById('verticalResizeHandle');
    const graphMain = document.querySelector('.graph-main') as HTMLElement;
    const nodeDetailsPanel = document.querySelector('.node-details-panel') as HTMLElement;

    if (!verticalResizeHandle || !graphMain || !nodeDetailsPanel) return;

    const handleMouseDown = (e: MouseEvent) => {
      this.isVerticalResizing = true;
      document.addEventListener('mousemove', this.handleVerticalResize);
      document.addEventListener('mouseup', this.stopVerticalResize);
      e.preventDefault();
    };

    verticalResizeHandle.addEventListener('mousedown', handleMouseDown);
  }

  /**
   * Handle vertical resize movement
   */
  private handleVerticalResize: ResizeHandler = (e: MouseEvent) => {
    if (!this.isVerticalResizing) return;
    
    const graphContainer = document.querySelector('.graph-container') as HTMLElement;
    const graphMain = document.querySelector('.graph-main') as HTMLElement;
    const nodeDetailsPanel = document.querySelector('.node-details-panel') as HTMLElement;
    const verticalResizeHandle = document.getElementById('verticalResizeHandle') as HTMLElement;
    
    if (!graphContainer || !graphMain || !nodeDetailsPanel || !verticalResizeHandle) return;
    
    const containerWidth = graphContainer.clientWidth;
    const newMainWidth = e.clientX;
    const newPanelWidth = containerWidth - newMainWidth - verticalResizeHandle.clientWidth;
    
    if (newMainWidth > 300 && newPanelWidth > 200) {
      graphMain.style.flex = `0 0 ${newMainWidth}px`;
      nodeDetailsPanel.style.width = `${newPanelWidth}px`;
    }
  };

  /**
   * Stop vertical resize
   */
  private stopVerticalResize = () => {
    this.isVerticalResizing = false;
    document.removeEventListener('mousemove', this.handleVerticalResize);
    document.removeEventListener('mouseup', this.stopVerticalResize);
  };

  /**
   * Clean up resize handlers
   */
  cleanup(): void {
    document.removeEventListener('mousemove', this.handleHorizontalResize);
    document.removeEventListener('mouseup', this.stopHorizontalResize);
    document.removeEventListener('mousemove', this.handleVerticalResize);
    document.removeEventListener('mouseup', this.stopVerticalResize);
  }
}
