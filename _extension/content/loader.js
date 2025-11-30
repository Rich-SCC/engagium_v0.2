/**
 * Content Script Loader
 * Dynamically imports the Google Meet content script as an ES module
 * Required for Chrome MV3 content scripts with ES module imports
 * 
 * Note: The bundled output is content/google-meet.js (not content/google-meet/index.js)
 */
(async () => {
  const src = chrome.runtime.getURL('content/google-meet.js');
  await import(src);
})();
