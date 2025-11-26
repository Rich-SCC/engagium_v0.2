# Extension Authentication Endpoint - Backend Requirements

## Overview
The extension now uses an **OAuth-style redirect flow** instead of manual token entry. This provides a much better user experience with single-click authentication.

## Required Backend Endpoint

### Route: `/extension/auth`
**Method:** GET  
**Purpose:** OAuth-style authentication page for browser extension

### Query Parameters
- `redirect_uri` (required) - The callback URL to redirect back to after authentication
  - Example: `chrome-extension://abcdefghijklmnop/options/callback.html`

### Behavior

1. **If user NOT logged in:**
   - Show standard login form
   - After successful login, proceed to step 2

2. **If user IS logged in:**
   - Show authorization confirmation page:
     ```
     ┌─────────────────────────────────────┐
     │  🔐 Authorize Engagium Extension    │
     │                                     │
     │  The Engagium Extension is          │
     │  requesting access to:              │
     │                                     │
     │  • View your classes                │
     │  • Submit attendance data           │
     │  • Track session information        │
     │                                     │
     │  Logged in as: user@example.com     │
     │                                     │
     │  [Authorize Extension]  [Cancel]    │
     └─────────────────────────────────────┘
     ```

3. **After authorization:**
   - Generate JWT token for user
   - Redirect to callback URL with token:
     ```
     {redirect_uri}?token={jwt_token}&user={user_data_json}
     ```

### Example Implementation (Express.js)

```javascript
// Route: GET /extension/auth
router.get('/extension/auth', requireAuth, async (req, res) => {
  const { redirect_uri } = req.query;
  
  // Validate redirect_uri is a chrome-extension:// URL
  if (!redirect_uri || !redirect_uri.startsWith('chrome-extension://')) {
    return res.status(400).json({ error: 'Invalid redirect_uri' });
  }
  
  // Show authorization page (or auto-authorize if you trust the extension)
  if (req.method === 'GET') {
    return res.render('extension-auth', {
      user: req.user,
      redirect_uri
    });
  }
});

// Route: POST /extension/auth (when user clicks "Authorize")
router.post('/extension/auth', requireAuth, async (req, res) => {
  const { redirect_uri } = req.body;
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      user_id: req.user.id,
      email: req.user.email,
      type: 'extension'
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' } // Long-lived for extension
  );
  
  // Build user data
  const userData = {
    id: req.user.id,
    email: req.user.email,
    name: req.user.name
  };
  
  // Redirect back to extension with token
  const callbackUrl = `${redirect_uri}?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
  res.redirect(callbackUrl);
});
```

### Example View Template (extension-auth.ejs)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Authorize Engagium Extension</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
    }
    .card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    .permissions {
      background: #f3f4f6;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }
    .permissions li {
      margin: 0.5rem 0;
    }
    .user-info {
      font-size: 0.9rem;
      color: #666;
      margin: 1rem 0;
    }
    .button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin: 0.5rem;
    }
    .button-primary {
      background: #667eea;
      color: white;
    }
    .button-secondary {
      background: #e5e7eb;
      color: #1f2937;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔐 Authorize Engagium Extension</h1>
    
    <p>The Engagium Extension is requesting access to:</p>
    
    <div class="permissions">
      <ul>
        <li>View your classes</li>
        <li>Submit attendance data</li>
        <li>Track session information</li>
      </ul>
    </div>
    
    <p class="user-info">Logged in as: <strong><%= user.email %></strong></p>
    
    <form method="POST" action="/extension/auth" style="text-align: center;">
      <input type="hidden" name="redirect_uri" value="<%= redirect_uri %>">
      <button type="submit" class="button button-primary">
        Authorize Extension
      </button>
      <button type="button" class="button button-secondary" onclick="window.close()">
        Cancel
      </button>
    </form>
  </div>
</body>
</html>
```

## Security Considerations

1. **Validate redirect_uri:**
   - MUST start with `chrome-extension://`
   - Optional: Whitelist specific extension IDs

2. **Token Security:**
   - Use long-lived tokens (30 days recommended)
   - Store token type in JWT: `{ type: 'extension' }`
   - Consider refresh token flow for very long sessions

3. **CORS Configuration:**
   - Extension will make API calls from `chrome-extension://` origin
   - Add to CORS whitelist:
     ```javascript
     app.use(cors({
       origin: function(origin, callback) {
         // Allow chrome-extension:// origins
         if (!origin || origin.startsWith('chrome-extension://')) {
           callback(null, true);
         } else if (allowedOrigins.includes(origin)) {
           callback(null, true);
         } else {
           callback(new Error('Not allowed by CORS'));
         }
       },
       credentials: true
     }));
     ```

4. **Rate Limiting:**
   - Implement rate limiting on `/extension/auth` endpoint
   - Prevent token generation abuse

## Testing the Flow

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Load Extension
```bash
cd _extension
npm run build
# Load dist/ folder in chrome://extensions/
```

### 3. Test Authentication
1. Click extension icon → "Open Settings"
2. Click "Login with Engagium"
3. Should open: http://localhost:3000/extension/auth?redirect_uri=chrome-extension://...
4. Login if needed
5. Click "Authorize Extension"
6. Should redirect back to extension with token
7. Extension stores token and shows "Connected"

### 4. Verify Token Storage
Open DevTools console in options page:
```javascript
chrome.storage.local.get(['auth_token', 'auth_user'], console.log)
```

## API Calls from Extension

After authentication, the extension will include the token in all API requests:

```javascript
fetch('http://localhost:3000/api/classes', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

Make sure your backend middleware validates these tokens correctly.

---

## Summary

**What you need to implement:**

1. ✅ Route: `GET /extension/auth` - Show authorization page
2. ✅ Route: `POST /extension/auth` - Handle authorization, redirect with token
3. ✅ View template for authorization confirmation
4. ✅ CORS configuration for `chrome-extension://` origins
5. ✅ JWT token generation with long expiry

**Benefits over manual token entry:**

- ✨ One-click authentication (no copy/paste)
- ✨ Uses existing web app login session
- ✨ Better UX and fewer support requests
- ✨ Secure token transmission via redirect
- ✨ Automatic user info retrieval

Let me know if you need any clarification or help implementing this!
