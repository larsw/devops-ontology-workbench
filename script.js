const parser = new N3.Parser();
const nodes = new Map();
const links = [];
const typeMap = new Map();
let yasgui;

// Global variables for D3 elements (needed for highlightNode function)
let globalSvg = null;
let globalContainer = null;
let globalZoom = null;
let globalWidth = 0;
let globalHeight = 0;

// Define color scheme for different concept types
const colorScheme = {
  'Application': '#ff6b6b',
  'Service': '#4ecdc4',
  'Container': '#45b7d1',
  'Database': '#96ceb4',
  'DatabaseSchema': '#a8e6cf',
  'VirtualServer': '#feca57',
  'PhysicalServer': '#ff9ff3',
  'ServerHardware': '#54a0ff',
  'DataCenter': '#5f27cd',
  'IPAddress': '#00d2d3',
  'NetworkSegment': '#ff6348',
  'NetworkCard': '#dda0dd',
  'Disk': '#c44569',
  'DigitalCertificate': '#40407a',
  'DNSDomain': '#706fd3',
  'ResourceGroup': '#f8b500',
  'Department': '#2c2c54',
  'Scope': '#1dd1a1',
  'MonitoringAgent': '#ff5722',
  'LogAggregator': '#ff9800',
  'Deployment': '#795548',
  'Workflow': '#607d8b',
  'WorkflowStep': '#9e9e9e',
  'Environment': '#4caf50',
  'User': '#e91e63',
  'Team': '#9c27b0',
  'Event': '#ff5252',
  'Incident': '#f44336',
  'LoadBalancer': '#3f51b5',
  'Firewall': '#009688',
  'FirewallRule': '#00bcd4',
  'Backup': '#8bc34a',
  'Storage': '#cddc39',
  'default': '#69b3a2'
};

fetch('sample.ttl')
  .then(res => res.text())
  .then(turtle => {
    parser.parse(turtle, (error, quad) => {
      if (quad) {
        const s = quad.subject.id;
        const p = quad.predicate.id;
        const o = quad.object.id || quad.object.value;

        // Extract type information when we encounter rdf:type predicates
        if (p === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
          const conceptType = o.split('/').pop().split('#').pop();
          typeMap.set(s, conceptType);
        }

        nodes.set(s, { id: s, type: typeMap.get(s) || 'default' });
        if (o.startsWith('http') || o.startsWith('https')) {
          nodes.set(o, { id: o, type: typeMap.get(o) || 'default' });
          // Only create links for URI objects, not literal values
          links.push({ source: s, target: o, label: p });
        }
      } else {
        // Update node types after parsing is complete
        for (let [nodeId, nodeData] of nodes) {
          nodeData.type = typeMap.get(nodeId) || 'default';
        }
        drawGraph();
        initializeSPARQL();
      }
    });
  });

// Global function to highlight and select a node by ID
function highlightNode(nodeId) {
  const nodeData = nodes.get(nodeId);
  if (nodeData && globalContainer && globalSvg && globalZoom) {
    const nodeElement = globalContainer.selectAll("circle")
      .filter(d => d.id === nodeId)
      .node();
    
    if (nodeElement) {
      selectNode(nodeData, nodeElement);
      
      // Animate to center the node
      const transform = d3.zoomTransform(globalSvg.node());
      const [x, y] = [nodeData.x, nodeData.y];
      
      globalSvg.transition()
        .duration(500)
        .call(globalZoom.transform, 
          d3.zoomIdentity
            .translate(globalWidth / 2 - x * transform.k, globalHeight / 2 - y * transform.k)
            .scale(transform.k)
        );
    }
  }
}

// Make highlightNode globally accessible
window.highlightNode = highlightNode;

