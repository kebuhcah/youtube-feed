import { YOUTUBE_API } from '../shared/constants.js';
import { chunkArray, normalizeLanguageCode } from '../shared/utils.js';

/**
 * Fetch video details from YouTube Data API v3
 * @param {string[]} videoIds - Array of video IDs
 * @param {string} apiKey - YouTube API key
 * @returns {Promise<Object[]>} Array of video objects
 */
export async function fetchVideoDetails(videoIds, apiKey) {
  if (!videoIds || videoIds.length === 0) {
    return [];
  }

  if (!apiKey) {
    throw new Error('API key is required');
  }

  // Batch requests (50 IDs per request)
  const chunks = chunkArray(videoIds, YOUTUBE_API.BATCH_SIZE);
  const allVideos = [];

  for (const chunk of chunks) {
    try {
      // Fetch video details
      const videos = await fetchVideoBatch(chunk, apiKey);

      // Extract unique channel IDs
      const channelIds = [...new Set(videos.map(v => v.channelId))];

      // Fetch channel details (including country)
      const channelDetails = await fetchChannelDetails(channelIds, apiKey);

      // Merge channel country into videos
      videos.forEach(video => {
        const channel = channelDetails[video.channelId];
        if (channel && channel.country) {
          video.regionCode = channel.country;
        }
      });

      allVideos.push(...videos);

      // Small delay between requests to avoid rate limiting
      if (chunks.length > 1) {
        await sleep(150);
      }
    } catch (error) {
      console.error('[API Handler] Error fetching batch:', error);
      // Continue with other batches even if one fails
    }
  }

  return allVideos;
}

/**
 * Fetch a batch of video details
 * @param {string[]} videoIds - Array of video IDs (max 50)
 * @param {string} apiKey - YouTube API key
 * @returns {Promise<Object[]>} Array of video objects
 */
async function fetchVideoBatch(videoIds, apiKey) {
  const url = `${YOUTUBE_API.BASE_URL}${YOUTUBE_API.VIDEOS_ENDPOINT}?` +
    `part=${YOUTUBE_API.PARTS}&` +
    `id=${videoIds.join(',')}&` +
    `key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
  }

  const data = await response.json();
  return parseApiResponse(data);
}

/**
 * Fetch channel details including country
 * @param {string[]} channelIds - Array of channel IDs (max 50)
 * @param {string} apiKey - YouTube API key
 * @returns {Promise<Object>} Map of channelId -> {country, ...}
 */
async function fetchChannelDetails(channelIds, apiKey) {
  if (!channelIds || channelIds.length === 0) {
    return {};
  }

  try {
    const url = `${YOUTUBE_API.BASE_URL}/channels?` +
      `part=snippet&` +
      `id=${channelIds.join(',')}&` +
      `key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API Handler] Channel fetch failed:', errorData.error?.message);
      return {};
    }

    const data = await response.json();
    const channelMap = {};

    if (data.items) {
      data.items.forEach(item => {
        channelMap[item.id] = {
          country: item.snippet.country || null,
          title: item.snippet.title || '',
          customUrl: item.snippet.customUrl || ''
        };
      });
    }

    console.log(`[API Handler] Fetched details for ${Object.keys(channelMap).length} channels`);
    return channelMap;

  } catch (error) {
    console.error('[API Handler] Error fetching channel details:', error);
    return {};
  }
}

/**
 * Parse YouTube API response into video objects
 * @param {Object} apiResponse - YouTube API response
 * @returns {Object[]} Array of video objects
 */
