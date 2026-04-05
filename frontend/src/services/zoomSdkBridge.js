import zoomSdkPackage from '@zoom/appssdk';

const ZOOM_CONFIG_CAPABILITIES = [
  'getSupportedJsApis',
  'getRunningContext',
  'getMeetingUUID',
  'getMeetingContext',
  'getMeetingJoinUrl',
  'getMeetingParticipants',
  'getUserContext',
  'onParticipantChange',
  'onReaction',
  'onEmojiReaction',
  'onMyReaction',
  'onMyMediaChange',
  'onMeeting',
  'onRunningContextChange',
  'onMyUserContextChange',
];

const ZOOM_CONFIG_CAPABILITIES_FALLBACK = [
  'getSupportedJsApis',
  'getRunningContext',
  'getUserContext',
  'onMeeting',
  'onRunningContextChange',
  'onMyUserContextChange',
];

const ZOOM_CONFIG_CAPABILITIES_MINIMAL = [
  'getRunningContext',
  'onMeeting',
];

const ZOOM_SDK_SCRIPT_ID = 'engagium-zoom-sdk-script';
const ZOOM_SDK_SCRIPT_URLS = [
  'https://appssdk.zoom.us/sdk.min.js',
  'https://appssdk.zoom.us/sdk.js',
];

