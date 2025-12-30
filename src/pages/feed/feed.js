import { MESSAGE_TYPES } from '../../shared/constants.js';
import { formatViews, formatRelativeTime, getLanguageName, getCountryName, debounce } from '../../shared/utils.js';

// State
let allVideos = [];
let filteredVideos = [];
let currentFilters = {
  selectedLanguages: [],
  selectedCountries: [],
  sortBy: 'date',
  searchQuery: ''
};
let availableLanguages = [];
let availableCountries = [];

// DOM Elements
const captureBtn = document.getElementById('capture-btn');
const settingsBtn = document.getElementById('settings-btn');
const emptyCaptureBtn = document.getElementById('empty-capture-btn');
const retryBtn = document.getElementById('retry-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');

const languageFilter = document.getElementById('language-filter');
const countryFilter = document.getElementById('country-filter');
const sortSelect = document.getElementById('sort-select');
const searchInput = document.getElementById('search-input');

const videosContainer = document.getElementById('videos-container');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');

const lastCaptureTime = document.getElementById('last-capture-time');
const videoCountNumber = document.getElementById('video-count-number');
const storageUsageText = document.getElementById('storage-usage-text');
const displayedCount = document.getElementById('displayed-count');

const captureModal = document.getElementById('capture-modal');
const captureProgress = document.getElementById('capture-progress');
const captureProgressText = document.getElementById('capture-progress-text');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupEventListeners();
  await loadVideos();
}

// Setup event listeners
function setupEventListeners() {
  captureBtn.addEventListener('click', triggerCapture);
  emptyCaptureBtn.addEventListener('click', triggerCapture);
  retryBtn.addEventListener('click', loadVideos);
  settingsBtn.addEventListener('click', openSettings);
  clearFiltersBtn.addEventListener('click', clearFilters);

  languageFilter.addEventListener('change', handleFilterChange);
  countryFilter.addEventListener('change', handleFilterChange);
  sortSelect.addEventListener('change', handleFilterChange);
  searchInput.addEventListener('input', debounce(handleSearchChange, 300));

  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
}

// Load videos from storage
async function loadVideos() {
  showLoading();

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.GET_VIDEOS
    });

    if (response.success) {
      allVideos = response.videos || [];
      availableLanguages = response.availableLanguages || [];
      availableCountries = response.availableCountries || [];

      // Update UI
      updateFilterOptions();
      applyFilters();
      updateMetadata(response);

      if (allVideos.length === 0) {
        showEmptyState();
      } else {
        showVideos();
      }
    } else {
      showError(response.error || 'Failed to load videos');
    }
  } catch (error) {
    console.error('[Feed] Error loading videos:', error);
    showError(error.message);
  }
}

// Trigger capture
async function triggerCapture() {
  showCaptureModal();

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TRIGGER_CAPTURE
    });

    if (!response.success) {
      hideCaptureModal();
      showError(response.error || 'Failed to trigger capture');
    }
    // Modal will be hidden by capture complete message
  } catch (error) {
    console.error('[Feed] Error triggering capture:', error);
    hideCaptureModal();
    showError(error.message);
  }
}

// Handle messages from background
function handleBackgroundMessage(message) {
  switch (message.type) {
    case MESSAGE_TYPES.CAPTURE_PROGRESS:
      updateCaptureProgress(message.data);
      break;

    case MESSAGE_TYPES.CAPTURE_COMPLETE:
      handleCaptureComplete(message.data);
      break;

    case MESSAGE_TYPES.CAPTURE_ERROR:
      hideCaptureModal();
      showError(message.data.error);
      break;
  }
}

// Update capture progress
function updateCaptureProgress(data) {
  const { currentCount, targetCount, status } = data;
  const percentage = (currentCount / targetCount) * 100;

  captureProgress.style.width = `${Math.min(percentage, 100)}%`;
  captureProgressText.textContent = status || `Loaded ${currentCount} videos...`;
}

// Handle capture complete
async function handleCaptureComplete(data) {
  captureProgressText.textContent = `Successfully captured ${data.videoCount} videos!`;
  captureProgress.style.width = '100%';

  // Wait a bit to show completion
  await new Promise(resolve => setTimeout(resolve, 1500));

  hideCaptureModal();

  // Reload videos
  await loadVideos();
}

// Update filter options
function updateFilterOptions() {
  // Update language filter
  languageFilter.innerHTML = '<option value="">All Languages</option>';
  availableLanguages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = getLanguageName(lang);
    languageFilter.appendChild(option);
  });

  // Update country filter
  countryFilter.innerHTML = '<option value="">All Countries</option>';
  availableCountries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = getCountryName(country);
    countryFilter.appendChild(option);
  });
}

// Handle filter change
function handleFilterChange() {
  // Get selected values
  const selectedLanguages = Array.from(languageFilter.selectedOptions)
    .map(opt => opt.value)
    .filter(val => val !== '');

  const selectedCountries = Array.from(countryFilter.selectedOptions)
    .map(opt => opt.value)
    .filter(val => val !== '');

  currentFilters = {
    ...currentFilters,
    selectedLanguages,
    selectedCountries,
    sortBy: sortSelect.value
  };

  applyFilters();
}

