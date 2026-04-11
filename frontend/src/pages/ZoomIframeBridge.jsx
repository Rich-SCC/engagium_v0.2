import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zoomIframeAPI } from '@/services/zoomIframeApi';
import { initZoomSdkBridge } from '@/services/zoomSdkBridge';
import { normalizeMeetingUrl } from '@/utils/urlUtils';
import heroLogo from '@/assets/images/hero-logo.png';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon,
  PlayCircleIcon,
  SignalIcon,
  StopCircleIcon,
} from '@heroicons/react/24/outline';

const TOKEN_STORAGE_KEY = 'engagium_zoom_bridge_token';
const CLASS_ID_STORAGE_KEY = 'engagium_zoom_bridge_class_id';
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
  return params.get('meetingLink') || '';
};

const getAutoStart = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('autostart') === '1';
};

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const shortenId = (value = '') => {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length <= 8 ? text : text.slice(0, 5);
};

const getEventSummaryText = (event = {}) => {
  const payload = event?.payload || {};

  if (payload?.participantName) {
    return payload.participantName;
  }

  if (payload?.participant?.name) {
    return payload.participant.name;
  }

  if (payload?.sessionId) {
    return `ID: ${shortenId(payload.sessionId)}`;
  }

  if (payload?.meetingUUID) {
    return `Meeting: ${shortenId(payload.meetingUUID)}`;
  }

  return '';
};

const waitForMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const buildSourceEventId = (prefix = 'evt') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeSignalText = (value) => String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

const PARTICIPATION_GUARD_WINDOWS_MS = {
  exactDuplicate: 2000,
  reactionBurst: 1200,
  sameReactionCooldown: 6000,
  handCooldown: 2500,
};

const detectHandFeedbackAction = (signal = '', source = '') => {
  const normalizedSignal = normalizeSignalText(signal);
  const normalizedSource = normalizeSignalText(source);

  if (!normalizedSignal && !normalizedSource) return null;

  if (
    normalizedSignal.includes('handraise') ||
    normalizedSignal.includes('raisehand') ||
    normalizedSignal.includes('raisedhand') ||
    normalizedSignal.includes('handup') ||
    normalizedSignal === 'raisehand'
  ) {
    return 'raised';
  }

  if (
    normalizedSignal.includes('lowerhand') ||
    normalizedSignal.includes('handlower') ||
    normalizedSignal.includes('putdownhand') ||
    normalizedSignal.includes('unraisehand') ||
    normalizedSignal.includes('unraisedhand') ||
    normalizedSignal === 'false' ||
    normalizedSignal === '0'
  ) {
    return 'lowered';
  }

  if (normalizedSignal === 'true' || normalizedSignal === '1') {
    return 'raised';
  }

  // If the event came from onFeedback and value contains "hand", treat as raise signal.
  if ((normalizedSource === 'onfeedback' || normalizedSource === 'onfeedbackreaction') && normalizedSignal.includes('hand')) {
    return 'raised';
  }

  return null;
};

const detectHandFeedbackActionFromRawEvent = (rawEvent = {}) => {
  if (!rawEvent || typeof rawEvent !== 'object') return null;

  const boolCandidates = [
    rawEvent?.isHandRaised,
    rawEvent?.handRaised,
    rawEvent?.raiseHand,
    rawEvent?.hand?.raised,
  ];

  for (const candidate of boolCandidates) {
    if (typeof candidate === 'boolean') {
      return candidate ? 'raised' : 'lowered';
    }
  }

  if (typeof rawEvent?.lowerHand === 'boolean') {
    return rawEvent.lowerHand ? 'lowered' : 'raised';
  }

  const textCandidates = [
    rawEvent?.feedback,
    rawEvent?.feedbackType,
    rawEvent?.reaction,
    rawEvent?.reactionType,
    rawEvent?.action,
    rawEvent?.status,
    rawEvent?.event,
    rawEvent?.eventType,
    rawEvent?.type,
    rawEvent?.name,
    rawEvent?.value,
  ];

  for (const candidate of textCandidates) {
    const inferred = detectHandFeedbackAction(candidate, 'onFeedback');
    if (inferred) return inferred;
  }

  return null;
};

