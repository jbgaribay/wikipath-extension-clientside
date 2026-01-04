// Popup script for WikiPath extension

let currentSessionData = null;
let isTracking = true;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadSessionData();
  setupEventListeners();
  
  // Refresh data every 2 seconds while popup is open
  setInterval(loadSessionData, 2000);
});

// Load session data from background
async function loadSessionData() {
  try {
    const data = await chrome.runtime.sendMessage({ action: 'getSessionData' });
    currentSessionData = data.currentSession;
    isTracking = data.isTracking !== false; // Default to true
    
    updateUI(data);
  } catch (error) {
    console.error('Error loading session data:', error);
  }
}

// Update UI with current data
function updateUI(data) {
  const { currentSession, sessions, isTracking } = data;
  
  // Update tracking status
  updateTrackingStatus(isTracking);
  
  // Update stats
  if (currentSession && currentSession.visits.length > 0) {
    updateStats(currentSession);
    updateArticleList(currentSession.visits);
    document.getElementById('viewJourney').disabled = false;
  } else {
    resetStats();
    document.getElementById('viewJourney').disabled = true;
  }
  
  // Update sessions count
  const sessionsCount = sessions ? sessions.length : 0;
  document.getElementById('sessionsCount').textContent = 
    `${sessionsCount} past session${sessionsCount !== 1 ? 's' : ''} saved`;
}

// Update tracking status indicator
function updateTrackingStatus(tracking) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const toggleBtn = document.getElementById('toggleTracking');
  
  if (tracking) {
    statusDot.classList.remove('inactive');
    statusText.textContent = 'Tracking active';
    toggleBtn.textContent = 'Pause Tracking';
  } else {
    statusDot.classList.add('inactive');
    statusText.textContent = 'Tracking paused';
    toggleBtn.textContent = 'Resume Tracking';
  }
}

// Update statistics
function updateStats(session) {
  const visitCount = session.visits.length;
  const duration = calculateDuration(session.startedAt);
  
  document.getElementById('visitCount').textContent = visitCount;
  document.getElementById('duration').textContent = duration;
}

// Reset statistics
function resetStats() {
  document.getElementById('visitCount').textContent = '0';
  document.getElementById('duration').textContent = '0m';
  
  const articleList = document.getElementById('articleList');
  articleList.innerHTML = '<p class="empty-state">Start browsing Wikipedia to see your journey!</p>';
}

// Calculate session duration
function calculateDuration(startTime) {
  const now = Date.now();
  const diffMs = now - startTime;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins}m`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  }
}

// Update article list
function updateArticleList(visits) {
  const articleList = document.getElementById('articleList');
  
  // Show last 5 articles
  const recentVisits = visits.slice(-5).reverse();
  
  if (recentVisits.length === 0) {
    articleList.innerHTML = '<p class="empty-state">No articles visited yet</p>';
    return;
  }
  
  articleList.innerHTML = recentVisits.map((visit, index) => {
    const isFirst = index === 0;
    return `
      <div class="article-item">
        ${!isFirst ? '<span class="arrow">↓</span>' : '<span class="arrow">📍</span>'}
        <span class="title" title="${visit.article}">${visit.article}</span>
      </div>
    `;
  }).join('');
}

// Setup event listeners
function setupEventListeners() {
  // Toggle tracking
  document.getElementById('toggleTracking').addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'toggleTracking' });
      isTracking = response.isTracking;
      updateTrackingStatus(isTracking);
    } catch (error) {
      console.error('Error toggling tracking:', error);
    }
  });
  
  // View journey button
  document.getElementById('viewJourney').addEventListener('click', async () => {
    try {
      const data = await chrome.runtime.sendMessage({ action: 'exportSession' });
      
      if (!data.currentSession || data.currentSession.visits.length === 0) {
        alert('No active session to visualize!');
        return;
      }
      
      // Open visualization page with session ID
      const vizUrl = chrome.runtime.getURL('visualize.html') + '?session=' + data.currentSession.id;
      chrome.tabs.create({ url: vizUrl });
    } catch (error) {
      console.error('Error opening visualization:', error);
      alert('Failed to open visualization');
    }
  });

  // View history button
  document.getElementById('viewHistory').addEventListener('click', () => {
    const historyUrl = chrome.runtime.getURL('history.html');
    chrome.tabs.create({ url: historyUrl });
  });
  
  // Clear session button
  document.getElementById('clearSession').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear the current session? This action cannot be undone.')) {
      try {
        await chrome.runtime.sendMessage({ action: 'clearSession' });
        await loadSessionData();
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    }
  });
}

// Helper function to format time
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
