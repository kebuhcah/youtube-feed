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
 * Normalize language code by removing regional suffix
 * @param {string} code - Language code (e.g., "en-US", "en-GB")
 * @returns {string} Normalized code (e.g., "en")
 */
export function normalizeLanguageCode(code) {
  if (!code || code === 'unknown') return 'unknown';
  return code.toLowerCase().split('-')[0];
}

/**
 * Get language name from language code
 * @param {string} code - ISO 639-1 language code (e.g., "en", "en-US", "en-GB")
 * @returns {string} Language name
 */
export function getLanguageName(code) {
  if (!code) return 'Unknown';

  const normalizedCode = normalizeLanguageCode(code);

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
    'fa': 'Persian',
    'ur': 'Urdu',
    'sw': 'Swahili',
    'am': 'Amharic',
    'af': 'Afrikaans',
    'sq': 'Albanian',
    'hy': 'Armenian',
    'az': 'Azerbaijani',
    'eu': 'Basque',
    'be': 'Belarusian',
    'bs': 'Bosnian',
    'bg': 'Bulgarian',
    'ca': 'Catalan',
    'hr': 'Croatian',
    'et': 'Estonian',
    'tl': 'Filipino',
    'ka': 'Georgian',
    'gu': 'Gujarati',
    'ha': 'Hausa',
    'is': 'Icelandic',
    'ig': 'Igbo',
    'ga': 'Irish',
    'kn': 'Kannada',
    'kk': 'Kazakh',
    'km': 'Khmer',
    'ku': 'Kurdish',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'mk': 'Macedonian',
    'ml': 'Malayalam',
    'mt': 'Maltese',
    'mn': 'Mongolian',
    'ne': 'Nepali',
    'ps': 'Pashto',
    'sr': 'Serbian',
    'si': 'Sinhala',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'so': 'Somali',
    'uz': 'Uzbek',
    'yo': 'Yoruba',
    'zu': 'Zulu',
    'sh': 'Serbo-Croatian',
    'nan': 'Hokkien',
    'iw': 'Hebrew',
    'fil': 'Filipino'
  };

  return languages[normalizedCode] || code.toUpperCase();
}

/**
 * Get country name from country code
 * @param {string} code - ISO 3166-1 alpha-2 country code
 * @returns {string} Country name
 */
export function getCountryName(code) {
  if (!code) return 'Unknown';

  const countries = {
    // North America
    'US': 'United States',
    'CA': 'Canada',
    'MX': 'Mexico',

    // South America
    'AR': 'Argentina',
    'BR': 'Brazil',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru',
    'VE': 'Venezuela',
    'EC': 'Ecuador',
    'BO': 'Bolivia',
    'UY': 'Uruguay',
    'PY': 'Paraguay',

    // Europe
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'IT': 'Italy',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'PL': 'Poland',
    'UA': 'Ukraine',
    'GR': 'Greece',
    'CZ': 'Czech Republic',
    'RO': 'Romania',
    'HU': 'Hungary',
    'PT': 'Portugal',
    'AT': 'Austria',
    'CH': 'Switzerland',
    'IE': 'Ireland',
    'RS': 'Serbia',
    'HR': 'Croatia',
    'BG': 'Bulgaria',
    'SK': 'Slovakia',
    'SI': 'Slovenia',
    'LT': 'Lithuania',
    'LV': 'Latvia',
    'EE': 'Estonia',
    'BY': 'Belarus',
    'BA': 'Bosnia and Herzegovina',
    'MK': 'North Macedonia',
    'AL': 'Albania',
    'ME': 'Montenegro',
    'RU': 'Russia',

    // Middle East & North Africa
    'DZ': 'Algeria',
    'MA': 'Morocco',
    'TN': 'Tunisia',
    'LY': 'Libya',
    'EG': 'Egypt',
    'SD': 'Sudan',
    'SA': 'Saudi Arabia',
    'AE': 'UAE',
    'QA': 'Qatar',
    'KW': 'Kuwait',
    'BH': 'Bahrain',
    'OM': 'Oman',
    'YE': 'Yemen',
    'IQ': 'Iraq',
    'SY': 'Syria',
    'JO': 'Jordan',
    'LB': 'Lebanon',
    'PS': 'Palestine',
    'IL': 'Israel',
    'IR': 'Iran',
    'TR': 'Turkey',

    // Asia
    'CN': 'China',
    'TW': 'Taiwan',
    'HK': 'Hong Kong',
    'JP': 'Japan',
    'KR': 'South Korea',
    'IN': 'India',
    'PK': 'Pakistan',
    'BD': 'Bangladesh',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'PH': 'Philippines',
    'ID': 'Indonesia',
    'MY': 'Malaysia',
    'SG': 'Singapore',
    'MM': 'Myanmar',
    'KH': 'Cambodia',
    'LA': 'Laos',
    'NP': 'Nepal',
    'LK': 'Sri Lanka',
    'AF': 'Afghanistan',
    'UZ': 'Uzbekistan',
    'KZ': 'Kazakhstan',
    'TJ': 'Tajikistan',
    'KG': 'Kyrgyzstan',
    'TM': 'Turkmenistan',
    'MN': 'Mongolia',
    'GE': 'Georgia',
    'AM': 'Armenia',
    'AZ': 'Azerbaijan',

    // Africa
    'ZA': 'South Africa',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'ET': 'Ethiopia',
    'GH': 'Ghana',
    'TZ': 'Tanzania',
    'UG': 'Uganda',
    'ZW': 'Zimbabwe',
    'SN': 'Senegal',
    'CI': 'Ivory Coast',
    'CM': 'Cameroon',
    'AO': 'Angola',
    'MZ': 'Mozambique',
    'MG': 'Madagascar',
    'BW': 'Botswana',
    'ZM': 'Zambia',
    'MW': 'Malawi',
    'RW': 'Rwanda',
    'SO': 'Somalia',

    // Oceania
    'AU': 'Australia',
    'NZ': 'New Zealand',
    'FJ': 'Fiji',
    'PG': 'Papua New Guinea',

    // Caribbean & Central America
    'CU': 'Cuba',
    'DO': 'Dominican Republic',
    'JM': 'Jamaica',
    'TT': 'Trinidad and Tobago',
    'CR': 'Costa Rica',
    'PA': 'Panama',
    'GT': 'Guatemala',
    'HN': 'Honduras',
    'SV': 'El Salvador',
    'NI': 'Nicaragua'
  };

  return countries[code.toUpperCase()] || code.toUpperCase();
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