const getRawReactionDetails = ({ signal, reactionEmoji, reactionUnicode, reactionName, rawEvent, eventData }) => {
  const payload = eventData || rawEvent?.eventData || rawEvent || {};
  const nestedReaction = payload?.reaction || {};

  const emoji = String(
    reactionEmoji ||
    nestedReaction?.emoji ||
    payload?.unicode ||
    payload?.emoji ||
    signal ||
    ''
  ).trim();

  const unicode = String(
    reactionUnicode ||
    nestedReaction?.unicode ||
    payload?.reactionUnicode ||
    payload?.unicode ||
    ''
  ).trim();

  const name = String(
    reactionName ||
    nestedReaction?.name ||
    payload?.reactionName ||
    ''
  ).trim();

  const displayValue = emoji || unicode || name || String(signal || '').trim() || 'unknown';
  return {
    displayValue,
    interactionValue: emoji || unicode || name || String(signal || '').trim() || 'unknown',
    dedupeSignal: `reaction:${normalizeSignalText(emoji || unicode || name || signal || 'unknown')}`,
    emoji: emoji || null,
    unicode: unicode || null,
    name: name || null,
  };
};

const shouldBlockParticipationSignal = ({
  cacheRef,
  identity,
  dedupeSignal,
  interactionType,
  now,
}) => {
  const exactKey = `exact|${identity}|${dedupeSignal}`;
  const exactLastSeen = cacheRef.current.get(exactKey);
  if (
    typeof exactLastSeen === 'number' &&
    now - exactLastSeen < PARTICIPATION_GUARD_WINDOWS_MS.exactDuplicate
  ) {
    return true;
  }

  if (interactionType === 'reaction') {
    const reactionBurstKey = `reaction:any|${identity}`;
    const reactionBurstLastSeen = cacheRef.current.get(reactionBurstKey);
    if (
      typeof reactionBurstLastSeen === 'number' &&
      now - reactionBurstLastSeen < PARTICIPATION_GUARD_WINDOWS_MS.reactionBurst
    ) {
      return true;
    }

    const sameReactionKey = `reaction:same|${identity}|${dedupeSignal}`;
    const sameReactionLastSeen = cacheRef.current.get(sameReactionKey);
    if (
      typeof sameReactionLastSeen === 'number' &&
      now - sameReactionLastSeen < PARTICIPATION_GUARD_WINDOWS_MS.sameReactionCooldown
    ) {
      return true;
    }

    cacheRef.current.set(reactionBurstKey, now);
    cacheRef.current.set(sameReactionKey, now);
  }

  if (interactionType === 'hand_raise') {
    const handKey = `hand|${identity}|${dedupeSignal}`;
    const handLastSeen = cacheRef.current.get(handKey);
    if (
      typeof handLastSeen === 'number' &&
      now - handLastSeen < PARTICIPATION_GUARD_WINDOWS_MS.handCooldown
    ) {
      return true;
    }

    cacheRef.current.set(handKey, now);
  }

  cacheRef.current.set(exactKey, now);

  const maxWindowMs = Math.max(...Object.values(PARTICIPATION_GUARD_WINDOWS_MS));
  const cutoff = now - maxWindowMs * 4;
  for (const [cachedKey, timestamp] of cacheRef.current.entries()) {
    if (timestamp < cutoff) {
      cacheRef.current.delete(cachedKey);
    }
  }

  return false;
};

const BRIDGE_INIT_TIMEOUT_MS = 15000;
const BOOT_INIT_SETTLE_DELAY_MS = 1500;
const BOOT_INIT_MAX_ATTEMPTS = 2;
const LIFECYCLE_DEDUPE_WINDOW_MS = {
  joined: 15000,
  left: 75000,
};

const getMeetingLinkFromZoomInit = (zoomInitResult) => {
  const joinUrl = zoomInitResult?.meetingJoinUrl?.joinUrl;
  if (joinUrl) return joinUrl;

  const meetingUuid = zoomInitResult?.meetingUuid?.meetingUUID;
  if (meetingUuid) return `zoom://meeting/${meetingUuid}`;

  return '';
};

