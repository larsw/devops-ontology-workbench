/**
 * UI Components - Legend, Instructions, Layout Controls and other UI elements
 */
import * as d3 from 'd3';
import { colorScheme, instructionItems, availableLayouts, physicsControls, defaultPhysicsConfig } from './constants.js';
import type { GraphLayoutType, PhysicsConfig } from './types.js';

export class UIComponents {
  private legendVisible = true;
  private instructionsVisible = true;
  private layoutChangeHandler?: (layout: GraphLayoutType) => void;
  private physicsChangeHandler?: (config: PhysicsConfig) => void;

  /**
   * Create and add legend to the SVG
   */
  createLegend(svg: any): void {
    // Calculate position below title
    const titleHeight = 100; // Approximate title height including padding
    const marginTop = 20;
    
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(20, ${titleHeight + marginTop})`);

    const legendData = Object.entries(colorScheme)
      .filter(([type]) => type !== 'default')
      .slice(0, 15); // Show first 15 types to avoid overcrowding

    const legendItems = legend.selectAll(".legend-item")
      .data(legendData)
      .enter().append("g")
      .attr("class", "legend-item")
      .attr("transform", (d: any, i: number) => `translate(0, ${i * 18})`);

    legendItems.append("circle")
      .attr("r", 6)
      .attr("cx", 8)
      .attr("cy", 0)
      .style("fill", (d: any) => d[1])
      .style("stroke", "#333")
      .style("stroke-width", "1px");

    legendItems.append("text")
      .attr("x", 20)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .style("fill", "#333")
      .text((d: any) => d[0]);

    // Add legend background
    const bbox = legend.node().getBBox();
    legend.insert("rect", ":first-child")
      .attr("x", bbox.x - 5)
      .attr("y", bbox.y - 5)
      .attr("width", bbox.width + 10)
      .attr("height", bbox.height + 10)
      .style("fill", "rgba(255, 255, 255, 0.9)")
      .style("stroke", "#ccc")
      .style("stroke-width", "1px")
      .style("rx", "3px");
  }

  /**
   * Add instructions to the SVG
   */
  addInstructions(svg: any): void {
    // Calculate position below legend
    const legend = svg.select('.legend');
    let instructionsY = 120; // Default fallback
    
    if (!legend.empty()) {
      const legendBBox = legend.node().getBBox();
      const legendTransform = legend.attr('transform');
      
      // Extract Y position from transform
      const translateYMatch = legendTransform.match(/translate\([^,]+,\s*([^)]+)\)/);
      const legendY = translateYMatch ? parseFloat(translateYMatch[1]) : 0;
      
      instructionsY = legendY + legendBBox.height + 20; // 20px margin below legend
    }
    
    const instructions = svg.append("g")
      .attr("class", "instructions")
      .attr("transform", `translate(20, ${instructionsY})`);

    const instructionList = instructions.selectAll(".instruction-item")
      .data(instructionItems)
      .enter().append("g")
      .attr("class", "instruction-item")
      .attr("transform", (d: string, i: number) => `translate(0, ${i * 16})`);

    instructionList.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .style("font-size", "10px")
      .style("fill", "#666")
      .text((d: string) => d);

    // Add instructions background
    const bbox = instructions.node().getBBox();
    instructions.insert("rect", ":first-child")
      .attr("x", bbox.x - 5)
      .attr("y", bbox.y - 5)
      .attr("width", bbox.width + 10)
      .attr("height", bbox.height + 10)
      .style("fill", "rgba(255, 255, 255, 0.85)")
      .style("stroke", "#ddd")
      .style("stroke-width", "1px")
      .style("rx", "3px");
  }

  /**
   * Toggle legend visibility
   */
  toggleLegend(): void {
    console.log("toggleLegend called");
    const legend = document.querySelector('.legend') as HTMLElement;
    console.log("Legend element:", legend);
    if (legend) {
      this.legendVisible = !this.legendVisible;
      legend.classList.toggle('hidden', !this.legendVisible);
      console.log(`Legend ${this.legendVisible ? 'shown' : 'hidden'}`);
    } else {
      console.error("Legend element not found");
    }
  }

  /**
   * Toggle instructions visibility
   */
  toggleInstructions(): void {
    console.log("toggleInstructions called");
    const instructions = document.querySelector('.instructions') as HTMLElement;
    console.log("Instructions element:", instructions);
    if (instructions) {
      this.instructionsVisible = !this.instructionsVisible;
      instructions.classList.toggle('hidden', !this.instructionsVisible);
      console.log(`Instructions ${this.instructionsVisible ? 'shown' : 'hidden'}`);
    } else {
      console.error("Instructions element not found");
    }
  }

  /**
   * Toggle panel visibility
   */
  togglePanel(panelId: string): void {
    const panel = document.getElementById(panelId);
    const toggleButton = document.getElementById(panelId + 'Toggle');
    
    if (!panel) return;
    
    if (panel.classList.contains('collapsed')) {
      panel.classList.remove('collapsed');
      if (toggleButton) {
        if (panelId === 'nodeDetailsPanel') {
          toggleButton.textContent = '⟨';
        } else if (panelId === 'queryContainer') {
          toggleButton.textContent = '⌄';
        }
      }
    } else {
      panel.classList.add('collapsed');
      if (toggleButton) {
        if (panelId === 'nodeDetailsPanel') {
          toggleButton.textContent = '⟩';
        } else if (panelId === 'queryContainer') {
          toggleButton.textContent = '⌃';
        }
      }
    }
  }

  /**
   * Get legend visibility state
   */
  isLegendVisible(): boolean {
    return this.legendVisible;
  }

  /**
   * Get instructions visibility state
   */
  areInstructionsVisible(): boolean {
    return this.instructionsVisible;
  }

  /**
   * Set the layout change handler
   */
  setLayoutChangeHandler(handler: (layout: GraphLayoutType) => void): void {
    this.layoutChangeHandler = handler;
  }

  /**
   * Set the physics change handler
   */
  setPhysicsChangeHandler(handler: (config: PhysicsConfig) => void): void {
    this.physicsChangeHandler = handler;
  }

  /**
   * Create layout selector controls with physics settings
   */
  createLayoutSelector(svg: any, currentLayout: GraphLayoutType, physicsConfig?: PhysicsConfig): void {
    // Remove any existing layout controls first
    svg.select(".layout-controls").remove();
    
    // Get SVG dimensions for right-side positioning
    const svgNode = svg.node();
    const svgRect = svgNode.getBoundingClientRect();
    const svgWidth = svgRect.width || 800; // fallback width
    const controlsWidth = 200; // Increased width for physics controls
    
    // Position the layout selector in the top-right corner
    const layoutControls = svg.append("g")
      .attr("class", "layout-controls")
      .attr("transform", `translate(${svgWidth - controlsWidth - 20}, 10)`)
      .style("pointer-events", "all");

    // Add background
    const controlsBackground = layoutControls.append("rect")
      .attr("class", "controls-background")
      .style("fill", "rgba(255, 255, 255, 0.95)")
      .style("stroke", "#ccc")
      .style("stroke-width", "1px")
      .style("rx", "5px");

    let yOffset = 20;

    // Add layout title
    layoutControls.append("text")
      .attr("x", 10)
      .attr("y", yOffset)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("Graph Layout:");

    yOffset += 20;

    // Create layout buttons
    const buttonGroups = layoutControls.selectAll(".layout-button")
      .data(availableLayouts)
      .enter().append("g")
      .attr("class", "layout-button")
      .attr("transform", (d: any, i: number) => `translate(10, ${yOffset + i * 25})`)
      .style("cursor", "pointer");

    // Add button backgrounds
    const buttons = buttonGroups.append("rect")
      .attr("width", 180)
      .attr("height", 20)
      .attr("rx", 3)
      .style("fill", (d: any) => d.type === currentLayout ? "#4ecdc4" : "rgba(255, 255, 255, 0.8)")
      .style("stroke", "#ccc")
      .style("stroke-width", "1px");

    // Add button text
    buttonGroups.append("text")
      .attr("x", 90)
      .attr("y", 14)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#333")
      .style("pointer-events", "none")
      .text((d: any) => d.name);

    // Add click handlers
    buttonGroups.on("click", (event: Event, d: any) => {
      event.stopPropagation();
      
      // Update button styles
      buttons.style("fill", (buttonData: any) => 
        buttonData.type === d.type ? "#4ecdc4" : "rgba(255, 255, 255, 0.8)"
      );
      
      // Call layout change handler
      if (this.layoutChangeHandler && d.type !== currentLayout) {
        this.layoutChangeHandler(d.type);
      }
    });

    // Add hover effects
    buttonGroups
      .on("mouseenter", function(event: Event, d: any) {
        if (d.type !== currentLayout) {
          d3.select(this).select("rect")
            .style("fill", "rgba(78, 205, 196, 0.4)")
            .style("stroke", "#4ecdc4")
            .style("stroke-width", "2px");
        }
      })
      .on("mouseleave", function(event: Event, d: any) {
        if (d.type !== currentLayout) {
          d3.select(this).select("rect")
            .style("fill", "rgba(255, 255, 255, 0.8)")
            .style("stroke", "#ccc")
            .style("stroke-width", "1px");
        }
      });

    yOffset += availableLayouts.length * 25 + 15;

    // Add physics controls section (for force-directed and manual layouts)
    if (currentLayout === 'force-directed' || currentLayout === 'manual') {
      this.addPhysicsControls(layoutControls, yOffset, physicsConfig || defaultPhysicsConfig);
      yOffset += this.calculatePhysicsControlsHeight();
    }

    // Calculate and set background size
    const backgroundWidth = controlsWidth;
    const backgroundHeight = yOffset + 10; // Add bottom padding
    
    controlsBackground
      .attr("width", backgroundWidth)
      .attr("height", backgroundHeight);
  }

  /**
   * Update layout selector to reflect current layout
   */
  updateLayoutSelector(svg: any, currentLayout: GraphLayoutType, physicsConfig?: PhysicsConfig): void {
    const layoutControls = svg.select(".layout-controls");
    if (!layoutControls.empty()) {
      // Update button styles
      layoutControls.selectAll(".layout-button rect")
        .style("fill", (d: any) => d.type === currentLayout ? "#4ecdc4" : "rgba(255, 255, 255, 0.8)");
      
      // Update position if needed (in case SVG size changed)
      const svgNode = svg.node();
      const svgRect = svgNode.getBoundingClientRect();
      const svgWidth = svgRect.width || 800;
      const controlsWidth = 200;
      
      layoutControls.attr("transform", `translate(${svgWidth - controlsWidth - 20}, 10)`);
    }
  }

  /**
   * Add physics controls to the layout panel
   */
  private addPhysicsControls(parent: any, yOffset: number, physicsConfig: PhysicsConfig): void {
    // Add physics section title
    parent.append("text")
      .attr("x", 10)
      .attr("y", yOffset)
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("Physics Settings:");

    yOffset += 15;

    // Add reset button
    const resetButton = parent.append("g")
      .attr("class", "reset-button")
      .attr("transform", `translate(10, ${yOffset})`)
      .style("cursor", "pointer");

    resetButton.append("rect")
      .attr("width", 80)
      .attr("height", 18)
      .attr("rx", 3)
      .style("fill", "rgba(255, 255, 255, 0.8)")
      .style("stroke", "#999")
      .style("stroke-width", "1px");

    resetButton.append("text")
      .attr("x", 40)
      .attr("y", 12)
      .attr("text-anchor", "middle")
      .style("font-size", "9px")
      .style("fill", "#666")
      .style("pointer-events", "none")
      .text("Reset Defaults");

    resetButton.on("click", (event: Event) => {
      event.stopPropagation();
      if (this.physicsChangeHandler) {
        this.physicsChangeHandler(Object.assign({}, defaultPhysicsConfig));
      }
    });

    resetButton
      .on("mouseenter", function() {
        d3.select(this).select("rect")
          .style("fill", "rgba(78, 205, 196, 0.3)")
          .style("stroke", "#4ecdc4");
      })
      .on("mouseleave", function() {
        d3.select(this).select("rect")
          .style("fill", "rgba(255, 255, 255, 0.8)")
          .style("stroke", "#999");
      });

    yOffset += 25;

    // Add physics control sliders
    physicsControls.forEach((control, index) => {
      this.addPhysicsControl(parent, yOffset + index * 35, control, physicsConfig);
    });
  }

  /**
   * Add a single physics control (custom draggable slider with label and value)
   */
  private addPhysicsControl(parent: any, yOffset: number, control: any, physicsConfig: PhysicsConfig): void {
    const controlGroup = parent.append("g")
      .attr("class", `physics-control-${control.key}`)
      .attr("transform", `translate(10, ${yOffset})`);

    // Add label
    controlGroup.append("text")
      .attr("x", 0)
      .attr("y", 10)
      .style("font-size", "9px")
      .style("fill", "#555")
      .text(control.label);

    // Add value display
    const valueText = controlGroup.append("text")
      .attr("x", 170)
      .attr("y", 10)
      .attr("text-anchor", "end")
      .style("font-size", "9px")
      .style("fill", "#777")
      .text(physicsConfig[control.key].toString());

    // Create custom D3 slider
    const sliderGroup = controlGroup.append("g")
      .attr("transform", "translate(0, 15)");

    // Slider track
    const trackWidth = 160;
    const track = sliderGroup.append("rect")
      .attr("class", "slider-track")
      .attr("x", 0)
      .attr("y", 6)
      .attr("width", trackWidth)
      .attr("height", 4)
      .attr("rx", 2)
      .style("fill", "#ddd")
      .style("cursor", "pointer");

    // Calculate initial position
    const currentValue = physicsConfig[control.key];
    const valueRange = control.max - control.min;
    const handleX = ((currentValue - control.min) / valueRange) * trackWidth;

    // Slider handle
    const handle = sliderGroup.append("circle")
      .attr("class", "slider-handle")
      .attr("cx", handleX)
      .attr("cy", 8)
      .attr("r", 8)
      .style("fill", "#4ecdc4")
      .style("stroke", "#fff")
      .style("stroke-width", "2px")
      .style("cursor", "grab")
      .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.2))");

    // Drag behavior
    const drag = d3.drag()
      .on("start", function() {
        handle.style("cursor", "grabbing");
      })
      .on("drag", (event) => {
        const newX = Math.max(0, Math.min(trackWidth, event.x));
        handle.attr("cx", newX);
        
        // Calculate new value
        const newValue = control.min + (newX / trackWidth) * valueRange;
        const steppedValue = Math.round(newValue / control.step) * control.step;
        
        // Update value display
        valueText.text(steppedValue.toString());
        
        // Update physics config and notify
        if (this.physicsChangeHandler) {
          const newConfig = Object.assign({}, physicsConfig);
          newConfig[control.key] = steppedValue;
          this.physicsChangeHandler(newConfig);
        }
      })
      .on("end", function() {
        handle.style("cursor", "grab");
      });

    handle.call(drag);

    // Click on track to jump to position
    track.on("click", (event) => {
      const rect = track.node().getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const newX = Math.max(0, Math.min(trackWidth, clickX));
      
      handle.attr("cx", newX);
      
      // Calculate new value
      const newValue = control.min + (newX / trackWidth) * valueRange;
      const steppedValue = Math.round(newValue / control.step) * control.step;
      
      // Update value display
      valueText.text(steppedValue.toString());
      
      // Update physics config and notify
      if (this.physicsChangeHandler) {
        const newConfig = Object.assign({}, physicsConfig);
        newConfig[control.key] = steppedValue;
        this.physicsChangeHandler(newConfig);
      }
    });
  }

  /**
   * Calculate the height needed for physics controls
   */
  private calculatePhysicsControlsHeight(): number {
    // Title (15) + Reset button (25) + Controls (35 each) + padding
    return 40 + (physicsControls.length * 35);
  }
}
