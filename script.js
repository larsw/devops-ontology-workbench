const parser = new N3.Parser();
const nodes = new Map();
const links = [];
const typeMap = new Map();
let yasgui;

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

function drawGraph() {
  const svg = d3.select("svg");
  const graphContainer = document.querySelector('.graph-container');
  const width = graphContainer.clientWidth;
  const height = graphContainer.clientHeight;

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

  // Add keyboard shortcuts for zoom
  d3.select("body").on("keydown", (event) => {
    if (event.key === "r" || event.key === "R") {
      // Reset zoom with 'R' key
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    } else if (event.key === "+" || event.key === "=") {
      // Zoom in with '+' key
      svg.transition()
        .duration(200)
        .call(zoom.scaleBy, 1.5);
    } else if (event.key === "-" || event.key === "_") {
      // Zoom out with '-' key
      svg.transition()
        .duration(200)
        .call(zoom.scaleBy, 1 / 1.5);
    }
  });

  // Add legend
  createLegend(svg);

  // Add instructions
  addInstructions(svg);
}

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
    "📊 Use SPARQL panel below to query data"
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

  // Add sample queries
  addSampleQueries();
}

function addSampleQueries() {
  // Check if sample queries are already added to avoid duplicates
  const existingTabs = yasgui.getTabNames();
  const sampleQueryNames = ["Servers & VMs", "Applications", "Dependencies"];
  
  // Only add sample queries if they don't already exist
  const needsToAddQueries = sampleQueryNames.some(name => !existingTabs.includes(name));
  if (!needsToAddQueries) {
    return; // Sample queries already exist, don't add duplicates
  }

  // Add some sample queries as tabs
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

  sampleQueries.forEach((sample, index) => {
    // Only add if this specific tab doesn't exist
    if (!existingTabs.includes(sample.name)) {
      yasgui.addTab(true, { 
        name: sample.name,
        requestConfig: {
          endpoint: "http://localhost:8000/sparql",
          method: "POST"
        }
      });
      const currentTab = yasgui.getTab();
      currentTab.yasqe.setValue(sample.query);
    }
  });
}

// Add resize functionality for the panels
function initializeResize() {
  const resizeHandle = document.getElementById('resizeHandle');
  const graphContainer = document.querySelector('.graph-container');
  const queryContainer = document.querySelector('.query-container');
  let isResizing = false;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
  });

  function handleResize(e) {
    if (!isResizing) return;
    
    const containerHeight = document.querySelector('.container').clientHeight;
    const newGraphHeight = e.clientY;
    const newQueryHeight = containerHeight - newGraphHeight - resizeHandle.clientHeight;
    
    if (newGraphHeight > 200 && newQueryHeight > 200) {
      graphContainer.style.flex = `0 0 ${newGraphHeight}px`;
      queryContainer.style.flex = `0 0 ${newQueryHeight}px`;
    }
  }

  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
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

