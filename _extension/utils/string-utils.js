/**
 * Centralized string manipulation utilities
 * Handles hashing, name normalization, and text cleaning
 */

/**
 * Generate a simple hash from a string
 * @param {string} str - String to hash
 * @returns {string} Hashed string in base36 format
 */
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Normalize a name for fuzzy matching
 * Converts to lowercase, removes special characters, sorts words alphabetically
 * @param {string} name - Name to normalize
 * @returns {string} Normalized name
 */
export function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '') // Remove non-letter, non-space characters
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .split(' ')
    .sort()
    .join(' ');
}

/**
 * Clean participant name from Google Meet
 * Removes trailing identifiers like (Guest), (You), etc.
 * @param {string} name - Raw participant name
 * @returns {string} Cleaned name
 */
export function cleanParticipantName(name) {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .replace(/\s*\(Guest\)$/i, '')
    .replace(/\s*\(You\)$/i, '')
    .replace(/\s*\(Host\)$/i, '')
    .replace(/\s*\(Presenter\)$/i, '')
    .replace(/\s*\(\d+\)$/, '') // Remove trailing numbers like (2)
    .trim();
}

/**
 * Extract initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  
  const cleaned = cleanParticipantName(name);
  const parts = cleaned.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
