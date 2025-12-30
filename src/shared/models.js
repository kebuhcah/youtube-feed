/**
 * @typedef {Object} Video
 * @property {string} id - YouTube video ID
 * @property {string} title - Video title
 * @property {string} thumbnail - Thumbnail URL
 * @property {string} channelTitle - Channel name
 * @property {string} channelId - Channel ID
 * @property {string} publishedAt - ISO date string
 * @property {string} description - Video description
 * @property {string} defaultLanguage - Content language (e.g., "en")
 * @property {string} defaultAudioLanguage - Audio language (e.g., "en")
 * @property {string} regionCode - Region code (e.g., "US")
 * @property {number} capturedAt - Timestamp when captured
 * @property {string} captureSource - Source of capture ("homepage")
 * @property {number} viewCount - View count
 * @property {number} likeCount - Like count
 * @property {string} categoryId - YouTube category ID
 * @property {string[]} tags - Video tags
 * @property {string} duration - Video duration (ISO 8601 format)
 */

/**
 * @typedef {Object} Settings
 * @property {string} apiKey - YouTube Data API key
 * @property {boolean} autoCapture - Enable automatic capture
 * @property {number} captureInterval - Auto-capture interval in minutes
 * @property {number} maxStoredVideos - Maximum videos to store
 * @property {number} targetVideoCount - Target video count for auto-scroll
 */

/**
 * @typedef {Object} Filters
 * @property {string[]} selectedLanguages - Selected language codes
 * @property {string[]} selectedCountries - Selected country codes
 * @property {string} sortBy - Sort field: 'date', 'views', 'title'
 * @property {string} viewMode - View mode: 'grid', 'list'
 */

/**
 * @typedef {Object} CaptureHistory
 * @property {number} timestamp - Capture timestamp
 * @property {number} videoCount - Number of videos captured
 */

/**
 * @typedef {Object} StorageData
 * @property {Settings} settings - User settings
 * @property {Video[]} videos - Stored videos
 * @property {Filters} filters - Current filters
 * @property {number} lastCaptureTimestamp - Last capture timestamp
 * @property {CaptureHistory[]} captureHistory - History of captures
 */

/**
 * @typedef {Object} CaptureProgress
 * @property {number} currentCount - Current video count
 * @property {number} targetCount - Target video count
 * @property {string} status - Status message
 */

/**
 * @typedef {Object} YouTubeAPIResponse
 * @property {string} kind - Response kind
 * @property {string} etag - Response etag
 * @property {YouTubeVideoItem[]} items - Video items
 * @property {Object} pageInfo - Page information
 */

/**
 * @typedef {Object} YouTubeVideoItem
 * @property {string} kind - Item kind
 * @property {string} etag - Item etag
 * @property {string} id - Video ID
 * @property {Object} snippet - Video snippet
 * @property {Object} statistics - Video statistics
 * @property {Object} contentDetails - Video content details
 */

// Export empty object to make this a module
export {};
