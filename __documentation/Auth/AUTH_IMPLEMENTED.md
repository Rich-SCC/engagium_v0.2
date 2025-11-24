# Authentication Feature Documentation

## Overview
Complete authentication system with user registration, login, logout, password management, and session handling using JWT tokens with refresh token rotation.

## Implementation Status
✅ **Fully Implemented** - All authentication features are complete and tested.

## Features

### 1. User Registration
**Status:** ✅ Implemented

- Create new instructor accounts
- Email uniqueness validation
- Password hashing with bcrypt
- Automatic role assignment (instructor/admin)
- Account creation confirmation

**Fields:**
- Email (required, unique)
- Password (required, min 6 characters)
- First Name (required)
- Last Name (required)
- Role (defaults to 'instructor')

### 2. User Login
**Status:** ✅ Implemented

- Email and password authentication
- JWT access token generation (1 hour expiry)
- JWT refresh token generation (7 days expiry)
- Secure token storage
- User profile return on success

**Security Features:**
- Password comparison with bcrypt
- Token signing with JWT secret
- HTTP-only cookie option (if configured)
- Rate limiting (recommended for production)

### 3. Session Management
**Status:** ✅ Implemented

- Access token validation
- Automatic token refresh
- Refresh token rotation
- Concurrent session support
- Token revocation on logout

**Token Strategy:**
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (7 days)
- Automatic refresh before expiry
- Queue system for concurrent requests

### 4. Password Management
**Status:** ✅ Implemented

#### Forgot Password
- Password reset request via email
- Unique reset token generation
- Token expiry (1 hour)
- Email delivery with reset link
- Token validation before reset

#### Reset Password
- Secure token verification
- New password validation
- Password update with hashing
- Token invalidation after use
- Automatic login after reset (optional)

### 5. User Profile
**Status:** ✅ Implemented

- Get current user profile
- Update profile information
- Change password (authenticated)
- Profile data validation

### 6. Logout
**Status:** ✅ Implemented

- Invalidate refresh token
- Clear client-side tokens
- Session termination
- Redirect to login page

## Database Schema

### Users Table
```sql
CREATE TYPE user_role AS ENUM ('instructor', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'instructor' NOT NULL,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_reset_token ON users(reset_token);
```

## API Endpoints

### Authentication
```
POST   /api/auth/register            - Create new account
POST   /api/auth/login               - Login user
POST   /api/auth/logout              - Logout user
POST   /api/auth/refresh-token       - Refresh access token
GET    /api/auth/profile             - Get current user profile
PUT    /api/auth/profile             - Update user profile
POST   /api/auth/forgot-password     - Request password reset
POST   /api/auth/reset-password      - Reset password with token
```

## Request/Response Examples

