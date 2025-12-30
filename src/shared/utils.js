/**
 * Utility functions shared across the extension
 */

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null if not found
 */
export function extractVideoId(url) {
  const regex = /watch\?v=([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Format number with commas (e.g., 1000000 -> 1,000,000)
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format view count in short format (e.g., 1.2M, 500K)
 * @param {number} views - View count
 * @returns {string} Formatted view count
 */
export function formatViews(views) {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M';
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K';
  }
  return views.toString();
}

/**
 * Format relative time (e.g., "2 days ago")
 * @param {string|number} timestamp - ISO date string or timestamp
 * @returns {string} Relative time string
 */
export function formatRelativeTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
  if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Parse ISO 8601 duration to seconds
 * @param {string} duration - ISO 8601 duration (e.g., "PT1H2M10S")
 * @returns {number} Duration in seconds
 */
export function parseDuration(duration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = duration.match(regex);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format duration in HH:MM:SS or MM:SS
 * @param {string} isoDuration - ISO 8601 duration
 * @returns {string} Formatted duration
 */
export function formatDuration(isoDuration) {
  const totalSeconds = parseDuration(isoDuration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get language name from language code
 * @param {string} code - ISO 639-1 language code
 * @returns {string} Language name
 */
export function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'pa': 'Punjabi',
    'te': 'Telugu',
    'mr': 'Marathi',
    'ta': 'Tamil',
    'tr': 'Turkish',
    'vi': 'Vietnamese',
    'pl': 'Polish',
    'uk': 'Ukrainian',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'el': 'Greek',
    'cs': 'Czech',
    'ro': 'Romanian',
    'hu': 'Hungarian',
    'th': 'Thai',
    'id': 'Indonesian',
    'ms': 'Malay',
    'he': 'Hebrew',
    'fa': 'Persian'
  };
  return languages[code] || code.toUpperCase();
}

/**
 * Get country name from country code
 * @param {string} code - ISO 3166-1 alpha-2 country code
 * @returns {string} Country name
 */
export function getCountryName(code) {
  const countries = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'IN': 'India',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'IT': 'Italy',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'RU': 'Russia',
    'JP': 'Japan',
    'KR': 'South Korea',
    'CN': 'China',
    'SA': 'Saudi Arabia',
    'AE': 'UAE',
    'TR': 'Turkey',
    'VN': 'Vietnam',
    'PL': 'Poland',
    'UA': 'Ukraine',
    'NL': 'Netherlands',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'GR': 'Greece',
    'CZ': 'Czech Republic',
    'RO': 'Romania',
    'HU': 'Hungary',
    'TH': 'Thailand',
    'ID': 'Indonesia',
    'MY': 'Malaysia',
    'IL': 'Israel',
    'IR': 'Iran',
    'PK': 'Pakistan',
    'BD': 'Bangladesh',
    'PH': 'Philippines',
    'EG': 'Egypt',
    'NG': 'Nigeria',
    'ZA': 'South Africa',
    'AR': 'Argentina',
    'CL': 'Chile',
    'CO': 'Colombia'
  };
  return countries[code] || code;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array[]} Chunked arrays
 */
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Remove duplicates from array based on key
 * @param {Array} array - Array to deduplicate
 * @param {string} key - Key to use for deduplication
 * @returns {Array} Deduplicated array
 */
export function deduplicateBy(array, key) {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}