function convertSparqlToJsonLd(results) {
  if (!results || !results.getBindings) {
    return { error: "No valid SPARQL results to convert" };
  }
  
  const bindings = results.getBindings();
  const variables = results.getVariables() || [];
  
  // Create JSON-LD context
  const context = {
    "@context": {
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "devops": "https://w3id.org/devops-infra/",
      "ex": "https://example.org/devops/",
      "dct": "http://purl.org/dc/terms/",
      "xsd": "http://www.w3.org/2001/XMLSchema#"
    }
  };
  
  // Convert SPARQL results to JSON-LD graph
  const graph = [];
  const processedEntities = new Set();
  
  bindings.forEach((binding, index) => {
    // Try to identify the main subject
    let subject = null;
    let subjectVar = null;
    
    // Look for variables that look like subjects (commonly 'subject', 'entity', 's', etc.)
    const subjectCandidates = ['subject', 'entity', 's', 'resource', 'item'];
    for (const candidate of subjectCandidates) {
      if (variables.includes(candidate) && binding[candidate]) {
        subject = binding[candidate];
        subjectVar = candidate;
        break;
      }
    }
    
    // If no obvious subject, use the first URI variable
    if (!subject) {
      for (const variable of variables) {
        const value = binding[variable];
        if (value && value.termType === 'NamedNode') {
          subject = value;
          subjectVar = variable;
          break;
        }
      }
    }
    
    if (subject && subject.termType === 'NamedNode') {
      const subjectId = subject.value;
      
      // Skip if we've already processed this entity
      if (processedEntities.has(subjectId)) {
        return;
      }
      processedEntities.add(subjectId);
      
      const entity = {
        "@id": subjectId
      };
      
      // Add properties from this binding
      variables.forEach(variable => {
        if (variable !== subjectVar && binding[variable]) {
          const value = binding[variable];
          const propertyName = variable;
          
          if (value.termType === 'NamedNode') {
            // URI reference
            if (propertyName === 'type') {
              entity["@type"] = value.value;
            } else {
              entity[propertyName] = { "@id": value.value };
            }
          } else if (value.termType === 'Literal') {
            // Literal value
            if (value.datatype) {
              entity[propertyName] = {
                "@value": value.value,
                "@type": value.datatype.value
              };
            } else if (value.language) {
              entity[propertyName] = {
                "@value": value.value,
                "@language": value.language
              };
            } else {
              entity[propertyName] = value.value;
            }
          } else {
            // Blank node or other
            entity[propertyName] = value.value;
          }
        }
      });
      
      graph.push(entity);
    } else {
      // If no clear subject, create a result object
      const result = {
        "@id": `_:result${index}`,
        "@type": "sparql:Result"
      };
      
      variables.forEach(variable => {
        if (binding[variable]) {
          const value = binding[variable];
          if (value.termType === 'NamedNode') {
            result[variable] = { "@id": value.value };
          } else if (value.termType === 'Literal') {
            if (value.datatype) {
              result[variable] = {
                "@value": value.value,
                "@type": value.datatype.value
              };
            } else {
              result[variable] = value.value;
            }
          } else {
            result[variable] = value.value;
          }
        }
      });
      
      graph.push(result);
    }
  });
  
  // Return JSON-LD document
  return {
    ...context,
    "@graph": graph,
    "sparql:resultCount": bindings.length,
    "sparql:variables": variables
  };
}

function convertSparqlToTurtle(results) {
  if (!results || !results.getBindings) {
    return "# No valid SPARQL results to convert";
  }
  
  const bindings = results.getBindings();
  const variables = results.getVariables() || [];
  
  // Create Turtle output with prefixes
  let turtle = `# Turtle serialization of SPARQL results
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix devops: <https://w3id.org/devops-infra/> .
@prefix ex: <https://example.org/devops/> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

`;

  // Group bindings by subject to create proper Turtle triples
  const subjectGroups = new Map();
  
  bindings.forEach((binding, index) => {
    // Try to identify the main subject (usually the first URI variable)
    let subject = null;
    let predicates = new Map();
    
    for (const variable of variables) {
      const value = binding[variable];
      if (value && value.type === 'uri') {
        if (!subject) {
          subject = value.value;
        } else {
          // This could be a predicate or object
          const predicateKey = `pred_${variable}`;
          predicates.set(predicateKey, value.value);
        }
      } else if (value) {
        // Literal or other value
        const predicateKey = `prop_${variable}`;
        predicates.set(predicateKey, formatTurtleValue(value));
      }
    }
    
    if (subject) {
      if (!subjectGroups.has(subject)) {
        subjectGroups.set(subject, new Map());
      }
      
      // Add predicates to this subject
      for (const [pred, obj] of predicates) {
        subjectGroups.get(subject).set(pred, obj);
      }
    }
  });
  
  // Generate Turtle triples
  for (const [subject, predicates] of subjectGroups) {
    turtle += `<${subject}>\n`;
    
    const predArray = Array.from(predicates.entries());
    predArray.forEach(([pred, obj], index) => {
      const isLast = index === predArray.length - 1;
      turtle += `    ${pred} ${obj}${isLast ? ' .' : ' ;'}\n`;
    });
    
    turtle += '\n';
  }
  
  return turtle;
}

