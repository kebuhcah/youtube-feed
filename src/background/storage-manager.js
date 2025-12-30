import { STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_FILTERS, STORAGE_LIMITS } from '../shared/constants.js';
import { deduplicateBy } from '../shared/utils.js';

/**
 * Save videos to storage
 * @param {Object[]} newVideos - Array of video objects
 * @returns {Promise<void>}
 */
export async function saveVideos(newVideos) {
  if (!newVideos || newVideos.length === 0) {
    return;
  }

  // Get existing videos
  const existingVideos = await getVideos();

  // Merge and deduplicate
  const allVideos = [...existingVideos, ...newVideos];
  const uniqueVideos = deduplicateBy(allVideos, 'id');

  // Sort by capture time (newest first)
  uniqueVideos.sort((a, b) => b.capturedAt - a.capturedAt);

  // Check storage limits and cleanup if necessary
  const settings = await getSettings();
  const maxVideos = settings.maxStoredVideos || 500;

  let videosToStore = uniqueVideos;
  if (uniqueVideos.length > maxVideos) {
    videosToStore = uniqueVideos.slice(0, maxVideos);
    console.log(`[Storage Manager] Trimmed to ${maxVideos} videos (limit reached)`);
  }

  // Check byte size and evict if necessary
  await checkAndEvictIfNeeded(videosToStore);

  // Save to storage
  await chrome.storage.local.set({
    [STORAGE_KEYS.VIDEOS]: videosToStore,
    [STORAGE_KEYS.LAST_CAPTURE_TIMESTAMP]: Date.now()
  });

  // Update capture history
  await updateCaptureHistory(newVideos.length);

  console.log(`[Storage Manager] Saved ${newVideos.length} new videos (${videosToStore.length} total)`);
}

/**
 * Get videos from storage with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Object[]>} Array of video objects
 */
export async function getVideos(filters = null) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.VIDEOS);
  let videos = result[STORAGE_KEYS.VIDEOS] || [];

  if (filters) {
    videos = applyFilters(videos, filters);
  }

  return videos;
}

/**
 * Apply filters to videos
 * @param {Object[]} videos - Array of videos
 * @param {Object} filters - Filter options
 * @returns {Object[]} Filtered videos
 */
function applyFilters(videos, filters) {
  let filtered = [...videos];

  // Filter by languages
  if (filters.selectedLanguages && filters.selectedLanguages.length > 0) {
    filtered = filtered.filter(video =>
      filters.selectedLanguages.includes(video.defaultLanguage) ||
      filters.selectedLanguages.includes(video.defaultAudioLanguage)
    );
  }

  // Filter by countries
  if (filters.selectedCountries && filters.selectedCountries.length > 0) {
    filtered = filtered.filter(video =>
      filters.selectedCountries.includes(video.regionCode)
    );
  }

  // Sort
  if (filters.sortBy) {
    filtered = sortVideos(filtered, filters.sortBy);
  }

  return filtered;
}

/**
 * Sort videos
 * @param {Object[]} videos - Array of videos
 * @param {string} sortBy - Sort field
 * @returns {Object[]} Sorted videos
 */
function sortVideos(videos, sortBy) {
  const sorted = [...videos];

  switch (sortBy) {
    case 'date':
      sorted.sort((a, b) => b.capturedAt - a.capturedAt);
      break;
    case 'views':
      sorted.sort((a, b) => b.viewCount - a.viewCount);
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      // Default to date
      sorted.sort((a, b) => b.capturedAt - a.capturedAt);
  }

  return sorted;
}

/**
 * Clear all videos
 * @returns {Promise<void>}
 */
export async function clearVideos() {
  await chrome.storage.local.set({
    [STORAGE_KEYS.VIDEOS]: [],
    [STORAGE_KEYS.LAST_CAPTURE_TIMESTAMP]: 0,
    [STORAGE_KEYS.CAPTURE_HISTORY]: []
  });

  console.log('[Storage Manager] All videos cleared');
}

/**
 * Get settings
 * @returns {Promise<Object>} Settings object
 */
export async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.SETTINGS] || {}) };
}

/**
 * Save settings
 * @param {Object} settings - Settings object
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: settings
  });

  console.log('[Storage Manager] Settings saved');
}

/**
 * Get filters
 * @returns {Promise<Object>} Filters object
 */
