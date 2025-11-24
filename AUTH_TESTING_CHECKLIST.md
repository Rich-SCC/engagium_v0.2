# Authentication Testing Checklist

Use this checklist to verify all authentication features are working correctly.

## Setup Verification

- [ ] Backend server is running on port 3001
- [ ] Frontend is running on port 5173
- [ ] Database migration completed successfully
- [ ] `.env` file configured with all required variables
- [ ] Email service configured and verified

## Registration Flow

- [ ] Navigate to registration page
- [ ] Test with missing fields (should show validation errors)
- [ ] Test with invalid email format (should show error)
- [ ] Test with short password <6 chars (should show error)
- [ ] Register successfully with valid data
- [ ] Verify user is redirected to dashboard
- [ ] Check localStorage for `engagium_token` and `engagium_refresh_token`
- [ ] Test registering with existing email (should show error)

## Login Flow

- [ ] Navigate to login page
- [ ] Test with invalid credentials (should show error)
- [ ] Login successfully with valid credentials
- [ ] Verify redirect to dashboard
- [ ] Verify tokens stored in localStorage
- [ ] Verify user data loaded correctly

## Token Management

- [ ] Access token is stored correctly
- [ ] Refresh token is stored correctly
- [ ] Check access token expiration (should be 15 minutes)
- [ ] Check refresh token expiration (should be 7 days)
- [ ] Wait or manipulate token to expire, verify auto-refresh works
- [ ] Verify API requests continue working after token refresh

## Forgot Password Flow

- [ ] Click "Forgot password?" link on login page
- [ ] Navigate to forgot password page
- [ ] Test with invalid email format (should show error)
- [ ] Submit with valid email
- [ ] Verify success message displayed
- [ ] Check email inbox for password reset email
- [ ] Verify email contains reset link
- [ ] Verify email is properly formatted and branded

## Reset Password Flow

- [ ] Click reset link from email
- [ ] Verify redirected to reset password page with token
- [ ] Test with mismatched passwords (should show error)
- [ ] Test with short password <6 chars (should show error)
- [ ] Submit with valid new password
- [ ] Verify success message and redirect to login
- [ ] Login with new password (should work)
- [ ] Try using old password (should fail)
- [ ] Try using reset link again (should fail - token already used)

## Logout Flow

- [ ] While logged in, click logout
- [ ] Verify redirected to login page
- [ ] Verify tokens removed from localStorage
- [ ] Verify cannot access protected routes without login
- [ ] Verify refresh token cleared from database

## Profile Management

- [ ] Access profile page while logged in
- [ ] Verify user data displayed correctly (firstname, lastname, email)
- [ ] Update profile information
- [ ] Verify changes saved successfully
- [ ] Refresh page, verify changes persisted

## Security Tests

- [ ] Try accessing protected routes without token (should redirect to login)
- [ ] Try using expired access token (should auto-refresh)
- [ ] Try using invalid token (should redirect to login)
- [ ] Try resetting password with expired token (should show error)
- [ ] Try resetting password with invalid token (should show error)
- [ ] Verify passwords are not visible in network requests
- [ ] Verify password hashing in database (not plain text)

## Email Service Tests

- [ ] Email received within reasonable time (< 1 minute)
- [ ] Email not marked as spam
- [ ] Email formatting looks good (HTML version)
- [ ] Plain text version of email readable
- [ ] Reset link works correctly
- [ ] Email sender name shows as "Engagium"

## Browser Testing

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test in Edge
- [ ] Verify tokens persist across page refreshes
- [ ] Verify tokens cleared on logout in all browsers

## API Endpoint Tests (Optional - using cURL or Postman)

- [ ] POST /api/auth/register - Creates user and returns tokens
- [ ] POST /api/auth/login - Authenticates and returns tokens
- [ ] POST /api/auth/refresh-token - Exchanges refresh token for new access token
- [ ] POST /api/auth/forgot-password - Sends reset email
- [ ] POST /api/auth/reset-password - Resets password with valid token
- [ ] GET /api/auth/profile - Returns user data (requires auth)
- [ ] PUT /api/auth/profile - Updates user data (requires auth)
- [ ] POST /api/auth/logout - Clears refresh token (requires auth)

## Error Handling

- [ ] Network errors handled gracefully
- [ ] Server errors show appropriate messages
- [ ] Validation errors shown clearly
- [ ] Loading states displayed during async operations
- [ ] User-friendly error messages (not technical jargon)

## Edge Cases

- [ ] Multiple rapid login attempts
- [ ] Extremely long names/emails
- [ ] Special characters in names
- [ ] Request password reset for non-existent email (should still show success)
- [ ] Multiple password reset requests (should invalidate previous tokens)
- [ ] Simultaneous API requests during token refresh

## Production Readiness (Before Going Live)

- [ ] Change JWT secrets to strong random values
- [ ] Enable HTTPS
- [ ] Configure production SMTP service (not Gmail)
- [ ] Set appropriate CORS origins
- [ ] Enable rate limiting on auth endpoints
- [ ] Add logging for security events
- [ ] Set up monitoring for failed login attempts
- [ ] Configure proper database backups
- [ ] Test password reset flow with production email

## Notes

Add any issues or observations here:
```
[Your notes here]
```

## Sign-off

- [ ] All critical tests passing
- [ ] All major tests passing
- [ ] Edge cases handled
- [ ] Ready for next feature

Tested by: ________________
Date: ________________
