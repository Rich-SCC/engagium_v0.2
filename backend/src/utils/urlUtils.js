/**
 * URL Utilities
 * Helper functions for normalizing and formatting meeting URLs
 */

/**
 * Format a Google Meet code/URL to the standard format
 * Converts various formats to: meet.google.com/xxx-yyyy-zzz
 * @param {string} input - Meeting code or URL
 * @returns {string} Formatted URL without protocol
 */
function formatGoogleMeetUrl(input) {
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
  
  // Return as is if format is unexpected
  return cleanInput;
}

/**
 * Add https:// protocol to a meeting URL if not present
 * @param {string} url - URL (e.g., "meet.google.com/xxx-yyyy-zzz")
 * @returns {string} Full URL with protocol
 */
function addProtocol(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

/**
 * Normalize a meeting link to the standard storage format
 * - Google Meet: meet.google.com/xxx-yyyy-zzz (no protocol)
 * - Zoom: zoom.us/j/... (no protocol)
 * - Others: as-is without protocol
 * @param {string} link - Any meeting link
 * @returns {string} Normalized link
 */
function normalizeMeetingLink(link) {
  if (!link) return '';
  
  // Remove protocol for consistent storage
  let cleanLink = link.replace(/^https?:\/\//, '');
  
  // Check if it's a Google Meet link/code and format it properly
  if (cleanLink.startsWith('meet.google.com/') || /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(cleanLink)) {
    return formatGoogleMeetUrl(cleanLink);
  }
  
  // For other platforms, return without protocol
  return cleanLink;
}

/**
 * Validate if a string is a valid Google Meet URL or code
 * @param {string} input - URL or code to validate
 * @returns {boolean} True if valid
 */
function isValidGoogleMeetUrl(input) {
  if (!input) return false;
  
  const cleanInput = input.replace(/^https?:\/\//, '');
  
  // Check if it matches the full URL pattern or just the code
  return /^meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(cleanInput) ||
         /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(cleanInput);
}

module.exports = {
  formatGoogleMeetUrl,
  addProtocol,
  normalizeMeetingLink,
  isValidGoogleMeetUrl
};
