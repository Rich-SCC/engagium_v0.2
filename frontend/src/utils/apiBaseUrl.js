const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function isLocalHost(hostname) {
  return LOCAL_HOSTS.has(hostname);
}

export function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  const allowCrossOrigin = import.meta.env.VITE_ALLOW_CROSS_ORIGIN_API === 'true';

  if (!configured) {
    return '/api';
  }

  if (configured.startsWith('/')) {
    return configured;
  }

  try {
    const parsed = new URL(configured, window.location.origin);
    const appIsLocal = isLocalHost(window.location.hostname);
    const apiIsLocal = isLocalHost(parsed.hostname);
    const sameOrigin = parsed.origin === window.location.origin;

    if (sameOrigin) {
      return configured;
    }

    // Prevent deployed pages from calling localhost URLs blocked by CSP/mixed-content rules.
    if (!appIsLocal && apiIsLocal) {
      return '/api';
    }

    // Mixed-content and CSP-safe default: avoid cross-origin API calls unless explicitly enabled.
    if (!allowCrossOrigin) {
      return '/api';
    }

    // If cross-origin is explicitly enabled, still prevent insecure HTTP from HTTPS pages.
    if (window.location.protocol === 'https:' && parsed.protocol === 'http:') {
      return '/api';
    }

    return configured;
  } catch {
    return '/api';
  }
}

export default resolveApiBaseUrl;