// Handle search change
function handleSearchChange() {
  currentFilters.searchQuery = searchInput.value.trim().toLowerCase();
  applyFilters();
}

// Apply filters
function applyFilters() {
  filteredVideos = allVideos.filter(video => {
    // Language filter
    if (currentFilters.selectedLanguages.length > 0) {
      if (!currentFilters.selectedLanguages.includes(video.defaultLanguage) &&
          !currentFilters.selectedLanguages.includes(video.defaultAudioLanguage)) {
        return false;
      }
    }

    // Country filter
    if (currentFilters.selectedCountries.length > 0) {
      if (!currentFilters.selectedCountries.includes(video.regionCode)) {
        return false;
      }
    }

    // Search filter
    if (currentFilters.searchQuery) {
      const searchLower = currentFilters.searchQuery;
      if (!video.title.toLowerCase().includes(searchLower) &&
          !video.channelTitle.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  // Sort
  sortVideos();

  // Render
  renderVideos();
}

// Sort videos
function sortVideos() {
  switch (currentFilters.sortBy) {
    case 'date':
      filteredVideos.sort((a, b) => b.capturedAt - a.capturedAt);
      break;
    case 'views':
      filteredVideos.sort((a, b) => b.viewCount - a.viewCount);
      break;
    case 'title':
      filteredVideos.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
}

// Render videos
function renderVideos() {
  videosContainer.innerHTML = '';

  filteredVideos.forEach(video => {
    const card = createVideoCard(video);
    videosContainer.appendChild(card);
  });

  // Update displayed count
  displayedCount.innerHTML = `Showing <strong>${filteredVideos.length}</strong> video${filteredVideos.length !== 1 ? 's' : ''}`;
}

// Create video card
function createVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.onclick = () => openVideo(video.id);

  const thumbnail = video.thumbnail || 'https://via.placeholder.com/320x180?text=No+Thumbnail';

  card.innerHTML = `
    <img src="${thumbnail}" alt="${video.title}" class="video-thumbnail" loading="lazy">
    <div class="video-info">
      <h3 class="video-title">${escapeHtml(video.title)}</h3>
      <p class="video-channel">${escapeHtml(video.channelTitle)}</p>
      <div class="video-metadata">
        <span class="badge language" title="Language">${getLanguageName(video.defaultLanguage)}</span>
        ${video.regionCode && video.regionCode !== 'unknown'
          ? `<span class="badge country" title="Country">${getCountryName(video.regionCode)}</span>`
          : ''}
      </div>
      <p class="video-stats">
        ${formatViews(video.viewCount)} views • ${formatRelativeTime(video.publishedAt)}
      </p>
    </div>
  `;

  return card;
}

// Open video in YouTube
function openVideo(videoId) {
  chrome.tabs.create({
    url: `https://www.youtube.com/watch?v=${videoId}`
  });
}

// Open settings
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Clear filters
function clearFilters() {
  languageFilter.selectedIndex = 0;
  countryFilter.selectedIndex = 0;
  sortSelect.value = 'date';
  searchInput.value = '';

  currentFilters = {
    selectedLanguages: [],
    selectedCountries: [],
    sortBy: 'date',
    searchQuery: ''
  };

  applyFilters();
}

// Update metadata
function updateMetadata(data) {
  // Last capture time
  if (data.lastCaptureTimestamp && data.lastCaptureTimestamp > 0) {
    lastCaptureTime.textContent = formatRelativeTime(data.lastCaptureTimestamp);
  } else {
    lastCaptureTime.textContent = 'Never';
  }

  // Video count
  videoCountNumber.textContent = allVideos.length;

  // Storage usage
  if (data.storageUsage) {
    storageUsageText.textContent = `${data.storageUsage.mbUsed} MB`;
  }
}

// Show/hide states
function showLoading() {
  videosContainer.style.display = 'none';
  emptyState.style.display = 'none';
  errorState.style.display = 'none';
  loadingState.style.display = 'flex';
}

function showVideos() {
  loadingState.style.display = 'none';
  emptyState.style.display = 'none';
  errorState.style.display = 'none';
  videosContainer.style.display = 'grid';
}

function showEmptyState() {
  loadingState.style.display = 'none';
  videosContainer.style.display = 'none';
  errorState.style.display = 'none';
  emptyState.style.display = 'block';
}

function showError(error) {
  loadingState.style.display = 'none';
  videosContainer.style.display = 'none';
  emptyState.style.display = 'none';
  errorState.style.display = 'block';
  errorMessage.textContent = error;
}

function showCaptureModal() {
  captureModal.style.display = 'flex';
  captureProgress.style.width = '0%';
  captureProgressText.textContent = 'Initializing capture...';
}

function hideCaptureModal() {
  captureModal.style.display = 'none';
}

// Utility function
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
