/**
 * Centralized logging utilities with module prefixes
 * Creates consistent, filterable console output
 */

/**
 * Create a logger instance for a specific module
 * @param {string} moduleName - Name of the module (e.g., 'Background', 'SessionManager')
 * @returns {Object} Logger instance with log, warn, error, success methods
 */
export function createLogger(moduleName) {
  const prefix = `[${moduleName}]`;
  
  return {
    /**
     * Log informational message
     */
    log: (...args) => {
      console.log(prefix, ...args);
    },
    
    /**
     * Log warning message
     */
    warn: (...args) => {
      console.warn(prefix, ...args);
    },
    
    /**
     * Log error message
     */
    error: (...args) => {
      console.error(prefix, ...args);
    },
    
    /**
     * Log success message (with green styling in supported consoles)
     */
    success: (...args) => {
      console.log(`%c${prefix}`, 'color: green; font-weight: bold', ...args);
    },
    
    /**
     * Log debug message (only in development)
     */
    debug: (...args) => {
      if (!('update_url' in chrome.runtime.getManifest())) {
        console.log(`%c${prefix}`, 'color: gray', ...args);
      }
    },
    
    /**
     * Create a grouped log section
     */
    group: (label, callback) => {
      console.group(prefix, label);
      callback && callback();
      console.groupEnd();
    },
    
    /**
     * Create a collapsed grouped log section
     */
    groupCollapsed: (label, callback) => {
      console.groupCollapsed(prefix, label);
      callback && callback();
      console.groupEnd();
    }
  };
}

/**
 * Create a scoped logger with additional context
 * @param {string} moduleName - Module name
 * @param {string} scope - Additional scope context
 * @returns {Object} Scoped logger instance
 */
export function createScopedLogger(moduleName, scope) {
  const logger = createLogger(`${moduleName}:${scope}`);
  return logger;
}

/**
 * Log timing information for performance monitoring
 * @param {string} moduleName - Module name
 * @param {string} operation - Operation being timed
 * @returns {Function} End function to call when operation completes
 */
export function createTimer(moduleName, operation) {
  const start = performance.now();
  const prefix = `[${moduleName}]`;
  
  return () => {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`${prefix} ${operation} completed in ${duration}ms`);
  };
}
