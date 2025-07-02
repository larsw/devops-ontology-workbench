/**
 * UI Components - Legend, Instructions, and other UI elements
 */
import * as d3 from 'd3';
import { colorScheme, instructionItems } from './constants.js';

export class UIComponents {
  private legendVisible = true;
  private instructionsVisible = true;

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
}