function drawGraph() {
  const svg = d3.select("svg");
  const graphContainer = document.querySelector('.graph-container');
  const width = graphContainer.clientWidth;
  const height = graphContainer.clientHeight;

  // Set global variables for highlightNode function
  globalSvg = svg;
  globalWidth = width;
  globalHeight = height;

  // Clear any existing content
  svg.selectAll("*").remove();

  // Create a container group for all graph elements
  const container = svg.append("g")
    .attr("class", "graph-container");

  // Define zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", (event) => {
      container.attr("transform", event.transform);
    });

  // Set global variables for highlightNode function
  globalContainer = container;
  globalZoom = zoom;

  // Apply zoom behavior to the SVG
  svg.call(zoom);

  // Add reset zoom button
  const resetButton = svg.append("g")
    .attr("class", "reset-button")
    .attr("transform", "translate(20, 60)")
    .style("cursor", "pointer");

  resetButton.append("rect")
    .attr("width", 80)
    .attr("height", 25)
    .attr("rx", 3)
    .style("fill", "rgba(255, 255, 255, 0.9)")
    .style("stroke", "#333")
    .style("stroke-width", "1px");

  resetButton.append("text")
    .attr("x", 40)
    .attr("y", 17)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "#333")
    .text("Reset Zoom");

  resetButton.on("click", () => {
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);
  });

  const simulation = d3.forceSimulation([...nodes.values()])
    .force("link", d3.forceLink(links).id(d => d.id).distance(150).strength(0.2))
    .force("charge", d3.forceManyBody().strength(-200).distanceMax(400))
    .force("center", d3.forceCenter(width / 2, height / 2).strength(0.1))
    .force("collision", d3.forceCollide().radius(18).strength(0.3))
    .alphaDecay(0.005) // Much slower decay for gentler movement
    .velocityDecay(0.6); // Higher damping for less bouncy behavior

  const link = container.selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("class", "link");

  const node = container.selectAll("circle")
    .data([...nodes.values()])
    .enter().append("circle")
    .attr("r", d => {
      // Different sizes for different concepts
      if (['DataCenter', 'Environment'].includes(d.type)) return 12;
      if (['PhysicalServer', 'VirtualServer'].includes(d.type)) return 10;
      if (['Application', 'Service', 'Database'].includes(d.type)) return 9;
      return 8;
    })
    .attr("class", "node")
    .style("fill", d => colorScheme[d.type] || colorScheme.default)
    .style("stroke", "#333")
    .style("stroke-width", "2px")
    .style("cursor", "grab")
    .style("user-select", "none")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .on("click", function(event, d) {
      event.stopPropagation();
      selectNode(d, this);
    });

  // Add tooltips
  node.append("title")
    .text(d => `${d.id.split('/').pop()} (${d.type})`);

  const labels = container.selectAll("text.node-label")
    .data([...nodes.values()])
    .enter().append("text")
    .attr("class", "node-label")
    .text(d => {
      const name = d.id.split('/').pop();
      // Truncate long names
      return name.length > 15 ? name.substring(0, 12) + '...' : name;
    })
    .attr("x", 10)
    .attr("y", 3)
    .style("font-size", "9px")
    .style("fill", "#333")
    .style("pointer-events", "none");

  // Improved tick function with better performance
  let animationId = null;
  
  simulation.on("tick", ticked);

  function ticked() {
    // Use requestAnimationFrame for smooth updates and avoid redundant calls
    if (animationId) return;
    
    animationId = requestAnimationFrame(() => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      labels
        .attr("x", d => d.x + 12)
        .attr("y", d => d.y + 4);
        
      animationId = null;
    });
  }

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.1).restart(); // Gentler restart
    
    d.fx = d.x;
    d.fy = d.y;
    
    // Add visual feedback for dragging
    d3.select(this)
      .classed("dragging", true)
      .style("stroke", "#ff6b6b")
      .style("stroke-width", "3px");
  }

  function dragged(event, d) {
    // Use the event's x and y which are already in the SVG coordinate space
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0.02); // Gentle settling instead of immediate stop
    
    // Keep node slightly fixed for smoother settling
    setTimeout(() => {
      d.fx = null;
      d.fy = null;
      simulation.alphaTarget(0);
    }, 300);
    
    // Remove visual feedback
    d3.select(this)
      .classed("dragging", false)
      .style("stroke", "#333")
      .style("stroke-width", "2px");
  }

  // Add legend
  createLegend(svg);

  // Add instructions
  addInstructions(svg);
}

