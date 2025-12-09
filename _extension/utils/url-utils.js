/**
 * URL Utilities
 * Helper functions for normalizing and formatting meeting URLs
 */

/**
 * Format a Google Meet code/URL to the standard format
 * Converts various formats to: meet.google.com/xxx-yyyy-zzz
 * @param {string} input - Meeting code or URL (e.g., "abc-defg-hij", "meet.google.com/abc-defg-hij", "https://meet.google.com/abc-defg-hij")
 * @returns {string} Formatted URL without protocol (meet.google.com/xxx-yyyy-zzz)
 */
export function formatGoogleMeetUrl(input) {
  if (!input) return '';
  
  // Remove protocol if present
  let cleanInput = input.replace(/^https?:\/\//, '');
  
  // If already starts with meet.google.com, return as is
  if (cleanInput.startsWith('meet.google.com/')) {
    return cleanInput;
  }
  
  // If starts with just the meeting code pattern (xxx-yyyy-zzz), prepend domain
  const meetingCodePattern = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
  if (meetingCodePattern.test(cleanInput)) {
    return `meet.google.com/${cleanInput}`;
  }
  
  // If it's just the domain with code already, return as is
  return cleanInput;
}

/**
 * Add https:// protocol to a meeting URL if not present
 * @param {string} url - URL (e.g., "meet.google.com/xxx-yyyy-zzz")
 * @returns {string} Full URL with protocol (https://meet.google.com/xxx-yyyy-zzz)
 */
export function addProtocol(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

/**
 * Extract meeting code from Google Meet URL
 * @param {string} url - Full URL or meeting code
 * @returns {string|null} Meeting code (xxx-yyyy-zzz) or null if invalid
 */
export function extractMeetingCode(url) {
  if (!url) return null;
  
  // Match the code pattern from the end of the URL
  const match = url.match(/([a-z]{3}-[a-z]{4}-[a-z]{3})$/);
  return match ? match[1] : null;
}

/**
 * Validate if a string is a valid Google Meet URL or code
 * @param {string} input - URL or code to validate
 * @returns {boolean} True if valid
 */
export function isValidGoogleMeetUrl(input) {
  if (!input) return false;
  
  // Remove protocol
  const cleanInput = input.replace(/^https?:\/\//, '');
  
  // Check if it matches the full URL pattern
  if (cleanInput.match(/^meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/)) {
    return true;
  }
  
  // Check if it's just the code
  if (cleanInput.match(/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/)) {
    return true;
  }
  
  return false;
}

/**
 * Normalize a meeting link to the standard storage format (meet.google.com/xxx-yyyy-zzz)
 * Works with Google Meet, Zoom, Teams, etc.
 * @param {string} link - Any meeting link
 * @param {string} platform - Platform type ('google-meet', 'zoom', 'teams')
 * @returns {string} Normalized link
 */
export function normalizeMeetingLink(link, platform = 'google-meet') {
  if (!link) return '';
  
  if (platform === 'google-meet') {
    return formatGoogleMeetUrl(link);
  }
  
  // For other platforms, just ensure it has no protocol for consistent storage
  return link.replace(/^https?:\/\//, '');
}
