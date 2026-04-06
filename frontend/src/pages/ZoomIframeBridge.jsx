import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zoomIframeAPI } from '@/services/zoomIframeApi';
import { initZoomSdkBridge } from '@/services/zoomSdkBridge';

const TOKEN_STORAGE_KEY = 'engagium_zoom_bridge_token';
const CLASS_ID_STORAGE_KEY = 'engagium_zoom_bridge_class_id';
const MEETING_LINK_STORAGE_KEY = 'engagium_zoom_bridge_meeting_link';
const TOKEN_REQUEST_RETRY_DELAYS_MS = [0, 800, 2000];

const getTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('token') ||
    params.get('extensionToken') ||
    params.get('xExtensionToken') ||
    ''
  );
};

const getPersistedValue = (key) => {
  const stores = [window.localStorage, window.sessionStorage];

  for (const store of stores) {
    if (!store) continue;

    try {
      const value = store.getItem(key);
      if (value) return value;
    } catch (error) {
      // Ignore restricted store access for this context.
    }
  }

  try {
    return '';
  } catch (error) {
    return '';
  }
};

const setPersistedValue = (key, value) => {
  const stores = [window.localStorage, window.sessionStorage];

  for (const store of stores) {
    if (!store) continue;

    try {
      if (value) {
        store.setItem(key, value);
      } else {
        store.removeItem(key);
      }
    } catch (error) {
      // Ignore store failures in restricted browser contexts.
    }
  }

  try {
    return;
  } catch (error) {
    // No-op.
  }
};

const getPersistedToken = () => getPersistedValue(TOKEN_STORAGE_KEY);

const getInitialToken = () => {
  const urlToken = getTokenFromUrl();
  if (urlToken) return urlToken;
  return getPersistedToken();
};

const getInitialClassId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('classId') || getPersistedValue(CLASS_ID_STORAGE_KEY);
};

const getInitialMeetingLink = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('meetingLink') || getPersistedValue(MEETING_LINK_STORAGE_KEY);
};

const getAutoStart = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('autostart') === '1';
};

const getMockMode = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('mock') === '1';
};

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const formatDebugLabel = (phase = 'unknown') =>
  String(phase)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

const waitForMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const BRIDGE_INIT_TIMEOUT_MS = 15000;
const BOOT_INIT_SETTLE_DELAY_MS = 1500;
const BOOT_INIT_MAX_ATTEMPTS = 2;
const LIFECYCLE_DEDUPE_WINDOW_MS = {
  joined: 15000,
  left: 75000,
};

const ZOOM_INSPECTOR_PRIORITIES = [
  'getSupportedJsApis',
  'getRunningContext',
  'getMeetingUUID',
  'getMeetingContext',
  'getMeetingJoinUrl',
  'getMeetingParticipants',
  'getIncomingParticipantAudioState',
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

const getMeetingLinkFromZoomInit = (zoomInitResult) => {
  const joinUrl = zoomInitResult?.meetingJoinUrl?.joinUrl;
  if (joinUrl) return joinUrl;

  const meetingUuid = zoomInitResult?.meetingUuid?.meetingUUID;
  if (meetingUuid) return `zoom://meeting/${meetingUuid}`;

  return '';
};

const normalizeIdentityValue = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim().toLowerCase();
};

const getZoomSelfIdentity = (zoomInitResult) => {
  const userContext = zoomInitResult?.userContext || {};

  const idCandidates = [
    userContext.participantUUID,
    userContext.participantId,
    userContext.userId,
    userContext.id,
    userContext.uid,
    userContext.userUUID,
    userContext.userUuid,
  ]
    .map(normalizeIdentityValue)
    .filter(Boolean);

  const nameCandidates = [
    userContext.screenName,
    userContext.displayName,
    userContext.userName,
    userContext.name,
  ]
    .map(normalizeIdentityValue)
    .filter(Boolean);

  return {
    ids: Array.from(new Set(idCandidates)),
    names: Array.from(new Set(nameCandidates)),
    raw: userContext,
  };
};

const getParticipantIdFromRecord = (participant = {}) =>
  participant?.participantUUID || participant?.userId || participant?.id || participant?.participantId || null;

const getParticipantNameFromRecord = (participant = {}) =>
  participant?.screenName || participant?.displayName || participant?.userName || participant?.name || '';

const getParticipantMutedState = (participant = {}) => {
  const parseBooleanLike = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'on', 'unmuted'].includes(normalized)) return false;
      if (['false', '0', 'no', 'off', 'muted'].includes(normalized)) return true;
    }
    return null;
  };

  if (typeof participant?.audio?.muted === 'boolean') return participant.audio.muted;
  if (typeof participant?.isMuted === 'boolean') return participant.isMuted;
  if (typeof participant?.muted === 'boolean') return participant.muted;
  if (typeof participant?.isAudioMuted === 'boolean') return participant.isAudioMuted;

  const candidates = [
    participant?.audioMuted,
    participant?.micMuted,
    participant?.microphoneMuted,
    participant?.mute,
    participant?.audioStatus,
    participant?.microphoneStatus,
  ];

  for (const candidate of candidates) {
    const parsed = parseBooleanLike(candidate);
    if (typeof parsed === 'boolean') return parsed;
  }

  const action = String(participant?.action || '').toLowerCase();
  if (action.includes('muted') || action.includes('audio_muted') || action.includes('mute_on')) return true;
  if (action.includes('unmuted') || action.includes('audio_unmuted') || action.includes('mute_off')) return false;

  return null;
};

const getParticipantHandRaisedState = (participant = {}) => {
  const parseBooleanLike = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'raised', 'up'].includes(normalized)) return true;
      if (['false', '0', 'no', 'lowered', 'down'].includes(normalized)) return false;
    }
    return null;
  };

  if (typeof participant?.isHandRaised === 'boolean') return participant.isHandRaised;
  if (typeof participant?.handRaised === 'boolean') return participant.handRaised;
  if (typeof participant?.raisedHand === 'boolean') return participant.raisedHand;
  if (typeof participant?.hand_raise === 'boolean') return participant.hand_raise;

  const candidates = [
    participant?.handRaise,
    participant?.isRaisedHand,
    participant?.isRaiseHand,
    participant?.handStatus,
  ];

  for (const candidate of candidates) {
    const parsed = parseBooleanLike(candidate);
    if (typeof parsed === 'boolean') return parsed;
  }

  const action = String(participant?.action || '').toLowerCase();
  if (action.includes('raise_hand') || action.includes('hand_raised') || action.includes('hand_raise')) return true;
  if (action.includes('lower_hand') || action.includes('hand_lowered')) return false;

  return null;
};

const getParticipantKey = (participant = {}) => {
  const participantId = getParticipantIdFromRecord(participant);
  const normalizedId = normalizeIdentityValue(participantId);
  if (normalizedId) return `id:${normalizedId}`;

  const participantName = getParticipantNameFromRecord(participant);
  const normalizedName = normalizeIdentityValue(participantName);
  if (normalizedName) return `name:${normalizedName}`;

  return '';
};