// Global keyboard shortcuts
document.addEventListener('keydown', (event) => {
  // Don't intercept keys when user is typing in input fields
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
    return;
  }
  
  console.log(`Key pressed: ${event.key}`);
  
  if (event.key === "r" || event.key === "R") {
    // Reset zoom with 'R' key
    if (globalSvg && globalZoom) {
      globalSvg.transition()
        .duration(750)
        .call(globalZoom.transform, d3.zoomIdentity);
    }
  } else if (event.key === "+" || event.key === "=") {
    // Zoom in with '+' key
    if (globalSvg && globalZoom) {
      globalSvg.transition()
        .duration(200)
        .call(globalZoom.scaleBy, 1.5);
    }
  } else if (event.key === "-" || event.key === "_") {
    // Zoom out with '-' key
    if (globalSvg && globalZoom) {
      globalSvg.transition()
        .duration(200)
        .call(globalZoom.scaleBy, 1 / 1.5);
    }
  } else if (event.key === "h" || event.key === "H") {
    // Toggle legend with 'H' key (Help/legend)
    event.preventDefault();
    toggleLegend();
  } else if (event.key === "?" || event.key === "/") {
    // Toggle instructions with '?' key (Help/instructions)
    event.preventDefault();
    toggleInstructions();
  } else if (event.key === "p" || event.key === "P") {
    // Toggle right panel with 'P' key
    event.preventDefault();
    togglePanel('nodeDetailsPanel');
  } else if (event.key === "q" || event.key === "Q") {
    // Toggle query panel with 'Q' key
    event.preventDefault();
    togglePanel('queryContainer');
  }
});

function addInstructions(svg) {
  const instructions = svg.append("g")
    .attr("class", "instructions")
    .attr("transform", "translate(20, 300)");

  const instructionData = [
    "🔍 Scroll to zoom in/out",
    "🖱️ Click and drag to pan",
    "🎯 Drag nodes to reposition", 
    "📍 Click 'Reset Zoom' or press R",
    "⌨️ Use +/- keys to zoom",
    "📊 Use SPARQL panel below to query data",
    "🔤 Press H to toggle legend",
    "❓ Press ? to toggle instructions",
    "📋 Press P to toggle details panel",
    "🔍 Press Q to toggle query panel"
  ];

  const instructionItems = instructions.selectAll(".instruction-item")
    .data(instructionData)
    .enter().append("g")
    .attr("class", "instruction-item")
    .attr("transform", (d, i) => `translate(0, ${i * 16})`);

  instructionItems.append("text")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "0.35em")
    .style("font-size", "10px")
    .style("fill", "#666")
    .text(d => d);

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

function createLegend(svg) {
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(20, 20)");

  const legendData = Object.entries(colorScheme)
    .filter(([type]) => type !== 'default')
    .slice(0, 15); // Show first 15 types to avoid overcrowding

  const legendItems = legend.selectAll(".legend-item")
    .data(legendData)
    .enter().append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 18})`);

  legendItems.append("circle")
    .attr("r", 6)
    .attr("cx", 8)
    .attr("cy", 0)
    .style("fill", d => d[1])
    .style("stroke", "#333")
    .style("stroke-width", "1px");

  legendItems.append("text")
    .attr("x", 20)
    .attr("y", 0)
    .attr("dy", "0.35em")
    .style("font-size", "11px")
    .style("fill", "#333")
    .text(d => d[0]);

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

function initializeSPARQL() {
  // Check if Yasgui is already initialized to prevent duplicate initialization
  if (yasgui && document.querySelector('#yasgui .yasgui')) {
    console.log("Yasgui already initialized, skipping...");
    return;
  }

  // Clear any existing Yasgui content
  const yasguiContainer = document.getElementById("yasgui");
  if (yasguiContainer) {
    yasguiContainer.innerHTML = '';
  }

  // Register JSON-LD plugin before initializing Yasgui
  registerJsonLdPlugin();
  registerTurtlePlugin();
  registerTrigPlugin();

  // Initialize Yasgui with proper endpoint
  yasgui = new Yasgui(document.getElementById("yasgui"), {
    requestConfig: {
      endpoint: "http://localhost:8000/sparql",
      method: "POST"
    },
    copyEndpointOnNewTab: false
  });

  // Set default query
  yasgui.getTab().yasqe.setValue(`PREFIX dct: <http://purl.org/dc/terms/>
PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>

SELECT ?subject ?type ?identifier WHERE {
  ?subject a ?type .
  OPTIONAL { ?subject dct:identifier ?identifier }
} 
LIMIT 20`);

  // Add sample queries after a short delay to ensure Yasgui is fully initialized
  setTimeout(() => {
    addSampleQueries();
    addCustomTabButtons();
  }, 500);
}

function addSampleQueries() {
  console.log("addSampleQueries called");
  
  // Check if yasgui is properly initialized
  if (!yasgui) {
    console.error("Yasgui not initialized");
    return;
  }
  
  const sampleQueries = [
    {
      name: "Servers & VMs",
      query: `PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?server ?type ?identifier WHERE {
  ?server a ?type .
  ?server dct:identifier ?identifier .
  FILTER(CONTAINS(STR(?type), "Server"))
}`
    },
    {
      name: "Applications",
      query: `PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?app ?identifier ?version WHERE {
  ?app a devops:Application .
  ?app dct:identifier ?identifier .
  OPTIONAL { ?app devops:hasVersion ?version }
}`
    },
    {
      name: "Dependencies",
      query: `PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?source ?target ?relation WHERE {
  ?source ?relation ?target .
  FILTER(?relation IN (devops:dependsOn, devops:deployedOn, devops:hostedOn))
}`
    }
  ];

  console.log("Attempting to add", sampleQueries.length, "sample queries");

  sampleQueries.forEach((sample, index) => {
    setTimeout(() => {
      try {
        console.log(`Adding tab: ${sample.name}`);
        
        // Try the simplest approach first
        yasgui.addTab();
        const currentTab = yasgui.getTab();
        
        if (currentTab && currentTab.yasqe) {
          currentTab.yasqe.setValue(sample.query);
          console.log(`Successfully added sample query tab: ${sample.name}`);
        } else {
          console.error(`Failed to get current tab for: ${sample.name}`);
        }
      } catch (error) {
        console.error(`Error adding sample query tab ${sample.name}:`, error);
      }
    }, index * 200); // Stagger the tab creation
  });

  console.log("Finished setting up sample queries");
}

function addCustomTabButtons() {
  console.log("Adding custom tab buttons as fallback");
  
  // Find the yasgui container
  const yasguiContainer = document.getElementById("yasgui");
  if (!yasguiContainer) {
    console.error("Yasgui container not found");
    return;
  }
  
  // Create a custom tab bar above yasgui
  const customTabBar = document.createElement('div');
  customTabBar.id = 'custom-sample-tabs';
  
  const sampleQueries = [
    {
      name: "Servers & VMs",
      query: `PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?server ?type ?identifier WHERE {
  ?server a ?type .
  ?server dct:identifier ?identifier .
  FILTER(CONTAINS(STR(?type), "Server"))
}`
    },
    {
      name: "Applications",
      query: `PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?app ?identifier ?version WHERE {
  ?app a devops:Application .
  ?app dct:identifier ?identifier .
  OPTIONAL { ?app devops:hasVersion ?version }
}`
    },
    {
      name: "Dependencies",
      query: `PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?source ?target ?relation WHERE {
  ?source ?relation ?target .
  FILTER(?relation IN (devops:dependsOn, devops:deployedOn, devops:hostedOn))
}`
    }
  ];
  
  // Create buttons for each sample query
  sampleQueries.forEach((sample, index) => {
    const button = document.createElement('button');
    button.textContent = sample.name;
    
    button.onclick = () => {
      if (yasgui && yasgui.getTab() && yasgui.getTab().yasqe) {
        yasgui.getTab().yasqe.setValue(sample.query);
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
    if (yasgui && yasgui.getTab() && yasgui.getTab().yasqe) {
      yasgui.getTab().yasqe.setValue(`PREFIX dct: <http://purl.org/dc/terms/>
