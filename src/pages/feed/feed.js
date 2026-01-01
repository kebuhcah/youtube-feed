import { MESSAGE_TYPES } from '../../shared/constants.js';
import { formatViews, formatRelativeTime, getLanguageName, getCountryName, debounce } from '../../shared/utils.js';

// Multiselect Component Class
class Multiselect {
  constructor(element, onChange) {
    this.element = element;
    this.onChange = onChange;
    this.selectedValues = new Set();
    this.options = [];

    this.selectedContainer = element.querySelector('.multiselect-selected');
    this.input = element.querySelector('.multiselect-input');
    this.dropdown = element.querySelector('.multiselect-dropdown');
    this.searchInput = element.querySelector('.multiselect-search');
    this.optionsContainer = element.querySelector('.multiselect-options');

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toggle dropdown
    this.input.addEventListener('click', () => this.toggleDropdown());

    // Search
    this.searchInput.addEventListener('input', () => this.filterOptions());

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) {
        this.closeDropdown();
      }
    });
  }

  toggleDropdown() {
    const isOpen = this.dropdown.style.display === 'block';
    if (isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.dropdown.style.display = 'block';
    this.searchInput.value = '';
    this.searchInput.focus();
    this.filterOptions();
  }

  closeDropdown() {
    this.dropdown.style.display = 'none';
  }

  setOptions(options) {
    this.options = options;
    this.renderOptions();
  }

  renderOptions() {
    this.optionsContainer.innerHTML = '';

    this.options.forEach(option => {
      const optionEl = document.createElement('div');
      optionEl.className = 'multiselect-option';
      optionEl.dataset.value = option.value;
      optionEl.dataset.label = option.label.toLowerCase();

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = this.selectedValues.has(option.value);

      const label = document.createElement('span');
      label.className = 'multiselect-option-label';
      label.textContent = option.label;

      optionEl.appendChild(checkbox);
      optionEl.appendChild(label);

      optionEl.addEventListener('click', () => {
        this.toggleOption(option.value);
      });

      this.optionsContainer.appendChild(optionEl);
    });
  }

  filterOptions() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const optionEls = this.optionsContainer.querySelectorAll('.multiselect-option');

    optionEls.forEach(el => {
      const label = el.dataset.label;
      el.style.display = label.includes(searchTerm) ? 'flex' : 'none';
    });
  }

  toggleOption(value) {
    if (this.selectedValues.has(value)) {
      this.selectedValues.delete(value);
    } else {
      this.selectedValues.add(value);
    }

    this.updateSelected();
    this.renderOptions();

    if (this.onChange) {
      this.onChange();
    }
  }

  updateSelected() {
    this.selectedContainer.innerHTML = '';

    this.selectedValues.forEach(value => {
      const option = this.options.find(opt => opt.value === value);
      if (!option) return;

      const chip = document.createElement('span');
      chip.className = 'multiselect-chip';

      const text = document.createElement('span');
      text.textContent = option.label;

      const remove = document.createElement('span');
      remove.className = 'multiselect-chip-remove';
      remove.textContent = '×';
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleOption(value);
      });

      chip.appendChild(text);
      chip.appendChild(remove);
      this.selectedContainer.appendChild(chip);
    });
  }

  getSelectedValues() {
    return Array.from(this.selectedValues);
  }

  clear() {
    this.selectedValues.clear();
    this.updateSelected();
    this.renderOptions();
  }
}

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

let languageMultiselect;
let countryMultiselect;
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
  setupMultiselects();
  setupEventListeners();
  await loadVideos();
}

// Setup multiselect components
function setupMultiselects() {
  languageMultiselect = new Multiselect(
    document.getElementById('language-multiselect'),
    handleFilterChange
  );

  countryMultiselect = new Multiselect(
    document.getElementById('country-multiselect'),
    handleFilterChange
  );
}

