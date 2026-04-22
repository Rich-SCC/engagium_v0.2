/**
 * Centralized authentication utilities for the extension
 * Handles token storage, retrieval, verification, and environment detection
 */

import { STORAGE_KEYS } from './constants.js';

const API_BASE_URL_CANDIDATES = [
  'https://engagium.app/api',
  'https://dev.engagium.app/api'
];

let cachedApiBaseUrl = null;

function normalizeApiBaseUrl(baseUrl) {
  return typeof baseUrl === 'string' ? baseUrl.replace(/\/+$/, '') : null;
}

async function readStoredApiBaseUrl() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.API_BASE_URL);
    return normalizeApiBaseUrl(result[STORAGE_KEYS.API_BASE_URL]);
  } catch (error) {
    console.error('[Auth] Failed to get API base URL:', error);
    return null;
  }
}

async function storeApiBaseUrl(baseUrl) {
  const normalized = normalizeApiBaseUrl(baseUrl);

  if (!normalized) {
    return;
  }

  cachedApiBaseUrl = normalized;

  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.API_BASE_URL]: normalized
    });
  } catch (error) {
    console.error('[Auth] Failed to store API base URL:', error);
  }
}

async function verifyTokenAgainstBaseUrl(baseUrl, token) {
  const response = await fetch(`${baseUrl}/extension-tokens/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });

  if (!response.ok) {
    return { valid: false };
  }

  const data = await response.json();
  return {
    valid: true,
    user: data?.data?.user || null
  };
}

async function discoverApiBaseUrl(token) {
  const storedBaseUrl = cachedApiBaseUrl || await readStoredApiBaseUrl();
  const candidates = [storedBaseUrl, ...API_BASE_URL_CANDIDATES]
    .map(normalizeApiBaseUrl)
    .filter(Boolean);
  const uniqueCandidates = [...new Set(candidates)];

  for (const baseUrl of uniqueCandidates) {
    try {
      const result = await verifyTokenAgainstBaseUrl(baseUrl, token);
      if (result.valid) {
        await storeApiBaseUrl(baseUrl);
        return { baseUrl, ...result };
      }
    } catch (error) {
      // Try the next known host.
    }
  }

  return null;
}

/**
 * Check if running in development environment
 * @returns {boolean} True if in development mode
 */
export function isDevEnvironment() {
  return !('update_url' in chrome.runtime.getManifest());
}

/**
 * Get the currently selected API base URL
 * @returns {string} API base URL
 */
export async function getApiBaseUrl() {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  const storedBaseUrl = await readStoredApiBaseUrl();
  if (storedBaseUrl) {
    cachedApiBaseUrl = storedBaseUrl;
    return storedBaseUrl;
  }

  return API_BASE_URL_CANDIDATES[0];
}

/**
 * Get stored authentication token
 * @returns {Promise<string|null>} Auth token or null if not found
 */
export async function getAuthToken() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
    return result[STORAGE_KEYS.AUTH_TOKEN] || null;
  } catch (error) {
    console.error('[Auth] Failed to get auth token:', error);
    return null;
  }
}

/**
 * Store authentication token
 * @param {string} token - Token to store
 * @returns {Promise<void>}
 */
export async function setAuthToken(token) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.AUTH_TOKEN]: token });
  } catch (error) {
    console.error('[Auth] Failed to set auth token:', error);
    throw error;
  }
}

/**
 * Clear stored authentication token
 * @returns {Promise<void>}
 */
export async function clearAuthToken() {
  try {
    await chrome.storage.local.remove(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('[Auth] Failed to clear auth token:', error);
    throw error;
  }
}

/**
 * Verify authentication token with backend
 * @param {string} token - Token to verify
 * @returns {Promise<{valid: boolean, user?: object}>} Verification result
 */
export async function verifyAuthToken(token) {
  try {
    const discovered = await discoverApiBaseUrl(token);

    if (!discovered) {
      return { valid: false };
    }

    return { valid: true, user: discovered.user };
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return { valid: false };
  }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
export async function isAuthenticated() {
  const token = await getAuthToken();
  if (!token) return false;
  
  const result = await verifyAuthToken(token);
  return result.valid;
}
