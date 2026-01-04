let selectedNode = null;

// Get session data from URL params or chrome storage
async function loadSessionData() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session');

  if (sessionId) {
    // Get from chrome storage
    const data = await chrome.storage.local.get(['currentSession', 'sessions']);
    
    let session;
    if (data.currentSession && data.currentSession.id === sessionId) {
      session = data.currentSession;
    } else if (data.sessions) {
      session = data.sessions.find(s => s.id === sessionId);
    }

    if (session) {
      return transformToGraphData(session);
    }
  }

  throw new Error('Session not found');
}

// Transform session to graph format
function transformToGraphData(session) {
  const nodes = new Map();
  const edges = [];

  session.visits.forEach((visit, index) => {
    // Add node if not exists
    if (!nodes.has(visit.article)) {
      nodes.set(visit.article, {
        id: visit.article,
        label: visit.article,
        url: visit.url,
        language: visit.language || 'en',
        visitCount: 0,
        firstVisit: visit.timestamp
      });
    }

    // Increment visit count
    nodes.get(visit.article).visitCount++;

    // Add edge from referrer
    if (visit.referrer && visit.referrer !== visit.article) {
      edges.push({
        source: visit.referrer,
        target: visit.article,
        timestamp: visit.timestamp,
        order: index
      });
    }
  });

  return {
    sessionId: session.id,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    nodes: Array.from(nodes.values()),
    edges: edges
  };
}

// Format date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format duration
function formatDuration(start, end) {
  if (!end) return 'In progress';
  const diffMs = end - start;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
}

// Get node color
function getNodeColor(visitCount) {
  const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];
  return colors[Math.min(visitCount - 1, colors.length - 1)];
}

// Truncate text
function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Show node details
function showNodeDetails(node) {
  selectedNode = node;
  
  // Remove existing panel
  const existing = document.querySelector('.node-panel');
  if (existing) existing.remove();

  // Create panel
  const panel = document.createElement('div');
  panel.className = 'node-panel';
  panel.innerHTML = `
    <button class="close-button" id="closeNodePanel">×</button>
    <h3>${node.label}</h3>
    <div class="panel-stats">
      <div class="panel-stat">
        <span class="panel-stat-label">Visits:</span>
        <span class="panel-stat-value">${node.visitCount}</span>
      </div>
      <div class="panel-stat">
        <span class="panel-stat-label">Language:</span>
        <span class="panel-stat-value">${node.language}</span>
      </div>
    </div>
    <a href="${node.url}" target="_blank" class="wiki-link">
      View on Wikipedia →
    </a>
  `;
  
  document.body.appendChild(panel);
  
  // Add event listener to close button
  document.getElementById('closeNodePanel').addEventListener('click', hideNodeDetails);
}

// Hide node details
function hideNodeDetails() {
  const panel = document.querySelector('.node-panel');
  if (panel) panel.remove();
  selectedNode = null;
}

// Render graph
function renderGraph(data) {
  document.getElementById('loading').style.display = 'none';

  // Update session info
  const sessionInfo = document.getElementById('sessionInfo');
  sessionInfo.innerHTML = `
    <div class="info-item">
      <span class="info-label">Started:</span>
      <span class="info-value">${formatDate(data.startedAt)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Duration:</span>
      <span class="info-value">${formatDuration(data.startedAt, data.endedAt)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Articles:</span>
      <span class="info-value">${data.nodes.length}</span>
    </div>
  `;

  const width = window.innerWidth;
  const height = window.innerHeight - 70;

  const svg = d3.select('#graph')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height]);

  const g = svg.append('g');

  // Zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  // Create copies of data
  const nodes = data.nodes.map(d => ({...d}));
  const links = data.edges.map(d => ({...d}));

  // Force simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(40));

  // Arrow marker
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 25)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .append('path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#999');

  // Links
  const link = g.append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('class', 'link')
    .attr('marker-end', 'url(#arrowhead)');

  // Node groups
  const node = g.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  // Circles
  node.append('circle')
    .attr('class', 'node')
    .attr('r', d => Math.max(20, Math.min(40, 20 + d.visitCount * 5)))
    .attr('fill', d => getNodeColor(d.visitCount))
    .attr('stroke', '#fff')
    .attr('stroke-width', 3)
    .on('click', (event, d) => {
      event.stopPropagation();
      showNodeDetails(d);
    });

  // Labels
  node.append('text')
    .attr('class', 'node-label')
    .attr('text-anchor', 'middle')
    .attr('dy', 50)
    .text(d => truncateText(d.label, 15));

  // Simulation tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Drag functions
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  // Auto-fit
  setTimeout(() => {
    const bounds = g.node().getBBox();
    const fullWidth = bounds.width;
    const fullHeight = bounds.height;
    const midX = bounds.x + fullWidth / 2;
    const midY = bounds.y + fullHeight / 2;

    const scale = 0.9 / Math.max(fullWidth / width, fullHeight / height);
    const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
  }, 500);

  // Click background to close panel
  svg.on('click', hideNodeDetails);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Add event listener to close button
  document.querySelector('.back-button').addEventListener('click', () => {
    window.close();
  });

  // Load and render session data
  loadSessionData()
    .then(data => renderGraph(data))
    .catch(err => {
      console.error('Error loading session:', err);
      document.getElementById('loading').innerHTML = `
        <div style="color: #dc3545;">
          <h2>Error Loading Session</h2>
          <p>${err.message}</p>
        </div>
      `;
    });
});