function convertSparqlToTrig(results) {
  if (!results || !results.getBindings) {
    return "# No valid SPARQL results to convert";
  }
  
  const bindings = results.getBindings();
  const variables = results.getVariables() || [];
  
  // Create TriG output with prefixes and named graphs
  let trig = `# TriG serialization of SPARQL results
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix devops: <https://w3id.org/devops-infra/> .
@prefix ex: <https://example.org/devops/> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# Default graph
{
`;

  // Process bindings similar to Turtle but within a named graph
  const subjectGroups = new Map();
  
  bindings.forEach((binding, index) => {
    let subject = null;
    let predicates = new Map();
    
    for (const variable of variables) {
      const value = binding[variable];
      if (value && value.type === 'uri') {
        if (!subject) {
          subject = value.value;
        } else {
          const predicateKey = `pred_${variable}`;
          predicates.set(predicateKey, value.value);
        }
      } else if (value) {
        const predicateKey = `prop_${variable}`;
        predicates.set(predicateKey, formatTurtleValue(value));
      }
    }
    
    if (subject) {
      if (!subjectGroups.has(subject)) {
        subjectGroups.set(subject, new Map());
      }
      
      for (const [pred, obj] of predicates) {
        subjectGroups.get(subject).set(pred, obj);
      }
    }
  });
  
  // Generate TriG triples within the default graph
  for (const [subject, predicates] of subjectGroups) {
    trig += `  <${subject}>\n`;
    
    const predArray = Array.from(predicates.entries());
    predArray.forEach(([pred, obj], index) => {
      const isLast = index === predArray.length - 1;
      trig += `      ${pred} ${obj}${isLast ? ' .' : ' ;'}\n`;
    });
    
    trig += '\n';
  }
  
  trig += '}\n\n';
  
  // Add a metadata graph
  trig += `# Metadata graph
<urn:sparql:results:metadata> {
  <urn:sparql:results> a <http://www.w3.org/ns/sparql-service-description#ResultSet> ;
    <http://purl.org/dc/terms/created> "${new Date().toISOString()}"^^xsd:dateTime ;
    <http://www.w3.org/ns/sparql-service-description#resultVariable> `;
  
  variables.forEach((variable, index) => {
    trig += `"${variable}"`;
    if (index < variables.length - 1) trig += ', ';
  });
  
  trig += ' .\n}\n';
  
  return trig;
}

function formatTurtleValue(value) {
  if (!value) return '""';
  
  switch (value.type) {
    case 'uri':
      return `<${value.value}>`;
    case 'literal':
      if (value.datatype) {
        return `"${value.value}"^^<${value.datatype}>`;
      } else if (value['xml:lang']) {
        return `"${value.value}"@${value['xml:lang']}`;
      } else {
        return `"${value.value}"`;
      }
    case 'bnode':
      return `_:${value.value}`;
    default:
      return `"${value.value}"`;
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
    const panel = document.getElementById('nodeDetailsPanel');
    
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
          <div class="relation-item" onclick="highlightNode('${rel.targetId}')">
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
          <div class="relation-item" onclick="highlightNode('${rel.sourceId}')">
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
  }

// Function to highlight and select a node by ID
window.highlightNode = function(nodeId) {
  const nodeData = nodes.get(nodeId);
  if (nodeData) {
    const nodeElement = container.selectAll("circle")
      .filter(d => d.id === nodeId)
      .node();
    
    if (nodeElement) {
      selectNode(nodeData, nodeElement);
      
      // Animate to center the node
      const transform = d3.zoomTransform(svg.node());
      const [x, y] = [nodeData.x, nodeData.y];
      
      svg.transition()
        .duration(500)
        .call(zoom.transform, 
          d3.zoomIdentity
            .translate(width / 2 - x * transform.k, height / 2 - y * transform.k)
            .scale(transform.k)
        );
    }
  }
};

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
    
    document.getElementById('nodeDetailsPanel').innerHTML = `
      <div class="no-selection">
        Click on a node to view its details
      </div>
    `;
  }
});

// Add keyboard shortcuts for zoom
d3.select("body").on("keydown", (event) => {
  if (event.key === "r" || event.key === "R") {
    // Reset zoom with 'R' key
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);
  } else if (event.key === "+" || event.key === "=") {
    // Zoom in with '+' key
    svg.transition()
      .duration(200)
      .call(zoom.scaleBy, 1.5);
  } else if (event.key === "-" || event.key === "_") {
    // Zoom out with '-' key
    svg.transition()
      .duration(200)
      .call(zoom.scaleBy, 1 / 1.5);
  }
});

// Add legend
createLegend(svg);

// Add instructions
addInstructions(svg);