const buildClassLinkLabel = (selectedClass = {}, meetingLink = '') => {
  const classSection = String(selectedClass?.section || '').trim();
  const compactMeetingId = String(meetingLink || '')
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
    .split('/')
    .filter(Boolean)
    .pop();

  if (classSection && compactMeetingId) {
    return `${classSection} - ${compactMeetingId} (zoom)`;
  }

  if (classSection) {
    return `${classSection} (zoom)`;
  }

  return 'Saved from Zoom bridge';
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
  participant?.participantUUID ||
  participant?.participant_id ||
  participant?.userId ||
  participant?.id ||
  participant?.participantId ||
  participant?.student_id ||
  null;

const getParticipantNameFromRecord = (participant = {}) =>
  participant?.screenName ||
  participant?.displayName ||
  participant?.userName ||
  participant?.name ||
  participant?.participant_name ||
  participant?.student_name ||
  participant?.full_name ||
  '';

const getCurrentParticipantsFromAttendance = (attendance = []) =>
  attendance
    .filter((record) =>
      Array.isArray(record?.intervals)
        ? record.intervals.some((interval) => !interval?.left_at)
        : record?.status === 'present'
    )
    .map((record) => ({
      participant_name: record?.participant_name || record?.student_name || record?.full_name || '',
      student_name: record?.student_name || record?.full_name || record?.participant_name || '',
      participant_id: record?.participant_id || null,
      student_id: record?.student_id || null,
    }))
    .filter((participant) => Boolean(getParticipantNameFromRecord(participant)));

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

const getAccountDisplayName = (user = {}) => {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return fullName || user?.email || 'Unknown account';
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

function ZoomIframeBridge() {
  const [token, setToken] = useState(getInitialToken());
  const [tokenInput, setTokenInput] = useState(getInitialToken());
  const [tokenAccount, setTokenAccount] = useState(null);
  const [isResolvingTokenAccount, setIsResolvingTokenAccount] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(getInitialClassId());
  const [meetingLinkOverride, setMeetingLinkOverride] = useState(getInitialMeetingLink());
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Initializing Zoom bridge...');
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [zoomState, setZoomState] = useState({ initialized: false, data: null });
  const [showTokenEditor, setShowTokenEditor] = useState(!getInitialToken());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rememberMeetingLink, setRememberMeetingLink] = useState(true);
  const tokenRef = useRef(token);
  const sessionRef = useRef(session);
  const hydratedSessionIdRef = useRef(null);
  const sdkBootStartedRef = useRef(false);
  const sdkInitInFlightRef = useRef(false);
  const zoomSdkRef = useRef(null);
  const selfIdentityRef = useRef({ ids: [], names: [], raw: null });
  const knownParticipantsRef = useRef(new Map());
  const recentLifecycleRef = useRef(new Map());
  const recentParticipationSignalsRef = useRef(new Map());

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
    if (token?.trim()) {
      setShowTokenEditor(false);
    }
  }, [token]);

  useEffect(() => {
    setPersistedValue(TOKEN_STORAGE_KEY, token?.trim() || '');
  }, [token]);

  useEffect(() => {
    setPersistedValue(CLASS_ID_STORAGE_KEY, selectedClassId?.trim() || '');
  }, [selectedClassId]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const appendEvent = useCallback((label, payload = {}) => {
    setEvents((prev) => [{ id: `${Date.now()}-${Math.random()}`, label, timestamp: new Date().toISOString(), payload }, ...prev].slice(0, 120));
  }, []);

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

  const processParticipationSignal = useCallback(async ({
    participantName,
    participantId,
    signal,
    reactionEmoji,
    reactionUnicode,
    reactionName,
    timestamp,
    source,
    rawEvent,
    eventData,
    pipeline = 'reaction',
  }) => {
    if (!sessionRef.current?.id) return;

    const resolvedParticipant = await resolveParticipantIdentityAsync(participantId, participantName);
    if (isSelfParticipant(resolvedParticipant.id, resolvedParticipant.name)) return;

    const handAction =
      detectHandFeedbackAction(signal, source) ||
      detectHandFeedbackActionFromRawEvent(rawEvent);

    // Feedback reaction pipeline is dedicated to hand signals; ignore non-hand feedback noise.
    if (pipeline === 'feedback_reaction' && !handAction) {
      return;
    }

    const participantDisplayName = resolvedParticipant.name || participantName || 'Unknown participant';
    const identityKey = String(
      resolvedParticipant.id || participantId || participantDisplayName || 'unknown'
    ).trim().toLowerCase();

    const rawReaction = getRawReactionDetails({
      signal,
      reactionEmoji,
      reactionUnicode,
      reactionName,
      rawEvent,
      eventData,
    });
    const interactionType = handAction ? 'hand_raise' : 'reaction';
    const interactionValue = handAction ? handAction : rawReaction.interactionValue;
    const dedupeSignal = handAction
      ? `hand:${handAction}`
      : rawReaction.dedupeSignal;

    if (shouldBlockParticipationSignal({
      cacheRef: recentParticipationSignalsRef,
      identity: identityKey,
      dedupeSignal,
      interactionType,
      now: Date.now(),
    })) {
      return;
    }

    const eventLabel = handAction
      ? handAction === 'raised'
        ? (pipeline === 'feedback_reaction' ? 'Hand Raissed' : 'Hand raised')
        : (pipeline === 'feedback_reaction' ? 'Hand lowered (feedback reaction)' : 'Hand lowered')
      : `Reacted ${rawReaction.displayValue}`;

    appendEvent(eventLabel, {
      participantName: participantDisplayName,
      reaction: handAction
        ? handAction === 'raised' ? '✋' : '⬇'
        : rawReaction.displayValue,
    });

    await sendLiveEvent('participation:logged', {
      interactionType,
      interactionValue,
      studentName: participantDisplayName,
      metadata: {
        participant_name: participantDisplayName,
        participant_id: resolvedParticipant.id || participantId || null,
        reaction: handAction ? null : interactionValue,
        reactionEmoji: handAction ? null : rawReaction.emoji,
        reactionUnicode: handAction ? null : rawReaction.unicode,
        reactionName: handAction ? null : rawReaction.name,
        handAction: handAction || null,
        source: 'zoom_sdk',
        source_listener: source || (pipeline === 'feedback_reaction' ? 'onFeedbackReaction' : 'onReaction'),
        source_event_id: buildSourceEventId(handAction ? 'feedbackreaction' : 'reaction'),
        feedback_signal: pipeline === 'feedback_reaction' ? (String(signal || '').trim() || null) : null,
      },
      occurredAt: timestamp || new Date().toISOString(),
    });
  }, [appendEvent, isSelfParticipant, resolveParticipantIdentityAsync, sendLiveEvent]);

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

    const runSingleInitAttempt = async () => Promise.race([
      initZoomSdkBridge({
        onReaction: async ({ participantName, participantId, reaction, reactionEmoji, reactionUnicode, reactionName, timestamp, source, rawEvent, eventData }) => {
          await processParticipationSignal({
            participantName,
            participantId,
            signal: reaction,
            reactionEmoji,
            reactionUnicode,
            reactionName,
            timestamp,
            source,
            rawEvent,
            eventData,
            pipeline: 'reaction',
          });
        },
        onFeedbackReaction: async ({ participantName, participantId, feedback, reactionEmoji, reactionUnicode, reactionName, timestamp, source, rawEvent, eventData }) => {
          await processParticipationSignal({
            participantName,
            participantId,
            signal: feedback,
            reactionEmoji,
            reactionUnicode,
            reactionName,
            timestamp,
            source,
            rawEvent,
            eventData,
            pipeline: 'feedback_reaction',
          });
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
        if (zoomInit?.error) {
          setError(zoomInit.error);
        }
        return;
      }

      setStatus('Zoom SDK initialized');

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
  }, [appendEvent, isDuplicateLifecycleEvent, isSelfParticipant, processParticipationSignal, removeKnownParticipant, resolveParticipantIdentityAsync, sendLiveEvent, upsertKnownParticipant]);

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
    setStatus('Applying token and resolving account...');
    setToken(cleaned);
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
    if (sessionRef.current?.id) {
      setSession(sessionRef.current);
      setStatus('Tracking active in Zoom iframe bridge');
      return;
    }

    if (!token) {
      setError('Missing token. Provide ?token=... in iframe URL or send token via postMessage.');
      return;
    }

    const hasMeetingContext = Boolean(
      zoomState?.data?.meetingUuid?.meetingUUID ||
      zoomState?.data?.meetingJoinUrl?.joinUrl
    );

    if (!hasMeetingContext) {
      setError('Please join a Zoom meeting before starting tracking.');
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
      const selectedClass = classes.find((cls) => cls.id === selectedClassId) || null;

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

      if (rememberMeetingLink) {
        try {
          await zoomIframeAPI.addClassLink(token, selectedClassId, {
            link_url: meetingLink,
            link_type: 'zoom',
            label: buildClassLinkLabel(selectedClass, meetingLink),
            is_primary: true,
          });
          appendEvent('Meeting link saved to class', {
            classId: selectedClassId,
            meetingLink,
          });
        } catch (linkSaveError) {
          appendEvent('Meeting link save failed', {
            classId: selectedClassId,
            reason: linkSaveError?.message || 'Unknown error',
          });
        }
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
          });
        });

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

        knownParticipantsRef.current = buildKnownParticipantsMap(currentParticipants);
      } catch (pollError) {
        // Poll failures are non-fatal; keep bridge running.
      }
    };

    pollParticipants();
    const intervalId = window.setInterval(pollParticipants, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [appendEvent, isDuplicateLifecycleEvent, isSelfParticipant, sendLiveEvent, session?.id, zoomState?.data?.zoomSdk]);

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
          return true;
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      return false;
    };

    const boot = async () => {
      setStatus('Waiting for Zoom context to be ready...');
      const contextReady = await waitForZoomContext();

      if (!mounted) return;

      if (!contextReady) {
        setStatus('Initialization timed out waiting for Zoom context. Click "Retry Init" to try again.');
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
  }, [initializeZoomSdk]);

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
    if (!token) {
      setTokenAccount(null);
      setIsResolvingTokenAccount(false);
      return;
    }

    let mounted = true;

    const resolveTokenAccount = async () => {
      setIsResolvingTokenAccount(true);

      try {
        const response = await zoomIframeAPI.verifyTokenIdentity(token);
        if (!mounted) return;

        const resolvedUser = response?.data?.user || null;
        if (!resolvedUser) {
          setTokenAccount(null);
          return;
        }

        setTokenAccount({
          first_name: resolvedUser.first_name || '',
          last_name: resolvedUser.last_name || '',
          email: resolvedUser.email || '',
        });
      } catch {
        if (!mounted) return;
        setTokenAccount(null);
      } finally {
        if (mounted) {
          setIsResolvingTokenAccount(false);
        }
      }
    };

    resolveTokenAccount();

    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || session?.id) return;

    let mounted = true;

    const normalizedCurrentMeetingLink = normalizeMeetingUrl(
      (meetingLinkOverride || getMeetingLinkFromZoomInit(zoomState?.data || {})) || ''
    ).toLowerCase();

    const hydrateExistingSession = async () => {
      try {
        const response = await zoomIframeAPI.getActiveSessions(token);
        if (!mounted) return;

        const activeSessions = Array.isArray(response?.data) ? response.data : [];
        if (activeSessions.length === 0) return;

        let matchingSession = null;

        if (normalizedCurrentMeetingLink) {
          matchingSession = activeSessions.find((candidate) =>
            normalizeMeetingUrl(candidate?.meeting_link || '').toLowerCase() === normalizedCurrentMeetingLink
          ) || null;
        }

        if (!matchingSession && selectedClassId) {
          matchingSession = activeSessions.find((candidate) => candidate?.class_id === selectedClassId) || null;
        }

        if (!matchingSession && activeSessions.length === 1) {
          matchingSession = activeSessions[0];
        }

        if (!matchingSession) return;

        setSession(matchingSession);
        suppressInitialPollDiffRef.current = true;
        if (matchingSession.class_id) {
          setSelectedClassId((prev) => prev || matchingSession.class_id);
        }

        try {
          const attendanceResponse = await zoomIframeAPI.getSessionAttendanceWithIntervals(token, matchingSession.id);
          const attendanceRecords = Array.isArray(attendanceResponse?.data?.attendance)
            ? attendanceResponse.data.attendance
            : [];
          const restoredParticipants = getCurrentParticipantsFromAttendance(attendanceRecords);

          knownParticipantsRef.current = buildKnownParticipantsMap(restoredParticipants);
          recentLifecycleRef.current = new Map();
        } catch {
          clearKnownParticipants();
        }

        setStatus('Resumed active tracking session');

        if (hydratedSessionIdRef.current !== matchingSession.id) {
          hydratedSessionIdRef.current = matchingSession.id;
          appendEvent('Session resumed', {
            sessionId: matchingSession.id,
            source: 'active-session-hydration',
          });
        }
      } catch {
        // Silent fail: hydration is best-effort and should not block normal flow.
      }
    };

    hydrateExistingSession();

    return () => {
      mounted = false;
    };
  }, [appendEvent, clearKnownParticipants, meetingLinkOverride, selectedClassId, session?.id, token, zoomState?.data]);

  useEffect(() => {
    if (!getAutoStart()) return;
    const hasMeetingContext = Boolean(
      zoomState?.data?.meetingUuid?.meetingUUID ||
      zoomState?.data?.meetingJoinUrl?.joinUrl
    );
    if (!hasMeetingContext || !selectedClassId || !token || session?.id || isLoading) return;

    handleStartSession();
  }, [selectedClassId, token, zoomState?.data?.meetingUuid?.meetingUUID, zoomState?.data?.meetingJoinUrl?.joinUrl, session?.id, isLoading]);

  const classOptions = useMemo(
    () =>
      classes.map((cls) => ({
        id: cls.id,
        label: [cls.section, cls.subject, cls.name].filter(Boolean).join(' - '),
      })),
    [classes]
  );

  const hasToken = Boolean(token?.trim());
  const tokenAccountLabel = tokenAccount
    ? getAccountDisplayName(tokenAccount)
    : '';
  const tokenAccountSummary = tokenAccount?.email
    ? `${tokenAccountLabel} (${tokenAccount.email})`
    : tokenAccountLabel;
  const tokenAccountEmail = tokenAccount?.email || '';
  const compactEvents = useMemo(() => events.slice(0, 30), [events]);
  const sdkReady = zoomState.initialized;
  const trackingActive = Boolean(session?.id);
  const meetingDetected = Boolean(
    zoomState?.data?.meetingUuid?.meetingUUID ||
    zoomState?.data?.meetingJoinUrl?.joinUrl
  );
  const statusTone = error
    ? 'error'
    : trackingActive
      ? 'tracking'
      : !sdkReady
        ? 'connecting'
        : meetingDetected
          ? 'ready'
          : 'waiting';
  const statusLabel = error
    ? 'Disconnected'
    : trackingActive
      ? 'Tracking Live'
      : !sdkReady
        ? 'Connecting to Zoom...'
        : meetingDetected
          ? 'Ready to Start'
          : 'Waiting for Meeting';
  const flowHint = trackingActive
    ? 'Tracking is active. Class selection is locked until you stop.'
    : !meetingDetected
      ? 'Please join a Zoom meeting to begin tracking.'
      : 'Meeting detected. Select your class and start tracking.';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={heroLogo} alt="Engagium Logo" className="h-8 w-auto" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 tracking-tight leading-none">Engagium</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasToken && (
                <div className="hidden sm:block text-[11px] text-gray-500 max-w-[220px] truncate">
                  {isResolvingTokenAccount
                    ? 'Verifying account...'
                    : tokenAccountEmail || tokenAccountSummary || 'Account unavailable'}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1 ${showAdvanced ? 'text-accent-700 bg-accent-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                aria-label="Toggle advanced options"
                title={showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
              >
                <Cog6ToothIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRetryInit}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                aria-label="Reconnect Zoom SDK"
                title="Reconnect"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {(!hasToken || showTokenEditor) && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste extension token"
                  />
                  <button
                    className="rounded-lg bg-accent-500 hover:bg-accent-600 text-white px-3 py-2 text-sm font-medium disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1"
                    onClick={handleApplyToken}
                    disabled={isLoading}
                  >
                    {hasToken ? 'Update Token' : 'Apply Token'}
                  </button>
                </div>
                {hasToken && (
                  <button
                    type="button"
                    onClick={() => setShowTokenEditor(false)}
                    className="mt-2 text-[11px] text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1 rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      statusTone === 'error'
                        ? 'bg-red-500'
                        : statusTone === 'tracking' || statusTone === 'ready'
                          ? 'bg-green-500'
                          : 'bg-amber-500'
                    } ${trackingActive ? 'animate-pulse' : ''}`}
                  />
                  <div className="text-xs font-semibold text-gray-800">{statusLabel}</div>
                </div>
                {hasToken && !showTokenEditor && (
                  <button
                    type="button"
                    onClick={() => setShowTokenEditor(true)}
                    className="text-[11px] text-accent-600 hover:text-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1 rounded"
                  >
                    Change Token
                  </button>
                )}
              </div>
              <div className="text-[11px] text-gray-600 mt-1">{flowHint}</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2.5">
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={trackingActive || isLoading || !meetingDetected}
              >
                <option value="">Select class</option>
                {classOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>

              {!trackingActive && meetingDetected && selectedClassId && (
                <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={rememberMeetingLink}
                    onChange={(event) => setRememberMeetingLink(event.target.checked)}
                    className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                    disabled={trackingActive || isLoading}
                  />
                  Remember this meeting link for future sessions
                </label>
              )}

              {!trackingActive ? (
                <button
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white px-3 py-2.5 text-sm font-semibold disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1"
                  onClick={handleStartSession}
                  disabled={isLoading || !selectedClassId || !token || !meetingDetected}
                >
                  <PlayCircleIcon className="w-4 h-4" />
                  Start Tracking
                </button>
              ) : (
                <button
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-2.5 text-sm font-semibold disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  onClick={handleEndSession}
                  disabled={isLoading}
                >
                  <StopCircleIcon className="w-4 h-4" />
                  Stop Tracking
                </button>
              )}
            </div>

            {showAdvanced && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1"
                    placeholder="Meeting link override"
                    value={meetingLinkOverride}
                    onChange={(e) => setMeetingLinkOverride(e.target.value)}
                    disabled={trackingActive || isLoading}
                  />
                  <button
                    className="rounded-lg border border-accent-300 bg-accent-50 hover:bg-accent-100 text-accent-800 px-3 py-2 text-sm font-medium disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1"
                    onClick={handleRefreshClasses}
                    disabled={isLoading || !token}
                  >
                    Refresh Classes
                  </button>
                </div>
              </div>
            )}

            {(error || trackingActive) && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  {error ? (
                    <ExclamationCircleIcon className="w-4 h-4 text-red-600 mt-0.5" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5" />
                  )}
                  <div className="text-xs text-gray-700">{error || status}</div>
                </div>
              </div>
            )}

            {trackingActive && (
              <div className="text-[11px] text-gray-500">
                Session ID: <span className="font-mono text-gray-700">{session.id}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-accent-100 rounded-lg">
                <SignalIcon className="w-4 h-4 text-accent-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Activity Log</h2>
              </div>
            </div>
            <span className="text-[11px] text-gray-500">{events.length} events</span>
          </div>
          <div className="max-h-72 overflow-auto divide-y divide-gray-100 px-4 py-1">
            {compactEvents.length === 0 ? (
              <div className="text-sm text-gray-500 py-8 text-center">No events yet.</div>
            ) : (
              compactEvents.map((event) => (
                <div key={event.id} className="py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-semibold text-gray-800 truncate">{event.label}</div>
                    <div className="text-[11px] text-gray-500 whitespace-nowrap">{formatTime(event.timestamp)}</div>
                  </div>
                  {getEventSummaryText(event) && (
                    <div className="text-[11px] text-gray-600 mt-1 line-clamp-2">
                      {getEventSummaryText(event)}
                    </div>
                  )}
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