const getParticipantIdentityTokens = (participant = {}) => {
  const tokens = [];
  const normalizedId = normalizeIdentityValue(participant?.id);
  const normalizedName = normalizeIdentityValue(participant?.name);

  if (normalizedId) tokens.push(`id:${normalizedId}`);
  if (normalizedName) tokens.push(`name:${normalizedName}`);

  return tokens;
};

const dedupeParticipantRecords = (participants = []) => {
  const seen = new Set();

  return participants.filter((participant) => {
    const tokens = getParticipantIdentityTokens(participant);
    const key = tokens[0] || '';

    if (!key) {
      return false;
    }

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const hasOverlappingIdentity = (a = {}, b = {}) => {
  const aTokens = getParticipantIdentityTokens(a);
  const bTokenSet = new Set(getParticipantIdentityTokens(b));

  return aTokens.some((token) => bTokenSet.has(token));
};

const findMatchingParticipant = (participant = {}, candidates = []) =>
  candidates.find((candidate) => hasOverlappingIdentity(participant, candidate)) || null;

const buildKnownParticipantsMap = (participants = []) => {
  const map = new Map();

  participants.forEach((participant) => {
    const tokens = getParticipantIdentityTokens(participant);
    tokens.forEach((token) => {
      map.set(token, participant);
    });
  });

  return map;
};

const createBridgeSourceEventId = (prefix) =>
  `zoom-bridge:${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

function ZoomIframeBridge() {
  const [token, setToken] = useState(getInitialToken());
  const [tokenInput, setTokenInput] = useState(getInitialToken());
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(getInitialClassId());
  const [meetingLinkOverride, setMeetingLinkOverride] = useState(getInitialMeetingLink());
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Initializing Zoom bridge...');
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [zoomState, setZoomState] = useState({ initialized: false, data: null });
  const [sdkDebug, setSdkDebug] = useState([]);
  const [sdkPhase, setSdkPhase] = useState('idle');
  const [selectedInspectorTarget, setSelectedInspectorTarget] = useState('');
  const [inspectorRunTarget, setInspectorRunTarget] = useState('');
  const [mockMode] = useState(getMockMode());
  const [mockParticipantName, setMockParticipantName] = useState('Mock Student');
  const [mockParticipantId, setMockParticipantId] = useState('mock-participant-001');
  const [mockIsMuted, setMockIsMuted] = useState(true);
  const tokenRef = useRef(token);
  const sessionRef = useRef(session);
  const sdkBootStartedRef = useRef(false);
  const sdkInitInFlightRef = useRef(false);
  const zoomSdkRef = useRef(null);
  const selfIdentityRef = useRef({ ids: [], names: [], raw: null });
  const knownParticipantsRef = useRef(new Map());
  const recentInteractionRef = useRef(new Map());
  const recentLifecycleRef = useRef(new Map());

  const requestTokenFromParent = useCallback((reason = 'bootstrap') => {
    window.parent?.postMessage(
      {
        type: 'engagium:zoom-token-request',
        source: 'zoom_iframe_bridge',
        reason,
      },
      '*'
    );
  }, []);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    setPersistedValue(TOKEN_STORAGE_KEY, token?.trim() || '');
  }, [token]);

  useEffect(() => {
    setPersistedValue(CLASS_ID_STORAGE_KEY, selectedClassId?.trim() || '');
  }, [selectedClassId]);

  useEffect(() => {
    setPersistedValue(MEETING_LINK_STORAGE_KEY, meetingLinkOverride?.trim() || '');
  }, [meetingLinkOverride]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const appendEvent = useCallback((label, payload = {}) => {
    setEvents((prev) => [{ id: `${Date.now()}-${Math.random()}`, label, timestamp: new Date().toISOString(), payload }, ...prev].slice(0, 120));
  }, []);

  const appendSdkDebug = useCallback((entry = {}) => {
    const normalized = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      phase: entry.phase || 'unknown',
      message: entry.message || 'Debug checkpoint',
      level: entry.level || 'info',
      meta: entry.meta || {},
    };

    setSdkPhase(normalized.phase);
    setSdkDebug((prev) => [normalized, ...prev].slice(0, 80));
  }, []);

  const inspectorEntriesByTarget = useMemo(() => {
    const entries = new Map();

    sdkDebug.forEach((entry) => {
      const phase = String(entry?.phase || '');

      if (phase === 'zoom-api-raw') {
        const target = String(entry?.meta?.requestedApi || '').trim();
        if (!target || entries.has(target)) return;

        entries.set(target, {
          target,
          kind: 'api',
          timestamp: entry?.timestamp || null,
          message: entry?.message || `${target} raw response`,
          payload: entry?.meta?.responseValue,
        });
        return;
      }

      if (phase === 'zoom-event-raw') {
        const message = String(entry?.message || '').trim();
        const target = message.endsWith(' raw event')
          ? message.slice(0, -' raw event'.length)
          : '';

        if (!target || entries.has(target)) return;

        entries.set(target, {
          target,
          kind: 'event',
          timestamp: entry?.timestamp || null,
          message: message || `${target} raw event`,
          payload: entry?.meta?.eventData,
        });
      }
    });

    return entries;
  }, [sdkDebug]);

  const inspectorTargets = useMemo(() => {
    const configuredCapabilities = Array.isArray(zoomState?.data?.configuredCapabilities)
      ? zoomState.data.configuredCapabilities
      : [];

    const merged = new Set([...ZOOM_INSPECTOR_PRIORITIES, ...configuredCapabilities]);
    const ordered = [];

    ZOOM_INSPECTOR_PRIORITIES.forEach((target) => {
      if (merged.has(target)) {
        ordered.push(target);
        merged.delete(target);
      }
    });

    Array.from(merged)
      .sort((a, b) => String(a).localeCompare(String(b)))
      .forEach((target) => ordered.push(target));

    return ordered;
  }, [zoomState?.data?.configuredCapabilities]);

  useEffect(() => {
    if (inspectorTargets.length === 0) {
      setSelectedInspectorTarget('');
      return;
    }

    if (!selectedInspectorTarget || !inspectorTargets.includes(selectedInspectorTarget)) {
      setSelectedInspectorTarget(inspectorTargets[0]);
    }
  }, [inspectorTargets, selectedInspectorTarget]);

  const selectedInspectorEntry = selectedInspectorTarget
    ? inspectorEntriesByTarget.get(selectedInspectorTarget) || null
    : null;

  const getCurrentParticipantUUIDs = useCallback(() => {
    const ids = new Set();

    const addFromParticipants = (participants = []) => {
      participants.forEach((participant) => {
        const participantId = getParticipantIdFromRecord(participant);
        const normalizedId = normalizeIdentityValue(participantId);
        if (normalizedId) {
          ids.add(participantId);
        }
      });
    };

    addFromParticipants(zoomState?.data?.meetingParticipants?.participants || []);
    addFromParticipants(Array.from(knownParticipantsRef.current.values()));

    return Array.from(ids);
  }, [zoomState?.data?.meetingParticipants?.participants]);

  const runInspectorApi = useCallback(async (target) => {
    const sdk = zoomSdkRef.current;

    if (!sdk) {
      setError('Zoom SDK is not ready yet.');
      return;
    }

    if (typeof sdk[target] !== 'function') {
      setError(`Zoom SDK does not expose ${target} in this session.`);
      return;
    }

    setError('');
    setInspectorRunTarget(target);

    try {
      const callArgs = target === 'getIncomingParticipantAudioState'
        ? [{ participantUUIDs: getCurrentParticipantUUIDs() }]
        : [];

      if (target === 'getIncomingParticipantAudioState' && callArgs[0].participantUUIDs.length === 0) {
        setError('No participant UUIDs are available yet for getIncomingParticipantAudioState. Start tracking first.');
        return;
      }

      const result = await sdk[target](...callArgs);

      appendSdkDebug({
        phase: 'zoom-api-raw',
        message: `${target}() manual run result`,
        meta: {
          requestedApi: target,
          responseValue: result,
          requestArgs: callArgs,
          runSource: 'manual-ui',
        },
      });

      setSelectedInspectorTarget(target);
      appendEvent(`Inspector ran ${target}`, { target });
    } catch (apiError) {
      appendSdkDebug({
        phase: 'zoom-api-raw',
        level: 'warn',
        message: `${target}() manual run failed`,
        meta: {
          requestedApi: target,
          error: apiError?.message || 'API call failed',
          requestArgs: target === 'getIncomingParticipantAudioState'
            ? [{ participantUUIDs: getCurrentParticipantUUIDs() }]
            : [],
          runSource: 'manual-ui',
        },
      });
      setError(apiError?.message || `Failed to run ${target}`);
    } finally {
      setInspectorRunTarget('');
    }
  }, [appendEvent, appendSdkDebug, getCurrentParticipantUUIDs]);

  const sendLiveEvent = useCallback(async (eventType, data, sessionId = null) => {
    const activeToken = tokenRef.current;
    const activeSessionId = sessionId || sessionRef.current?.id;

    if (!activeToken || !activeSessionId) return;

    await zoomIframeAPI.sendLiveEvent(activeToken, {
      eventType,
      sessionId: activeSessionId,
      data,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const isSelfParticipant = useCallback((participantId, participantName) => {
    const normalizedId = normalizeIdentityValue(participantId);
    const normalizedName = normalizeIdentityValue(participantName);
    const selfIdentity = selfIdentityRef.current;

    if (normalizedId && selfIdentity.ids.includes(normalizedId)) {
      return true;
    }

    if (normalizedName && selfIdentity.names.includes(normalizedName)) {
      return true;
    }

    return false;
  }, []);

  const clearKnownParticipants = useCallback(() => {
    knownParticipantsRef.current = new Map();
    recentLifecycleRef.current = new Map();
  }, []);

  const isDuplicateLifecycleEvent = useCallback(({
    action,
    participantId,
    participantName,
    timestamp,
  }) => {
    const normalizedAction = normalizeIdentityValue(action) || 'unknown-action';
    const normalizedId = normalizeIdentityValue(participantId);
    const normalizedName = normalizeIdentityValue(participantName);
    const eventTime = Number.isFinite(Date.parse(timestamp)) ? Date.parse(timestamp) : Date.now();

    const identityKeys = [];
    if (normalizedId) identityKeys.push(`id:${normalizedId}`);
    if (normalizedName) identityKeys.push(`name:${normalizedName}`);
    if (identityKeys.length === 0) identityKeys.push('unknown-identity');

    const dedupeWindowMs =
      normalizedAction === 'left'
        ? LIFECYCLE_DEDUPE_WINDOW_MS.left
        : LIFECYCLE_DEDUPE_WINDOW_MS.joined;

    const hasDuplicate = identityKeys.some((identityKey) => {
      const cacheKey = `${normalizedAction}|${identityKey}`;
      const lastSeen = recentLifecycleRef.current.get(cacheKey);
      return typeof lastSeen === 'number' && eventTime - lastSeen < dedupeWindowMs;
    });

    identityKeys.forEach((identityKey) => {
      const cacheKey = `${normalizedAction}|${identityKey}`;
      recentLifecycleRef.current.set(cacheKey, eventTime);
    });

    const cutoff = eventTime - Math.max(LIFECYCLE_DEDUPE_WINDOW_MS.left, LIFECYCLE_DEDUPE_WINDOW_MS.joined) * 2;
    for (const [key, value] of recentLifecycleRef.current.entries()) {
      if (value < cutoff) {
        recentLifecycleRef.current.delete(key);
      }
    }

    return hasDuplicate;
  }, []);

  const upsertKnownParticipant = useCallback((participant = {}) => {
    const participantId = getParticipantIdFromRecord(participant);
    const participantName = getParticipantNameFromRecord(participant);
    const normalizedId = normalizeIdentityValue(participantId);
    const normalizedName = normalizeIdentityValue(participantName);

    const record = {
      id: participantId,
      name: participantName,
      isMuted: getParticipantMutedState(participant),
      isHandRaised: getParticipantHandRaisedState(participant),
    };

    if (normalizedId) {
      knownParticipantsRef.current.set(`id:${normalizedId}`, record);
    }

    if (normalizedName) {
      knownParticipantsRef.current.set(`name:${normalizedName}`, record);
    }
  }, []);

  const removeKnownParticipant = useCallback((participantId, participantName) => {
    const normalizedId = normalizeIdentityValue(participantId);
    const normalizedName = normalizeIdentityValue(participantName);

    if (normalizedId) {
      knownParticipantsRef.current.delete(`id:${normalizedId}`);
    }

    if (normalizedName) {
      knownParticipantsRef.current.delete(`name:${normalizedName}`);
    }
  }, []);

  const resolveParticipantIdentity = useCallback((participantId, participantName) => {
    const normalizedId = normalizeIdentityValue(participantId);
    const normalizedName = normalizeIdentityValue(participantName);

    const byId = normalizedId ? knownParticipantsRef.current.get(`id:${normalizedId}`) : null;
    const byIdFromName = !normalizedId && normalizedName
      ? knownParticipantsRef.current.get(`id:${normalizedName}`)
      : null;
    const byName = normalizedName ? knownParticipantsRef.current.get(`name:${normalizedName}`) : null;
    const resolved = byId || byIdFromName || byName || null;

    const id = participantId || resolved?.id || (byIdFromName ? normalizedName : null);
    const name = resolved?.name || participantName || participantId || 'Unknown participant';

    if (!id && (!participantName || participantName === 'Unknown participant')) {
      const nonSelfParticipants = [];
      const seen = new Set();

      for (const participant of knownParticipantsRef.current.values()) {
        const dedupeKey = `${normalizeIdentityValue(participant?.id)}|${normalizeIdentityValue(participant?.name)}`;
        if (!participant?.name || seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        if (isSelfParticipant(participant?.id, participant?.name)) continue;
        nonSelfParticipants.push(participant);
      }

      if (nonSelfParticipants.length === 1) {
        return {
          id: nonSelfParticipants[0].id || null,
          name: nonSelfParticipants[0].name,
        };
      }
    }

    return { id, name };
  }, [isSelfParticipant]);

  const resolveParticipantIdentityAsync = useCallback(async (participantId, participantName) => {
    const resolved = resolveParticipantIdentity(participantId, participantName);

    if (resolved.name && resolved.name !== 'Unknown participant') {
      return resolved;
    }

    const sdk = zoomSdkRef.current;
    if (!sdk || typeof sdk.getMeetingParticipants !== 'function') {
      return resolved;
    }

    try {
      const result = await sdk.getMeetingParticipants();
      const participants = Array.isArray(result?.participants) ? result.participants : [];

      participants.forEach((participant) => {
        upsertKnownParticipant(participant);
      });

      return resolveParticipantIdentity(participantId, participantName);
    } catch {
      return resolved;
    }
  }, [resolveParticipantIdentity, upsertKnownParticipant]);

  const isDuplicateInteraction = useCallback(({ interactionType, participantId, participantName, interactionValue, timestamp }) => {
    const normalizedType = normalizeIdentityValue(interactionType);
    const normalizedId = normalizeIdentityValue(participantId);
    const normalizedName = normalizeIdentityValue(participantName);
    const normalizedIdentity = normalizedId || normalizedName || 'unknown-identity';
    const normalizedValue = normalizeIdentityValue(interactionValue) || 'unknown-value';
    const eventTime = Number.isFinite(Date.parse(timestamp)) ? Date.parse(timestamp) : Date.now();

    const cacheKey = `${normalizedType}|${normalizedIdentity}|${normalizedValue}`;
    const lastSeen = recentInteractionRef.current.get(cacheKey);
    const DEDUPE_WINDOW_MS = 2500;

    if (lastSeen && eventTime - lastSeen < DEDUPE_WINDOW_MS) {
      return true;
    }

    recentInteractionRef.current.set(cacheKey, eventTime);

    const cutoff = eventTime - 20000;
    for (const [key, value] of recentInteractionRef.current.entries()) {
      if (value < cutoff) {
        recentInteractionRef.current.delete(key);
      }
    }

    return false;
  }, []);

  const initializeZoomSdk = useCallback(async ({ trigger = 'boot' } = {}) => {
    const isRetry = trigger === 'retry';
    const maxAttempts = isRetry ? 1 : BOOT_INIT_MAX_ATTEMPTS;

    if (sdkInitInFlightRef.current) {
      return;
    }

    sdkInitInFlightRef.current = true;
    zoomSdkRef.current = null;
    selfIdentityRef.current = { ids: [], names: [], raw: null };

    setError('');
    setStatus(isRetry ? 'Retrying Zoom SDK initialization...' : 'Initializing Zoom SDK...');
    setSdkDebug([]);
    setSdkPhase('idle');

    const runSingleInitAttempt = async () => Promise.race([
      initZoomSdkBridge({
        onDebug: (entry) => {
          appendSdkDebug(entry);
        },
        onParticipantJoined: async ({ participantName, participantId, timestamp }) => {
          if (!sessionRef.current?.id) return;
          if (isSelfParticipant(participantId, participantName)) return;
          const resolvedParticipant = await resolveParticipantIdentityAsync(participantId, participantName);
          if (isSelfParticipant(resolvedParticipant.id, resolvedParticipant.name)) return;
          if (isDuplicateLifecycleEvent({
            action: 'joined',
            participantId: resolvedParticipant.id,
            participantName: resolvedParticipant.name,
            timestamp,
          })) {
            return;
          }
          upsertKnownParticipant({
            participantUUID: resolvedParticipant.id,
            displayName: resolvedParticipant.name,
          });
          appendEvent('Participant joined', { participantName: resolvedParticipant.name });
          await sendLiveEvent('participant:joined', {
            participant: {
              id: resolvedParticipant.id,
              name: resolvedParticipant.name,
              joinedAt: timestamp,
            },
          });
        },
        onParticipantLeft: async ({ participantName, participantId, timestamp }) => {
          if (!sessionRef.current?.id) return;
          if (isSelfParticipant(participantId, participantName)) return;
          const resolvedParticipant = await resolveParticipantIdentityAsync(participantId, participantName);
          if (isSelfParticipant(resolvedParticipant.id, resolvedParticipant.name)) return;
          if (isDuplicateLifecycleEvent({
            action: 'left',
            participantId: resolvedParticipant.id,
            participantName: resolvedParticipant.name,
            timestamp,
          })) {
            return;
          }
          appendEvent('Participant left', { participantName: resolvedParticipant.name });
          await sendLiveEvent('participant:left', {
            participantId: resolvedParticipant.id,
            participant_name: resolvedParticipant.name,
            leftAt: timestamp,
          });
          removeKnownParticipant(resolvedParticipant.id, resolvedParticipant.name);
        },
        onReaction: async ({ participantName, participantId, isSelfEvent = false, interactionType = 'reaction', reaction, sourceEventId, timestamp }) => {
          if (!sessionRef.current?.id) return;
          if (isSelfEvent) return;
          if (isSelfParticipant(participantId, participantName)) return;
          const resolvedParticipant = await resolveParticipantIdentityAsync(participantId, participantName);
          if (isSelfParticipant(resolvedParticipant.id, resolvedParticipant.name)) return;
          if (isDuplicateInteraction({
            interactionType,
            participantId: resolvedParticipant.id,
            participantName: resolvedParticipant.name,
            interactionValue: reaction,
            timestamp,
          })) {
            return;
          }

          appendEvent(interactionType === 'hand_raise' ? 'Hand raise' : 'Reaction', {
            participantName: resolvedParticipant.name,
            reaction,
          });
          await sendLiveEvent('participation:logged', {
            interactionType,
            interactionValue: reaction,
            studentName: resolvedParticipant.name,
            metadata: {
              participant_name: resolvedParticipant.name,
              participant_id: resolvedParticipant.id,
              reaction,
              source: 'zoom_sdk',
              source_event_id: sourceEventId,
            },
            timestamp,
          });
        },
        onMicToggle: async ({ participantName, participantId, isMuted, sourceEventId, timestamp }) => {
          if (!sessionRef.current?.id) return;
          if (isSelfParticipant(participantId, participantName)) return;
          const resolvedParticipant = await resolveParticipantIdentityAsync(participantId, participantName);
          if (isSelfParticipant(resolvedParticipant.id, resolvedParticipant.name)) return;
          if (isDuplicateInteraction({
            interactionType: 'mic_toggle',
            participantId: resolvedParticipant.id,
            participantName: resolvedParticipant.name,
            interactionValue: isMuted ? 'muted' : 'unmuted',
            timestamp,
          })) {
            return;
          }
          appendEvent('Mic toggle', { participantName: resolvedParticipant.name, isMuted });
          await sendLiveEvent('participation:logged', {
            interactionType: 'mic_toggle',
            interactionValue: isMuted ? 'muted' : 'unmuted',
            studentName: resolvedParticipant.name,
            metadata: {
              participant_name: resolvedParticipant.name,
              participant_id: resolvedParticipant.id,
              isMuted,
              source: 'zoom_sdk',
              source_event_id: sourceEventId,
            },
            timestamp,
          });
        },
        onMeetingEnded: async ({ timestamp }) => {
          const activeSessionId = sessionRef.current?.id;
          const activeToken = tokenRef.current;
          if (!activeSessionId || !activeToken) return;
          appendEvent('Meeting ended by Zoom event', { sessionId: activeSessionId });
          await sendLiveEvent('session:extension_disconnected', {
            sessionId: activeSessionId,
            source: 'zoom_iframe_bridge',
            reason: 'meeting_ended_event',
          }, activeSessionId);
          await zoomIframeAPI.endSessionWithTimestamp(activeToken, activeSessionId, timestamp || new Date().toISOString());
          setSession(null);
          setStatus('Tracking stopped (meeting ended)');
        },
      }),
      waitForMs(BRIDGE_INIT_TIMEOUT_MS).then(() => ({
        initialized: false,
        error: `Zoom SDK initialization timed out after ${Math.round(BRIDGE_INIT_TIMEOUT_MS / 1000)}s`,
      })),
    ]);

    try {
      let zoomInit = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (attempt > 1) {
          appendSdkDebug({
            phase: 'init-retry',
            message: `Automatic boot retry ${attempt}/${maxAttempts}`,
            level: 'warn',
            meta: { trigger },
          });
        }

        zoomInit = await runSingleInitAttempt();

        if (zoomInit?.initialized) {
          break;
        }

        if (attempt < maxAttempts) {
          await waitForMs(1000);
        }
      }

      setZoomState({ initialized: Boolean(zoomInit?.initialized), data: zoomInit });

      if (!zoomInit?.initialized) {
        setStatus('Zoom SDK initialization failed. Click "Retry Init" to try again.');
        setSdkPhase('init-failed');
        if (zoomInit?.error) {
          setError(zoomInit.error);
        }
        return;
      }

      setStatus('Zoom SDK initialized');
      setSdkPhase('initialized');

      const selfIdentity = getZoomSelfIdentity(zoomInit);
      selfIdentityRef.current = selfIdentity;
      zoomSdkRef.current = zoomInit?.zoomSdk || null;

      const resolvedMeetingLink = getMeetingLinkFromZoomInit(zoomInit);
      if (resolvedMeetingLink) {
        setMeetingLinkOverride(resolvedMeetingLink);
      }

      appendEvent(isRetry ? 'Zoom SDK initialized (retry)' : 'Zoom SDK initialized', {
        runningContext: zoomInit?.runningContext?.runningContext,
        meetingUUID: zoomInit?.meetingUuid?.meetingUUID,
        meetingLink: resolvedMeetingLink || null,
        selfIdentity: {
          ids: selfIdentity.ids,
          names: selfIdentity.names,
        },
      });
    } finally {
      sdkInitInFlightRef.current = false;
    }
  }, [appendSdkDebug, appendEvent, isDuplicateInteraction, isDuplicateLifecycleEvent, isSelfParticipant, removeKnownParticipant, resolveParticipantIdentityAsync, sendLiveEvent, upsertKnownParticipant]);

  const handleRetryInit = useCallback(async () => {
    sdkBootStartedRef.current = false;
    await initializeZoomSdk({ trigger: 'retry' });
  }, [initializeZoomSdk]);

  const resolveMeetingLink = async (zoomInitResult) => {
    if (meetingLinkOverride) return meetingLinkOverride;

    const sdkMeetingLink = getMeetingLinkFromZoomInit(zoomInitResult);
    if (sdkMeetingLink) return sdkMeetingLink;

    throw new Error('Unable to resolve meeting link. Pass meetingLink in query or grant Zoom context access.');
  };

  const loadClassesForToken = useCallback(async (tokenValue) => {
    if (!tokenValue) return;

    const response = await zoomIframeAPI.getClasses(tokenValue);
    const classRows = response?.data || [];
    setClasses(classRows);

    if (!selectedClassId && classRows.length > 0) {
      setSelectedClassId(classRows[0].id);
    }
  }, [selectedClassId]);

  const handleApplyToken = async () => {
    const cleaned = tokenInput.trim();

    if (!cleaned) {
      setError('Please enter an extension token first.');
      return;
    }

    setError('');
    setStatus('Applying token...');
    setToken(cleaned);

    try {
      await loadClassesForToken(cleaned);
      setStatus('Token applied. Classes loaded.');
    } catch (tokenError) {
      setError(tokenError.message || 'Failed to load classes with provided token');
      setStatus('Token applied but class fetch failed');
    }
  };

  const handleRefreshClasses = async () => {
    if (!token) {
      setError('Apply an extension token first.');
      return;
    }

    setError('');
    setStatus('Refreshing classes...');
    try {
      await loadClassesForToken(token);
      setStatus('Classes refreshed');
    } catch (refreshError) {
      setError(refreshError.message || 'Failed to refresh classes');
      setStatus('Class refresh failed');
    }
  };

  const handleStartSession = async () => {
    if (!token) {
      setError('Missing token. Provide ?token=... in iframe URL or send token via postMessage.');
      return;
    }

    if (!selectedClassId) {
      setError('Select a class before starting tracking.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const meetingLink = await resolveMeetingLink(zoomState.data);

      const response = await zoomIframeAPI.startSessionFromMeeting(token, {
        class_id: selectedClassId,
        meeting_link: meetingLink,
        started_at: new Date().toISOString(),
        platform: 'zoom',
        title: `Zoom Session - ${new Date().toLocaleString()}`,
      });

      const createdSession = response?.data;
      if (!createdSession?.id) {
        throw new Error('Failed to create session');
      }

      setSession(createdSession);
      clearKnownParticipants();
      setStatus('Tracking active in Zoom iframe bridge');
      appendEvent('Session started', { sessionId: createdSession.id, meetingLink });

      await sendLiveEvent('session:extension_connected', {
        sessionId: createdSession.id,
        source: 'zoom_iframe_bridge',
      }, createdSession.id);

      const initialParticipants = zoomState?.data?.meetingParticipants?.participants || [];
      for (const participant of initialParticipants) {
        const participantName = getParticipantNameFromRecord(participant) || participant?.participantUUID;
        const participantId = getParticipantIdFromRecord(participant);
        if (!participantName) continue;
        if (isSelfParticipant(participantId, participantName)) continue;

        upsertKnownParticipant(participant);

        await sendLiveEvent('participant:joined', {
          participant: {
            id: participantId,
            name: participantName,
            joinedAt: new Date().toISOString(),
          },
        }, createdSession.id);
      }
    } catch (startError) {
      setError(startError.message || 'Failed to start tracking session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!session?.id) return;

    setIsLoading(true);
    setError('');

    try {
      await sendLiveEvent('session:extension_disconnected', {
        sessionId: session.id,
        source: 'zoom_iframe_bridge',
      });

      await zoomIframeAPI.endSessionWithTimestamp(token, session.id, new Date().toISOString());
      appendEvent('Session ended', { sessionId: session.id });
      clearKnownParticipants();
      zoomSdkRef.current = null;
      setSession(null);
      setStatus('Tracking stopped');
    } catch (endError) {
      setError(endError.message || 'Failed to end session');
    } finally {
      setIsLoading(false);
    }
  };

  const createMockSourceEventId = (prefix) =>
    `mock:${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const emitMockJoin = async () => {
    if (!sessionRef.current?.id) return;

    const payload = {
      participant: {
        id: mockParticipantId,
        name: mockParticipantName,
        joinedAt: new Date().toISOString(),
      },
    };

    await sendLiveEvent('participant:joined', payload);
    appendEvent('Mock event: participant joined', payload);
  };

  const emitMockLeave = async () => {
    if (!sessionRef.current?.id) return;

    const payload = {
      participantId: mockParticipantId,
      participant_name: mockParticipantName,
      leftAt: new Date().toISOString(),
    };

    await sendLiveEvent('participant:left', payload);
    appendEvent('Mock event: participant left', payload);
  };

  const emitMockReaction = async () => {
    if (!sessionRef.current?.id) return;

    const payload = {
      interactionType: 'reaction',
      interactionValue: 'thumbs_up',
      studentName: mockParticipantName,
      metadata: {
        participant_name: mockParticipantName,
        participant_id: mockParticipantId,
        reaction: 'thumbs_up',
        source: 'zoom_mock_ui',
        source_event_id: createMockSourceEventId('reaction'),
      },
      timestamp: new Date().toISOString(),
    };

    await sendLiveEvent('participation:logged', payload);
    appendEvent('Mock event: reaction', payload);
  };

  const emitMockMicToggle = async () => {
    if (!sessionRef.current?.id) return;

    const nextMuted = !mockIsMuted;
    setMockIsMuted(nextMuted);

    const payload = {
      interactionType: 'mic_toggle',
      interactionValue: nextMuted ? 'muted' : 'unmuted',
      studentName: mockParticipantName,
      metadata: {
        participant_name: mockParticipantName,
        participant_id: mockParticipantId,
        isMuted: nextMuted,
        source: 'zoom_mock_ui',
        source_event_id: createMockSourceEventId('mic_toggle'),
      },
      timestamp: new Date().toISOString(),
    };

    await sendLiveEvent('participation:logged', payload);
    appendEvent(`Mock event: mic ${nextMuted ? 'muted' : 'unmuted'}`, payload);
  };

  const emitMockEndSession = async () => {
    if (!sessionRef.current?.id) return;

    await sendLiveEvent('session:extension_disconnected', {
      sessionId: sessionRef.current.id,
      source: 'zoom_mock_ui',
      reason: 'manual_mock_end',
    });

    await zoomIframeAPI.endSessionWithTimestamp(tokenRef.current, sessionRef.current.id, new Date().toISOString());
    appendEvent('Mock event: session ended', { sessionId: sessionRef.current.id });
    clearKnownParticipants();
    zoomSdkRef.current = null;
    setSession(null);
    setStatus('Tracking stopped (mock end)');
  };

  useEffect(() => {
    if (!session?.id) return undefined;

    const sdk = zoomState?.data?.zoomSdk;
    if (!sdk || typeof sdk.getMeetingParticipants !== 'function') return undefined;

    let cancelled = false;

    const pollParticipants = async () => {
      try {
        const result = await sdk.getMeetingParticipants();
        const participants = Array.isArray(result?.participants) ? result.participants : [];
        const currentMap = new Map();

        participants.forEach((participant) => {
          const participantId = getParticipantIdFromRecord(participant);
          const participantName = getParticipantNameFromRecord(participant) || participant?.participantUUID;
          if (!participantName) return;
          if (isSelfParticipant(participantId, participantName)) return;

          const key = getParticipantKey(participant);
          if (!key) return;

          currentMap.set(key, {
            id: participantId,
            name: participantName,
            isMuted: getParticipantMutedState(participant),
            isHandRaised: getParticipantHandRaisedState(participant),
          });
        });

        if (typeof sdk.getIncomingParticipantAudioState === 'function') {
          const participantIds = Array.from(currentMap.values())
            .map((participant) => participant.id)
            .filter(Boolean);

          if (participantIds.length > 0) {
            try {
              const audioStateResponse = await sdk.getIncomingParticipantAudioState({
                participantUUIDs: participantIds,
              });

              const audioRows = Array.isArray(audioStateResponse?.participants)
                ? audioStateResponse.participants
                : [];

              const audioById = new Map(
                audioRows
                  .filter((row) => row?.participantUUID)
                  .map((row) => [
                    normalizeIdentityValue(row.participantUUID),
                    typeof row.audio === 'boolean' ? !row.audio : null,
                  ])
              );

              for (const [key, participant] of currentMap.entries()) {
                const normalizedId = normalizeIdentityValue(participant.id);
                if (!normalizedId) continue;

                if (!audioById.has(normalizedId)) continue;
                const isMuted = audioById.get(normalizedId);
                if (typeof isMuted !== 'boolean') continue;

                currentMap.set(key, {
                  ...participant,
                  isMuted,
                });
              }
            } catch (audioStateError) {
              appendSdkDebug({
                phase: 'participant-poll-audio-state',
                level: 'warn',
                message: 'Incoming participant audio poll failed',
                meta: { error: audioStateError?.message || 'audio poll failed' },
              });
            }
          }
        }

        const previousParticipants = dedupeParticipantRecords(Array.from(knownParticipantsRef.current.values()));
        const currentParticipants = dedupeParticipantRecords(Array.from(currentMap.values()));

        for (const participant of currentParticipants) {
          if (findMatchingParticipant(participant, previousParticipants)) continue;
          const joinedAt = new Date().toISOString();
          if (isDuplicateLifecycleEvent({
            action: 'joined',
            participantId: participant.id,
            participantName: participant.name,
            timestamp: joinedAt,
          })) {
            continue;
          }

          if (cancelled || !sessionRef.current?.id) return;
          await sendLiveEvent('participant:joined', {
            participant: {
              id: participant.id,
              name: participant.name,
              joinedAt,
            },
          }, sessionRef.current.id);
          appendEvent('Participant joined (poll)', {
            participantName: participant.name,
            participantId: participant.id,
          });
        }

        for (const participant of previousParticipants) {
          if (findMatchingParticipant(participant, currentParticipants)) continue;
          if (isSelfParticipant(participant.id, participant.name)) continue;
          const leftAt = new Date().toISOString();
          if (isDuplicateLifecycleEvent({
            action: 'left',
            participantId: participant.id,
            participantName: participant.name,
            timestamp: leftAt,
          })) {
            continue;
          }

          if (cancelled || !sessionRef.current?.id) return;
          await sendLiveEvent('participant:left', {
            participantId: participant.id,
            participant_name: participant.name,
            leftAt,
          }, sessionRef.current.id);
          appendEvent('Participant left (poll)', {
            participantName: participant.name,
            participantId: participant.id,
          });
        }

        for (const participant of currentParticipants) {
          const previousParticipant = findMatchingParticipant(participant, previousParticipants);
          if (!previousParticipant) continue;

          if (
            typeof previousParticipant.isMuted === 'boolean' &&
            typeof participant.isMuted === 'boolean' &&
            previousParticipant.isMuted !== participant.isMuted
          ) {
            const mutedAt = new Date().toISOString();
            if (!isDuplicateInteraction({
              interactionType: 'mic_toggle',
              participantId: participant.id,
              participantName: participant.name,
              interactionValue: participant.isMuted ? 'muted' : 'unmuted',
              timestamp: mutedAt,
            })) {
              await sendLiveEvent('participation:logged', {
                interactionType: 'mic_toggle',
                interactionValue: participant.isMuted ? 'muted' : 'unmuted',
                studentName: participant.name,
                metadata: {
                  participant_name: participant.name,
                  participant_id: participant.id,
                  isMuted: participant.isMuted,
                  source: 'zoom_poll',
                  source_event_id: createBridgeSourceEventId('poll_mic_toggle'),
                },
                timestamp: mutedAt,
              }, sessionRef.current.id);

              appendEvent('Mic toggle (poll)', {
                participantName: participant.name,
                participantId: participant.id,
                isMuted: participant.isMuted,
              });
            }
          }

          if (
            typeof previousParticipant.isHandRaised === 'boolean' &&
            typeof participant.isHandRaised === 'boolean' &&
            previousParticipant.isHandRaised !== participant.isHandRaised &&
            participant.isHandRaised
          ) {
            const raisedAt = new Date().toISOString();
            if (!isDuplicateInteraction({
              interactionType: 'hand_raise',
              participantId: participant.id,
              participantName: participant.name,
              interactionValue: 'raised',
              timestamp: raisedAt,
            })) {
              await sendLiveEvent('participation:logged', {
                interactionType: 'hand_raise',
                interactionValue: 'raised',
                studentName: participant.name,
                metadata: {
                  participant_name: participant.name,
                  participant_id: participant.id,
                  handRaised: true,
                  source: 'zoom_poll',
                  source_event_id: createBridgeSourceEventId('poll_hand_raise'),
                },
                timestamp: raisedAt,
              }, sessionRef.current.id);

              appendEvent('Hand raise (poll)', {
                participantName: participant.name,
                participantId: participant.id,
              });
            }
          }
        }

        knownParticipantsRef.current = buildKnownParticipantsMap(currentParticipants);
      } catch (pollError) {
        appendSdkDebug({
          phase: 'participant-poll',
          level: 'warn',
          message: 'Participant poll failed',
          meta: { error: pollError?.message || 'poll failed' },
        });
      }
    };

    pollParticipants();
    const intervalId = window.setInterval(pollParticipants, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [appendEvent, appendSdkDebug, isDuplicateInteraction, isDuplicateLifecycleEvent, isSelfParticipant, sendLiveEvent, session?.id, zoomState?.data?.zoomSdk]);

  useEffect(() => {
    const listener = (evt) => {
      if (!evt?.data || typeof evt.data !== 'object') return;
      if (evt.data.type !== 'engagium:zoom-token') return;
      if (typeof evt.data.token !== 'string' || !evt.data.token.trim()) return;
      const incomingToken = evt.data.token.trim();
      setTokenInput(incomingToken);
      setToken(incomingToken);
      setStatus('Token received from parent frame');
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  useEffect(() => {
    if (tokenRef.current) return;

    let cancelled = false;
    const timers = [];

    TOKEN_REQUEST_RETRY_DELAYS_MS.forEach((delayMs) => {
      const timerId = window.setTimeout(() => {
        if (cancelled || tokenRef.current) return;

        requestTokenFromParent('startup-retry');
      }, delayMs);

      timers.push(timerId);
    });

    const intervalId = window.setInterval(() => {
      if (!tokenRef.current) {
        requestTokenFromParent('periodic-retry');
      }
    }, 30000);

    const onFocus = () => {
      if (!tokenRef.current) {
        requestTokenFromParent('focus');
      }
    };

    const onPageShow = () => {
      if (!tokenRef.current) {
        requestTokenFromParent('pageshow');
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (!tokenRef.current) {
        requestTokenFromParent('visibility-visible');
      }
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      timers.forEach((timerId) => window.clearTimeout(timerId));
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [requestTokenFromParent]);

  useEffect(() => {
    if (sdkBootStartedRef.current) {
      return undefined;
    }

    sdkBootStartedRef.current = true;
    let mounted = true;

    const waitForZoomContext = async () => {
      // Poll for Zoom SDK context to be ready (up to 10 seconds)
      const startTime = Date.now();
      const maxWaitMs = 10000;

      while (Date.now() - startTime < maxWaitMs) {
        const inZoomContext = 
          typeof window !== 'undefined' &&
          (Boolean(window.__ZOOM_APP__) || 
           (window.navigator?.userAgent?.toLowerCase() || '').includes('zoom'));

        if (inZoomContext) {
          appendSdkDebug({
            phase: 'context-ready',
            message: 'Zoom context detected, proceeding with initialization',
            meta: { waitedMs: Date.now() - startTime },
          });
          return true;
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      appendSdkDebug({
        phase: 'context-timeout',
        message: 'Timeout waiting for Zoom context',
        level: 'warn',
        meta: { maxWaitMs },
      });
      return false;
    };

    const boot = async () => {
      setStatus('Waiting for Zoom context to be ready...');
      const contextReady = await waitForZoomContext();

      if (!mounted) return;

      if (!contextReady) {
        setStatus('Initialization timed out waiting for Zoom context. Click "Retry Init" to try again.');
        setSdkPhase('context-timeout');
        setError('Zoom context did not become available within timeout');
        return;
      }

      await waitForMs(BOOT_INIT_SETTLE_DELAY_MS);

      if (!mounted) return;
      await initializeZoomSdk({ trigger: 'boot' });
    };

    const bootTimer = setTimeout(() => {
      boot();
    }, 0);

    return () => {
      clearTimeout(bootTimer);
      sdkBootStartedRef.current = false;
      mounted = false;
    };
  }, [appendSdkDebug, initializeZoomSdk]);

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    const load = async () => {
      try {
        await loadClassesForToken(token);
      } catch (classError) {
        if (!mounted) return;
        setError(classError.message || 'Failed to fetch classes with iframe token');
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [token, loadClassesForToken]);

  useEffect(() => {
    if (!getAutoStart()) return;
    if (!selectedClassId || !token || session?.id || isLoading) return;

    handleStartSession();
  }, [selectedClassId, token]);

  const classOptions = useMemo(
    () =>
      classes.map((cls) => ({
        id: cls.id,
        label: [cls.section, cls.subject, cls.name].filter(Boolean).join(' - '),
      })),
    [classes]
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h1 className="text-xl font-semibold">Engagium Zoom Bridge</h1>
          <p className="text-sm text-slate-600 mt-1">Iframe-ready session tracker using Zoom events and extension-compatible APIs.</p>

          <div className="mt-4 bg-slate-50 rounded-lg border border-slate-200 p-3">
            <label className="block text-sm font-medium mb-1">Engagium Extension Token</label>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste extension token here"
              />
              <button
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
                onClick={handleApplyToken}
                disabled={isLoading}
              >
                Apply Token
              </button>
              <button
                className="rounded-lg bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 text-sm"
                onClick={handleRefreshClasses}
                disabled={isLoading || !token}
              >
                Refresh Classes
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Classes are fetched using this token through extension-compatible API auth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
            <div className="bg-slate-50 rounded-lg p-3 border border-cyan-200 border-l-4 border-l-cyan-500">
              <div className="font-medium text-cyan-700">Status</div>
              <div className="text-slate-700 mt-1">{status}</div>
              <div className="text-xs text-slate-500 mt-2">
                Phase: <span className="font-medium text-slate-700">{formatDebugLabel(sdkPhase)}</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="font-medium">Zoom SDK</div>
              <div className="text-slate-700 mt-1">{zoomState.initialized ? 'Initialized' : 'Unavailable (manual mode)'}</div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">SDK Timeline</div>
                <div className="text-xs text-slate-500 mt-0.5">Latest 80 SDK checkpoints from load, config, listeners, and context fetch.</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-xs rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                  onClick={handleRetryInit}
                  type="button"
                >
                  Retry Init
                </button>
                <button
                  className="text-xs rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                  onClick={() => {
                    setSdkDebug([]);
                    setSdkPhase('idle');
                  }}
                  type="button"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-3 max-h-56 overflow-auto divide-y divide-slate-200 bg-white rounded border border-slate-200">
              {sdkDebug.length === 0 ? (
                <div className="text-xs text-slate-500 p-3">No SDK debug entries yet.</div>
              ) : (
                sdkDebug.map((entry) => (
                  <div key={entry.id} className="p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium text-slate-800">{formatDebugLabel(entry.phase)}</div>
                      <div className="text-[11px] text-slate-500">{formatTime(entry.timestamp)}</div>
                    </div>
                    <div className="text-xs mt-1 text-slate-700">{entry.message}</div>
                    {entry.meta && Object.keys(entry.meta).length > 0 && (
                      <pre className="text-[11px] mt-1 bg-slate-50 border border-slate-200 rounded p-2 overflow-auto">
                        {JSON.stringify(entry.meta, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium">API Inspector</div>
                <div className="text-xs text-slate-500 mt-0.5">Click any subscribed API or listener to view the latest raw payload captured from Zoom SDK.</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[11px] text-slate-500">
                  Subscribed: {inspectorTargets.length}
                </div>
                <button
                  className="text-xs rounded border border-blue-500 bg-blue-50 px-2 py-1 text-blue-800 hover:bg-blue-100 disabled:opacity-60"
                  onClick={() => runInspectorApi('getSupportedJsApis')}
                  disabled={inspectorRunTarget === 'getSupportedJsApis' || !zoomSdkRef.current}
                  type="button"
                >
                  {inspectorRunTarget === 'getSupportedJsApis' ? 'Running getSupportedJsApis...' : 'Run getSupportedJsApis'}
                </button>
                <button
                  className="text-xs rounded border border-cyan-500 bg-cyan-50 px-2 py-1 text-cyan-800 hover:bg-cyan-100 disabled:opacity-60"
                  onClick={() => runInspectorApi('getIncomingParticipantAudioState')}
                  disabled={inspectorRunTarget === 'getIncomingParticipantAudioState' || !zoomSdkRef.current}
                  type="button"
                >
                  {inspectorRunTarget === 'getIncomingParticipantAudioState'
                    ? 'Running getIncomingParticipantAudioState...'
                    : 'Run getIncomingParticipantAudioState'}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {inspectorTargets.map((target) => {
                const hasPayload = inspectorEntriesByTarget.has(target);
                const isSelected = selectedInspectorTarget === target;

                return (
                  <button
                    key={target}
                    className={`text-xs rounded border px-2.5 py-1.5 ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                    onClick={() => setSelectedInspectorTarget(target)}
                    type="button"
                  >
                    {target}
                    <span className={`ml-1.5 inline-block h-2 w-2 rounded-full ${hasPayload ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </button>
                );
              })}
            </div>

            <div className="mt-3 bg-white rounded border border-slate-200 p-3">
              {!selectedInspectorTarget ? (
                <div className="text-xs text-slate-500">No subscribed APIs detected yet.</div>
              ) : selectedInspectorEntry ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-slate-800">{selectedInspectorEntry.target}</div>
                    <div className="text-[11px] text-slate-500">{selectedInspectorEntry.timestamp ? formatTime(selectedInspectorEntry.timestamp) : 'No timestamp'}</div>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{selectedInspectorEntry.message}</div>
                  <pre className="text-[11px] mt-2 bg-slate-50 border border-slate-200 rounded p-2 overflow-auto max-h-64">
                    {JSON.stringify(selectedInspectorEntry.payload ?? {}, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="text-xs text-slate-500">
                  No raw payload captured yet for {selectedInspectorTarget}. Trigger this API/event in Zoom and it will appear here.
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={!!session?.id || isLoading}
              >
                <option value="">Select class</option>
                {classOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Meeting Link Override</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="https://zoom.us/j/..."
                value={meetingLinkOverride}
                onChange={(e) => setMeetingLinkOverride(e.target.value)}
                disabled={!!session?.id || isLoading}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {!session?.id ? (
              <button
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm disabled:opacity-60"
                onClick={handleStartSession}
                disabled={isLoading || !selectedClassId || !token}
              >
                Start Tracking
              </button>
            ) : (
              <button
                className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-sm disabled:opacity-60"
                onClick={handleEndSession}
                disabled={isLoading}
              >
                End Tracking
              </button>
            )}
          </div>

          {session?.id && (
            <div className="mt-3 text-sm text-slate-600">
              Active session: <span className="font-mono text-slate-800">{session.id}</span>
            </div>
          )}
        </div>

        {mockMode && (
          <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-amber-800">Mock Test Controls</h2>
            <p className="text-sm text-slate-600 mt-1">
              Emits synthetic Zoom-like events to your real backend contracts. Enabled via query parameter mock=1.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Participant Name</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={mockParticipantName}
                  onChange={(e) => setMockParticipantName(e.target.value)}
                  disabled={!session?.id || isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Participant ID</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={mockParticipantId}
                  onChange={(e) => setMockParticipantId(e.target.value)}
                  disabled={!session?.id || isLoading}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 text-sm disabled:opacity-50"
                onClick={emitMockJoin}
                disabled={!session?.id || isLoading}
              >
                Emit Join
              </button>
              <button
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-sm disabled:opacity-50"
                onClick={emitMockReaction}
                disabled={!session?.id || isLoading}
              >
                Emit Reaction
              </button>
              <button
                className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 text-sm disabled:opacity-50"
                onClick={emitMockMicToggle}
                disabled={!session?.id || isLoading}
              >
                Emit Mic Toggle ({mockIsMuted ? 'muted' : 'unmuted'})
              </button>
              <button
                className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 text-sm disabled:opacity-50"
                onClick={emitMockLeave}
                disabled={!session?.id || isLoading}
              >
                Emit Leave
              </button>
              <button
                className="rounded-lg bg-rose-700 hover:bg-rose-800 text-white px-3 py-2 text-sm disabled:opacity-50"
                onClick={emitMockEndSession}
                disabled={!session?.id || isLoading}
              >
                Emit Session End
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Live Event Stream</h2>
          <p className="text-sm text-slate-600 mt-1">Last 120 bridge events emitted to backend.</p>

          <div className="mt-3 max-h-[480px] overflow-auto divide-y divide-slate-100">
            {events.length === 0 ? (
              <div className="text-sm text-slate-500 py-6">No events yet.</div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="py-2">
                  <div className="text-sm font-medium text-slate-800">{event.label}</div>
                  <div className="text-xs text-slate-500">{formatTime(event.timestamp)}</div>
                  <pre className="text-xs mt-1 bg-slate-50 border border-slate-200 rounded p-2 overflow-auto">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ZoomIframeBridge;
