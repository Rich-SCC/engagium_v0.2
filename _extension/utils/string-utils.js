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

