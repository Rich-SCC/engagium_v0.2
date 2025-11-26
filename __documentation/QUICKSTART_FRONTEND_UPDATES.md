# Quick Start Guide - Frontend Updates

## What Changed?

1. ✅ **New Home Page** - Cleaner overview with stats and quick actions
2. ✅ **Live Feed Page** - Dedicated page for real-time monitoring
3. ✅ **Updated Navigation** - New order: Home → Live Feed → My Classes → Sessions → Analytics → Notifications → Settings
4. ✅ **Secure Token System** - Extension tokens are now separate from internal auth tokens
5. ✅ **Testing Setup** - Complete testing framework with Vitest and React Testing Library

## Getting Started

### 1. Update Database (Required)

```bash
cd database
psql -h localhost -U postgres -d engagium -f extension_tokens.sql
```

Or see `database/MIGRATION_EXTENSION_TOKENS.md` for detailed instructions.

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Test the Changes

1. Open http://localhost:5173
2. Login with your account
3. You'll land on the new Home page
4. Check the navigation sidebar - notice the new order
5. Click "Live Feed" to see the dedicated live monitoring page
6. Go to Settings → Generate a new extension token
7. Notice the security improvements and better UI

### 5. Run Tests (Optional)

```bash
cd frontend
npm test              # Run all tests
npm run test:ui       # Interactive test UI
npm run test:coverage # Generate coverage report
```

## Important Notes

### ⚠️ Extension Token Change

**Action Required for Extension Users:**

The old JWT tokens are **no longer valid**. You must:

1. Go to Settings in the web app
2. Generate a new extension token
3. Copy the token (it's shown only once!)
4. Update your browser extension with the new token

### 🔄 Route Changes

- Old route: `/app/dashboard` → Redirects to `/app/home`
- All internal links updated automatically
- Bookmarks will redirect properly

### 🧪 Testing

Tests are now available for frontend components:
- Run `npm test` to verify everything works
- See `frontend/TESTING.md` for the complete guide

## Features Overview

### New Home Page
- **Quick Stats**: Total classes, students, sessions, active sessions
- **Quick Actions**: Links to Manage Classes, View Live Feed, View Analytics
- **Recent Classes**: Grid view of your classes with student counts
- **Empty State**: Helpful prompt when no classes exist

### Live Feed Page
- **Active Session Card**: Currently running sessions
- **Live Event Feed**: Real-time participation events
- Dedicated focus area for monitoring

### Secure Token System

**Security Improvements:**
- ✅ Separate tokens from internal JWT system
- ✅ Tokens are hashed (SHA-256) before storage
- ✅ 30-day expiration
- ✅ Manual revocation support
- ✅ Last-used tracking
- ✅ Token preview for reference

**Settings Page:**
- Clear security warnings
- One-time token display
- Copy-to-clipboard with visual feedback
- Detailed setup instructions
- Token expiration information

## Troubleshooting

### "Extension token not working"
→ Regenerate token in Settings page and update extension

### "Cannot find module" errors
→ Run `npm install` in frontend directory

### "Database table doesn't exist"
→ Run the migration: `database/extension_tokens.sql`

### Tests failing
→ Ensure all dependencies installed: `npm install`
→ Check that you're in the frontend directory

### Navigation not showing correctly
→ Clear browser cache and reload
→ Check that you're logged in

## Next Steps

1. **Test Navigation**: Click through all menu items
2. **Generate Token**: Create a new extension token
3. **Update Extension**: Use new token in browser extension
4. **Run Tests**: Verify everything works with `npm test`
5. **Read Docs**: Check `FRONTEND_RESTRUCTURE_NOV26.md` for details

## Need Help?

- **Full Documentation**: `__documentation/FRONTEND_RESTRUCTURE_NOV26.md`
- **Testing Guide**: `frontend/TESTING.md`
- **Migration Guide**: `database/MIGRATION_EXTENSION_TOKENS.md`
- **System Architecture**: `__documentation/SYSTEM_ARCHITECTURE.md`

---

**Status**: ✅ All changes implemented and tested
**Version**: November 26, 2025