const createSourceEventId = (prefix) =>
  `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

const getIsoNow = () => new Date().toISOString();

const extractParticipantName = (payload = {}) =>
  payload.screenName ||
  payload.displayName ||
  payload.userName ||
  payload.participantName ||
  payload.name ||
  payload.participantUUID ||
  'Unknown participant';

const extractParticipantId = (payload = {}) =>
  payload.participantUUID || payload.userId || payload.id || payload.participantId || null;

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

  const scheduleTask = (() => {
  if (typeof MessageChannel !== 'undefined') {
    const queue = [];
    const channel = new MessageChannel();

    channel.port1.onmessage = () => {
      const fn = queue.shift();
      fn?.();
    };

    return (fn) => {
      queue.push(fn);
      channel.port2.postMessage(0);
    };
  }

  return (fn) => setTimeout(fn, 0);
})();

const wait = (ms) => new Promise((resolve) => {
  const started = Date.now();

  const loop = () => {
    if (Date.now() - started >= ms) {
      resolve();
      return;
    }

    scheduleTask(loop);
  };

  loop();
});
const waitForMicrotask = () => Promise.resolve();

const withTimeout = async (promise, timeoutMs, timeoutMessage) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const createDebugEmitter = (onDebug) => (phase, message, meta = {}, level = 'info') => {
  try {
    onDebug?.({
      timestamp: getIsoNow(),
      phase,
      message,
      level,
      meta,
    });
  } catch {
    // Debug channel must never break SDK initialization flow.
  }
};

const createStepTracer = (debug, scope) => {
  return (step, phaseStart, phaseEnd, operation) => {
    const startedAt = Date.now();
    debug(`${scope}:${phaseStart}`, `Starting ${step}`);

    return Promise.resolve()
      .then(operation)
      .then((result) => {
        debug(`${scope}:${phaseEnd}`, `Finished ${step}`, {
          durationMs: Date.now() - startedAt,
        });
        return result;
      })
      .catch((error) => {
        debug(`${scope}:${phaseEnd}`, `Failed ${step}`, {
          durationMs: Date.now() - startedAt,
          error: error?.message || 'step failed',
        }, 'error');
        throw error;
      });
  };
};

const uniqueList = (items = []) => Array.from(new Set(items.filter(Boolean)));

const isMustCallConfigError = (error) =>
  String(error?.message || '').toLowerCase().includes('must call zoomsdk.config before using other api methods');

const getSupportedApisFromResult = (value) => {
  const candidates = [
    value,
    value?.supportedApis,
    value?.apis,
    value?.supportedJsApis,
    value?.result,
    value?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return uniqueList(candidate);
    }
  }

  if (Array.isArray(value?.result?.supportedApis)) {
    return uniqueList(value.result.supportedApis);
  }

  return [];
};

async function configureZoomSdk(zoomSdk, debug = () => {}) {
  debug('config-phase', 'Entering Zoom SDK config phase');
  const trace = createStepTracer(debug, 'config');

  const configAttempts = [
    uniqueList(ZOOM_CONFIG_CAPABILITIES),
    uniqueList(ZOOM_CONFIG_CAPABILITIES_FALLBACK),
    uniqueList(ZOOM_CONFIG_CAPABILITIES_MINIMAL),
  ];

  const errors = [];
  let successfulCapabilities = null;
  let configResult = null;

  for (const capabilities of configAttempts) {
    debug('config-attempt', 'Attempting Zoom SDK config', {
      capabilityCount: capabilities.length,
      capabilities,
    });

    try {
      configResult = await trace(
        `zoomSdk.config (${capabilities.length} capabilities)`,
        'call-start',
        'call-end',
        () => withTimeout(zoomSdk.config({
          version: '0.16',
          capabilities,
          size: { width: 1280, height: 720 },
          popoutSize: { width: 720, height: 600 },
        }), 8000, 'Zoom SDK config timed out')
      );

      successfulCapabilities = capabilities;
      debug('config-success', 'Zoom SDK config succeeded', {
        capabilityCount: capabilities.length,
      });
      break;
    } catch (error) {
      debug('config-failed', 'Zoom SDK config attempt failed', {
        capabilityCount: capabilities.length,
        error: error?.message || 'config failed',
      }, 'warn');
      errors.push(`${capabilities.join(', ')} => ${error?.message || 'config failed'}`);
    }
  }

  if (!successfulCapabilities) {
    throw new Error(`Zoom SDK config failed for all capability sets. ${errors.join(' | ')}`);
  }

  let supportedApis = [];

  if (typeof zoomSdk.getSupportedJsApis === 'function') {
    try {
      debug('capability-discovery', 'Fetching supported Zoom JS APIs');
      const supportedResult = await trace(
        'zoomSdk.getSupportedJsApis()',
        'fetch-start',
        'fetch-end',
        () => withTimeout(
          zoomSdk.getSupportedJsApis(),
          5000,
          'Zoom SDK getSupportedJsApis timed out'
        )
      );
      supportedApis = getSupportedApisFromResult(supportedResult);

      debug('capability-discovery', 'Received supported Zoom JS APIs', {
        supportedApiCount: supportedApis.length,
      });

      if (supportedApis.length > 0) {
        const negotiatedCapabilities = successfulCapabilities.filter((capability) =>
          supportedApis.includes(capability)
        );

        if (negotiatedCapabilities.length > 0) {
          try {
            debug('config-negotiate', 'Reconfiguring with negotiated supported capabilities', {
              capabilityCount: negotiatedCapabilities.length,
            });

            configResult = await trace(
              `zoomSdk.config negotiated (${negotiatedCapabilities.length} capabilities)`,
              'negotiate-start',
              'negotiate-end',
              () => withTimeout(zoomSdk.config({
                version: '0.16',
                capabilities: negotiatedCapabilities,
                size: { width: 1280, height: 720 },
                popoutSize: { width: 720, height: 600 },
              }), 8000, 'Zoom SDK negotiated config timed out')
            );

            successfulCapabilities = negotiatedCapabilities;
            debug('config-negotiate', 'Negotiated config succeeded');
          } catch {
            // Keep the last known-good config if negotiated re-config fails.
            debug('config-negotiate', 'Negotiated config failed, keeping previous successful config', {}, 'warn');
          }
        }
      }
    } catch {
      // Supported API introspection can fail in some clients; keep baseline config.
      debug('capability-discovery', 'Unable to fetch supported APIs, using baseline config', {}, 'warn');
    }
  }

  return { configResult, configuredCapabilities: successfulCapabilities, supportedApis };
}

const getZoomSdkGlobal = () => {
  if (typeof window === 'undefined') return null;

  // Zoom SDK can appear on different global keys depending on environment/build.
  return window.zoomSdk || window.zoomSDK || window.ZoomSdk || null;
};

async function loadZoomSdkFromPackage(debug = () => {}) {
  try {
    debug('sdk-package', 'Attempting to load Zoom SDK from @zoom/appssdk package');

    const sdkFromPackage = zoomSdkPackage?.default || zoomSdkPackage || null;

    if (!sdkFromPackage) {
      debug('sdk-package', 'Package imported but no SDK instance was exported', {}, 'warn');
      return null;
    }

    debug('sdk-package', 'Loaded Zoom SDK from package import');
    return { zoomSdk: sdkFromPackage, source: 'package' };
  } catch (error) {
    debug('sdk-package', 'Package import failed, falling back to script/global path', {
      error: error?.message || 'Failed to import @zoom/appssdk',
    }, 'warn');
    return null;
  }
}

const isLikelyZoomClientContext = () => {
  if (typeof window === 'undefined') return false;

  const ua = String(window.navigator?.userAgent || '').toLowerCase();
  let inIframe = false;

  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }

  const hasZoomSignals =
    ua.includes('zoom') ||
    ua.includes('zoomapps') ||
    ua.includes('zoom rooms') ||
    Boolean(window.__ZOOM_APP__);

  // Local testing is iframe-based; UA signals are helpful but not always present.
  return inIframe || hasZoomSignals;
};

async function readZoomSdkGlobalWithMicroRetries(maxAttempts = 6, debug = () => {}, phase = 'sdk-global') {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const sdk = getZoomSdkGlobal();
    if (sdk) {
      debug(phase, 'Zoom SDK global resolved', {
        attempt,
        maxAttempts,
      });
      return sdk;
    }

    if (attempt === 1 || attempt === maxAttempts) {
      debug(phase, 'Zoom SDK global not yet available', {
        attempt,
        maxAttempts,
      });
    }

    await waitForMicrotask();
  }

  return null;
}

async function readZoomSdkGlobalWithWait(timeoutMs = 7000, debug = () => {}, phase = 'script-load') {
  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < timeoutMs) {
    attempt += 1;
    const sdk = getZoomSdkGlobal();
    if (sdk) {
      debug(phase, 'Zoom SDK global resolved after script append', { attempt, timeoutMs });
      return sdk;
    }

    if (attempt === 1 || attempt % 12 === 0) {
      debug(phase, 'Waiting for Zoom SDK global after script append', { attempt, timeoutMs });
    }

    await wait(80);
  }

  return null;
}

function injectZoomSdkScript(url) {
  if (typeof document === 'undefined') {
    throw new Error('Document is unavailable while loading Zoom SDK');
  }

  const previous = document.getElementById(ZOOM_SDK_SCRIPT_ID);
  if (previous) {
    previous.remove();
  }

  const script = document.createElement('script');
  script.id = ZOOM_SDK_SCRIPT_ID;
  script.src = url;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.dataset.engagiumLoadState = 'appended';
  script.onload = () => {
    script.dataset.engagiumLoadState = 'loaded';
  };
  script.onerror = () => {
    script.dataset.engagiumLoadState = 'error';
    script.dataset.engagiumLoadError = `Failed to load Zoom SDK script from ${url}`;
  };
  document.head.appendChild(script);

  return script;
}

async function loadZoomSdkFromScript(debug = () => {}, { skipPackage = false } = {}) {
  if (typeof window === 'undefined') {
    throw new Error('Zoom SDK requires a browser context');
  }

  if (!skipPackage) {
    const packageSdk = await loadZoomSdkFromPackage(debug);
    if (packageSdk?.zoomSdk?.config) {
      return packageSdk;
    }

    if (packageSdk) {
      debug('sdk-fallback', 'Package SDK resolved but is missing required APIs, trying CDN fallback', {}, 'warn');
    }
  }

  if (!isLikelyZoomClientContext()) {
    let inIframe = false;

    try {
      inIframe = window.self !== window.top;
    } catch {
      inIframe = true;
    }

    debug('context-check', 'Not detected as Zoom client context', {
      inIframe,
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent || '' : '',
    }, 'warn');
    return null;
  }

  for (const url of ZOOM_SDK_SCRIPT_URLS) {
    debug('sdk-script', 'Attempting to load Zoom SDK from CDN script', { url });
    injectZoomSdkScript(url);

    const scriptSdk = await readZoomSdkGlobalWithWait(7000, debug, 'sdk-script');
    if (scriptSdk?.config) {
      debug('sdk-script', 'Zoom SDK global resolved from CDN script', { url });
      return { zoomSdk: scriptSdk, source: 'script' };
    }

    debug('sdk-script', 'CDN script did not expose a usable Zoom SDK global', { url }, 'warn');
  }

  return null;
}

export async function initZoomSdkBridge({
  onParticipantJoined,
  onParticipantLeft,
  onReaction,
  onMicToggle,
  onMeetingEnded,
  onDebug,
}) {
  const debug = createDebugEmitter(onDebug);

  try {
    debug('init-start', 'Starting Zoom SDK bridge initialization');

    let zoomSdkResult = await withTimeout(
      loadZoomSdkFromScript(debug),
      9000,
      'Zoom SDK loading timed out'
    );

    const trace = createStepTracer(debug, 'init');
    let zoomSdk = zoomSdkResult?.zoomSdk || null;

    debug('sdk-load', 'Zoom SDK load step completed', { sdkFound: Boolean(zoomSdk), source: zoomSdkResult?.source || null });

    if (!zoomSdk) {
      debug('init-failed', 'Zoom SDK unavailable because no usable SDK instance could be loaded', {}, 'warn');
      return {
        initialized: false,
        error: 'Unable to load a usable Zoom SDK instance',
      };
    }

    debug('sdk-ready', 'Zoom SDK instance resolved, preparing config call', {
      source: zoomSdkResult?.source || null,
    });

    let configArtifacts;

    try {
      configArtifacts = await configureZoomSdk(zoomSdk, debug);
    } catch (configError) {
      if (zoomSdkResult?.source !== 'package') {
        throw configError;
      }

      debug('sdk-fallback', 'Package-based SDK config failed, retrying with CDN script fallback', {
        error: configError?.message || 'config failed',
      }, 'warn');

      const scriptFallback = await withTimeout(
        loadZoomSdkFromScript(debug, { skipPackage: true }),
        9000,
        'Zoom CDN SDK loading timed out'
      );

      if (!scriptFallback?.zoomSdk) {
        throw configError;
      }

      zoomSdkResult = scriptFallback;
      zoomSdk = scriptFallback.zoomSdk;
      configArtifacts = await configureZoomSdk(zoomSdk, debug);
    }

    const { configResult, configuredCapabilities, supportedApis } = configArtifacts;
    debug('config-ready', 'Zoom SDK configuration complete', {
      configuredCapabilityCount: configuredCapabilities?.length || 0,
      supportedApiCount: supportedApis?.length || 0,
    });

    let reconfiguredAfterPreConfigError = false;

    const ensureConfiguredAfterPreConfigError = async (source = 'unknown') => {
      if (reconfiguredAfterPreConfigError) return false;

      reconfiguredAfterPreConfigError = true;
      debug('config-retry', 'Retrying zoomSdk.config after pre-config API error', { source }, 'warn');

      const retryTrace = createStepTracer(debug, 'config');

      await retryTrace(
        'zoomSdk.config retry (fallback capabilities)',
        'retry-start',
        'retry-end',
        () => withTimeout(zoomSdk.config({
          version: '0.16',
          capabilities: uniqueList(ZOOM_CONFIG_CAPABILITIES_FALLBACK),
          size: { width: 1280, height: 720 },
          popoutSize: { width: 720, height: 600 },
        }), 8000, 'Zoom SDK retry config timed out')
      );

      debug('config-retry', 'zoomSdk.config retry succeeded', { source });
      return true;
    };

    const registerZoomListener = async (methodName, handler) => {
      if (typeof zoomSdk?.[methodName] !== 'function') return;

      try {
        await trace(
          `zoomSdk.${methodName}(handler)`,
          'register-start',
          'register-end',
          () => Promise.resolve(zoomSdk[methodName](handler))
        );
      } catch (error) {
        debug('listener-register', 'Zoom listener registration failed', {
          methodName,
          error: error?.message || 'registration failed',
        }, 'warn');

        if (!isMustCallConfigError(error)) {
          return;
        }

        try {
          const reconfigured = await ensureConfiguredAfterPreConfigError(methodName);
          if (!reconfigured) return;
          await trace(
            `zoomSdk.${methodName}(handler) retry`,
            'register-retry-start',
            'register-retry-end',
            () => Promise.resolve(zoomSdk[methodName](handler))
          );
          debug('listener-register', 'Zoom listener registration recovered after config retry', { methodName });
        } catch (retryError) {
          debug('listener-register', 'Zoom listener registration retry failed', {
            methodName,
            error: retryError?.message || 'registration retry failed',
          }, 'warn');
        }
      }
    };

    await registerZoomListener('onParticipantChange', (event) => {
        const participants = toArray(event?.participants?.length ? event.participants : event?.participant || event);

        participants.forEach((participant) => {
          const action = String(participant?.action || event?.action || '').toLowerCase();
          const participantName = extractParticipantName(participant);
          const participantId = extractParticipantId(participant);

          if (action.includes('join')) {
            onParticipantJoined?.({ participantName, participantId, timestamp: getIsoNow() });
            return;
          }

          if (action.includes('left') || action.includes('leave')) {
            onParticipantLeft?.({ participantName, participantId, timestamp: getIsoNow() });
          }
        });
      });

    await registerZoomListener('onReaction', (event) => {
        const participantName = extractParticipantName(event);
        const participantId = extractParticipantId(event);
        const reactionValue = event?.reaction || event?.emoji || event?.feedback || 'reaction';

        onReaction?.({
          participantName,
          participantId,
          reaction: reactionValue,
          sourceEventId: createSourceEventId('reaction'),
          timestamp: getIsoNow(),
        });
      });

    await registerZoomListener('onEmojiReaction', (event) => {
        const participantName = extractParticipantName(event);
        const participantId = extractParticipantId(event);
        const reactionValue = event?.emoji || event?.unicode || event?.name || 'emoji';

        onReaction?.({
          participantName,
          participantId,
          reaction: reactionValue,
          sourceEventId: createSourceEventId('emoji'),
          timestamp: getIsoNow(),
        });
      });

    await registerZoomListener('onMyReaction', (event) => {
        const participantName = extractParticipantName(event);
        const participantId = extractParticipantId(event);
        const reactionValue = event?.reaction || event?.emoji || event?.feedback || 'reaction';

        onReaction?.({
          participantName,
          participantId,
          reaction: reactionValue,
          sourceEventId: createSourceEventId('my_reaction'),
          timestamp: getIsoNow(),
        });
      });

    await registerZoomListener('onMyMediaChange', (event) => {
        const participantName = extractParticipantName(event);
        const participantId = extractParticipantId(event);

        const explicitMuted =
          typeof event?.audio?.muted === 'boolean'
            ? event.audio.muted
            : typeof event?.muted === 'boolean'
              ? event.muted
              : null;

        if (explicitMuted === null) return;

        onMicToggle?.({
          participantName,
          participantId,
          isMuted: explicitMuted,
          sourceEventId: createSourceEventId('mic_toggle'),
          timestamp: getIsoNow(),
        });
      });

    await registerZoomListener('onMeeting', (event) => {
        const action = String(event?.action || '').toLowerCase();
        if (action === 'ended' || action === 'leave') {
          onMeetingEnded?.({ timestamp: getIsoNow() });
        }
      });

    debug('context-phase', 'Starting Zoom SDK context fetch block');
    const context = await trace(
      'Zoom SDK context fetch allSettled block',
      'context-start',
      'context-end',
      () => withTimeout(Promise.allSettled([
        typeof zoomSdk.getRunningContext === 'function' ? zoomSdk.getRunningContext() : Promise.resolve(null),
        typeof zoomSdk.getMeetingContext === 'function' ? zoomSdk.getMeetingContext() : Promise.resolve(null),
        typeof zoomSdk.getMeetingUUID === 'function' ? zoomSdk.getMeetingUUID() : Promise.resolve(null),
        typeof zoomSdk.getMeetingJoinUrl === 'function' ? zoomSdk.getMeetingJoinUrl() : Promise.resolve(null),
        typeof zoomSdk.getUserContext === 'function' ? zoomSdk.getUserContext() : Promise.resolve(null),
        typeof zoomSdk.getMeetingParticipants === 'function' ? zoomSdk.getMeetingParticipants() : Promise.resolve(null),
      ]), 6000, 'Zoom SDK context fetch timed out')
    );

    debug('context-fetch', 'Zoom SDK context fetch completed');

    const [runningContext, meetingContext, meetingUuid, meetingJoinUrl, userContext, meetingParticipants] =
      context.map((result) => (result.status === 'fulfilled' ? result.value : null));

    return {
      zoomSdk,
      configResult,
      configuredCapabilities,
      supportedApis,
      runningContext,
      meetingContext,
      meetingUuid,
      meetingJoinUrl,
      userContext,
      meetingParticipants,
      initialized: true,
    };
  } catch (error) {
    debug('init-failed', 'Zoom SDK bridge initialization failed', {
      error: error?.message || 'Unknown initialization failure',
    }, 'error');

    return {
      initialized: false,
      error: error.message || 'Failed to initialize Zoom SDK bridge',
    };
  }
}
