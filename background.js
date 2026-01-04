// Background service worker for WikiPath extension

// Session management
let currentSession = null;
let sessionTimeout = null;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const BATCH_UPLOAD_INTERVAL = 60 * 1000; // Upload every 60 seconds

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('WikiPath extension installed');
  initializeStorage();
});

// Initialize storage structure
async function initializeStorage() {
  const data = await chrome.storage.local.get(['sessions', 'currentSession', 'isTracking']);
  
  if (!data.sessions) {
    await chrome.storage.local.set({ sessions: [] });
  }
  if (data.isTracking === undefined) {
    await chrome.storage.local.set({ isTracking: true });
  }
}

// Generate unique session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Start a new session
async function startNewSession() {
  const sessionId = generateSessionId();
  currentSession = {
    id: sessionId,
    startedAt: Date.now(),
    visits: [],
    lastActivity: Date.now()
  };
  
  await chrome.storage.local.set({ currentSession });
  console.log('Started new session:', sessionId);
  return currentSession;
}

// End current session
async function endSession() {
  if (!currentSession) return;
  
  currentSession.endedAt = Date.now();
  
  // Save to sessions history
  const { sessions } = await chrome.storage.local.get('sessions');
  sessions.push(currentSession);
  await chrome.storage.local.set({ sessions, currentSession: null });
  
  console.log('Ended session:', currentSession.id);
  currentSession = null;
}

// Reset session timeout
function resetSessionTimeout() {
  if (sessionTimeout) {
    clearTimeout(sessionTimeout);
  }
  
  sessionTimeout = setTimeout(() => {
    console.log('Session timed out due to inactivity');
    endSession();
  }, SESSION_TIMEOUT_MS);
}

// Extract article title from Wikipedia URL
function extractArticleInfo(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const wikiIndex = pathParts.indexOf('wiki');
    
    if (wikiIndex !== -1 && pathParts[wikiIndex + 1]) {
      const articleTitle = decodeURIComponent(pathParts[wikiIndex + 1]);
      const language = urlObj.hostname.split('.')[0];
      
      return {
        title: articleTitle.replace(/_/g, ' '),
        url: url,
        language: language
      };
    }
  } catch (e) {
    console.error('Error parsing Wikipedia URL:', e);
  }
  return null;
}

// Check if URL is a Wikipedia article
function isWikipediaArticle(url) {
  if (!url) return false;
  
  // Match Wikipedia article URLs, exclude special pages
  const wikiArticleRegex = /^https?:\/\/[a-z]{2,3}\.wikipedia\.org\/wiki\/[^:]+$/;
  return wikiArticleRegex.test(url);
}

// Track a page visit
async function trackPageVisit(tabId, url, referrer = null) {
  const { isTracking } = await chrome.storage.local.get('isTracking');
  if (!isTracking) return;
  
  const articleInfo = extractArticleInfo(url);
  if (!articleInfo) return;
  
  // Start new session if needed
  if (!currentSession) {
    await startNewSession();
  }
  
  // Create visit record
  const visit = {
    article: articleInfo.title,
    url: articleInfo.url,
    language: articleInfo.language,
    timestamp: Date.now(),
    referrer: referrer,
    tabId: tabId
  };
  
  currentSession.visits.push(visit);
  currentSession.lastActivity = Date.now();
  
  // Update storage
  await chrome.storage.local.set({ currentSession });
  
  // Reset inactivity timeout
  resetSessionTimeout();
  
  console.log('Tracked visit:', visit.article);
  
  // Update badge with visit count
  chrome.action.setBadgeText({ text: currentSession.visits.length.toString() });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
}

// Listen for tab updates (navigation)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when page is fully loaded
  if (changeInfo.status !== 'complete') return;
  
  const url = tab.url;
  if (!isWikipediaArticle(url)) return;
  
  // Get the previous article from this tab (if any)
  let referrer = null;
  if (currentSession) {
    const previousVisits = currentSession.visits.filter(v => v.tabId === tabId);
    if (previousVisits.length > 0) {
      referrer = previousVisits[previousVisits.length - 1].article;
    }
  }
  
  await trackPageVisit(tabId, url, referrer);
});

// Listen for tab closure to potentially end session
chrome.tabs.onRemoved.addListener(async (tabId) => {
  // Check if there are any remaining Wikipedia tabs
  const tabs = await chrome.tabs.query({ url: '*://*.wikipedia.org/*' });
  
  if (tabs.length === 0 && currentSession) {
    console.log('No Wikipedia tabs remaining, ending session');
    await endSession();
    chrome.action.setBadgeText({ text: '' });
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSessionData') {
    chrome.storage.local.get(['currentSession', 'sessions', 'isTracking']).then(data => {
      sendResponse(data);
    });
    return true; // Required for async response
  }
  
  if (message.action === 'toggleTracking') {
    chrome.storage.local.get('isTracking').then(async ({ isTracking }) => {
      const newState = !isTracking;
      await chrome.storage.local.set({ isTracking: newState });
      sendResponse({ isTracking: newState });
    });
    return true;
  }
  
  if (message.action === 'clearSession') {
    endSession().then(() => {
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === 'exportSession') {
    chrome.storage.local.get(['currentSession', 'sessions']).then(data => {
      sendResponse(data);
    });
    return true;
  }
});

console.log('WikiPath background service worker loaded');
