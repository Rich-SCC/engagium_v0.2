import React, { useRef, useEffect, useMemo } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import {
  ChatBubbleLeftIcon,
  HandRaisedIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  SparklesIcon,
  UserPlusIcon,
  UserMinusIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const LiveEventFeed = () => {
  const { recentEvents, clearEvents, isLoadingRecentEvents } = useWebSocket();
  const feedRef = useRef(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  const formatSpeakingDuration = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${minutes}m`;
    return `${minutes}m ${secs}s`;
  };

  const getParticipantName = (event) =>
    event.participant_name || event.student_name || event.full_name || 'Unknown participant';

  const getEventMetadata = (event) => {
    if (event.metadata && typeof event.metadata === 'object') {
      return event.metadata;
    }

    if (event.additional_data && typeof event.additional_data === 'object') {
      return event.additional_data;
    }

    if (typeof event.additional_data === 'string') {
      try {
        return JSON.parse(event.additional_data);
      } catch {
        return {};
      }
    }

    return {};
  };

  const normalizeSignalText = (value) => String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

  const REACTION_TO_EMOJI = {
    joy: '😂',
    laugh: '😂',
    openmouth: '😮',
    wow: '😮',
    heart: '❤️',
    clap: '👏',
    thumbsup: '👍',
    thumbsdown: '👎',
    tada: '🎉',
    fire: '🔥',
    yes: '✅',
    no: '❌',
  };

  const toReactionEmoji = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return REACTION_TO_EMOJI[normalizeSignalText(raw)] || raw;
  };

  const getReactionEmoji = (event) =>
    toReactionEmoji(getEventMetadata(event).reaction || event.interaction_value || event.reaction || '');

  const displayEvents = useMemo(() => {
    const chronological = [...recentEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const pendingMicStarts = new Map();
    const rows = [];

    chronological.forEach((event) => {
      const metadata = getEventMetadata(event);

      if (event.type !== 'mic_toggle' && event.interaction_type !== 'mic_toggle') {
        const reaction = event.type === 'reaction' ? getReactionEmoji(event) : '';
        rows.push({
          ...event,
          displayMessage: reaction && event.message && !event.message.endsWith(reaction)
            ? `${event.message} ${reaction}`
            : event.message
        });
        return;
      }

      const participantName = getParticipantName(event).trim().toLowerCase();
      const sessionId = event.session_id || '';
      const micKey = `${sessionId}:${participantName}`;
      const isMuted = typeof metadata.isMuted === 'boolean'
        ? metadata.isMuted
        : null;
      const speakingLabel = metadata.speakingDurationLabel || formatSpeakingDuration(
        Number(metadata.speakingDurationSeconds || event.duration_seconds)
      );

      if (isMuted === false) {
        pendingMicStarts.set(micKey, { ...event, metadata });
        return;
      }

      if (isMuted === true && pendingMicStarts.has(micKey)) {
        const startEvent = pendingMicStarts.get(micKey);
        const startTime = new Date(startEvent.timestamp).getTime();
        const endTime = new Date(event.timestamp).getTime();
        const computedSeconds = Number.isFinite(startTime) && Number.isFinite(endTime) && endTime >= startTime
          ? Math.round((endTime - startTime) / 1000)
          : null;
        const durationSeconds = Number(event.duration_seconds ?? metadata.speakingDurationSeconds) || computedSeconds;
        const durationLabel = speakingLabel || formatSpeakingDuration(durationSeconds);

        rows.push({
          ...event,
          type: 'speaking_session',
          displayMessage: durationLabel
            ? `${getParticipantName(event)} spoke for ${durationLabel}`
            : `${getParticipantName(event)} spoke`,
          duration_seconds: durationSeconds,
          metadata: {
            ...metadata,
            speakingAction: 'stop',
            speakingDurationSeconds: durationSeconds,
            speakingDurationLabel: durationLabel,
            speakingStartedAt: startEvent.timestamp,
            speakingEndedAt: event.timestamp
          }
        });

        pendingMicStarts.delete(micKey);
        return;
      }

      rows.push({
        ...event,
        metadata,
        displayMessage: isMuted === false
          ? `${getParticipantName(event)} mic on`
          : event.message
      });
    });

    pendingMicStarts.forEach((event) => {
      rows.push({
        ...event,
        metadata: getEventMetadata(event),
        displayMessage: `${getParticipantName(event)} mic on`
      });
    });

    return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [recentEvents]);

  // Auto-scroll to top when new events arrive (latest events are at the top)
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [recentEvents, autoScroll]);

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    // Enable auto-scroll if user scrolls to top, disable otherwise
    setAutoScroll(scrollTop < 100);
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'chat':
        return <ChatBubbleLeftIcon className="w-5 h-5" />;
      case 'hand_raise':
        return <HandRaisedIcon className="w-5 h-5" />;
      case 'mic_toggle':
        return <MicrophoneIcon className="w-5 h-5" />;
      case 'speaking_session':
        return <MicrophoneIcon className="w-5 h-5" />;
      case 'camera_toggle':
        return <VideoCameraIcon className="w-5 h-5" />;
      case 'reaction':
        return <FaceSmileIcon className="w-5 h-5" />;
      case 'participation':
        return <ChatBubbleLeftIcon className="w-5 h-5" />;
      case 'attendance':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'participant_joined':
        return <UserPlusIcon className="w-5 h-5" />;
      case 'participant_left':
        return <UserMinusIcon className="w-5 h-5" />;
      case 'session_started':
        return <SparklesIcon className="w-5 h-5" />;
      case 'session_ended':
        return <VideoCameraIcon className="w-5 h-5" />;
      default:
        return <ChatBubbleLeftIcon className="w-5 h-5" />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'chat':
        return 'bg-blue-100 text-blue-600';
      case 'hand_raise':
        return 'bg-sky-100 text-sky-600';
      case 'mic_toggle':
        return 'bg-indigo-100 text-indigo-600';
      case 'speaking_session':
        return 'bg-indigo-100 text-indigo-600';
      case 'camera_toggle':
        return 'bg-pink-100 text-pink-600';
      case 'reaction':
        return 'bg-yellow-100 text-yellow-600';
      case 'participation':
        return 'bg-blue-100 text-blue-600';
      case 'attendance':
        return 'bg-green-100 text-green-600';
      case 'participant_joined':
        return 'bg-emerald-100 text-emerald-600';
      case 'participant_left':
        return 'bg-orange-100 text-orange-600';
      case 'session_started':
        return 'bg-purple-100 text-purple-600';
      case 'session_ended':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatInteractionType = (type) => {
    if (!type) return '';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-100 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-accent-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Live Activity Feed</h2>
            <p className="text-sm text-gray-500">Real-time participation events</p>
          </div>
        </div>
        
        {recentEvents.length > 0 && (
          <button
            onClick={clearEvents}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="h-96 overflow-y-auto p-4 space-y-3"
      >
        {isLoadingRecentEvents && recentEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
                <SparklesIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Loading recent activity...</p>
            </div>
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No activity yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Events will appear here as they happen
              </p>
            </div>
          </div>
        ) : (
          <>
            {displayEvents.map((event, index) => (
              <div
                key={event.id || index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition animate-fadeIn"
              >
                <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                  {getEventIcon(event.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900 font-medium truncate">
                      {event.displayMessage || event.message}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  
                  {event.interaction_type && (
                    <p className="text-xs text-gray-600 mt-1">
                      {formatInteractionType(event.interaction_type)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {!autoScroll && (
              <div className="sticky top-0 left-0 right-0 py-2 text-center">
                <button
                  onClick={() => {
                    setAutoScroll(true);
                    if (feedRef.current) {
                      feedRef.current.scrollTop = 0;
                    }
                  }}
                  className="px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 transition shadow-lg"
                >
                  Scroll to Latest
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LiveEventFeed;