### Register
**Request:**
```json
POST /api/auth/register
{
  "email": "instructor@university.edu",
  "password": "securepass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "instructor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "instructor@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "instructor"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Login
**Request:**
```json
POST /api/auth/login
{
  "email": "instructor@university.edu",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "instructor@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "instructor"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Forgot Password
**Request:**
```json
POST /api/auth/forgot-password
{
  "email": "instructor@university.edu"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password
**Request:**
```json
POST /api/auth/reset-password
{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### Refresh Token
**Request:**
```json
POST /api/auth/refresh-token
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

## Frontend Implementation

### Authentication Context
**Location:** `frontend/src/contexts/AuthContext.jsx`

**Features:**
- Global auth state management
- User session persistence
- Automatic token refresh
- Protected route handling
- Login/logout functions

### Token Storage
**Location:** `frontend/src/utils/auth.js`

**Functions:**
- `setToken(token)` - Store access token
- `getToken()` - Retrieve access token
- `setRefreshToken(token)` - Store refresh token
- `getRefreshToken()` - Retrieve refresh token
- `removeTokens()` - Clear all tokens

**Storage Method:** localStorage (can be configured for sessionStorage or cookies)

### API Interceptors
**Location:** `frontend/src/services/api.js`

**Request Interceptor:**
- Automatically adds Authorization header
- Includes Bearer token for authenticated requests

**Response Interceptor:**
- Handles 401 Unauthorized
- Triggers automatic token refresh
- Queues failed requests during refresh
- Retries requests after refresh
- Redirects to login on refresh failure

### Components

#### LoginModal
**Location:** `frontend/src/components/LoginModal.jsx`

**Features:**
- Email and password inputs
- Form validation
- Error message display
- Loading state
- Link to forgot password
- Link to signup

#### SignUpModal
**Location:** `frontend/src/components/SignUpModal.jsx`

**Features:**
- Registration form (email, password, first/last name)
- Password confirmation
- Form validation
- Error handling
- Loading state
- Link to login

#### ForgotPasswordModal
**Location:** `frontend/src/components/ForgotPasswordModal.jsx`

**Features:**
- Email input
- Submit request
- Success/error messages
- Link back to login

#### ResetPassword Page
**Location:** `frontend/src/pages/ResetPassword.jsx`

**Features:**
- Token extraction from URL
- New password input
- Password confirmation
- Token validation
- Success redirect to login

### Protected Routes
**Implementation:** `App.jsx`

**ProtectedRoute Component:**
- Checks authentication status
- Shows loading during auth check
- Redirects to login if not authenticated
- Allows access if authenticated

**PublicRoute Component:**
- Prevents authenticated users from accessing
- Redirects to dashboard if already logged in
- Allows access if not authenticated

## Security Considerations

### Password Security
- Passwords hashed with bcrypt (10 rounds)
- Minimum length enforcement (6 characters)
- Never stored in plain text
- Never returned in API responses

### Token Security
- Short-lived access tokens (1 hour)
- Refresh tokens stored securely
- Token rotation on refresh
- Tokens signed with secret key
- HTTP-only cookies recommended for production

### Reset Token Security
- Cryptographically random tokens
- One-time use only
- 1-hour expiration
- Token invalidation after use
- Token stored hashed in database

### Rate Limiting (Recommended)
- Login attempts limited
- Registration rate limited
- Password reset requests limited
- Prevents brute force attacks

### Input Validation
- Email format validation
- Password strength requirements
- SQL injection prevention
- XSS prevention

## Error Handling

### Common Error Responses

**Invalid Credentials:**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Email Already Exists:**
```json
{
  "success": false,
  "error": "User already exists"
}
```

**Invalid/Expired Token:**
```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

**Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

## Middleware

### Authentication Middleware
**Location:** `backend/src/middleware/auth.js`

#### `instructorAuth`
- Validates access token
- Extracts user from token
- Attaches user to request object
- Returns 401 if invalid/missing token
- Used for all protected instructor routes

## Email Service

### Password Reset Emails
**Location:** `backend/src/services/emailService.js`

**Configuration:**
- SMTP settings (host, port, auth)
- Email templates
- Sender information

**Features:**
- HTML email templates
- Plain text fallback
- Reset link generation
- Error handling and retry

**Environment Variables Required:**
```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@example.com
EMAIL_PASSWORD=password
EMAIL_FROM=noreply@example.com
```

## Testing
See `AUTH_TESTING_CHECKLIST.md` for comprehensive testing guide.

## File Structure

### Backend
```
backend/src/
├── controllers/
│   └── authController.js     - Auth business logic
├── middleware/
│   └── auth.js               - JWT validation middleware
├── models/
│   └── User.js               - User model & DB operations
├── routes/
│   └── auth.js               - Auth route definitions
└── services/
    └── emailService.js       - Email sending service
```

### Frontend
```
frontend/src/
├── components/
│   ├── LoginModal.jsx         - Login form
│   ├── SignUpModal.jsx        - Registration form
│   └── ForgotPasswordModal.jsx - Password reset request
├── contexts/
│   └── AuthContext.jsx        - Global auth state
├── pages/
│   ├── LandingPage.jsx        - Landing with auth modals
│   └── ResetPassword.jsx      - Password reset page
├── services/
│   └── api.js                 - API client with interceptors
└── utils/
    └── auth.js                - Token storage utilities
```

## Configuration

### Environment Variables

**Backend (.env):**
```
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@engagium.com
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000
```

## Known Limitations

### Email Sending
- Requires SMTP configuration
- Gmail may require app-specific passwords
- Rate limits on email providers
- No email queue system (synchronous sending)

### Token Storage
- localStorage vulnerable to XSS
- Consider HTTP-only cookies for production
- No token rotation on every refresh (only on refresh request)

### Session Management
- No device tracking
- No session listing/revocation
- Limited to one refresh token per user

## Future Enhancements
See separate documentation for planned authentication enhancements.
