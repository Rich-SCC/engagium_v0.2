/**
 * Options Page React App
 * Settings and configuration for the extension
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { STORAGE_KEYS } from '../utils/constants.js';
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
  const [isLoading, setIsLoading] = useState(true);
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
      const storage = await chrome.storage.local.get([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_INFO,
        STORAGE_KEYS.MEETING_MAPPINGS,
        STORAGE_KEYS.AUTO_START,
        STORAGE_KEYS.MATCH_THRESHOLD
      ]);

      if (storage[STORAGE_KEYS.AUTH_TOKEN]) {
        setAuthToken(storage[STORAGE_KEYS.AUTH_TOKEN]);
        setIsAuthenticated(true);
        
        if (storage[STORAGE_KEYS.USER_INFO]) {
          setUserInfo(storage[STORAGE_KEYS.USER_INFO]);
        }
        
        // Load classes
        await loadClasses();
      }

      setMeetingMappings(storage[STORAGE_KEYS.MEETING_MAPPINGS] || {});
      setAutoStart(storage[STORAGE_KEYS.AUTO_START] || false);
      setMatchThreshold(storage[STORAGE_KEYS.MATCH_THRESHOLD] || 0.7);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setIsLoading(false);
    }
  }

  async function loadClasses() {
    try {
      const response = await sendMessage('GET_CLASSES');
      if (response.success && response.data) {
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
    await chrome.storage.local.remove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_INFO
    ]);
    
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
      [STORAGE_KEYS.MATCH_THRESHOLD]: matchThreshold
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2"/>
            </svg>
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

              {!isAuthenticated ? (
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
                {Object.keys(meetingMappings).length === 0 ? (
                  <p className="empty-state">No mappings yet. Add one above!</p>
                ) : (
                  <div className="mappings-list">
                    {Object.entries(meetingMappings).map(([meetingId, mapping]) => (
                      <div key={meetingId} className="mapping-item">
                        <div className="mapping-info">
                          <div className="mapping-meeting">{meetingId}</div>
                          <div className="mapping-arrow">→</div>
                          <div className="mapping-class">{mapping.class_name}</div>
                        </div>
                        <button 
                          className="button-icon-danger"
                          onClick={() => handleRemoveMapping(meetingId)}
                          title="Remove mapping"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

                <button className="button button-primary" onClick={handleSavePreferences}>
                  Save Preferences
                </button>
              </div>
            </div>
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
              {c.name} ({c.code})
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

// Initialize
const root = createRoot(document.getElementById('root'));
root.render(<OptionsApp />);
