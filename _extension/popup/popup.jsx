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

  // Load session status on mount
  useEffect(() => {
    loadSessionStatus();
    
    // Refresh every 2 seconds
    const interval = setInterval(loadSessionStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);

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