function parseApiResponse(apiResponse) {
  if (!apiResponse.items || apiResponse.items.length === 0) {
    return [];
  }

  return apiResponse.items.map(item => {
    const snippet = item.snippet || {};
    const statistics = item.statistics || {};
    const contentDetails = item.contentDetails || {};

    return {
      id: item.id,
      title: snippet.title || 'Unknown Title',
      thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
      channelTitle: snippet.channelTitle || 'Unknown Channel',
      channelId: snippet.channelId || '',
      publishedAt: snippet.publishedAt || new Date().toISOString(),
      description: snippet.description || '',

      // Language/region data (normalized to avoid duplicates like en-US, en-GB)
      defaultLanguage: normalizeLanguageCode(snippet.defaultLanguage || snippet.defaultAudioLanguage || detectLanguageFromTitle(snippet.title) || 'unknown'),
      defaultAudioLanguage: normalizeLanguageCode(snippet.defaultAudioLanguage || snippet.defaultLanguage || 'unknown'),
      regionCode: inferRegionCode(snippet) || 'unknown',

      // Capture metadata
      capturedAt: Date.now(),
      captureSource: 'homepage',

      // Statistics
      viewCount: parseInt(statistics.viewCount || 0),
      likeCount: parseInt(statistics.likeCount || 0),
      commentCount: parseInt(statistics.commentCount || 0),

      // Additional metadata
      categoryId: snippet.categoryId || '',
      tags: snippet.tags || [],
      duration: contentDetails.duration || 'PT0S',
      definition: contentDetails.definition || 'hd',
      caption: contentDetails.caption === 'true'
    };
  });
}

/**
 * Detect language from title (basic heuristic)
 * @param {string} title - Video title
 * @returns {string|null} Language code or null
 */
function detectLanguageFromTitle(title) {
  if (!title) return null;

  // Very basic detection - check for non-Latin characters
  const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(title);
  const hasKorean = /[\uac00-\ud7af]/.test(title);
  const hasCyrillic = /[\u0400-\u04ff]/.test(title);
  const hasArabic = /[\u0600-\u06ff]/.test(title);
  const hasChinese = /[\u4e00-\u9fff]/.test(title);

  if (hasJapanese) return 'ja';
  if (hasKorean) return 'ko';
  if (hasCyrillic) return 'ru';
  if (hasArabic) return 'ar';
  if (hasChinese) return 'zh';

  // Default to English for Latin characters
  return null; // Let caller decide default
}

/**
 * Infer region code from snippet data
 * @param {Object} snippet - YouTube video snippet
 * @returns {string|null} Region code or null
 */
function inferRegionCode(snippet) {
  // YouTube API doesn't directly provide region in video snippets
  // We can try to infer from language
  const language = snippet.defaultLanguage || snippet.defaultAudioLanguage;

  if (!language) return null;

  // Map common languages to primary regions
  const languageToRegion = {
    'en': 'US',
    'es': 'ES',
    'fr': 'FR',
    'de': 'DE',
    'it': 'IT',
    'pt': 'BR',
    'ru': 'RU',
    'ja': 'JP',
    'ko': 'KR',
    'zh': 'CN',
    'ar': 'SA',
    'hi': 'IN',
    'bn': 'IN',
    'pa': 'IN',
    'te': 'IN',
    'mr': 'IN',
    'ta': 'IN',
    'tr': 'TR',
    'vi': 'VN',
    'pl': 'PL',
    'uk': 'UA',
    'nl': 'NL',
    'sv': 'SE',
    'no': 'NO',
    'da': 'DK',
    'fi': 'FI',
    'el': 'GR',
    'cs': 'CZ',
    'ro': 'RO',
    'hu': 'HU',
    'th': 'TH',
    'id': 'ID',
    'ms': 'MY',
    'he': 'IL',
    'fa': 'IR'
  };

  return languageToRegion[language] || null;
}

/**
 * Validate API key
 * @param {string} apiKey - YouTube API key
 * @returns {Promise<boolean>} True if valid
 */
export async function validateApiKey(apiKey) {
  try {
    const testUrl = `${YOUTUBE_API.BASE_URL}${YOUTUBE_API.VIDEOS_ENDPOINT}?` +
      `part=snippet&id=dQw4w9WgXcQ&key=${apiKey}`;

    const response = await fetch(testUrl);
    const data = await response.json();

    return response.ok && data.items && data.items.length > 0;
  } catch (error) {
    console.error('[API Handler] API key validation error:', error);
    return false;
  }
}

/**
 * Get estimated quota usage
 * @param {number} videoCount - Number of videos to fetch
 * @returns {number} Estimated quota units
 */
export function estimateQuotaUsage(videoCount) {
  const requestCount = Math.ceil(videoCount / YOUTUBE_API.BATCH_SIZE);
  // 2 API calls per batch: 1 for videos, 1 for channels
  return requestCount * YOUTUBE_API.REQUEST_COST * 2;
}

/**
 * Sleep helper
 * @param {number} ms - Milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
