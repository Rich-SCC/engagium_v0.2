import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zoomIframeAPI } from '@/services/zoomIframeApi';
import { initZoomSdkBridge } from '@/services/zoomSdkBridge';

const getTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('token') ||
    params.get('extensionToken') ||
    params.get('xExtensionToken') ||
    ''
  );
};

const getInitialClassId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('classId') || '';
};

const getInitialMeetingLink = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('meetingLink') || '';
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

function ZoomIframeBridge() {
  const [token, setToken] = useState(getTokenFromUrl());
  const [tokenInput, setTokenInput] = useState(getTokenFromUrl());
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
  const [showStepTracer, setShowStepTracer] = useState(true);
  const [mockMode] = useState(getMockMode());
  const [mockParticipantName, setMockParticipantName] = useState('Mock Student');
  const [mockParticipantId, setMockParticipantId] = useState('mock-participant-001');
  const [mockIsMuted, setMockIsMuted] = useState(true);
  const tokenRef = useRef(token);
  const sessionRef = useRef(session);
  const sdkBootStartedRef = useRef(false);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const appendEvent = (label, payload = {}) => {
    setEvents((prev) => [{ id: `${Date.now()}-${Math.random()}`, label, timestamp: new Date().toISOString(), payload }, ...prev].slice(0, 120));
  };

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
    setStatus(`Zoom SDK: ${normalized.message}`);
  }, []);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const stepTracerEntries = useMemo(() => {
    const interestingPrefixes = [
      'init-start',
      'init-attempt',
      'init-retry-wait',
      'init-failed',
      'sdk-package',
      'sdk-load',
      'sdk-ready',
      'sdk-fallback',
      'sdk-script',
      'sdk-global',
      'config-phase',
      'config-attempt',
      'config-call',
      'config-success',
      'config-failed',
      'config-negotiate',
      'config-retry',
      'listener-register',
      'context-phase',
      'context-fetch',
    ];
    return sdkDebug.filter((entry) =>
      interestingPrefixes.some((prefix) => String(entry.phase || '').startsWith(prefix))
    );
  }, [sdkDebug]);

  const resolveMeetingLink = async (zoomInitResult) => {
    if (meetingLinkOverride) return meetingLinkOverride;

    const joinUrl = zoomInitResult?.meetingJoinUrl?.joinUrl;
    if (joinUrl) return joinUrl;

    const meetingUuid = zoomInitResult?.meetingUuid?.meetingUUID;
    if (meetingUuid) return `zoom://meeting/${meetingUuid}`;

    throw new Error('Unable to resolve meeting link. Pass meetingLink in query or grant Zoom context access.');
  };

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

  const initializeZoomBridge = useCallback(async ({ allowUnmountGuard = true, sourceLabel = 'init' } = {}) => {
    const zoomInit = await initZoomSdkBridge({
      onDebug: (entry) => {
        appendSdkDebug(entry);
      },
      onParticipantJoined: async ({ participantName, participantId, timestamp }) => {
        if (!sessionRef.current?.id) return;
        appendEvent('Participant joined', { participantName });

        await sendLiveEvent('participant:joined', {
          participant: {
            id: participantId,
            name: participantName,
            joinedAt: timestamp,
          },
        });
      },
      onParticipantLeft: async ({ participantName, participantId, timestamp }) => {
        if (!sessionRef.current?.id) return;
        appendEvent('Participant left', { participantName });

        await sendLiveEvent('participant:left', {
          participantId,
          participant_name: participantName,
          leftAt: timestamp,
        });
      },
      onReaction: async ({ participantName, participantId, reaction, sourceEventId, timestamp }) => {
        if (!sessionRef.current?.id) return;
        appendEvent('Reaction', { participantName, reaction });

        await sendLiveEvent('participation:logged', {
          interactionType: 'reaction',
          interactionValue: reaction,
          studentName: participantName,
          metadata: {
            participant_name: participantName,
            participant_id: participantId,
            reaction,
            source: 'zoom_sdk',
            source_event_id: sourceEventId,
          },
          timestamp,
        });
      },
      onMicToggle: async ({ participantName, participantId, isMuted, sourceEventId, timestamp }) => {
        if (!sessionRef.current?.id) return;
        appendEvent('Mic toggle', { participantName, isMuted });

        await sendLiveEvent('participation:logged', {
          interactionType: 'mic_toggle',
          interactionValue: isMuted ? 'muted' : 'unmuted',
          studentName: participantName,
          metadata: {
            participant_name: participantName,
            participant_id: participantId,
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
    });

    if (!allowUnmountGuard) {
      return zoomInit;
    }

    setZoomState({ initialized: zoomInit.initialized, data: zoomInit });

    if (!zoomInit.initialized) {
      setStatus('Zoom SDK initialization failed. Click "Retry Init" to try again.');
      setSdkPhase('init-failed');
      if (zoomInit.error) {
        setError(zoomInit.error);
      }
      return zoomInit;
    }

    setStatus('Zoom SDK initialized');
    setSdkPhase('initialized');
    appendEvent(`Zoom SDK initialized (${sourceLabel})`, {
      runningContext: zoomInit?.runningContext?.runningContext,
      meetingUUID: zoomInit?.meetingUuid?.meetingUUID,
    });

    return zoomInit;
  }, [appendSdkDebug, appendEvent, sendLiveEvent]);

  const handleRetryInit = useCallback(async () => {
    setError('');
    setStatus('Retrying Zoom SDK initialization...');
    setSdkDebug([]);
    setSdkPhase('idle');
    sdkBootStartedRef.current = false;

    await initializeZoomBridge({ sourceLabel: 'retry' });
  }, [initializeZoomBridge]);

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
      setStatus('Tracking active in Zoom iframe bridge');
      appendEvent('Session started', { sessionId: createdSession.id, meetingLink });

      await sendLiveEvent('session:extension_connected', {
        sessionId: createdSession.id,
        source: 'zoom_iframe_bridge',
      }, createdSession.id);

      const initialParticipants = zoomState?.data?.meetingParticipants?.participants || [];
      for (const participant of initialParticipants) {
        const participantName = participant?.screenName || participant?.displayName || participant?.participantUUID;
        if (!participantName) continue;

        await sendLiveEvent('participant:joined', {
          participant: {
            id: participant?.participantUUID || null,
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
    setSession(null);
    setStatus('Tracking stopped (mock end)');
  };

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

      setStatus('Initializing Zoom SDK...');

      const maxInitAttempts = 5;
      const delayBetweenAttemptsMs = 1200;
      let lastAttempt = null;

      for (let attempt = 1; attempt <= maxInitAttempts; attempt += 1) {
        appendSdkDebug({
          phase: 'init-attempt',
          message: `Running sequential SDK init attempt ${attempt}/${maxInitAttempts}`,
          meta: { attempt, maxInitAttempts },
        });

        lastAttempt = await initializeZoomBridge({
          allowUnmountGuard: false,
          sourceLabel: `initial-attempt-${attempt}`,
        });

        if (!mounted) return;

        setZoomState({ initialized: lastAttempt.initialized, data: lastAttempt });

        if (lastAttempt.initialized) {
          setStatus('Zoom SDK initialized');
          setSdkPhase('initialized');
          appendEvent(`Zoom SDK initialized (initial attempt ${attempt})`, {
            runningContext: lastAttempt?.runningContext?.runningContext,
            meetingUUID: lastAttempt?.meetingUuid?.meetingUUID,
          });
          return;
        }

        if (attempt < maxInitAttempts) {
          appendSdkDebug({
            phase: 'init-retry-wait',
            message: 'SDK init attempt failed; waiting before next sequential attempt',
            level: 'warn',
            meta: {
              attempt,
              maxInitAttempts,
              delayMs: delayBetweenAttemptsMs,
              error: lastAttempt?.error || null,
            },
          });

          await wait(delayBetweenAttemptsMs);
          if (!mounted) return;
        }
      }

      setStatus('Zoom SDK initialization failed after sequential attempts. Click "Retry Init" to try again.');
      setSdkPhase('init-failed');
      if (lastAttempt?.error) {
        setError(lastAttempt.error);
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, [appendSdkDebug, appendEvent, initializeZoomBridge]);

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
                <div className="text-sm font-medium">SDK Init Debug Timeline</div>
                <div className="text-xs text-slate-500 mt-0.5">Latest 80 checkpoints from script load, config, and context fetch.</div>
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

            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-700">Step Tracer</div>
                <div className="text-[11px] text-slate-500">Focused view of package load, config, listener, and context steps.</div>
              </div>
              <button
                className="text-xs rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                onClick={() => setShowStepTracer((prev) => !prev)}
                type="button"
              >
                {showStepTracer ? 'Hide tracer' : 'Show tracer'}
              </button>
            </div>

            {showStepTracer && (
              <div className="mt-2 rounded border border-cyan-200 bg-cyan-50/40 p-2 max-h-44 overflow-auto">
                {stepTracerEntries.length === 0 ? (
                  <div className="text-xs text-slate-500 p-2">No traced steps yet.</div>
                ) : (
                  stepTracerEntries.map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between gap-3 border-b border-cyan-100 py-2 last:border-b-0">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-cyan-800">{formatDebugLabel(entry.phase)}</div>
                        <div className="text-[11px] text-slate-700 mt-0.5">{entry.message}</div>
                        {entry.meta && Object.keys(entry.meta).length > 0 && (
                          <pre className="text-[10px] mt-1 bg-white/80 border border-cyan-100 rounded p-2 overflow-auto">
                            {JSON.stringify(entry.meta, null, 2)}
                          </pre>
                        )}
                      </div>
                      <div className="shrink-0 text-[11px] text-slate-500 whitespace-nowrap">{formatTime(entry.timestamp)}</div>
                    </div>
                  ))
                )}
              </div>
            )}

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
