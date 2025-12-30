// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  VIDEOS: 'videos',
  FILTERS: 'filters',
  LAST_CAPTURE_TIMESTAMP: 'lastCaptureTimestamp',
  CAPTURE_HISTORY: 'captureHistory'
};

// Message types for communication between components
export const MESSAGE_TYPES = {
  // Content script -> Background
  CAPTURE_VIDEOS: 'CAPTURE_VIDEOS',
  CAPTURE_PROGRESS: 'CAPTURE_PROGRESS',
  CAPTURE_COMPLETE: 'CAPTURE_COMPLETE',
  CAPTURE_ERROR: 'CAPTURE_ERROR',

  // Feed page -> Background
  GET_VIDEOS: 'GET_VIDEOS',
  GET_SETTINGS: 'GET_SETTINGS',
  TRIGGER_CAPTURE: 'TRIGGER_CAPTURE',
  CLEAR_VIDEOS: 'CLEAR_VIDEOS',

  // Background -> Feed page
  VIDEOS_DATA: 'VIDEOS_DATA',
  SETTINGS_DATA: 'SETTINGS_DATA',
  CAPTURE_STARTED: 'CAPTURE_STARTED',
  CAPTURE_STATUS: 'CAPTURE_STATUS',

  // Options page -> Background
  SAVE_SETTINGS: 'SAVE_SETTINGS',
  VALIDATE_API_KEY: 'VALIDATE_API_KEY',

  // Background -> Options page
  API_KEY_VALID: 'API_KEY_VALID',
  API_KEY_INVALID: 'API_KEY_INVALID'
};

// YouTube API configuration
export const YOUTUBE_API = {
  BASE_URL: 'https://www.googleapis.com/youtube/v3',
  VIDEOS_ENDPOINT: '/videos',
  BATCH_SIZE: 50, // Maximum IDs per request
  DAILY_QUOTA: 10000,
  REQUEST_COST: 1,
  PARTS: ['snippet', 'statistics', 'contentDetails'].join(',')
};

// Default settings
export const DEFAULT_SETTINGS = {
  apiKey: '',
  autoCapture: false,
  captureInterval: 60, // minutes
  maxStoredVideos: 500,
  targetVideoCount: 100 // Target for auto-scroll
};

// Default filters
export const DEFAULT_FILTERS = {
  selectedLanguages: [],
  selectedCountries: [],
  sortBy: 'date', // 'date', 'views', 'title'
  viewMode: 'grid' // 'grid', 'list'
};

// Storage limits
export const STORAGE_LIMITS = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  WARNING_THRESHOLD: 0.8, // 80%
  EVICTION_TARGET: 0.6 // Evict down to 60%
};

// Auto-scroll configuration
export const AUTO_SCROLL = {
  TARGET_VIDEO_COUNT: 100,
  MIN_VIDEO_COUNT: 20,
  SCROLL_DELAY_MS: 500,
  MAX_SCROLL_ATTEMPTS: 20,
  NO_NEW_VIDEOS_THRESHOLD: 3 // Stop after 3 scrolls with no new videos
};

// DOM selectors for YouTube
export const YOUTUBE_SELECTORS = {
  PRIMARY_VIDEO_LINK: 'a#video-title-link[href*="/watch?v="]',
  FALLBACK_VIDEO_LINK: 'a.yt-simple-endpoint[href*="/watch"]',
  VIDEO_ID_REGEX: /watch\?v=([a-zA-Z0-9_-]{11})/
};
