/**
 * Utility functions for formatting class information
 * Enforces hierarchy: Section → Subject → Course
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
export const formatClassDisplay = (cls) => {
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
};

/**
 * Formats class display for dropdown/select elements
 * Same as formatClassDisplay but optimized for compact display
 */
export const formatClassOption = (cls) => {
  return formatClassDisplay(cls);
};

/**
 * Returns the hierarchical components separately
 * Useful for display in separate UI elements
 * 
 * @param {Object} cls - Class object
 * @returns {Object} Object with section, subject, course properties
 */
export const getClassHierarchy = (cls) => {
  if (!cls) return { section: '', subject: '', course: '' };
  
  return {
    section: cls.section || '',
    subject: cls.subject || '',
    course: cls.name || ''
  };
};
