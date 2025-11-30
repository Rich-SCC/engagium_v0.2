/**
 * Popup React App
 * Main popup interface for the extension
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MESSAGE_TYPES, SESSION_STATUS } from '../utils/constants.js';
import { formatTime, formatDuration, secondsToDuration } from '../utils/date-utils.js';
import './popup.css';

function PopupApp() {
  const [sessionStatus, setSessionStatus] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // Meeting detection state
  const [meetingDetected, setMeetingDetected] = useState(null); // { meeting_id, platform, mapped_class_id, mapped_class_name }
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [rememberMeetingLink, setRememberMeetingLink] = useState(true); // Default to saving link

  // Load session status on mount
  useEffect(() => {
    loadSessionStatus();
    loadMeetingDetectionStatus();
    
    // Only refresh every 10 seconds for status updates (reduced from 2s)
    // Most updates will come from user actions
    const interval = setInterval(() => {
      loadSessionStatus();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Load meeting detection status
  async function loadMeetingDetectionStatus() {
    try {
      const response = await sendMessage(MESSAGE_TYPES.GET_MEETING_STATUS);
      if (response.success && response.data) {
        setMeetingDetected(response.data.meeting);
        setAvailableClasses(response.data.classes || []);
        
        // Pre-select mapped class if exists
        if (response.data.meeting?.mapped_class_id) {
          setSelectedClassId(response.data.meeting.mapped_class_id);
        }
      }
    } catch (err) {
      console.error('Error loading meeting status:', err);
    }
  }

  // Update session duration timer
  useEffect(() => {
    if (sessionStatus?.status === SESSION_STATUS.ACTIVE && sessionStatus.session) {
      const timer = setInterval(() => {
        const startTime = new Date(sessionStatus.session.started_at);
        const now = new Date();
        const seconds = Math.floor((now - startTime) / 1000);
        setSessionDuration(seconds);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [sessionStatus]);

  async function loadSessionStatus() {
    try {
      const response = await sendMessage(MESSAGE_TYPES.GET_SESSION_STATUS);
      
      if (response.success) {
        setSessionStatus(response.data);
        
        // Load participants if session is active
        if (response.data.session) {
          loadParticipants(response.data.session.id);
        }
        
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }

  async function loadParticipants(sessionId) {
    try {
      const response = await sendMessage(MESSAGE_TYPES.GET_PARTICIPANTS, { sessionId });
      
      if (response.success) {
        setParticipants(response.data);
      }
    } catch (err) {
      console.error('Error loading participants:', err);
    }
  }

  async function handleEndSession() {
    if (!sessionStatus?.session) return;
    
    const confirmed = confirm('End this session and submit attendance data?');
    if (!confirmed) return;
    
    try {
      setIsLoading(true);
      const response = await sendMessage(MESSAGE_TYPES.END_SESSION, {
        sessionId: sessionStatus.session.id
      });
      
      if (response.success) {
        await loadSessionStatus();
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartSession(classId) {
    if (!meetingDetected || !classId) return;
    
    try {
      setIsLoading(true);
      const response = await sendMessage(MESSAGE_TYPES.START_SESSION, {
        class_id: classId,
        meeting_id: meetingDetected.meeting_id,
        platform: meetingDetected.platform,
        save_meeting_link: rememberMeetingLink && !meetingDetected.mapped_class_id // Only save if unmapped
      });
      
      if (response.success) {
        setMeetingDetected(null); // Clear detection UI
        await loadSessionStatus();
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDismissMeeting() {
    setMeetingDetected(null);
    sendMessage(MESSAGE_TYPES.DISMISS_MEETING);
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  function sendMessage(type, data = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, ...data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  if (isLoading && !sessionStatus) {
    return (
      <div className="popup">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const isActive = sessionStatus?.status === SESSION_STATUS.ACTIVE;
  const session = sessionStatus?.session;
  const matchedCount = session?.matched_count || 0;
  const totalCount = session?.participant_count || 0;
  const unmatchedCount = totalCount - matchedCount;

  return (
    <div className="popup">
      {/* Header */}
      <div className="header">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h1>Engagium Tracker</h1>
        </div>
        <button className="icon-button" onClick={openOptions} title="Settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/>
          </svg>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Meeting Detection Banner (shows when meeting detected but no active session) */}
      {meetingDetected && !isActive && (
        <div className="meeting-detection">
          <div className="meeting-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15.5 5H21M21 5V10.5M21 5L13 13"/>
              <path d="M7 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V17"/>
            </svg>
            <div className="meeting-info">
              <h3>Meeting Detected</h3>
              <p className="meeting-platform">{meetingDetected.platform === 'google-meet' ? 'Google Meet' : meetingDetected.platform}</p>
            </div>
          </div>

          {/* Mapped Class (Auto-Track) */}
          {meetingDetected.mapped_class_id && meetingDetected.mapped_class_name && (
            <div className="meeting-action-mapped">
              <p className="mapped-label">Track attendance for:</p>
              <div className="mapped-class">{meetingDetected.mapped_class_name}</div>
              <div className="button-group">
                <button 
                  className="button button-primary"
                  onClick={() => handleStartSession(meetingDetected.mapped_class_id)}
                  disabled={isLoading}
                >
                  Start Tracking
                </button>
                <button 
                  className="button button-secondary"
                  onClick={handleDismissMeeting}
                  disabled={isLoading}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Unmapped Class (Manual Selection) */}
          {!meetingDetected.mapped_class_id && availableClasses.length > 0 && (
            <div className="meeting-action-unmapped">
              <p className="unmapped-label">Select class to track:</p>
              <select 
                className="class-selector"
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">-- Select a class --</option>
                {availableClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}{cls.section ? ` (${cls.section})` : ''}
                  </option>
                ))}
              </select>
              
              {/* Remember this meeting link checkbox */}
              {selectedClassId && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMeetingLink}
                    onChange={(e) => setRememberMeetingLink(e.target.checked)}
                  />
                  <span>Remember this meeting link for future sessions</span>
                </label>
              )}
              
              <div className="button-group">
                <button 
                  className="button button-primary"
                  onClick={() => handleStartSession(selectedClassId)}
                  disabled={isLoading || !selectedClassId}
                >
                  Start Tracking
                </button>
                <button 
                  className="button button-secondary"
                  onClick={handleDismissMeeting}
                  disabled={isLoading}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* No Classes Available */}
          {!meetingDetected.mapped_class_id && availableClasses.length === 0 && (
            <div className="meeting-action-none">
              <p className="no-classes-message">No classes found. Please create a class in the web app first.</p>
              <button 
                className="button button-secondary"
                onClick={handleDismissMeeting}
                disabled={isLoading}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Session */}
      {isActive && session ? (
        <div className="session-active">
          {/* Status Card */}
          <div className="status-card">
            <div className="status-indicator">
              <div className="status-dot active"></div>
              <span className="status-label">Tracking Active</span>
            </div>
            <div className="session-info">
              <h2>{session.class_name}</h2>
              <p className="session-meta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {secondsToDuration(sessionDuration)}
              </p>
            </div>
          </div>

          {/* Participant Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{totalCount}</div>
              <div className="stat-label">Participants</div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-value">{matchedCount}</div>
              <div className="stat-label">Matched</div>
            </div>
            {unmatchedCount > 0 && (
              <div className="stat-card stat-warning">
                <div className="stat-value">{unmatchedCount}</div>
                <div className="stat-label">Unmatched</div>
              </div>
            )}
          </div>

          {/* Recent Participants */}
          <div className="participants-section">
            <h3>Recent Joins</h3>
            <div className="participants-list">
              {participants.length === 0 ? (
                <p className="empty-state">No participants yet</p>
              ) : (
                participants.slice(0, 5).map((p) => (
                  <div key={p.id} className="participant-item">
                    <div className="participant-avatar">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="participant-info">
                      <div className="participant-name">{p.name}</div>
                      <div className="participant-meta">
                        {p.matched_student_id ? (
                          <span className="badge badge-success">Matched</span>
                        ) : (
                          <span className="badge badge-warning">Unmatched</span>
                        )}
                        <span className="participant-time">
                          {formatTime(p.joined_at)}
                        </span>
                      </div>
                    </div>
                    {p.event_count > 0 && (
                      <div className="participant-events">
                        💬 {p.event_count}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="actions">
            <button 
              className="button button-primary button-danger"
              onClick={handleEndSession}
              disabled={isLoading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
              </svg>
              End Session & Submit
            </button>
          </div>
        </div>
      ) : (
        /* Idle State */
        <div className="session-idle">
          <div className="idle-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h2>No Active Session</h2>
          <p className="idle-message">
            Join a Google Meet meeting to start tracking attendance automatically.
          </p>
          <div className="idle-tips">
            <h4>Quick Tips:</h4>
            <ul>
              <li>Make sure you're in a Google Meet call</li>
              <li>Tracking starts automatically if meeting is mapped</li>
              <li>Configure class mapping in settings</li>
            </ul>
          </div>
          <button className="button button-secondary" onClick={openOptions}>
            Open Settings
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <a href="https://engagium.app" target="_blank" rel="noopener">
          Engagium v1.0.0
        </a>
      </div>
    </div>
  );
}

// Initialize
const root = createRoot(document.getElementById('root'));
root.render(<PopupApp />);
