import React, { useRef, useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import {
  ChatBubbleLeftIcon,
  HandRaisedIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const LiveEventFeed = () => {
  const { recentEvents, clearEvents, isLoadingRecentEvents } = useWebSocket();
  const feedRef = useRef(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [recentEvents, autoScroll]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Enable auto-scroll if user scrolls to bottom, disable otherwise
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'participation':
        return <ChatBubbleLeftIcon className="w-5 h-5" />;
      case 'attendance':
        return <ArrowRightOnRectangleIcon className="w-5 h-5" />;
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
      case 'participation':
        return 'bg-blue-100 text-blue-600';
      case 'attendance':
        return 'bg-green-100 text-green-600';
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
        {isLoadingRecentEvents ? (
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
            {recentEvents.map((event, index) => (
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
                      {event.message}
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
              <div className="sticky bottom-0 left-0 right-0 py-2 text-center">
                <button
                  onClick={() => {
                    setAutoScroll(true);
                    if (feedRef.current) {
                      feedRef.current.scrollTop = feedRef.current.scrollHeight;
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
