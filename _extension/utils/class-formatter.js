/**
 * Utility functions for formatting class information
 * Enforces hierarchy: Section → Subject → Course
 * 
 * Shared utility for extension components
 */

/**
 * Formats class display with hierarchy: Section Subject - Course
 * Examples:
 *   Section A Psychology - Introduction to Psychology
 *   CS101 Computer Science - Data Structures
 *   B Mathematics - Calculus I
 * 
 * @param {Object} cls - Class object with section, subject, and name properties
 * @returns {string} Formatted class string
 */
export function formatClassDisplay(cls) {
  if (!cls) return '';
  
  const parts = [];
  
  // Section comes first
  if (cls.section) {
    parts.push(cls.section);
  }
  
  // Subject comes second
  if (cls.subject) {
    parts.push(cls.subject);
  }
  
  // Add separator if we have section or subject
  const prefix = parts.length > 0 ? parts.join(' ') + ' - ' : '';
  
  // Course name (the main name field)
  return `${prefix}${cls.name}`;
}