// Setup event listeners
function setupEventListeners() {
  captureBtn.addEventListener('click', triggerCapture);
  emptyCaptureBtn.addEventListener('click', triggerCapture);
  retryBtn.addEventListener('click', loadVideos);
  settingsBtn.addEventListener('click', openSettings);
  clearFiltersBtn.addEventListener('click', clearFilters);

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

// Update filter options based on current video set
function updateFilterOptions(videosForLanguages = allVideos, videosForCountries = allVideos) {
  // Calculate language counts from videos filtered by country (if any)
  const languageCounts = {};
  videosForLanguages.forEach(video => {
    const lang = video.defaultLanguage || video.defaultAudioLanguage;
    if (lang && lang !== 'unknown') {
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    }
  });

  // Calculate country counts from videos filtered by language (if any)
  const countryCounts = {};
  videosForCountries.forEach(video => {
    const country = video.regionCode;
    if (country && country !== 'unknown') {
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    }
  });

  // Sort languages by count (descending)
  const sortedLanguages = Object.keys(languageCounts).sort((a, b) => {
    return languageCounts[b] - languageCounts[a];
  });

  // Update language multiselect
  const languageOptions = sortedLanguages.map(lang => ({
    value: lang,
    label: `${getLanguageName(lang)} (${languageCounts[lang]})`
  }));
  languageMultiselect.setOptions(languageOptions);

  // Sort countries by count (descending)
  const sortedCountries = Object.keys(countryCounts).sort((a, b) => {
    return countryCounts[b] - countryCounts[a];
  });

  // Update country multiselect
  const countryOptions = sortedCountries.map(country => ({
    value: country,
    label: `${getCountryName(country)} (${countryCounts[country]})`
  }));
  countryMultiselect.setOptions(countryOptions);
}

// Handle filter change
function handleFilterChange() {
  // Get selected values from multiselects
  const selectedLanguages = languageMultiselect.getSelectedValues();
  const selectedCountries = countryMultiselect.getSelectedValues();

  currentFilters = {
    ...currentFilters,
    selectedLanguages,
    selectedCountries,
    sortBy: sortSelect.value
  };

  // For language filter: show all languages, but filtered by selected countries (if any)
  let videosForLanguageFilter = allVideos;
  if (selectedCountries.length > 0) {
    videosForLanguageFilter = videosForLanguageFilter.filter(video =>
      selectedCountries.includes(video.regionCode)
    );
  }

  // For country filter: show all countries, but filtered by selected languages (if any)
  let videosForCountryFilter = allVideos;
  if (selectedLanguages.length > 0) {
    videosForCountryFilter = videosForCountryFilter.filter(video =>
      selectedLanguages.includes(video.defaultLanguage) ||
      selectedLanguages.includes(video.defaultAudioLanguage)
    );
  }

  // Update filter options with separate video sets
  updateFilterOptions(videosForLanguageFilter, videosForCountryFilter);

  // Apply filters and render
  applyFilters();
}

// Handle search change
function handleSearchChange() {
  currentFilters.searchQuery = searchInput.value.trim().toLowerCase();

  // Get videos matching search
  let searchedVideos = allVideos;

  if (currentFilters.searchQuery) {
    searchedVideos = searchedVideos.filter(video =>
      video.title.toLowerCase().includes(currentFilters.searchQuery) ||
      video.channelTitle.toLowerCase().includes(currentFilters.searchQuery)
    );
  }

  // Update filter options based on search results (both filters use searched videos)
  updateFilterOptions(searchedVideos, searchedVideos);

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
  languageMultiselect.clear();
  countryMultiselect.clear();
  sortSelect.value = 'date';
  searchInput.value = '';

  currentFilters = {
    selectedLanguages: [],
    selectedCountries: [],
    sortBy: 'date',
    searchQuery: ''
  };

  // Reset filter options to show all videos (both filters use all videos)
  updateFilterOptions(allVideos, allVideos);

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
