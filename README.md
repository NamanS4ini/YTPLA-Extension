# YouTube Playlist Analyzer Extension

A browser extension that displays total duration and video count for YouTube playlists directly on the playlist page.

## Features

- **Instant Playlist Analytics**: Displays total duration and video count right below the playlist title
- **Quick Details Link**: One-click access to detailed playlist information on ytpla.in
- **Smart Detection**: Automatically detects when you're viewing a YouTube playlist
- **SPA Navigation Support**: Works seamlessly with YouTube's single-page application architecture
- **Cross-Browser Support**: Available for both Chrome and Firefox

## Installation

### Firefox (Recommended - Official Release)

**[Install from Firefox Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/ytpla/)**

Simply click the link above and add the extension to Firefox with one click!

### Chrome/Edge (Manual Installation Required)

> **Note**: Due to the $5 Chrome Web Store developer fee, this extension is not available on the Chrome Web Store. Please install it manually using the steps below.

1. **Download the extension**: [chrome.0.0.1.zip](https://github.com/NamanS4ini/YTPLA-Extension/releases/download/Chrome/chrome.0.0.1.zip)
2. Extract the downloaded ZIP file to a folder on your computer
3. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
4. Enable "Developer mode" using the toggle in the top-right corner
5. Click "Load unpacked"
6. Select the extracted `chrome` folder
7. The extension is now installed! You should see the YouTube Playlist Analyzer icon in your extensions bar

### Firefox (Manual Installation - Development Mode)

If you want to install from source or test development versions:

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to the `firefox` folder and select the `manifest.json` file
5. **Note**: This installation is temporary and will be removed when Firefox restarts

## How It Works

When you visit a YouTube playlist page:

1. The extension detects the playlist ID from the URL
2. A "loading..." badge appears below the playlist title
3. The extension fetches playlist data from the ytpla.in API
4. The badge updates to show the total duration and video count
5. Click "Details" to view comprehensive playlist information on ytpla.in

## Project Structure

```
ytpla-extension/
├── chrome/                    # Chrome extension files
│   ├── manifest.json          # Chrome manifest (v3)
│   ├── assets/
│   │   ├── background.js      # Background service worker
│   │   └── content.js         # Content script for YouTube pages
│   ├── icons/                 # Extension icons (16x16, 48x48, 128x128)
│   └── src/
│       └── popup/
│           └── index.html     # Extension popup (placeholder)
│
└── firefox/                   # Firefox extension files
    ├── manifest.json          # Firefox manifest (v2)
    ├── assets/
    │   ├── background.js      # Background script
    │   └── content.js         # Content script for YouTube pages
    ├── icons/                 # Extension icons (16x16, 48x48, 128x128)
    └── src/
        └── popup/
            └── index.html     # Extension popup (placeholder)
```

## Technical Details

### Content Script

The content script (`content.js`) handles:

- **Badge Creation**: Creates a styled badge element that matches YouTube's UI
- **API Integration**: Fetches playlist data from `https://www.ytpla.in/api/extension?id={playlistId}`
- **Dynamic Updates**: Uses MutationObserver to handle YouTube's SPA navigation
- **Smart Placement**: Inserts the badge right after the playlist title element

### Permissions

- **storage**: Store extension settings (if needed)
- **tabs**: Access tab information
- **activeTab**: Interact with the active tab
- **host_permissions**: Access YouTube.com pages

### API Endpoint

The extension uses the ytpla.in API:
```
GET https://www.ytpla.in/api/extension?id={playlistId}
```

Expected response format:
```json
{
  "totalDuration": "3h 45m",
  "videoCount": 42
}
```

## Development

### Manifest Differences

- **Chrome**: Uses Manifest V3 with service worker
- **Firefox**: Uses Manifest V2 with background scripts and browser_action

### Making Changes

1. Edit the appropriate files in the `chrome/` or `firefox/` folder
2. Reload the extension in your browser:
   - **Chrome**: Go to `chrome://extensions/` and click the reload icon
   - **Firefox**: Go to `about:debugging` and click "Reload"

### Testing

1. Navigate to any YouTube playlist (URL contains `list=` parameter)
2. Look for the duration badge below the playlist title
3. Verify the badge shows loading state, then updates with actual data
4. Test navigation between different playlists
5. Click the "Details" link to verify it opens the correct ytpla.in page

## Browser Compatibility

- **Chrome**: Version 88+ (Manifest V3 support)
- **Edge**: Version 88+ (Chromium-based)
- **Firefox**: Version 48+ (Manifest V2 support)

## API Dependencies

This extension requires the ytpla.in API to be available. If the API is down or unreachable, the badge will show "Length: unavailable".

## Future Improvements

- [ ] Add settings/options page
- [ ] Cache playlist data to reduce API calls
- [ ] Support for offline mode with cached data
- [ ] Add additional playlist statistics
- [ ] Theme customization options
- [ ] Multi-language support


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.

---

**Note**: This extension is not affiliated with YouTube or Google.
