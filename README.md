# YouTube Feed Organizer

A Chrome extension that captures and categorizes your YouTube homepage recommendations by language and country, making it easy to discover and filter videos based on your preferences.

## Features

- **Auto-Capture**: Automatically scrolls through YouTube homepage and captures 50-100 video recommendations
- **Language Filtering**: Filter videos by content language (English, Spanish, Japanese, etc.)
- **Country Filtering**: Filter videos by country/region
- **Smart Sorting**: Sort by date, view count, or title
- **Search**: Search through captured videos by title or channel
- **Persistent Storage**: Videos are saved locally and persist across browser sessions
- **Clean UI**: Modern, responsive interface with grid layout
- **Privacy-Focused**: All data stored locally, no external servers

## Installation

### 1. Clone or Download

```bash
git clone https://github.com/yourusername/youtube-feed.git
cd youtube-feed
```

### 2. Get YouTube API Key

You'll need a free YouTube Data API v3 key. See [API Setup Guide](docs/API_SETUP.md) for detailed instructions.

Quick steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create API credentials (API key)
5. Copy the API key

### 3. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `youtube-feed` directory
5. The extension icon should appear in your toolbar

### 4. Configure API Key

1. Click the extension icon, or right-click and select **"Options"**
2. Paste your YouTube API key
3. Click **"Validate API Key"** to test
4. Click **"Save API Key"**

## Usage

### Capturing Videos

1. Click the extension icon to open the Feed page
2. Click **"Capture Feed"** button
3. The extension will:
   - Open/focus YouTube homepage
   - Auto-scroll to load ~100 videos (10-20 seconds)
   - Fetch video metadata via YouTube API
   - Save videos to local storage
4. Videos appear in the feed, categorized by language/country

### Filtering Videos

- **Language**: Select one or more languages from the dropdown
- **Country**: Select one or more countries from the dropdown
- **Sort**: Sort by date (newest), view count, or title
- **Search**: Type to search video titles and channels
- **Clear Filters**: Reset all filters at once

### Viewing Videos

- Click any video card to open it on YouTube in a new tab

## Project Structure

```
youtube-feed/
├── manifest.json              # Extension manifest (Manifest V3)
├── src/
│   ├── content/
│   │   └── youtube-scraper.js    # Content script for YouTube homepage
│   ├── background/
│   │   ├── service-worker.js     # Background orchestration
│   │   ├── api-handler.js        # YouTube API integration
│   │   └── storage-manager.js    # Chrome storage management
│   ├── pages/
│   │   ├── feed/                 # Main feed page
│   │   │   ├── feed.html
│   │   │   ├── feed.js
│   │   │   └── feed.css
│   │   └── options/              # Settings page
│   │       ├── options.html
│   │       ├── options.js
│   │       └── options.css
│   ├── shared/
│   │   ├── constants.js          # Shared constants
│   │   ├── models.js             # Data models (JSDoc types)
│   │   └── utils.js              # Utility functions
│   └── assets/
│       └── icons/                # Extension icons (16, 32, 48, 128px)
└── docs/
    └── API_SETUP.md              # YouTube API setup guide
```

## Technical Details

### Architecture

- **Manifest V3**: Modern Chrome extension architecture
- **Content Script**: Runs on YouTube homepage to extract video IDs
- **Service Worker**: Background script that coordinates components
- **YouTube API**: Fetches video metadata (language, country, views, etc.)
- **Chrome Storage**: Stores videos locally (up to 10MB ≈ 5000 videos)

### Data Flow

```
YouTube Homepage → Content Script (extract IDs) →
Service Worker → API Handler (fetch metadata) →
Storage Manager (persist) → Feed Page (display)
```

### API Quota

- **Daily Quota**: 10,000 units (free)
- **Cost per Capture**: 2 units per 50 videos (1 for videos, 1 for channels)
- **Practical Usage**: 50-100 capture sessions per day (100 videos each)
- **Note**: We fetch channel details to get accurate country information

## Development

### Prerequisites

- Chrome browser (latest version)
- YouTube Data API v3 key
- Basic knowledge of JavaScript/Chrome Extensions

### Local Development

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Debugging

- **Content Script**: Open DevTools on YouTube page
- **Service Worker**: Click "Service Worker" link in `chrome://extensions/`
- **Feed Page**: Right-click feed page → Inspect
- **Options Page**: Right-click options page → Inspect

## Limitations

- **YouTube DOM**: May break if YouTube updates their HTML structure (selectors included as fallback)
- **Language Detection**: YouTube API doesn't always provide language data; falls back to "unknown"
- **Storage**: Chrome storage limited to 10MB (~5000 videos)
- **API Quota**: 10,000 units/day (sufficient for typical usage)

## Privacy

- All data stored **locally** in Chrome storage
- No external servers (except YouTube API)
- No tracking or analytics
- No data collection or sharing
- API key stored securely in Chrome storage

## Troubleshooting

### Extension doesn't load
- Check that Developer mode is enabled
- Look for errors in `chrome://extensions/`
- Try reloading the extension

### "API key not configured"
- Go to Settings and add your YouTube API key
- See [API Setup Guide](docs/API_SETUP.md)

### Capture doesn't work
- Ensure you're on YouTube homepage
- Check that content script has permission
- Look for errors in DevTools console

### No language/country data
- Some videos don't have language metadata
- Falls back to "unknown" category
- Filter may not show these videos

## Future Enhancements

- Export videos to CSV/JSON
- Statistics dashboard
- Multi-source capture (trending, search results)
- Cloud sync (optional)
- Dark mode
- Video thumbnails lazy loading
- Virtual scrolling for large datasets

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- [GitHub Issues](https://github.com/yourusername/youtube-feed/issues)
- [API Setup Guide](docs/API_SETUP.md)
- [YouTube Data API Docs](https://developers.google.com/youtube/v3)

## Acknowledgments

- YouTube Data API v3 by Google
- Chrome Extension APIs by Google
- Icons: (add icon attribution here)

---

Made with 💙 by [Your Name]
