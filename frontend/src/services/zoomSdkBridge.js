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
  'onFeedbackReaction',
  'onRemoveFeedbackReaction',
  'onIncomingParticipantAudioChange',
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
const ZOOM_LISTENER_REGISTRATION_TIMEOUT_MS = 4000;

const ZOOM_SDK_SCRIPT_ID = 'engagium-zoom-sdk-script';
const ZOOM_SDK_SCRIPT_URLS = [
  'https://appssdk.zoom.us/sdk.min.js',
  'https://appssdk.zoom.us/sdk.js',
];

const createSourceEventId = (prefix) =>
  `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

const getIsoNow = () => new Date().toISOString();

const PARTICIPANT_JOIN_STATUSES = new Set(['join', 'joined', 'add', 'added']);
const PARTICIPANT_LEAVE_STATUSES = new Set(['leave', 'left', 'remove', 'removed', 'departed']);
const PARTICIPANT_LEAVE_GRACE_MS = 2500;

const getParticipantPayloadCandidates = (payload = {}) => [
  payload,
  payload?.participant,
  payload?.user,
  payload?.sender,
  payload?.actor,
  payload?.from,
  payload?.target,
].filter(Boolean);

const extractParticipantName = (payload = {}) => {
  const candidates = getParticipantPayloadCandidates(payload);

  for (const candidate of candidates) {
    const name =
      candidate.screenName ||
      candidate.displayName ||
      candidate.userName ||
      candidate.participantName ||
      candidate.name ||
      candidate.fullName ||
      candidate.participantUUID ||
      candidate.userId ||
      candidate.id ||
      candidate.participantId ||
      '';

    if (name) return name;
  }

  return '';
};

const extractParticipantId = (payload = {}) => {
  const candidates = getParticipantPayloadCandidates(payload);

  for (const candidate of candidates) {
    const id =
      candidate.participantUUID ||
      candidate.participantId ||
      candidate.userUUID ||
      candidate.userUuid ||
      candidate.userId ||
      candidate.uid ||
      candidate.id ||
      null;

    if (id) return id;
  }

  return null;
};

const normalizeReactionValue = (value) => {
  if (value === undefined || value === null) return '';

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'object') {
    return (
      value.emoji ||
      value.unicode ||
      value.value ||
      value.name ||
      value.reaction ||
      value.type ||
      ''
    );
  }

  return String(value);
};

const isHandRaiseReaction = (reactionValue, event = {}) => {
  const normalizedValue = String(reactionValue || '').trim().toLowerCase();
  const eventType = String(event?.type || event?.reactionType || '').trim().toLowerCase();
  const eventAction = String(event?.action || '').trim().toLowerCase();

  const handTokens = [
    'raise_hand',
    'raised_hand',
    'hand_raise',
    'raisehand',
    'handraised',
    'raise hand',
    'hand raised',
    'handraise',
  ];

  if (reactionValue === '✋') {
    return true;
  }

  if (handTokens.some((token) => normalizedValue.includes(token))) {
    return true;
  }

  if (handTokens.some((token) => eventType.includes(token) || eventAction.includes(token))) {
    return true;
  }

  return false;
};

const extractReactionData = (event = {}) => {
  const reactionValue = normalizeReactionValue(
    event?.unicode ||
    event?.type ||
    event?.emoji ||
    event?.reaction ||
    event?.reaction?.emoji ||
    event?.reaction?.unicode ||
    event?.reaction?.name ||
    event?.feedback ||
    event?.value ||
    event?.name ||
    event?.reactionType ||
    ''
  );

  const interactionType = isHandRaiseReaction(reactionValue, event)
    ? 'hand_raise'
    : 'reaction';

  return {
    interactionType,
    reactionValue: reactionValue || (interactionType === 'hand_raise' ? 'raised' : 'reaction'),
  };
};

const extractParticipantChanges = (event = {}) => {
  const joins = [];
  const leaves = [];

  const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

  const pushByStatus = (participant, statusValue) => {
    if (!participant || typeof participant !== 'object') return;

    const status = normalizeStatus(statusValue);
    if (PARTICIPANT_JOIN_STATUSES.has(status)) {
      joins.push(participant);
      return;
    }

    if (PARTICIPANT_LEAVE_STATUSES.has(status)) {
      leaves.push(participant);
    }
  };

  // Strict Zoom contract: onParticipantChange event contains participants[] entries with status join|leave.
  toArray(event?.participants).forEach((participant) => {
    const participantStatus = participant?.status;
    pushByStatus(participant, participantStatus);
  });

  return { joins, leaves };
};

const dedupeParticipants = (participants = []) => {
  const seen = new Set();

  return participants.filter((participant) => {
    const participantId = String(extractParticipantId(participant) || '').trim().toLowerCase();
    const participantName = String(extractParticipantName(participant) || '').trim().toLowerCase();
    const key = participantId ? `id:${participantId}` : participantName ? `name:${participantName}` : null;

    if (!key) {
      return true;
    }

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getParticipantTransitionKey = (participant = {}) => {
  const participantId = extractParticipantId(participant);
  if (participantId !== undefined && participantId !== null && String(participantId).trim()) {
    return `id:${String(participantId).trim().toLowerCase()}`;
  }

  const participantName = String(extractParticipantName(participant) || '').trim().toLowerCase();
  if (participantName) {
    return `name:${participantName}`;
  }

  return null;
};

const createParticipantLifecycleDetector = ({ onParticipantJoined, onParticipantLeft, debug = () => {} }) => {
  const pendingLeaveTimers = new Map();

  const clearPendingLeaveByKey = (key) => {
    if (!key) return;

    const timer = pendingLeaveTimers.get(key);
    if (!timer) return;

    clearTimeout(timer);
    pendingLeaveTimers.delete(key);
    debug('participant-change', 'Cancelled pending leave due to matching join', { key });
  };

  const emitJoin = (participant) => {
    const participantName = extractParticipantName(participant);
    const participantId = extractParticipantId(participant);
    onParticipantJoined?.({ participantName, participantId, timestamp: getIsoNow() });
  };

  const queueLeave = (participant) => {
    const key = getParticipantTransitionKey(participant);

    const emitLeave = () => {
      const participantName = extractParticipantName(participant);
      const participantId = extractParticipantId(participant);
      onParticipantLeft?.({ participantName, participantId, timestamp: getIsoNow() });
    };

    if (!key) {
      emitLeave();
      return;
    }

    const existingTimer = pendingLeaveTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      pendingLeaveTimers.delete(key);
      emitLeave();
    }, PARTICIPANT_LEAVE_GRACE_MS);

    pendingLeaveTimers.set(key, timer);
  };

  const onParticipantChangeEvent = (event = {}) => {
    const { joins, leaves } = extractParticipantChanges(event);
    const dedupedJoins = dedupeParticipants(joins);
    const dedupedLeaves = dedupeParticipants(leaves);

    const joinKeys = new Set(
      dedupedJoins
        .map((participant) => getParticipantTransitionKey(participant))
        .filter(Boolean)
    );

    const filteredLeaves = dedupedLeaves.filter((participant) => {
      const key = getParticipantTransitionKey(participant);
      return !key || !joinKeys.has(key);
    });

    debug('participant-change', 'Resolved participant transitions', {
      detectionMode: 'event_status',
      joinCount: dedupedJoins.length,
      leaveCount: filteredLeaves.length,
      droppedLeaveCount: dedupedLeaves.length - filteredLeaves.length,
      action: event?.action || null,
    });

    dedupedJoins.forEach((participant) => {
      clearPendingLeaveByKey(getParticipantTransitionKey(participant));
      emitJoin(participant);
    });

    filteredLeaves.forEach((participant) => {
      queueLeave(participant);
    });
  };

  const clearPendingLeaves = () => {
    pendingLeaveTimers.forEach((timer) => clearTimeout(timer));
    pendingLeaveTimers.clear();
  };

  return {
    onParticipantChangeEvent,
    clearPendingLeaves,
  };
};

const createReactionDetectors = ({ onReaction }) => {
  const emitReaction = ({ event = {}, sourcePrefix, isSelfEvent = false, reactionValue }) => {
    const participantName = extractParticipantName(event);
    const participantId = extractParticipantId(event);

    onReaction?.({
      participantName,
      participantId,
      isSelfEvent,
      interactionType: 'reaction',
      reaction: reactionValue || 'reaction',
      sourceEventId: createSourceEventId(sourcePrefix),
      timestamp: getIsoNow(),
    });
  };

  const emitHandRaise = ({ event = {}, sourcePrefix, isSelfEvent = false, reactionValue = 'raised' }) => {
    const participantName = extractParticipantName(event);
    const participantId = extractParticipantId(event);

    onReaction?.({
      participantName,
      participantId,
      isSelfEvent,
      interactionType: 'hand_raise',
      reaction: reactionValue || 'raised',
      sourceEventId: createSourceEventId(sourcePrefix),
      timestamp: getIsoNow(),
    });
  };

  const onReactionEvent = (event = {}, { sourcePrefix = 'reaction', isSelfEvent = false } = {}) => {
    const { interactionType, reactionValue } = extractReactionData(event);
    if (interactionType !== 'reaction') return;

    emitReaction({ event, sourcePrefix, isSelfEvent, reactionValue });
  };

  const onHandRaiseFromReactionEvent = (event = {}, { sourcePrefix = 'reaction', isSelfEvent = false } = {}) => {
    const { interactionType, reactionValue } = extractReactionData(event);
    if (interactionType !== 'hand_raise') return;

    emitHandRaise({
      event,
      sourcePrefix,
      isSelfEvent,
      reactionValue: reactionValue || 'raised',
    });
  };

  const onFeedbackReactionEvent = (event = {}) => {
    const feedback = String(event?.feedback || '').trim();
    if (!feedback) return;

    const normalizedFeedback = feedback.toLowerCase();
    if (normalizedFeedback === 'raisehand' || normalizedFeedback === 'raise_hand') {
      emitHandRaise({ event, sourcePrefix: 'feedback_raise_hand' });
      return;
    }

    emitReaction({
      event,
      sourcePrefix: 'feedback_reaction',
      reactionValue: feedback,
    });
  };

  return {
    onReactionEvent,
    onHandRaiseFromReactionEvent,
    onFeedbackReactionEvent,
  };
};

const createMicToggleDetector = ({ onMicToggle }) => {
  const onMyMediaChangeEvent = (event = {}) => {
    const participantName = extractParticipantName(event);
    const participantId = extractParticipantId(event);

    const explicitMuted =
      typeof event?.media?.audio?.state === 'boolean'
        ? !event.media.audio.state
        : typeof event?.audio?.muted === 'boolean'
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
  };

  const onIncomingParticipantAudioChangeEvent = (event = {}) => {
    const participants = toArray(event?.participants);

    participants.forEach((participant) => {
      const participantId = participant?.participantUUID || null;
      const audioOn = typeof participant?.audio === 'boolean' ? participant.audio : null;

      if (!participantId || audioOn === null) return;

      onMicToggle?.({
        participantName: '',
        participantId,
        isMuted: !audioOn,
        sourceEventId: createSourceEventId('incoming_participant_audio'),
        timestamp: getIsoNow(),
      });
    });
  };

  return {
    onMyMediaChangeEvent,
    onIncomingParticipantAudioChangeEvent,
  };
};

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
    const participantLifecycleDetector = createParticipantLifecycleDetector({
      onParticipantJoined,
      onParticipantLeft,
      debug,
    });

    const reactionDetectors = createReactionDetectors({ onReaction });
    const micToggleDetector = createMicToggleDetector({ onMicToggle });

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
          () => withTimeout(
            Promise.resolve(zoomSdk[methodName](handler)),
            ZOOM_LISTENER_REGISTRATION_TIMEOUT_MS,
            `zoomSdk.${methodName} listener registration timed out`
          )
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
            () => withTimeout(
              Promise.resolve(zoomSdk[methodName](handler)),
              ZOOM_LISTENER_REGISTRATION_TIMEOUT_MS,
              `zoomSdk.${methodName} listener registration retry timed out`
            )
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
      debug('zoom-event-raw', 'onParticipantChange raw event', { eventData: event || {} });
      participantLifecycleDetector.onParticipantChangeEvent(event || {});
    });

    await registerZoomListener('onReaction', (event) => {
      debug('zoom-event-raw', 'onReaction raw event', { eventData: event || {} });
      reactionDetectors.onHandRaiseFromReactionEvent(event || {}, { sourcePrefix: 'reaction' });
      reactionDetectors.onReactionEvent(event || {}, { sourcePrefix: 'reaction' });
    });

    await registerZoomListener('onEmojiReaction', (event) => {
      debug('zoom-event-raw', 'onEmojiReaction raw event', { eventData: event || {} });
      reactionDetectors.onHandRaiseFromReactionEvent(event || {}, { sourcePrefix: 'emoji' });
      reactionDetectors.onReactionEvent(event || {}, { sourcePrefix: 'emoji' });
    });

    await registerZoomListener('onMyReaction', (event) => {
      debug('zoom-event-raw', 'onMyReaction raw event', { eventData: event || {} });
      reactionDetectors.onHandRaiseFromReactionEvent(event || {}, {
        sourcePrefix: 'my_reaction',
        isSelfEvent: true,
      });
      reactionDetectors.onReactionEvent(event || {}, {
        sourcePrefix: 'my_reaction',
        isSelfEvent: true,
      });
    });

    await registerZoomListener('onMyMediaChange', (event) => {
      debug('zoom-event-raw', 'onMyMediaChange raw event', { eventData: event || {} });
      micToggleDetector.onMyMediaChangeEvent(event || {});
    });

    await registerZoomListener('onIncomingParticipantAudioChange', (event) => {
      debug('zoom-event-raw', 'onIncomingParticipantAudioChange raw event', { eventData: event || {} });
      micToggleDetector.onIncomingParticipantAudioChangeEvent(event || {});
    });

    await registerZoomListener('onFeedbackReaction', (event) => {
      debug('zoom-event-raw', 'onFeedbackReaction raw event', { eventData: event || {} });
      reactionDetectors.onFeedbackReactionEvent(event || {});
    });

    await registerZoomListener('onRemoveFeedbackReaction', (event) => {
      debug('zoom-event-raw', 'onRemoveFeedbackReaction raw event', { eventData: event || {} });
      const participantId = extractParticipantId(event || {});
      if (!participantId) return;

      debug('reaction-remove', 'Received onRemoveFeedbackReaction event', {
        participantId,
      });
    });

    await registerZoomListener('onMeeting', (event) => {
      debug('zoom-event-raw', 'onMeeting raw event', { eventData: event || {} });
      const action = String(event?.action || '').toLowerCase();

      if (action === 'ended' || action === 'leave') {
        participantLifecycleDetector.clearPendingLeaves();
      }

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

    // Log raw API responses for debugging
    debug('zoom-api-raw', 'getRunningContext() raw response', {
      requestedApi: 'getRunningContext',
      responseValue: runningContext,
    });
    debug('zoom-api-raw', 'getMeetingContext() raw response', {
      requestedApi: 'getMeetingContext',
      responseValue: meetingContext,
    });
    debug('zoom-api-raw', 'getMeetingUUID() raw response', {
      requestedApi: 'getMeetingUUID',
      responseValue: meetingUuid,
    });
    debug('zoom-api-raw', 'getMeetingJoinUrl() raw response', {
      requestedApi: 'getMeetingJoinUrl',
      responseValue: meetingJoinUrl,
    });
    debug('zoom-api-raw', 'getUserContext() raw response', {
      requestedApi: 'getUserContext',
      responseValue: userContext,
    });
    debug('zoom-api-raw', 'getMeetingParticipants() raw response', {
      requestedApi: 'getMeetingParticipants',
      responseValue: meetingParticipants,
    });

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
