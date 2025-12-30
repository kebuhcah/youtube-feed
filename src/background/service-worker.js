import { MESSAGE_TYPES } from '../shared/constants.js';
import { fetchVideoDetails, validateApiKey, estimateQuotaUsage } from './api-handler.js';
import {
  saveVideos,
  getVideos,
  clearVideos,
  getSettings,
  saveSettings,
  getFilters,
  saveFilters,
  getStorageUsage,
  getAvailableLanguages,
  getAvailableCountries,
  getLastCaptureTimestamp
} from './storage-manager.js';

console.log('[YouTube Feed Organizer] Service worker loaded');

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async response
});

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  // Open feed page in new tab
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/pages/feed/feed.html')
  });
});

// Main message router
async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      // From content script
      case MESSAGE_TYPES.CAPTURE_VIDEOS:
        await handleCaptureVideos(message.data, sendResponse);
        break;

      case MESSAGE_TYPES.CAPTURE_PROGRESS:
        // Forward progress to all feed pages
        broadcastToFeedPages(message);
        sendResponse({ success: true });
        break;

      case MESSAGE_TYPES.CAPTURE_ERROR:
        console.error('[Service Worker] Capture error:', message.data);
        broadcastToFeedPages(message);
        sendResponse({ success: true });
        break;

      // From feed page
      case MESSAGE_TYPES.GET_VIDEOS:
        await handleGetVideos(message.data, sendResponse);
        break;

      case MESSAGE_TYPES.GET_SETTINGS:
        await handleGetSettings(sendResponse);
        break;

      case MESSAGE_TYPES.TRIGGER_CAPTURE:
        await handleTriggerCapture(message.data, sendResponse);
        break;

      case MESSAGE_TYPES.CLEAR_VIDEOS:
        await handleClearVideos(sendResponse);
        break;

      // From options page
      case MESSAGE_TYPES.SAVE_SETTINGS:
        await handleSaveSettings(message.data, sendResponse);
        break;

      case MESSAGE_TYPES.VALIDATE_API_KEY:
        await handleValidateApiKey(message.data, sendResponse);
        break;

      default:
        console.warn('[Service Worker] Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('[Service Worker] Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle capture videos
async function handleCaptureVideos(data, sendResponse) {
  const { videoIds } = data;

  if (!videoIds || videoIds.length === 0) {
    sendResponse({ success: false, error: 'No video IDs provided' });
    return;
  }

  console.log(`[Service Worker] Processing ${videoIds.length} video IDs...`);

  // Get API key
  const settings = await getSettings();
  if (!settings.apiKey) {
    sendResponse({ success: false, error: 'API key not configured' });
    broadcastToFeedPages({
      type: MESSAGE_TYPES.CAPTURE_ERROR,
      data: { error: 'API key not configured. Please go to Settings.' }
    });
    return;
  }

  // Estimate quota usage
  const quotaUsage = estimateQuotaUsage(videoIds.length);
  console.log(`[Service Worker] Estimated quota usage: ${quotaUsage} units`);

  try {
    // Fetch video details from YouTube API
    const videos = await fetchVideoDetails(videoIds, settings.apiKey);

    if (videos.length === 0) {
      sendResponse({ success: false, error: 'No videos fetched from API' });
      return;
    }

    // Save to storage
    await saveVideos(videos);

    console.log(`[Service Worker] Successfully captured ${videos.length} videos`);

    // Notify feed pages
    broadcastToFeedPages({
      type: MESSAGE_TYPES.CAPTURE_COMPLETE,
      data: {
        videoCount: videos.length,
        quotaUsed: quotaUsage
      }
    });

    sendResponse({ success: true, videoCount: videos.length });
  } catch (error) {
    console.error('[Service Worker] Error capturing videos:', error);

    broadcastToFeedPages({
      type: MESSAGE_TYPES.CAPTURE_ERROR,
      data: { error: error.message }
    });

    sendResponse({ success: false, error: error.message });
  }
}

// Handle get videos
async function handleGetVideos(data, sendResponse) {
  try {
    const filters = data?.filters || null;
    const videos = await getVideos(filters);
    const lastCaptureTimestamp = await getLastCaptureTimestamp();
    const availableLanguages = await getAvailableLanguages();
    const availableCountries = await getAvailableCountries();
    const storageUsage = await getStorageUsage();

    sendResponse({
      success: true,
      videos,
      lastCaptureTimestamp,
      availableLanguages,
      availableCountries,
      storageUsage
    });
  } catch (error) {
    console.error('[Service Worker] Error getting videos:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle get settings
async function handleGetSettings(sendResponse) {
  try {
    const settings = await getSettings();
    const filters = await getFilters();
    const storageUsage = await getStorageUsage();

    sendResponse({
      success: true,
      settings,
      filters,
      storageUsage
    });
  } catch (error) {
    console.error('[Service Worker] Error getting settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle trigger capture
async function handleTriggerCapture(data, sendResponse) {
  try {
    const settings = await getSettings();

    if (!settings.apiKey) {
      sendResponse({ success: false, error: 'API key not configured' });
      return;
    }

    // Find or create YouTube tab
    const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });

    let youtubeTab;
    if (tabs.length > 0) {
      // Use existing YouTube tab
      youtubeTab = tabs[0];
      await chrome.tabs.update(youtubeTab.id, { active: true });
    } else {
      // Create new YouTube tab
      youtubeTab = await chrome.tabs.create({ url: 'https://www.youtube.com/', active: true });

      // Wait for tab to load
      await new Promise(resolve => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === youtubeTab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        });
      });
    }

    // Send capture message to content script
    const targetCount = settings.targetVideoCount || 100;
    await chrome.tabs.sendMessage(youtubeTab.id, {
      type: 'TRIGGER_CAPTURE',
      targetCount
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error triggering capture:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle clear videos
async function handleClearVideos(sendResponse) {
  try {
    await clearVideos();
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error clearing videos:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle save settings
async function handleSaveSettings(data, sendResponse) {
  try {
    const { settings, filters } = data;

    if (settings) {
      await saveSettings(settings);
    }

    if (filters) {
      await saveFilters(filters);
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error saving settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle validate API key
async function handleValidateApiKey(data, sendResponse) {
  try {
    const { apiKey } = data;
    const isValid = await validateApiKey(apiKey);

    sendResponse({
      success: true,
      isValid,
      message: isValid ? 'API key is valid' : 'API key is invalid'
    });
  } catch (error) {
    console.error('[Service Worker] Error validating API key:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Broadcast message to all feed pages
async function broadcastToFeedPages(message) {
  try {
    const feedUrl = chrome.runtime.getURL('src/pages/feed/feed.html');
    const tabs = await chrome.tabs.query({ url: feedUrl });

    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Ignore errors (tab may be closed)
      });
    }
  } catch (error) {
    console.error('[Service Worker] Error broadcasting to feed pages:', error);
  }
}
