/**
 * URL Utilities for Frontend
 * Helper functions for formatting and displaying meeting URLs
 */

/**
 * Ensure a URL has a protocol (https://)
 * @param {string} url - URL with or without protocol
 * @returns {string} URL with protocol
 */
export function ensureProtocol(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

/**
 * Format a meeting link for display
 * @param {string} link - Meeting link (may be stored without protocol)
 * @returns {string} Full URL with protocol
 */
export function formatMeetingLinkForDisplay(link) {
  if (!link) return '';
  return ensureProtocol(link);
}

/**
 * Get a friendly display text for a meeting link
 * @param {string} link - Meeting link
 * @returns {string} Friendly text (e.g., "Join Meeting", "meet.google.com/xxx-yyyy-zzz")
 */
export function getMeetingLinkText(link) {
  if (!link) return '';
  
  const cleanLink = link.replace(/^https?:\/\//, '');
  
  // For Google Meet, show the full domain/code
  if (cleanLink.startsWith('meet.google.com/')) {
    return cleanLink;
  }
  
  // For Zoom, show domain/path
  if (cleanLink.startsWith('zoom.us/')) {
    return cleanLink;
  }
  
  // Fallback: show the domain
  try {
    const url = new URL(ensureProtocol(cleanLink));
    return url.hostname;
  } catch {
    return cleanLink;
  }
}

/**
 * Validate if a string looks like a valid meeting URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export function isValidMeetingUrl(url) {
  if (!url) return false;
  
  try {
    const fullUrl = ensureProtocol(url);
    const parsed = new URL(fullUrl);
    
    // Check for common meeting platforms
    const validDomains = [
      'meet.google.com',
      'zoom.us'
    ];
    
    return validDomains.some(domain => parsed.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Normalize a meeting URL for storage (removes protocol)
 * This ensures consistent storage format across the app
 * @param {string} url - URL with or without protocol
 * @returns {string} Normalized URL without protocol
 */
export function normalizeMeetingUrl(url) {
  if (!url) return '';
  
  // Remove protocol and any trailing slashes
  return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}
