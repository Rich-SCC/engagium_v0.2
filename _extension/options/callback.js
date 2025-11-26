/**
 * OAuth Callback Handler
 * 
 * This script runs when the web app redirects back to the extension
 * after successful authentication. It extracts the JWT token from the URL,
 * stores it securely, and notifies the options page.
 */

(async function handleCallback() {
  const messageEl = document.getElementById('message');

  try {
    // Extract token and user data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userJson = urlParams.get('user');

    if (!token) {
      throw new Error('No token received from authentication server');
    }

    // Parse user data if provided
    let userData = null;
    if (userJson) {
      try {
        userData = JSON.parse(decodeURIComponent(userJson));
      } catch (e) {
        console.warn('Failed to parse user data:', e);
      }
    }

    // Store token in chrome.storage.local
    await chrome.storage.local.set({
      auth_token: token,
      auth_user: userData,
      auth_timestamp: Date.now()
    });

    console.log('[Callback] Token stored successfully');

    // Notify the options page that authentication succeeded
    // This will trigger the options page to update its UI
    chrome.runtime.sendMessage({
      type: 'AUTH_SUCCESS',
      token,
      user: userData
    }).catch(err => {
      console.log('[Callback] Options page not open, will update on next open');
    });

    // Show success message
    messageEl.textContent = 'Authentication successful! This window will close automatically.';

    // Close this tab after a short delay
    setTimeout(() => {
      window.close();
    }, 1500);

  } catch (error) {
    console.error('[Callback] Authentication error:', error);
    
    // Show error message
    const container = document.querySelector('.container');
    container.innerHTML = `
      <div class="error">
        <h2>Authentication Failed</h2>
        <p>${error.message}</p>
        <p><small>You can close this window and try again.</small></p>
      </div>
    `;
  }
})();