export async function getFilters() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.FILTERS);
  return { ...DEFAULT_FILTERS, ...(result[STORAGE_KEYS.FILTERS] || {}) };
}

/**
 * Save filters
 * @param {Object} filters - Filters object
 * @returns {Promise<void>}
 */
export async function saveFilters(filters) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.FILTERS]: filters
  });
}

/**
 * Get storage usage
 * @returns {Promise<Object>} Storage usage info
 */
export async function getStorageUsage() {
  const bytesInUse = await chrome.storage.local.getBytesInUse();
  const maxBytes = STORAGE_LIMITS.MAX_SIZE_BYTES;
  const percentage = (bytesInUse / maxBytes) * 100;

  return {
    bytesInUse,
    maxBytes,
    mbUsed: (bytesInUse / (1024 * 1024)).toFixed(2),
    mbMax: (maxBytes / (1024 * 1024)).toFixed(2),
    percentage: percentage.toFixed(2),
    isNearLimit: percentage > (STORAGE_LIMITS.WARNING_THRESHOLD * 100)
  };
}

/**
 * Check storage and evict old videos if needed
 * @param {Object[]} videos - Current videos array
 * @returns {Promise<Object[]>} Potentially evicted videos array
 */
async function checkAndEvictIfNeeded(videos) {
  const usage = await getStorageUsage();

  if (usage.percentage > (STORAGE_LIMITS.WARNING_THRESHOLD * 100)) {
    console.log(`[Storage Manager] Storage at ${usage.percentage}%, evicting old videos...`);

    // Calculate target video count (evict to 60% of limit)
    const targetPercentage = STORAGE_LIMITS.EVICTION_TARGET * 100;
    const targetCount = Math.floor(videos.length * (targetPercentage / usage.percentage));

    // Keep only the newest videos
    const evictedVideos = videos.slice(0, targetCount);

    await chrome.storage.local.set({
      [STORAGE_KEYS.VIDEOS]: evictedVideos
    });

    console.log(`[Storage Manager] Evicted ${videos.length - targetCount} old videos`);
    return evictedVideos;
  }

  return videos;
}

/**
 * Update capture history
 * @param {number} videoCount - Number of videos captured
 * @returns {Promise<void>}
 */
async function updateCaptureHistory(videoCount) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CAPTURE_HISTORY);
  const history = result[STORAGE_KEYS.CAPTURE_HISTORY] || [];

  history.push({
    timestamp: Date.now(),
    videoCount
  });

  // Keep only last 50 captures
  const trimmedHistory = history.slice(-50);

  await chrome.storage.local.set({
    [STORAGE_KEYS.CAPTURE_HISTORY]: trimmedHistory
  });
}

/**
 * Get capture history
 * @returns {Promise<Object[]>} Capture history
 */
export async function getCaptureHistory() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CAPTURE_HISTORY);
  return result[STORAGE_KEYS.CAPTURE_HISTORY] || [];
}

/**
 * Get last capture timestamp
 * @returns {Promise<number>} Timestamp
 */
export async function getLastCaptureTimestamp() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.LAST_CAPTURE_TIMESTAMP);
  return result[STORAGE_KEYS.LAST_CAPTURE_TIMESTAMP] || 0;
}

/**
 * Get available languages from stored videos
 * @returns {Promise<string[]>} Array of language codes
 */
export async function getAvailableLanguages() {
  const videos = await getVideos();
  const languages = new Set();

  videos.forEach(video => {
    if (video.defaultLanguage && video.defaultLanguage !== 'unknown') {
      languages.add(video.defaultLanguage);
    }
    if (video.defaultAudioLanguage && video.defaultAudioLanguage !== 'unknown') {
      languages.add(video.defaultAudioLanguage);
    }
  });

  return Array.from(languages).sort();
}

/**
 * Get available countries from stored videos
 * @returns {Promise<string[]>} Array of country codes
 */
export async function getAvailableCountries() {
  const videos = await getVideos();
  const countries = new Set();

  videos.forEach(video => {
    if (video.regionCode && video.regionCode !== 'unknown') {
      countries.add(video.regionCode);
    }
  });

  return Array.from(countries).sort();
}
