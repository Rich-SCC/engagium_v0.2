(async () => {
  const src = chrome.runtime.getURL('content/google-meet.js');
  await import(src);
})();
