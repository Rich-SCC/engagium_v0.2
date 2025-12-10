/**
 * Options Page React App
 * Settings and configuration for the extension
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { STORAGE_KEYS } from '../utils/constants.js';
import { formatClassDisplay } from '../utils/class-formatter.js';
import { getApiBaseUrl, verifyAuthToken, clearAuthToken } from '../utils/auth.js';
import './options.css';

function OptionsApp() {
  const [activeTab, setActiveTab] = useState('auth');
  const [authToken, setAuthToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [classes, setClasses] = useState([]);
  const [meetingMappings, setMeetingMappings] = useState({});
  const [autoStart, setAutoStart] = useState(false);
  const [matchThreshold, setMatchThreshold] = useState(0.7);
  const [autoOpenPopup, setAutoOpenPopup] = useState(false);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [showTrackingReminder, setShowTrackingReminder] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false);
  const [message, setMessage] = useState(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    
    // Listen for authentication success from callback page
    const handleMessage = (message) => {
      if (message.type === 'AUTH_SUCCESS') {
        console.log('[Options] Received AUTH_SUCCESS');
        loadSettings(); // Reload settings with new token
        showMessage('success', 'Successfully authenticated!');
      }
    };
    
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  async function loadSettings() {
    try {
      setIsVerifyingAuth(true);
      const storage = await chrome.storage.local.get([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_INFO,
        STORAGE_KEYS.MEETING_MAPPINGS,
        STORAGE_KEYS.AUTO_START,
        STORAGE_KEYS.MATCH_THRESHOLD,
        STORAGE_KEYS.AUTO_OPEN_POPUP,
        STORAGE_KEYS.SHOW_JOIN_PROMPT,
        STORAGE_KEYS.SHOW_TRACKING_REMINDER
      ]);

      if (storage[STORAGE_KEYS.AUTH_TOKEN]) {
        setAuthToken(storage[STORAGE_KEYS.AUTH_TOKEN]);
        
        // Verify token is still valid
        try {
          const result = await verifyAuthToken(storage[STORAGE_KEYS.AUTH_TOKEN]);

          if (result.valid) {
            setIsAuthenticated(true);
            
            if (result.user) {
              setUserInfo(result.user);
              // Update stored user info if it changed
              await chrome.storage.local.set({
                [STORAGE_KEYS.USER_INFO]: result.user
              });
            } else if (storage[STORAGE_KEYS.USER_INFO]) {
              setUserInfo(storage[STORAGE_KEYS.USER_INFO]);
            }
            
            // Load classes
            await loadClasses();
          } else {
            // Token invalid, clear it
            setIsAuthenticated(false);
            await clearAuthToken();
            await chrome.storage.local.remove(STORAGE_KEYS.USER_INFO);
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          // Keep existing auth state on error (might be offline)
          setIsAuthenticated(true);
          if (storage[STORAGE_KEYS.USER_INFO]) {
            setUserInfo(storage[STORAGE_KEYS.USER_INFO]);
          }
        }
      }

      setMeetingMappings(storage[STORAGE_KEYS.MEETING_MAPPINGS] || {});
      setAutoStart(storage[STORAGE_KEYS.AUTO_START] || false);
      setMatchThreshold(storage[STORAGE_KEYS.MATCH_THRESHOLD] || 0.7);
      setAutoOpenPopup(storage[STORAGE_KEYS.AUTO_OPEN_POPUP] || false);
      setShowJoinPrompt(storage[STORAGE_KEYS.SHOW_JOIN_PROMPT] || false);
      setShowTrackingReminder(storage[STORAGE_KEYS.SHOW_TRACKING_REMINDER] !== undefined ? storage[STORAGE_KEYS.SHOW_TRACKING_REMINDER] : true);

      setIsVerifyingAuth(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setIsVerifyingAuth(false);
      setIsLoading(false);
    }
  }

  async function loadClasses() {
    try {
      const response = await sendMessage('GET_CLASSES');
      if (response.success && response.data) {
        // response.data is already the classes array
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  }

  async function handleLogin() {
    try {
      const tokenInput = document.getElementById('tokenInput');
      const token = tokenInput?.value?.trim();
      
      if (!token) {
        showMessage('error', 'Please enter your extension token');
        return;
      }

      // Validate token using the new extension token verification endpoint
      const isDev = !('update_url' in chrome.runtime.getManifest());
      const baseUrl = isDev ? 'http://localhost:3001' : 'https://engagium.app';
      
      const response = await fetch(`${baseUrl}/api/extension-tokens/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!data.success) {
        showMessage('error', data.error || 'Invalid or expired token');
        return;
      }

      // Store token and user info
      await chrome.storage.local.set({
        [STORAGE_KEYS.AUTH_TOKEN]: token,
        [STORAGE_KEYS.USER_INFO]: data.data.user
      });

      setAuthToken(token);
      setIsAuthenticated(true);
      setUserInfo(data.data.user);
      
      // Load classes
      await loadClasses();
      
      showMessage('success', 'Successfully authenticated!');
      tokenInput.value = '';
    } catch (error) {
      showMessage('error', `Login failed: ${error.message}`);
    }
  }

  async function handleLogout() {
    await clearAuthToken();
    await chrome.storage.local.remove(STORAGE_KEYS.USER_INFO);
    
    setAuthToken('');
    setIsAuthenticated(false);
    setUserInfo(null);
    setClasses([]);
    showMessage('success', 'Logged out successfully');
  }

  async function handleAddMapping(meetingId, classId) {
    if (!meetingId.trim() || !classId) {
      showMessage('error', 'Please enter meeting ID and select a class');
      return;
    }

    const selectedClass = classes.find(c => c.id === classId);
    if (!selectedClass) return;

    const newMappings = {
      ...meetingMappings,
      [meetingId.trim()]: {
        class_id: selectedClass.id,
        class_name: selectedClass.name
      }
    };

    await chrome.storage.local.set({
      [STORAGE_KEYS.MEETING_MAPPINGS]: newMappings
    });

    setMeetingMappings(newMappings);
    showMessage('success', 'Mapping added successfully');
  }

  async function handleRemoveMapping(meetingId) {
    const newMappings = { ...meetingMappings };
    delete newMappings[meetingId];

    await chrome.storage.local.set({
      [STORAGE_KEYS.MEETING_MAPPINGS]: newMappings
    });

    setMeetingMappings(newMappings);
    showMessage('success', 'Mapping removed');
  }

  async function handleSavePreferences() {
    await chrome.storage.local.set({
      [STORAGE_KEYS.AUTO_START]: autoStart,
      [STORAGE_KEYS.MATCH_THRESHOLD]: matchThreshold,
      [STORAGE_KEYS.AUTO_OPEN_POPUP]: autoOpenPopup,
      [STORAGE_KEYS.SHOW_JOIN_PROMPT]: showJoinPrompt,
      [STORAGE_KEYS.SHOW_TRACKING_REMINDER]: showTrackingReminder
    });

    showMessage('success', 'Preferences saved successfully');
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

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  if (isLoading) {
    return (
      <div className="options-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="options-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <img 
              src="../assets/icons/icon128.png" 
              alt="Engagium" 
              width="64" 
              height="64"
            />
            <div>
              <h1>Engagium Extension</h1>
              <p>Attendance & Participation Tracker</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Message */}
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
            <button onClick={() => setMessage(null)}>×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'auth' ? 'active' : ''}`}
            onClick={() => setActiveTab('auth')}
          >
            Authentication
          </button>
          <button 
            className={`tab ${activeTab === 'mapping' ? 'active' : ''}`}
            onClick={() => setActiveTab('mapping')}
            disabled={!isAuthenticated}
          >
            Class Mapping
          </button>
          <button 
            className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button 
            className={`tab ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveTab('debug')}
          >
            🔧 Debug
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Authentication Tab */}
          {activeTab === 'auth' && (
            <div className="section">
              <h2>Authentication</h2>
              <p className="section-description">
                Connect your Engagium account to enable data syncing.
              </p>

              {isVerifyingAuth ? (
                <div className="card">
                  <div className="loading" style={{padding: '2rem'}}>
                    <div className="spinner"></div>
                    <p>Verifying authentication...</p>
                  </div>
                </div>
              ) : !isAuthenticated ? (
                <div className="card">
                  <h3>Connect with Engagium</h3>
                  <p className="help-text">
                    Enter your extension token from your Engagium account settings.
                  </p>
                  <div style={{marginBottom: '1rem'}}>
                    <label htmlFor="tokenInput" style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>
                      Extension Token
                    </label>
                    <input
                      id="tokenInput"
                      type="password"
                      placeholder="Paste your extension token here"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button className="button button-primary button-large" onClick={handleLogin}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{marginRight: '8px'}}>
                      <path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z" 
                            stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Connect
                  </button>
                  <div className="help-text" style={{marginTop: '1rem', fontSize: '0.85rem', color: '#666', background: '#f0f9ff', padding: '1rem', borderRadius: '6px', borderLeft: '3px solid #3b82f6'}}>
                    <strong>How to get your token:</strong>
                    <ol style={{margin: '0.5rem 0 0 1.2rem', padding: 0}}>
                      <li>Log in to Engagium web app</li>
                      <li>Go to Account Settings</li>
                      <li>Find "Extension Token" section</li>
                      <li>Click "Generate Token" and copy it</li>
                      <li>Paste it above and click Connect</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="auth-status">
                    <div className="status-icon success">✓</div>
                    <div>
                      <h3>Connected</h3>
                      <p>You are authenticated and ready to track attendance.</p>
                      {userInfo && (
                        <p className="user-email">{userInfo.email}</p>
                      )}
                    </div>
                  </div>
                  <button className="button button-secondary" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Class Mapping Tab */}
          {activeTab === 'mapping' && (
            <div className="section">
              <h2>Meeting → Class Mapping</h2>
              <p className="section-description">
                Map Google Meet meeting IDs to your classes for automatic tracking.
              </p>

              <div className="card">
                <h3>Add New Mapping</h3>
                <MappingForm 
                  classes={classes}
                  onAdd={handleAddMapping}
                />
              </div>

              <div className="card">
                <h3>Existing Mappings</h3>
                {(() => {
                  // Collect all class links from all classes
                  const classLinks = [];
                  classes.forEach(cls => {
                    if (cls.links && cls.links.length > 0) {
                      cls.links.forEach(link => {
                        classLinks.push({
                          meetingId: link.link_url,
                          className: formatClassDisplay(cls),
                          linkType: link.link_type,
                          isPrimary: link.is_primary,
                          label: link.label
                        });
                      });
                    }
                  });

                  // Show manual mappings from old system (for backward compatibility)
                  const manualMappings = Object.entries(meetingMappings).map(([meetingId, mapping]) => ({
                    meetingId,
                    className: mapping.class_name,
                    isManual: true
                  }));

                  const allMappings = [...classLinks, ...manualMappings];

                  if (allMappings.length === 0) {
                    return <p className="empty-state">No mappings yet. Add one above!</p>;
                  }

                  return (
                    <div className="mappings-list">
                      {allMappings.map((mapping, index) => (
                        <div key={`${mapping.meetingId}-${index}`} className="mapping-item">
                          <div className="mapping-info">
                            <div className="mapping-meeting">
                              {mapping.meetingId}
                              {mapping.label && <span className="mapping-label"> ({mapping.label})</span>}
                              {mapping.isPrimary && <span className="badge-primary">Primary</span>}
                            </div>
                            <div className="mapping-arrow">→</div>
                            <div className="mapping-class">{mapping.className}</div>
                          </div>
                          {mapping.isManual && (
                            <button 
                              className="button-icon-danger"
                              onClick={() => handleRemoveMapping(mapping.meetingId)}
                              title="Remove mapping"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="section">
              <h2>Preferences</h2>
              <p className="section-description">
                Customize extension behavior.
              </p>

              <div className="card">
                <h3>Tracking Behavior</h3>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={autoStart}
                      onChange={(e) => setAutoStart(e.target.checked)}
                    />
                    <span>Auto-start tracking when joining mapped meetings</span>
                  </label>
                  <p className="help-text">
                    Automatically start tracking when you join a Google Meet call that's mapped to a class.
                  </p>
                </div>

                <div className="form-group">
                  <label>Student Name Matching Threshold</label>
                  <p className="help-text">
                    How similar names must be to match (0.5 = loose, 1.0 = exact)
                  </p>
                  <div className="slider-group">
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={matchThreshold}
                      onChange={(e) => setMatchThreshold(parseFloat(e.target.value))}
                      className="slider"
                    />
                    <span className="slider-value">{matchThreshold.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3>Quality of Life Features</h3>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={autoOpenPopup}
                      onChange={(e) => setAutoOpenPopup(e.target.checked)}
                    />
                    <span>Auto-open popup for known class meetings</span>
                  </label>
                  <p className="help-text">
                    Automatically opens the extension popup when you join a meeting that's mapped to a class.
                  </p>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showJoinPrompt}
                      onChange={(e) => setShowJoinPrompt(e.target.checked)}
                    />
                    <span>Show prompt to join meeting when tracking starts</span>
                  </label>
                  <p className="help-text">
                    Displays a visual prompt if you start tracking while still in the waiting room.
                  </p>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showTrackingReminder}
                      onChange={(e) => setShowTrackingReminder(e.target.checked)}
                    />
                    <span>Show tracking reminder after 60 seconds</span>
                  </label>
                  <p className="help-text">
                    Reminds you to start tracking if you've been in the meeting for 60 seconds without starting. Also enables retroactive participant capture when starting late.
                  </p>
                </div>
              </div>

              <button className="button button-primary" onClick={handleSavePreferences}>
                Save Preferences
              </button>
            </div>
          )}

          {/* Debug Tab */}
          {activeTab === 'debug' && (
            <DebugDashboard />
          )}
        </div>
      </div>
    </div>
  );
}

function MappingForm({ classes, onAdd }) {
  const [meetingId, setMeetingId] = useState('');
  const [classId, setClassId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onAdd(meetingId, classId);
    setMeetingId('');
    setClassId('');
  }

  return (
    <form onSubmit={handleSubmit} className="mapping-form">
      <div className="form-group">
        <label>Google Meet ID</label>
        <input
          type="text"
          placeholder="abc-defg-hij"
          value={meetingId}
          onChange={(e) => setMeetingId(e.target.value)}
          className="input"
          required
        />
        <p className="help-text">
          Found in URL: meet.google.com/<strong>abc-defg-hij</strong>
        </p>
      </div>
      <div className="form-group">
        <label>Class</label>
        <select 
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="select"
          required
        >
          <option value="">Select a class...</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {formatClassDisplay(c)}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="button button-primary">
        Add Mapping
      </button>
    </form>
  );
}

// ============================================================================
// Debug Dashboard Component
// ============================================================================

function DebugDashboard() {
  const [logs, setLogs] = useState([]);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [meetingStatus, setMeetingStatus] = useState(null);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Source exclusion filters
  const [excludeSources, setExcludeSources] = useState({
    background: false,
    content: false,
    socket: false,
    api: false
  });

  // Load logs from storage
  const loadLogs = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get('debug_logs');
      setLogs(result.debug_logs || []);
    } catch (error) {
      console.error('Failed to load debug logs:', error);
    }
  }, []);

  // Load session status
  const loadStatus = useCallback(async () => {
    try {
      const sessionResponse = await sendMessageAsync('GET_SESSION_STATUS');
      // Response is wrapped in { success: true, data: {...} }
      setSessionStatus(sessionResponse?.data || sessionResponse);
      
      const meetingResponse = await sendMessageAsync('GET_MEETING_STATUS');
      setMeetingStatus(meetingResponse?.data || meetingResponse);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    Promise.all([loadLogs(), loadStatus()]).finally(() => setIsLoading(false));
  }, [loadLogs, loadStatus]);

  // Listen for new debug logs and status changes
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === 'DEBUG_LOG_ADDED' && autoRefresh) {
        setLogs(prev => [message.entry, ...prev].slice(0, 500));
      }
      
      // Update status on key events instead of constant polling
      if (
        message.type === 'SESSION_STARTED' ||
        message.type === 'SESSION_ENDED' ||
        message.type === 'MEETING_DETECTED' ||
        message.type === 'MEETING_LEFT'
      ) {
        loadStatus();
      }
    };
    
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [autoRefresh, loadStatus]);

  // Auto-refresh status (only when enabled and tab is visible)
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Only poll if the page is visible
      if (document.visibilityState === 'visible') {
        loadStatus();
      }
    }, 10000); // Reduced from 2s to 10s
    
    return () => clearInterval(interval);
  }, [autoRefresh, loadStatus]);

  // Clear logs
  const handleClearLogs = async () => {
    await chrome.storage.local.set({ debug_logs: [] });
    setLogs([]);
  };

  // Export logs
  const handleExportLogs = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engagium-debug-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Test functions
  const handleTestEvent = async (eventType) => {
    try {
      const response = await sendMessageAsync(eventType);
      console.log('Test response:', response);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  // Toggle source exclusion
  const toggleExcludeSource = (source) => {
    setExcludeSources(prev => ({
      ...prev,
      [source]: !prev[source]
    }));
  };

  // Filter logs with exclusions
  const filteredLogs = logs.filter(log => {
    // Apply source exclusions first
    if (excludeSources[log.source]) return false;
    
    // Then apply type/source filter
    if (filter === 'all') return true;
    return log.source === filter || log.type === filter;
  });

  const getLogStyle = (type) => {
    switch (type) {
      case 'SEND': return { color: '#3b82f6', bg: '#eff6ff' };
      case 'RECEIVE': return { color: '#10b981', bg: '#ecfdf5' };
      case 'ERROR': return { color: '#ef4444', bg: '#fef2f2' };
      case 'SUCCESS': return { color: '#22c55e', bg: '#f0fdf4' };
      case 'WARN': return { color: '#f59e0b', bg: '#fffbeb' };
      case 'EVENT': return { color: '#8b5cf6', bg: '#f5f3ff' };
      default: return { color: '#6b7280', bg: '#f9fafb' };
    }
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  if (isLoading) {
    return (
      <div className="section">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading debug data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>🔧 Debug Dashboard</h2>
      <p className="section-description">
        Real-time monitoring of extension events and data flow.
      </p>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Session Status */}
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📊 Session Status</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              background: sessionStatus?.status === 'active' ? '#dcfce7' : '#f3f4f6',
              color: sessionStatus?.status === 'active' ? '#166534' : '#6b7280'
            }}>
              {sessionStatus?.status || 'idle'}
            </span>
          </h4>
          {sessionStatus?.session ? (
            <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
              <div><strong>Session ID:</strong> {sessionStatus.session.id?.slice(0, 8)}...</div>
              <div><strong>Class:</strong> {sessionStatus.session.class_name}</div>
              <div><strong>Participants:</strong> {sessionStatus.session.participant_count || 0}</div>
              <div><strong>Matched:</strong> {sessionStatus.session.matched_count || 0}</div>
              <div><strong>Events:</strong> {sessionStatus.session.event_count || 0}</div>
            </div>
          ) : (
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>No active session</p>
          )}
        </div>

        {/* Meeting Detection */}
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎥 Meeting Detection</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              background: meetingStatus?.meeting ? '#dbeafe' : '#f3f4f6',
              color: meetingStatus?.meeting ? '#1e40af' : '#6b7280'
            }}>
              {meetingStatus?.meeting ? 'detected' : 'none'}
            </span>
          </h4>
          {meetingStatus?.meeting ? (
            <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
              <div><strong>Meeting ID:</strong> {meetingStatus.meeting.meeting_id}</div>
              <div><strong>Platform:</strong> {meetingStatus.meeting.platform}</div>
              <div><strong>Tab ID:</strong> {meetingStatus.meeting.tab_id}</div>
              {meetingStatus.meeting.mapped_class_name && (
                <div><strong>Mapped to:</strong> {meetingStatus.meeting.mapped_class_name}</div>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>No meeting detected</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>📈 Log Stats</h4>
          <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
            <div><strong>Total Logs:</strong> {logs.length}</div>
            <div><strong>Errors:</strong> {logs.filter(l => l.type === 'ERROR').length}</div>
            <div><strong>Sends:</strong> {logs.filter(l => l.type === 'SEND').length}</div>
            <div><strong>Receives:</strong> {logs.filter(l => l.type === 'RECEIVE').length}</div>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.75rem 0' }}>🧪 Test Actions</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button 
            className="button button-secondary" 
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => handleTestEvent('GET_SESSION_STATUS')}
          >
            Get Session Status
          </button>
          <button 
            className="button button-secondary" 
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => handleTestEvent('GET_MEETING_STATUS')}
          >
            Get Meeting Status
          </button>
          <button 
            className="button button-secondary" 
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => handleTestEvent('GET_SYNC_STATUS')}
          >
            Get Sync Queue
          </button>
          <button 
            className="button button-secondary" 
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => handleTestEvent('IS_AUTHENTICATED')}
          >
            Check Auth
          </button>
          <button 
            className="button" 
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: '#ef4444', color: 'white' }}
            onClick={() => handleTestEvent('CLEAR_ALL_SESSIONS')}
          >
            Clear All Sessions
          </button>
        </div>
      </div>

      {/* Log Controls */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ margin: 0 }}>📋 Event Logs</h4>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
            >
              <option value="all">All</option>
              <optgroup label="By Type">
                <option value="SEND">📤 Send</option>
                <option value="RECEIVE">📥 Receive</option>
                <option value="ERROR">❌ Error</option>
                <option value="SUCCESS">✅ Success</option>
                <option value="EVENT">🎯 Event</option>
              </optgroup>
              <optgroup label="By Source">
                <option value="content">Content Script</option>
                <option value="background">Background</option>
                <option value="socket">Socket</option>
                <option value="api">API</option>
              </optgroup>
            </select>
            <button 
              className="button button-secondary" 
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
              onClick={loadLogs}
            >
              Refresh
            </button>
            <button 
              className="button button-secondary" 
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
              onClick={handleExportLogs}
            >
              Export
            </button>
            <button 
              className="button" 
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', background: '#ef4444', color: 'white' }}
              onClick={handleClearLogs}
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Source Exclusion Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          background: '#f9fafb', 
          borderRadius: '6px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#374151' }}>Hide sources:</span>
          {[
            { key: 'background', label: '🔧 Background', color: '#6366f1' },
            { key: 'content', label: '📄 Content', color: '#10b981' },
            { key: 'socket', label: '🔌 Socket', color: '#f59e0b' },
            { key: 'api', label: '🌐 API', color: '#3b82f6' }
          ].map(({ key, label, color }) => (
            <label 
              key={key}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem', 
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                background: excludeSources[key] ? '#fee2e2' : 'white',
                border: `1px solid ${excludeSources[key] ? '#fca5a5' : '#e5e7eb'}`,
                transition: 'all 0.15s'
              }}
            >
              <input 
                type="checkbox" 
                checked={excludeSources[key]} 
                onChange={() => toggleExcludeSource(key)}
                style={{ margin: 0 }}
              />
              <span style={{ 
                textDecoration: excludeSources[key] ? 'line-through' : 'none',
                color: excludeSources[key] ? '#9ca3af' : color
              }}>
                {label}
              </span>
            </label>
          ))}
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            ({filteredLogs.length} / {logs.length} shown)
          </span>
        </div>

        {/* Log List */}
        <div style={{ 
          maxHeight: '500px', 
          overflowY: 'auto', 
          border: '1px solid #e5e7eb', 
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontFamily: 'monospace'
        }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
              No logs yet. Start tracking a meeting to see events.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const style = getLogStyle(log.type);
              return (
                <div 
                  key={log.id} 
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    borderBottom: '1px solid #f3f4f6',
                    background: style.bg
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span style={{ 
                      color: style.color, 
                      fontWeight: 'bold',
                      minWidth: '70px'
                    }}>
                      {log.type}
                    </span>
                    <span style={{ 
                      color: '#6b7280',
                      padding: '0 4px',
                      background: '#f3f4f6',
                      borderRadius: '3px',
                      fontSize: '0.75rem'
                    }}>
                      {log.source}
                    </span>
                    <span style={{ color: '#374151', fontWeight: '500' }}>
                      {log.event}
                    </span>
                  </div>
                  {log.data && (
                    <details style={{ marginTop: '0.25rem', marginLeft: '5.5rem' }}>
                      <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '0.75rem' }}>
                        Show data
                      </summary>
                      <pre style={{ 
                        margin: '0.25rem 0 0 0', 
                        padding: '0.5rem', 
                        background: '#f9fafb', 
                        borderRadius: '4px',
                        overflow: 'auto',
                        maxHeight: '200px',
                        fontSize: '0.7rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>
                        {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function for async message sending
function sendMessageAsync(type, data = {}) {
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

// Initialize
const root = createRoot(document.getElementById('root'));
root.render(<OptionsApp />);
