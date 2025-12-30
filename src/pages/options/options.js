import { STORAGE_KEYS, DEFAULT_SETTINGS, MESSAGE_TYPES } from '../../shared/constants.js';

// DOM Elements
const apiKeyInput = document.getElementById('api-key');
const toggleVisibilityBtn = document.getElementById('toggle-visibility');
const validateKeyBtn = document.getElementById('validate-key');
const saveApiKeyBtn = document.getElementById('save-api-key');
const apiStatusDiv = document.getElementById('api-status');
const targetVideoCountInput = document.getElementById('target-video-count');
const maxStoredVideosInput = document.getElementById('max-stored-videos');
const storageUsedSpan = document.getElementById('storage-used');
const storageProgressDiv = document.getElementById('storage-progress');
const clearVideosBtn = document.getElementById('clear-videos');
const saveSettingsBtn = document.getElementById('save-settings');
const saveStatusDiv = document.getElementById('save-status');
const apiHelpLink = document.getElementById('api-help-link');

// State
let settings = { ...DEFAULT_SETTINGS };

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadSettings();
  await updateStorageInfo();
  setupEventListeners();
}

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  if (result[STORAGE_KEYS.SETTINGS]) {
    settings = { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
  }

  // Populate form
  apiKeyInput.value = settings.apiKey || '';
  targetVideoCountInput.value = settings.targetVideoCount || 100;
  maxStoredVideosInput.value = settings.maxStoredVideos || 500;
}

// Setup event listeners
function setupEventListeners() {
  toggleVisibilityBtn.addEventListener('click', toggleApiKeyVisibility);
  validateKeyBtn.addEventListener('click', validateApiKey);
  saveApiKeyBtn.addEventListener('click', saveApiKey);
  clearVideosBtn.addEventListener('click', clearVideos);
  saveSettingsBtn.addEventListener('click', saveAllSettings);
  apiHelpLink.addEventListener('click', openApiSetupGuide);
}

// Toggle API key visibility
function toggleApiKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleVisibilityBtn.textContent = '🙈';
  } else {
    apiKeyInput.type = 'password';
    toggleVisibilityBtn.textContent = '👁️';
  }
}

// Validate API key
async function validateApiKey() {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showApiStatus('Please enter an API key', 'error');
    return;
  }

  showApiStatus('Validating API key...', 'info');
  validateKeyBtn.disabled = true;

  try {
    // Test API key by making a simple request
    const testUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=${apiKey}`;
    const response = await fetch(testUrl);
    const data = await response.json();

    if (response.ok && data.items) {
      showApiStatus('✓ API key is valid!', 'success');
    } else if (data.error) {
      showApiStatus(`✗ API key validation failed: ${data.error.message}`, 'error');
    } else {
      showApiStatus('✗ API key validation failed', 'error');
    }
  } catch (error) {
    showApiStatus(`✗ Error validating API key: ${error.message}`, 'error');
  } finally {
    validateKeyBtn.disabled = false;
  }
}

// Save API key
async function saveApiKey() {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showApiStatus('Please enter an API key', 'error');
    return;
  }

  settings.apiKey = apiKey;

  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
    showApiStatus('✓ API key saved successfully!', 'success');
  } catch (error) {
    showApiStatus(`✗ Error saving API key: ${error.message}`, 'error');
  }
}

// Save all settings
async function saveAllSettings() {
  const apiKey = apiKeyInput.value.trim();
  const targetVideoCount = parseInt(targetVideoCountInput.value);
  const maxStoredVideos = parseInt(maxStoredVideosInput.value);

  // Validate inputs
  if (!apiKey) {
    showSaveStatus('Please enter an API key', 'error');
    return;
  }

  if (targetVideoCount < 20 || targetVideoCount > 200) {
    showSaveStatus('Target video count must be between 20 and 200', 'error');
    return;
  }

  if (maxStoredVideos < 50 || maxStoredVideos > 1000) {
    showSaveStatus('Max stored videos must be between 50 and 1000', 'error');
    return;
  }

  // Update settings
  settings.apiKey = apiKey;
  settings.targetVideoCount = targetVideoCount;
  settings.maxStoredVideos = maxStoredVideos;

  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
    showSaveStatus('✓ All settings saved successfully!', 'success');
  } catch (error) {
    showSaveStatus(`✗ Error saving settings: ${error.message}`, 'error');
  }
}

// Clear all videos
async function clearVideos() {
  if (!confirm('Are you sure you want to delete all captured videos? This cannot be undone.')) {
    return;
  }

  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.VIDEOS]: [],
      [STORAGE_KEYS.LAST_CAPTURE_TIMESTAMP]: 0,
      [STORAGE_KEYS.CAPTURE_HISTORY]: []
    });

    await updateStorageInfo();
    showSaveStatus('✓ All videos cleared successfully!', 'success');
  } catch (error) {
    showSaveStatus(`✗ Error clearing videos: ${error.message}`, 'error');
  }
}

// Update storage info
async function updateStorageInfo() {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const mbUsed = (bytesInUse / (1024 * 1024)).toFixed(2);
    const percentage = (bytesInUse / (10 * 1024 * 1024)) * 100;

    storageUsedSpan.textContent = mbUsed;
    storageProgressDiv.style.width = `${Math.min(percentage, 100)}%`;

    // Change color if over 80%
    if (percentage > 80) {
      storageProgressDiv.style.background = '#d93025';
    } else if (percentage > 60) {
      storageProgressDiv.style.background = '#f9ab00';
    } else {
      storageProgressDiv.style.background = '#1a73e8';
    }
  } catch (error) {
    console.error('Error getting storage info:', error);
  }
}

// Show API status message
function showApiStatus(message, type) {
  apiStatusDiv.textContent = message;
  apiStatusDiv.className = `status-message ${type}`;
  apiStatusDiv.style.display = 'block';
}

// Show save status message
function showSaveStatus(message, type) {
  saveStatusDiv.textContent = message;
  saveStatusDiv.className = `status-message ${type}`;
  saveStatusDiv.style.display = 'block';

  // Auto-hide after 3 seconds
  setTimeout(() => {
    saveStatusDiv.style.display = 'none';
  }, 3000);
}

// Open API setup guide
function openApiSetupGuide(e) {
  e.preventDefault();
  chrome.tabs.create({
    url: chrome.runtime.getURL('docs/API_SETUP.md')
  });
}
