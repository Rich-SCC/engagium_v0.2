import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '@/contexts/WebSocketContext';
import {
  VideoCameraIcon,
  UserGroupIcon,
  ClockIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

const ActiveSessionCard = () => {
  const { activeSessions, isConnected } = useWebSocket();
  const [durations, setDurations] = useState({});

  // Update session durations every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newDurations = {};
      activeSessions.forEach(session => {
        if (session.started_at) {
          const startTime = new Date(session.started_at);
          const now = new Date();
          const seconds = Math.floor((now - startTime) / 1000);
          newDurations[session.session_id] = formatDuration(seconds);
        }
      });
      setDurations(newDurations);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSessions]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-100 rounded-lg">
            <VideoCameraIcon className="w-6 h-6 text-accent-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
            <p className="text-sm text-gray-500">Currently tracking in real-time</p>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <SignalIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start tracking a meeting using the browser extension
            </p>
            <Link
              to="/app/classes"
              className="inline-block px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition text-sm font-medium"
            >
              Manage Classes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div
                key={session.session_id}
                className="border border-gray-200 rounded-lg p-4 hover:border-accent-300 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {session.class_name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{durations[session.session_id] || '0s'}</span>
                      </div>
                      {session.participant_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <UserGroupIcon className="w-4 h-4" />
                          <span>{session.participant_count} participants</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Live
                    </span>
                  </div>
                </div>
                
                <Link
                  to={`/app/sessions/${session.session_id}`}
                  className="block w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSessionCard;
