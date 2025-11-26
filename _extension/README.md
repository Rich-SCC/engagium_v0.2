# Engagium Browser Extension - MVP

Automatically track student attendance and participation during **Google Meet** meetings.

## 🚀 Quick Start (First Time Setup)

### 1. Install Dependencies

```bash
cd _extension
npm install
```

### 2. Build the Extension

```bash
npm run build
```

This creates a `dist/` folder with the compiled extension.

### 3. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `_extension/dist/` folder
5. The Engagium icon should appear in your extensions toolbar

### 4. Configure Extension

1. Click the Engagium extension icon
2. Click **"Open Settings"**
3. In the **Authentication** tab:
   - Get your auth token from Engagium web app (coming soon - for now use any JWT)
   - Paste it and click **Login**
4. In the **Class Mapping** tab:
   - Add a mapping: Meeting ID (e.g., `abc-defg-hij`) → Select your class
   - This tells the extension which class the meeting belongs to

### 5. Test on Google Meet

1. Join a Google Meet: https://meet.google.com/new
2. The extension should show a small indicator in the top-right: **"Engagium: Tracking"**
3. Click the extension icon to see the popup with participant count
4. When done, click **"End Session & Submit"** to send data to backend

## 🔧 Development

### Watch Mode (Auto-rebuild on changes)

```bash
npm run dev
```

Then reload the extension in Chrome after each rebuild:
- Go to `chrome://extensions/`
- Click the refresh icon on the Engagium extension card

## Project Structure

```
_extension/
├── manifest.json              # Extension manifest (Manifest V3)
├── package.json               # Dependencies
├── vite.config.js             # Build configuration
│
├── background/                # Background service worker
├── content/                   # Content scripts (inject into meeting pages)
├── popup/                     # Popup UI (React)
├── options/                   # Options page (React)
├── utils/                     # Shared utilities
└── assets/                    # Icons, images, styles
```

## Supported Platforms

- ✅ **Google Meet** (meet.google.com/*) - Fully implemented
- 🔜 **Zoom** (zoom.us/j/*, *.zoom.us/wc/*) - Planned for future release

## Features

### Core
- 🎯 Automatic attendance tracking (join/leave times)
- 💬 Participation logging (chat messages, reactions, hand raises)
- 🤖 Intelligent student matching (fuzzy name matching)
- 📊 Real-time participant list
- 🔄 Offline sync queue

### Security & Privacy
- 🔐 Secure authentication with Engagium backend
- 🏠 Local-first data storage (IndexedDB)
- 🚫 No automatic data upload (instructor must click "End Session")
- 🔒 Encrypted token storage

## Development

### Testing Locally

1. **Build extension:**
   ```bash
   npm run dev
   ```

2. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select `_extension/dist/` folder

3. **Test on Zoom:**
   - Join a Zoom meeting: https://zoom.us/test
   - Click extension icon (should show popup)
   - Start tracking session
   - Verify participant list updates

4. **Check console logs:**
   - Right-click extension icon → "Inspect popup" (for popup logs)
   - Open DevTools → Console (for content script logs)
   - Navigate to `chrome://extensions/` → Click "service worker" (for background logs)

### Hot Reload

With `npm run dev` running, changes to source files will automatically rebuild. You'll need to manually reload the extension in `chrome://extensions/`:
- Click the reload icon next to your extension

## Architecture

See [EXTENSION_ARCHITECTURE.md](../__documentation/Extension/EXTENSION_ARCHITECTURE.md) for detailed architecture documentation.

### Key Components

**Content Scripts** (`content/`)
- Inject into meeting pages (Zoom, Google Meet)
- Monitor participant list DOM changes
- Extract participant data (name, email, join/leave times)
- Track chat messages and reactions
- Send events to background worker

**Background Service Worker** (`background/`)
- Coordinate all extension components
- Store data in IndexedDB
- Submit bulk attendance/participation to backend API
- Handle offline sync queue
- Manage authentication tokens

**Popup UI** (`popup/`)
- React-based popup interface
- Show active session status
- Display participant list
- End session and submit data
- Handle errors and sync status

**Options Page** (`options/`)
- React-based settings interface
- Login with Engagium credentials
- Map meetings to classes
- Sync student rosters
- Configure auto-start preferences

## API Integration

The extension integrates with Engagium backend APIs:

**Bulk Attendance Submission:**
```
POST /api/sessions/:sessionId/attendance/bulk
Authorization: Bearer <jwt_token>

{
  "attendance": [
    {
      "student_id": "uuid",
      "status": "present",
      "joined_at": "2025-11-25T14:05:00Z",
      "left_at": "2025-11-25T15:45:00Z"
    }
  ]
}
```

**Bulk Participation Logging:**
```
POST /api/participation/sessions/:sessionId/logs/bulk
Authorization: Bearer <jwt_token>

{
  "logs": [
    {
      "student_id": "uuid",
      "interaction_type": "chat",
      "timestamp": "2025-11-25T14:35:00Z",
      "metadata": { "message_length": 50 }
    }
  ]
}
```

## Debugging

### Content Script Logs
Open DevTools on the meeting page (F12), check Console tab:
```javascript
// Look for logs like:
[Engagium] Meeting detected: abc-defg-hij
[Engagium] Participant joined: John Doe
[Engagium] Chat message detected
```

### Background Worker Logs
Navigate to `chrome://extensions/`, find "Engagium Attendance Tracker", click "service worker":
```javascript
// Look for logs like:
[Background] Message received: PARTICIPANT_JOINED
[Background] Stored participant: John Doe
[Background] Session ended, preparing bulk submission
```

### Popup Logs
Right-click extension icon → "Inspect popup":
```javascript
// Look for logs like:
[Popup] Active session loaded
[Popup] Participant list updated: 23 participants
```

### Common Issues

**"Content script not injecting"**
- Check manifest.json `matches` patterns
- Verify you're on the correct URL (e.g., `zoom.us/j/*`)
- Reload extension in chrome://extensions/

**"Background worker not receiving messages"**
- Check `chrome.runtime.sendMessage()` calls in content script
- Verify service worker is running (check chrome://extensions/)
- Look for CORS errors if making API calls

**"API calls failing"**
- Check auth token in chrome.storage.local
- Verify backend is running (http://localhost:3000)
- Check Network tab for 401/403 errors

## Permissions

### Required
- `storage` - Store auth token and settings locally
- `activeTab` - Access current tab when popup opened

### Optional (Future)
- `notifications` - Show desktop notifications
- `alarms` - Schedule periodic syncs

## Chrome Web Store Submission

Before submitting to Chrome Web Store:

1. **Build production version:**
   ```bash
   npm run build
   ```

2. **Test production build:**
   - Load `dist/` folder as unpacked extension
   - Test all features thoroughly
   - Verify no console errors

3. **Create store assets:**
   - 128x128 icon (required)
   - 5 screenshots (1280x800)
   - Promotional images (440x280, 920x680, 1400x560)
   - Detailed description
   - Privacy policy URL

4. **Zip for upload:**
   ```bash
   cd dist
   zip -r engagium-extension-v1.0.0.zip *
   ```

5. **Submit:**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Create new item
   - Upload ZIP
   - Fill in metadata
   - Submit for review

## License

MIT License - See LICENSE file

## Support

- **Documentation:** `__documentation/Extension/`
- **Issues:** GitHub Issues
- **Email:** support@engagium.app
