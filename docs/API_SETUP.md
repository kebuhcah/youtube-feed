# YouTube API Setup Guide

This extension requires a YouTube Data API v3 key to fetch video metadata. Follow these steps to obtain your free API key.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the project dropdown at the top of the page
4. Click **"New Project"**
5. Enter a project name (e.g., "YouTube Feed Organizer")
6. Click **"Create"**

## Step 2: Enable YouTube Data API v3

1. In your project, navigate to **"APIs & Services"** > **"Library"**
   - Or use this direct link: [API Library](https://console.cloud.google.com/apis/library)
2. Search for **"YouTube Data API v3"**
3. Click on **"YouTube Data API v3"**
4. Click the **"Enable"** button

## Step 3: Create API Credentials

1. Navigate to **"APIs & Services"** > **"Credentials"**
   - Or use this direct link: [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ Create Credentials"** at the top
3. Select **"API key"**
4. Your API key will be created and displayed
5. **Copy the API key** (you'll need this for the extension)

## Step 4: Restrict Your API Key (Optional but Recommended)

For security, it's recommended to restrict your API key:

1. After creating the key, click **"Edit API key"** (or find it in the credentials list)
2. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check **"YouTube Data API v3"**
3. Click **"Save"**

**Note:** Do NOT set Application restrictions, as Chrome extensions cannot be easily restricted.

## Step 5: Configure the Extension

1. Open the extension and click **"Settings"**
2. Paste your API key into the **"API Key"** field
3. Click **"Validate API Key"** to test it
4. Click **"Save API Key"**

## API Quota Information

### Daily Quota
- **10,000 units per day** (free tier)
- Each `videos.list` request costs **1 unit**
- Each request can fetch up to **50 video details**

### Quota Usage Example
- Capturing 50 videos = 2 requests (videos + channels) = 2 units
- Capturing 100 videos = 4 requests = 4 units
- Capturing 500 videos = 20 requests = 20 units

With the default daily quota, you can capture:
- **Up to 250,000 videos per day** (5,000 batches × 50 videos)
- In practice, you'll likely capture 50-100 videos per session (2-4 units)
- This allows for **50-100 capture sessions per day** (capturing 100 videos each)

**Note:** We now fetch channel details to get accurate country information, which doubles the API usage but provides much more accurate location data.

### If You Exceed Quota
If you exceed your daily quota:
- The extension will show an error message
- Your quota resets at **midnight Pacific Time (PT)**
- Previously captured videos remain stored
- You can export/browse existing videos

### Increasing Your Quota
If you need more quota:
1. Go to [Google Cloud Console Quotas](https://console.cloud.google.com/iam-admin/quotas)
2. Search for "YouTube Data API v3"
3. Request a quota increase (may require billing account)

## Troubleshooting

### "API key is invalid"
- Check that you copied the entire API key (no extra spaces)
- Verify YouTube Data API v3 is enabled for your project
- Wait a few minutes after creating the key (propagation delay)

### "API quota exceeded"
- Your daily quota has been used
- Wait until midnight PT for quota reset
- Consider requesting a quota increase

### "API request failed: 403"
- Your API key may have restrictions
- Check that YouTube Data API v3 is allowed
- Remove any application restrictions

### "API request failed: 400"
- The video IDs may be invalid
- Try capturing again from YouTube homepage
- This is usually temporary

## Privacy & Security

- Your API key is stored **locally** in Chrome's storage
- No data is sent to external servers (except YouTube API)
- The extension only fetches public video metadata
- Your API key is never shared or transmitted elsewhere

## Cost

The YouTube Data API v3 is **completely free** for standard usage:
- No credit card required
- 10,000 units/day free quota
- No charges for API usage within quota

## Additional Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [Google Cloud Console](https://console.cloud.google.com/)

## Need Help?

If you encounter issues:
1. Check this guide again
2. Verify each step was completed
3. Try creating a new API key
4. Report issues on [GitHub](https://github.com/your-repo/issues)

---

**Note:** Google may update their interface. If screenshots or steps don't match exactly, look for similar options in the Google Cloud Console.