PREFIX devops: <https://w3id.org/devops-infra/>
PREFIX ex: <https://example.org/devops/>

SELECT ?subject ?type ?identifier WHERE {
  ?subject a ?type .
  OPTIONAL { ?subject dct:identifier ?identifier }
} 
LIMIT 20`);
      console.log("Reset to default query");
    }
  };
  
  customTabBar.appendChild(resetButton);
  
  // Insert the custom tab bar before the yasgui container
  yasguiContainer.parentNode.insertBefore(customTabBar, yasguiContainer);
  
  console.log("Custom tab buttons added successfully");
}

// Add resize functionality for the panels
function initializeResize() {
  // Horizontal resize handle for bottom panel
  const resizeHandle = document.getElementById('resizeHandle');
  const graphContainer = document.querySelector('.graph-container');
  const queryContainer = document.querySelector('.query-container');
  let isResizing = false;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.addEventListener('mousemove', handleHorizontalResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
  });

  function handleHorizontalResize(e) {
    if (!isResizing) return;
    
    const containerHeight = document.querySelector('.container').clientHeight;
    const newGraphHeight = e.clientY;
    const newQueryHeight = containerHeight - newGraphHeight - resizeHandle.clientHeight;
    
    if (newGraphHeight > 200 && newQueryHeight > 100) {
      graphContainer.style.flex = `0 0 ${newGraphHeight}px`;
      queryContainer.style.flex = `0 0 ${newQueryHeight}px`;
    }
  }

  // Vertical resize handle for right panel
  const verticalResizeHandle = document.getElementById('verticalResizeHandle');
  const graphMain = document.querySelector('.graph-main');
  const nodeDetailsPanel = document.querySelector('.node-details-panel');
  let isVerticalResizing = false;

  verticalResizeHandle.addEventListener('mousedown', (e) => {
    isVerticalResizing = true;
    document.addEventListener('mousemove', handleVerticalResize);
    document.addEventListener('mouseup', stopVerticalResize);
    e.preventDefault();
  });

  function handleVerticalResize(e) {
    if (!isVerticalResizing) return;
    
    const containerWidth = graphContainer.clientWidth;
    const newMainWidth = e.clientX;
    const newPanelWidth = containerWidth - newMainWidth - verticalResizeHandle.clientWidth;
    
    if (newMainWidth > 300 && newPanelWidth > 200) {
      graphMain.style.flex = `0 0 ${newMainWidth}px`;
      nodeDetailsPanel.style.width = `${newPanelWidth}px`;
    }
  }

  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleHorizontalResize);
    document.removeEventListener('mouseup', stopResize);
  }

  function stopVerticalResize() {
    isVerticalResizing = false;
    document.removeEventListener('mousemove', handleVerticalResize);
    document.removeEventListener('mouseup', stopVerticalResize);
  }
}

// Initialize resize functionality when the page loads
document.addEventListener('DOMContentLoaded', initializeResize);

function registerJsonLdPlugin() {
  // Create JSON-LD plugin for Yasr
  const JsonLdPlugin = {
    // Plugin configuration
    getIcon: function() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    },
    
    label: "JSON-LD",
    
    priority: 5,
    
    // Check if this plugin can handle the current result
    canHandleResults: function(yasr) {
      return yasr && yasr.results && yasr.results.getBindings;
    },
    
    // Draw the JSON-LD output
    draw: function(yasr, options) {
      try {
        const jsonLd = convertSparqlToJsonLd(yasr.results);
        const container = yasr.getContainer();
        
        // Clear container
        container.innerHTML = '';
        
        // Create JSON-LD display
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
        
        // Add copy button
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
        
        // Add JSON content
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
        errorDiv.textContent = `Error generating JSON-LD: ${error.message}`;
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '16px';
        yasr.getContainer().appendChild(errorDiv);
        return errorDiv;
      }
    }
  };
  
  // Register the plugin with Yasr
  if (typeof Yasr !== 'undefined' && Yasr.plugins) {
    Yasr.plugins.jsonld = JsonLdPlugin;
  }
}

function registerTurtlePlugin() {
  // Create Turtle plugin for Yasr
  const TurtlePlugin = {
    // Plugin configuration
    getIcon: function() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>';
    },
    
    label: "Turtle",
    
    priority: 4,
    
    // Check if this plugin can handle the current result
    canHandleResults: function(yasr) {
      return yasr && yasr.results && yasr.results.getBindings;
    },
    
    // Draw the Turtle output
    draw: function(yasr, options) {
      try {
        const turtle = convertSparqlToTurtle(yasr.results);
        const container = yasr.getContainer();
        
        // Clear container
        container.innerHTML = '';
        
        // Create Turtle display
        const turtleContainer = document.createElement('div');
        turtleContainer.style.cssText = `
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
        
        // Add toolbar with copy button
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
        title.textContent = 'Turtle Output';
        title.style.fontWeight = 'bold';
        title.style.color = '#495057';
        
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Turtle';
        copyButton.style.cssText = `
          background: #28a745;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 11px;
          cursor: pointer;
        `;
        
        copyButton.onclick = function() {
          navigator.clipboard.writeText(turtle).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
              copyButton.textContent = 'Copy Turtle';
            }, 1500);
          });
        };
        
        toolbar.appendChild(title);
        toolbar.appendChild(copyButton);
        
        // Add Turtle content
        const turtleContent = document.createElement('div');
        turtleContent.textContent = turtle;
        turtleContent.style.color = '#212529';
        
        turtleContainer.appendChild(toolbar);
        turtleContainer.appendChild(turtleContent);
        container.appendChild(turtleContainer);
        
        return turtleContainer;
        
      } catch (error) {
        console.error('Error rendering Turtle:', error);
        const errorDiv = document.createElement('div');
        errorDiv.textContent = `Error generating Turtle: ${error.message}`;
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '16px';
        yasr.getContainer().appendChild(errorDiv);
        return errorDiv;
      }
    }
  };
  
  // Register the plugin with Yasr
  if (typeof Yasr !== 'undefined' && Yasr.plugins) {
    Yasr.plugins.turtle = TurtlePlugin;
  }
}

