/**
 * Centralized authentication utilities for the extension
 * Handles token storage, retrieval, verification, and environment detection
 */

import { STORAGE_KEYS } from './constants.js';

/**
 * Check if running in development environment
 * @returns {boolean} True if in development mode
 */
export function isDevEnvironment() {
  return !('update_url' in chrome.runtime.getManifest());
}

/**
 * Get the API base URL based on environment
 * @returns {string} API base URL
 */
export function getApiBaseUrl() {
  return isDevEnvironment() 
    ? 'http://localhost:3001' 
    : 'https://engagium.app';
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
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/extension-tokens/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json();
    return { valid: true, user: data.user };
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
