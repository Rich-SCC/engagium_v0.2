# Extension Token Authentication - Implementation Guide

## Overview

The extension uses a **separate token system** from the web app's JWT authentication. This is simpler, more secure, and clearer than dual authentication.

## Architecture

```
Web App       →  JWT Token  →  Authorization: Bearer <jwt>    →  auth middleware
Extension     →  Ext Token  →  X-Extension-Token: <token>    →  extensionAuth middleware
```

**Key Principle**: Each client uses ONE authentication method, not both.

## Why Separate Tokens?

### ✅ Advantages
1. **Security**: Extension tokens don't expose JWT secret
2. **Simplicity**: One auth method per request type
3. **Flexibility**: Different expiration, revocation for each
4. **Clarity**: Easy to identify request source
5. **Maintenance**: Easier to update/modify independently

### ❌ Dual Auth Problems (Avoided)
- Complex logic checking multiple auth methods
- Ambiguity about which token type was used
- Harder to debug authentication issues
- More code to maintain and test

## Token Flow

### Extension Token Generation (Web App)
```
1. User clicks "Generate Extension Token" in Settings
2. Backend creates random 64-char hex token
3. Token is hashed (SHA-256) before storage
4. Plain token shown ONCE to user
5. User copies and pastes into extension
```

### Extension Token Usage
```
1. Extension stores token locally
2. On API request, adds header: X-Extension-Token: <token>
3. Backend middleware verifies token
4. If valid, attaches user to req.user
5. Request proceeds normally
```

## Implementation

### Backend Middleware

**extensionAuth** (`backend/src/middleware/extensionAuth.js`)
```javascript
const extensionAuth = async (req, res, next) => {
  const token = req.header('X-Extension-Token');
  const result = await ExtensionToken.verify(token);
  req.user = result.user;
  next();
};
```

### Extension API Client

**apiRequest** (`_extension/background/api-client.js`)
```javascript
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'X-Extension-Token': token,
    ...options.headers
  };
  // Make request...
}
```

### Route Configuration

**Extension-only routes** use `extensionAuth`:
```javascript
// Classes
router.get('/', extensionAuth, getClasses);
router.get('/:id', extensionAuth, getClass);
router.get('/:id/students', extensionAuth, getStudents);

// Sessions
router.post('/start-from-meeting', extensionAuth, startSessionFromMeeting);
router.put('/:id/end-with-timestamp', extensionAuth, endSessionWithTimestamp);
router.get('/:id', extensionAuth, getSession);

// Participation
router.post('/sessions/:sessionId/logs', extensionAuth, addParticipationLog);
router.post('/sessions/:sessionId/logs/bulk', extensionAuth, addBulkParticipationLogs);
```

**Web-only routes** use `instructorAuth` (JWT):
```javascript
router.get('/stats', instructorAuth, getClassStats);
router.post('/', instructorAuth, createClass);
router.put('/:id', instructorAuth, updateClass);
```

## Token Management

### Database Schema
```sql
CREATE TABLE extension_tokens (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    token_hash VARCHAR(255) UNIQUE,      -- SHA-256 hash
    token_preview VARCHAR(20),            -- First 8 chars for display
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,                 -- 30 days from creation
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP
);
```

### Model Methods
```javascript
ExtensionToken.create(userId, expiryDays)     // Generate new token
ExtensionToken.verify(token)                   // Validate token
ExtensionToken.revoke(tokenId, userId)         // Revoke one token
ExtensionToken.revokeAll(userId)               // Revoke all user tokens
ExtensionToken.getByUserId(userId)             // List user's tokens
ExtensionToken.cleanupExpired()                // Remove old tokens
```

## Security Features

1. **Hashed Storage**: Only SHA-256 hash stored, never plain text
2. **One-Time Display**: Token shown once, then hidden forever
3. **Expiration**: 30-day automatic expiration
4. **Manual Revocation**: Users can revoke tokens anytime
5. **Last-Used Tracking**: Monitor suspicious activity
6. **Token Preview**: First 8 chars for user reference
7. **Separate from JWT**: No exposure of system secrets

## Migration from Old System

### Old (JWT-based)
```javascript
// Extension sent JWT
headers: { 'Authorization': `Bearer ${jwtToken}` }

// Backend used same auth as web app
router.use(instructorAuth);  // Checked JWT
```

### New (Extension Token)
```javascript
// Extension sends extension token
headers: { 'X-Extension-Token': token }

// Backend uses extension auth
router.get('/', extensionAuth, getClasses);  // Checks extension token
```

## User Experience

### Web App (Settings Page)
1. Click "Generate Extension Token"
2. See security warning
3. Copy token (shown once)
4. Paste into extension

### Extension (Options Page)
1. Paste token from web app
2. Click "Connect"
3. Extension verifies token
4. Shows success message

## Testing

### Test Extension Token
```bash
# Generate token in web app
curl -X POST http://localhost:3001/api/extension-tokens/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "your-token-here"}'

# Use token in API request
curl http://localhost:3001/api/classes \
  -H "X-Extension-Token: your-token-here"
```

### Test Web App JWT
```bash
# Login to get JWT
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use JWT in API request
curl http://localhost:3001/api/classes/stats \
  -H "Authorization: Bearer your-jwt-here"
```

## Troubleshooting

### "Invalid or expired extension token"
- Token may be expired (30 days)
- Token may be revoked
- Generate new token in Settings

### "No extension token provided"
- Check header name: `X-Extension-Token`
- Ensure token is stored in extension storage
- Verify token retrieval logic

### Extension can't connect
- Run database migration for `extension_tokens` table
- Restart backend server
- Verify token in database (check hash exists)

## Future Enhancements

- [ ] Multiple tokens per user (different devices)
- [ ] Token usage analytics
- [ ] Token scopes/permissions
- [ ] Device fingerprinting
- [ ] Email alerts for new token generation
- [ ] Automatic token rotation

---

**Key Takeaway**: Simple is better. Extension uses extension tokens, web app uses JWT. No mixing, no confusion, easier to maintain.
