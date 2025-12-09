import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api, { extensionTokensAPI } from '@/services/api';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  KeyIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const { user } = useAuth();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Extension token state
  const [extensionToken, setExtensionToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenSuccess, setTokenSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Active tokens state
  const [activeTokens, setActiveTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(true);

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Load active tokens
  useEffect(() => {
    loadActiveTokens();
  }, []);

  const loadActiveTokens = async () => {
    try {
      setLoadingTokens(true);
      const response = await extensionTokensAPI.getAll();
      if (response.success) {
        // Filter out revoked and expired tokens
        const activeOnly = response.data.filter(token => {
          const isExpired = new Date(token.expires_at) < new Date();
          return !token.revoked && !isExpired;
        });
        setActiveTokens(activeOnly);
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await api.put('/auth/profile', profileData);
      if (response.success) {
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setPasswordSuccess(''), 5000);
      }
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const generateExtensionToken = async () => {
    setIsGenerating(true);
    setTokenError('');
    setTokenSuccess('');
    setShowToken(false);
    
    try {
      const response = await api.post('/auth/generate-extension-token');
      
      if (response.success) {
        setExtensionToken(response.data.token);
        setShowToken(true);
        setTokenSuccess(response.message || 'Token generated successfully!');
        await loadActiveTokens(); // Reload tokens list
      } else {
        setTokenError(response.error || 'Failed to generate token');
      }
    } catch (error) {
      setTokenError(error.response?.data?.error || error.message || 'Failed to generate token');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extensionToken);
    setCopied(true);
    setTokenSuccess('Token copied to clipboard!');
    setTimeout(() => {
      setCopied(false);
      setTokenSuccess('');
    }, 3000);
  };

  const handleRevokeToken = async (tokenId) => {
    if (!confirm('Are you sure you want to revoke this token? The extension will stop working until you generate a new token.')) {
      return;
    }

    try {
      const response = await extensionTokensAPI.revoke(tokenId);
      if (response.success) {
        setTokenSuccess('Token revoked successfully');
        await loadActiveTokens();
        setTimeout(() => setTokenSuccess(''), 3000);
      }
    } catch (error) {
      setTokenError(error.message || 'Failed to revoke token');
    }
  };

  const getInitials = () => {
    if (!user) return '?';
    const firstInitial = user.first_name?.[0]?.toUpperCase() || '';
    const lastInitial = user.last_name?.[0]?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || '?';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTokenStatus = (token) => {
    const now = new Date();
    const expiresAt = new Date(token.expires_at);
    const daysUntilExpiry = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));

    if (token.revoked) return { text: 'Revoked', color: 'text-red-600', bg: 'bg-red-100' };
    if (expiresAt < now) return { text: 'Expired', color: 'text-gray-600', bg: 'bg-gray-100' };
    if (daysUntilExpiry <= 7) return { text: `${daysUntilExpiry}d left`, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Active', color: 'text-green-600', bg: 'bg-green-100' };
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your account details</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleProfileSubmit}>
            <div className="flex items-start gap-6">
              {/* Avatar with Initials */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-white">{getInitials()}</span>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">Profile Picture</p>
              </div>

              {/* Profile Form */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {profileError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {profileError}
                  </div>
                )}
                
                {profileSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                    {profileSuccess}
                  </div>
                )}

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={profileLoading}
                    className="bg-accent-600 text-white px-6 py-2 rounded-lg hover:bg-accent-700 transition font-medium disabled:opacity-50"
                  >
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Security - Change Password */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <KeyIcon className="w-6 h-6 text-accent-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Security</h2>
            <p className="text-sm text-gray-500 mt-1">Change your password</p>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {passwordSuccess}
              </div>
            )}

            <button 
              type="submit"
              disabled={passwordLoading}
              className="bg-accent-600 text-white px-6 py-2 rounded-lg hover:bg-accent-700 transition font-medium disabled:opacity-50"
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Extension Authentication */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <ShieldCheckIcon className="w-6 h-6 text-accent-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Extension Authentication</h2>
            <p className="text-sm text-gray-500 mt-1">Securely connect your browser extension</p>
          </div>
        </div>
        
        <div className="p-6">
          {/* Security Notice */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <strong>Security Notice:</strong> This token provides access to your account. 
              Never share it with anyone or post it publicly. Generate a new token if compromised.
            </div>
          </div>

          {tokenError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <span>{tokenError}</span>
            </div>
          )}
          
          {tokenSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start">
              <CheckIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <span>{tokenSuccess}</span>
            </div>
          )}

          {!showToken ? (
            <div>
              <p className="text-gray-600 mb-4 text-sm">
                Generate a secure authentication token to connect the Engagium browser extension with your account.
              </p>
              <button
                onClick={generateExtensionToken}
                disabled={isGenerating}
                className="bg-accent-600 text-white px-6 py-3 rounded-lg hover:bg-accent-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isGenerating ? 'Generating...' : 'Generate Extension Token'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Extension Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extensionToken}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm select-all"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-6 py-3 rounded-lg font-medium transition flex items-center ${
                      copied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-5 h-5 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ This token will only be shown once. Save it securely before leaving this page.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">i</span>
                  Setup Instructions
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 ml-4">
                  <li>Copy the token above using the Copy button</li>
                  <li>Open the Engagium browser extension</li>
                  <li>Click on the extension icon and go to Options/Settings</li>
                  <li>Paste the token in the "Authentication Token" field</li>
                  <li>Click "Connect" or "Save"</li>
                  <li>You should see a success message once connected</li>
                </ol>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={generateExtensionToken}
                  disabled={isGenerating}
                  className="text-sm text-accent-600 hover:text-accent-700 underline font-medium"
                >
                  Generate New Token
                </button>
                <span className="text-xs text-gray-500">Token expires in 30 days</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Extension Tokens */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Active Extension Tokens</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your browser extension connections</p>
        </div>
        
        <div className="p-6">
          {loadingTokens ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600 mx-auto"></div>
              <p className="mt-2 text-sm">Loading tokens...</p>
            </div>
          ) : activeTokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No active tokens</p>
              <p className="text-xs mt-1">Generate a token above to connect your browser extension</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTokens.map((token) => {
                const status = getTokenStatus(token);
                return (
                  <div 
                    key={token.id} 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {token.token_preview}...
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                        <div>Created: {formatDate(token.created_at)}</div>
                        <div>Last used: {formatDate(token.last_used_at)}</div>
                        <div>Expires: {formatDate(token.expires_at)}</div>
                      </div>
                    </div>
                    {!token.revoked && new Date(token.expires_at) > new Date() && (
                      <button
                        onClick={() => handleRevokeToken(token.id)}
                        className="ml-4 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2 text-sm font-medium"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
