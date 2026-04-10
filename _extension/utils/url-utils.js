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