function registerTrigPlugin() {
  // Create TriG plugin for Yasr
  const TrigPlugin = {
    // Plugin configuration
    getIcon: function() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/><path d="M12,12H16V14H12V12M12,16H16V18H12V16Z"/></svg>';
    },
    
    label: "TriG",
    
    priority: 3,
    
    // Check if this plugin can handle the current result
    canHandleResults: function(yasr) {
      return yasr && yasr.results && yasr.results.getBindings;
    },
    
    // Draw the TriG output
    draw: function(yasr, options) {
      try {
        const trig = convertSparqlToTrig(yasr.results);
        const container = yasr.getContainer();
        
        // Clear container
        container.innerHTML = '';
        
        // Create TriG display
        const trigContainer = document.createElement('div');
        trigContainer.style.cssText = `
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
        
        // Add toolbar with copy button
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
        title.textContent = 'TriG Output';
        title.style.fontWeight = 'bold';
        title.style.color = '#495057';
        
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy TriG';
        copyButton.style.cssText = `
          background: #6f42c1;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 11px;
          cursor: pointer;
        `;
        
        copyButton.onclick = function() {
          navigator.clipboard.writeText(trig).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
              copyButton.textContent = 'Copy TriG';
            }, 1500);
          });
        };
        
        toolbar.appendChild(title);
        toolbar.appendChild(copyButton);
        
        // Add TriG content
        const trigContent = document.createElement('div');
        trigContent.textContent = trig;
        trigContent.style.color = '#212529';
        
        trigContainer.appendChild(toolbar);
        trigContainer.appendChild(trigContent);
        container.appendChild(trigContainer);
        
        return trigContainer;
        
      } catch (error) {
        console.error('Error rendering TriG:', error);
        const errorDiv = document.createElement('div');
        errorDiv.textContent = `Error generating TriG: ${error.message}`;
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '16px';
        yasr.getContainer().appendChild(errorDiv);
        return errorDiv;
      }
    }
  };
  
  // Register the plugin with Yasr
  if (typeof Yasr !== 'undefined' && Yasr.plugins) {
    Yasr.plugins.trig = TrigPlugin;
  }
}

// Node selection and details panel functionality
let selectedNode = null;
let selectedElement = null;

function selectNode(nodeData, element) {
  // Clear previous selection
  if (selectedElement) {
    d3.select(selectedElement)
      .classed("selected", false)
      .style("stroke", "#333")
      .style("stroke-width", "2px");
  }

  // Set new selection
  selectedNode = nodeData;
  selectedElement = element;
  
  // Highlight selected node
  d3.select(element)
    .classed("selected", true)
    .style("stroke", "#007bff")
    .style("stroke-width", "4px");

  // Populate details panel
  populateNodeDetails(nodeData);
}  function populateNodeDetails(nodeData) {
    const panel = document.getElementById('nodeDetailsContent');
    
    // Extract node name from URI
    const nodeName = nodeData.id.split('/').pop();
    
    // Get properties (literals) for this node
    const properties = [];
    const inboundRelations = [];
    const outboundRelations = [];
    
    // Use the global variables to find relations
    links.forEach(link => {
      const predicateName = link.label ? link.label.split('/').pop().split('#').pop() : 'connected to';
      
      // Handle both string IDs and object references (after simulation starts)
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      if (sourceId === nodeData.id) {
        // Outbound relation
        const targetName = targetId.split('/').pop();
        outboundRelations.push({
          predicate: predicateName,
          target: targetName,
          targetId: targetId
        });
      } else if (targetId === nodeData.id) {
        // Inbound relation
        const sourceName = sourceId.split('/').pop();
        inboundRelations.push({
          predicate: predicateName,
          source: sourceName,
          sourceId: sourceId
        });
      }
    });

    // Generate HTML for the panel
    let html = `
      <h3>${nodeName}</h3>
      <div class="property-item">
        <span class="property-label">Type:</span>
        <span class="property-value">${nodeData.type}</span>
      </div>
      <div class="property-item">
        <span class="property-label">URI:</span>
        <span class="property-value" style="font-size: 11px; word-break: break-all;">${nodeData.id}</span>
      </div>
    `;

    if (properties.length > 0) {
      html += '<h4>Properties</h4><div class="property-list">';
      properties.forEach(prop => {
        html += `
          <div class="property-item">
            <span class="property-label">${prop.predicate}:</span>
            <span class="property-value">${prop.value}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    if (outboundRelations.length > 0) {
      html += '<h4>Outbound Relations</h4><div class="property-list">';
      outboundRelations.forEach(rel => {
        html += `
          <div class="relation-item" data-target-id="${rel.targetId}">
            <span class="relation-predicate">${rel.predicate}</span>
            <span class="relation-target">→ ${rel.target}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    if (inboundRelations.length > 0) {
      html += '<h4>Inbound Relations</h4><div class="property-list">';
      inboundRelations.forEach(rel => {
        html += `
          <div class="relation-item" data-target-id="${rel.sourceId}">
            <span class="relation-predicate">${rel.predicate}</span>
            <span class="relation-target">${rel.source} →</span>
          </div>
        `;
      });
      html += '</div>';
    }

    if (outboundRelations.length === 0 && inboundRelations.length === 0) {
      html += '<h4>Relations</h4><div class="no-selection">No relations found</div>';
    }

    panel.innerHTML = html;
    
    // Add event listeners for relation items
    panel.querySelectorAll('.relation-item').forEach(item => {
      item.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target-id');
        if (targetId) {
          console.log('Clicking relation to navigate to:', targetId);
          highlightNode(targetId);
        }
      });
    });
  }

// Clear selection when clicking on empty space
svg.on("click", function(event) {
  if (event.target === this) {
    if (selectedElement) {
      d3.select(selectedElement)
        .classed("selected", false)
        .style("stroke", "#333")
        .style("stroke-width", "2px");
    }
    selectedNode = null;
    selectedElement = null;
    
    document.getElementById('nodeDetailsContent').innerHTML = `
      <div class="no-selection">
        Click on a node to view its details
      </div>
    `;
  }
});

// Panel management functions
function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  const toggleButton = document.getElementById(panelId + 'Toggle');
  
  if (panel.classList.contains('collapsed')) {
    panel.classList.remove('collapsed');
    if (panelId === 'nodeDetailsPanel') {
      toggleButton.textContent = '⟨';
    } else if (panelId === 'queryContainer') {
      toggleButton.textContent = '⌄';
    }
  } else {
    panel.classList.add('collapsed');
    if (panelId === 'nodeDetailsPanel') {
      toggleButton.textContent = '⟩';
    } else if (panelId === 'queryContainer') {
      toggleButton.textContent = '⌃';
    }
  }
}

// Legend and instructions visibility
let legendVisible = true;
let instructionsVisible = true;

function toggleLegend() {
  console.log("toggleLegend called");
  const legend = document.querySelector('.legend');
  console.log("Legend element:", legend);
  if (legend) {
    legendVisible = !legendVisible;
    legend.classList.toggle('hidden', !legendVisible);
    console.log(`Legend ${legendVisible ? 'shown' : 'hidden'}`);
  } else {
    console.error("Legend element not found");
  }
}

function toggleInstructions() {
  console.log("toggleInstructions called");
  const instructions = document.querySelector('.instructions');
  console.log("Instructions element:", instructions);
  if (instructions) {
    instructionsVisible = !instructionsVisible;
    instructions.classList.toggle('hidden', !instructionsVisible);
    console.log(`Instructions ${instructionsVisible ? 'shown' : 'hidden'}`);
  } else {
    console.error("Instructions element not found");
  }
}

// Helper function to shorten URIs using prefixes
function shortenUri(uri, prefixes) {
  if (!uri || !prefixes) return uri;
  
  for (const prefix in prefixes) {
    const namespace = prefixes[prefix];
    if (uri.startsWith(namespace)) {
      return `${prefix}:${uri.substring(namespace.length)}`;
    }
  }
  
  // Common prefixes not always in the query
  const commonPrefixes = {
    'xsd': 'http://www.w3.org/2001/XMLSchema#',
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'owl': 'http://www.w3.org/2002/07/owl#',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'dct': 'http://purl.org/dc/terms/',
    'foaf': 'http://xmlns.com/foaf/0.1/',
    'skos': 'http://www.w3.org/2004/02/skos/core#'
  };
  
  for (const prefix in commonPrefixes) {
    const namespace = commonPrefixes[prefix];
    if (uri.startsWith(namespace)) {
      return `${prefix}:${uri.substring(namespace.length)}`;
    }
  }
  
  return uri;
}

// Make functions globally accessible
window.togglePanel = togglePanel;
window.toggleLegend = toggleLegend;
window.toggleInstructions = toggleInstructions;

