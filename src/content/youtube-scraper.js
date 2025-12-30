// Content script for YouTube homepage video scraping with auto-scroll

// Check if we're on the YouTube homepage
function isYouTubeHomepage() {
  return window.location.hostname === 'www.youtube.com' &&
         (window.location.pathname === '/' || window.location.pathname === '/feed/trending');
}

// Extract video IDs from the page
function extractVideoIds() {
  const videoIds = new Set();

  // Multiple selectors for different YouTube layouts
  const selectors = [
    'a#video-title-link[href*="/watch?v="]',           // Main selector
    'a#video-title[href*="/watch?v="]',                // Alternative
    'ytd-video-renderer a[href*="/watch?v="]',         // Video renderer
    'ytd-rich-item-renderer a[href*="/watch?v="]',     // Rich item (newer layout)
    'ytd-grid-video-renderer a[href*="/watch?v="]',    // Grid layout
    'a.yt-simple-endpoint[href*="/watch?v="]'          // Generic fallback
  ];

  // Try each selector
  selectors.forEach(selector => {
    const links = document.querySelectorAll(selector);
    console.log(`[YouTube Feed Organizer] Selector "${selector}" found ${links.length} elements`);

    links.forEach(link => {
      const videoId = extractVideoIdFromUrl(link.href);
      if (videoId) videoIds.add(videoId);
    });
  });

  console.log(`[YouTube Feed Organizer] Extracted ${videoIds.size} unique video IDs`);
  return Array.from(videoIds);
}

// Extract video ID from URL
function extractVideoIdFromUrl(url) {
  const regex = /watch\?v=([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Auto-scroll to load more videos
async function autoScroll(targetCount = 100) {
  console.log('[YouTube Feed Organizer] Starting auto-scroll...');

  let previousCount = 0;
  let currentCount = 0;
  let scrollAttempts = 0;
  let noNewVideosCount = 0;
  const maxScrollAttempts = 20;
  const noNewVideosThreshold = 3;

  while (currentCount < targetCount && scrollAttempts < maxScrollAttempts) {
    // Get current video count
    currentCount = extractVideoIds().length;

    // Send progress update
    chrome.runtime.sendMessage({
      type: 'CAPTURE_PROGRESS',
      data: {
        currentCount,
        targetCount,
        status: `Loaded ${currentCount} videos...`
      }
    }).catch(() => {});

    console.log(`[YouTube Feed Organizer] Scroll ${scrollAttempts + 1}: ${currentCount} videos`);

    // Check if we got new videos
    if (currentCount === previousCount) {
      noNewVideosCount++;
      if (noNewVideosCount >= noNewVideosThreshold) {
        console.log('[YouTube Feed Organizer] No new videos after multiple scrolls, stopping');
        break;
      }
    } else {
      noNewVideosCount = 0;
    }

    previousCount = currentCount;

    // Scroll to bottom
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });

    // Wait for content to load
    await sleep(800);

    scrollAttempts++;
  }

  console.log(`[YouTube Feed Organizer] Auto-scroll complete: ${currentCount} videos`);
  return currentCount;
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle capture request from background
async function handleCaptureRequest(targetCount) {
  console.log('[YouTube Feed Organizer] Capture request received');
  console.log('[YouTube Feed Organizer] Current URL:', window.location.href);
  console.log('[YouTube Feed Organizer] Target count:', targetCount);

  if (!isYouTubeHomepage()) {
    console.error('[YouTube Feed Organizer] Not on YouTube homepage!');
    chrome.runtime.sendMessage({
      type: 'CAPTURE_ERROR',
      data: { error: 'Not on YouTube homepage. Please navigate to youtube.com/' }
    }).catch(() => {});
    return;
  }

  try {
    // Show visual feedback
    showCaptureOverlay('Capturing videos...');

    // Check initial video count
    const initialVideoIds = extractVideoIds();
    console.log(`[YouTube Feed Organizer] Initial video count: ${initialVideoIds.length}`);

    if (initialVideoIds.length === 0) {
      console.warn('[YouTube Feed Organizer] No videos found on page! YouTube layout may have changed.');
      updateCaptureOverlay('No videos found. Please refresh YouTube and try again.');
      await sleep(3000);
      hideCaptureOverlay();
      chrome.runtime.sendMessage({
        type: 'CAPTURE_ERROR',
        data: { error: 'No videos found. Please refresh YouTube homepage and try again.' }
      }).catch(() => {});
      return;
    }

    // Perform auto-scroll
    const finalCount = await autoScroll(targetCount);

    // Extract all video IDs
    const videoIds = extractVideoIds();
    console.log(`[YouTube Feed Organizer] Final video count: ${videoIds.length}`);

    // Update overlay
    updateCaptureOverlay(`Captured ${videoIds.length} videos. Fetching metadata...`);

    // Send video IDs to background
    chrome.runtime.sendMessage({
      type: 'CAPTURE_VIDEOS',
      data: { videoIds }
    }).catch(() => {});

    // Keep overlay visible briefly
    await sleep(1000);
    hideCaptureOverlay();

  } catch (error) {
    console.error('[YouTube Feed Organizer] Capture error:', error);
    chrome.runtime.sendMessage({
      type: 'CAPTURE_ERROR',
      data: { error: error.message }
    }).catch(() => {});
    hideCaptureOverlay();
  }
}

// Visual feedback overlay
function showCaptureOverlay(message) {
  let overlay = document.getElementById('ytfo-capture-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ytfo-capture-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease;
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);
  }

  overlay.textContent = message;
}

function updateCaptureOverlay(message) {
  const overlay = document.getElementById('ytfo-capture-overlay');
  if (overlay) {
    overlay.textContent = message;
  }
}

function hideCaptureOverlay() {
  const overlay = document.getElementById('ytfo-capture-overlay');
  if (overlay) {
    overlay.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRIGGER_CAPTURE') {
    const targetCount = message.targetCount || 100;
    handleCaptureRequest(targetCount);
    sendResponse({ success: true });
  }
  return true;
});

console.log('[YouTube Feed Organizer] Content script loaded');
