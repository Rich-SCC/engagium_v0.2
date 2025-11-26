import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

const Settings = () => {
  const { user } = useAuth();
  const [extensionToken, setExtensionToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenSuccess, setTokenSuccess] = useState('');

  const generateExtensionToken = async () => {
    setIsGenerating(true);
    setTokenError('');
    setTokenSuccess('');
    
    try {
      const response = await api.post('/auth/generate-extension-token');
      
      if (response.success) {
        setExtensionToken(response.data.token);
        setShowToken(true);
        setTokenSuccess('Token generated successfully!');
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
    setTokenSuccess('Token copied to clipboard!');
    setTimeout(() => setTokenSuccess(''), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      {/* Extension Token */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Browser Extension</h2>
        <p className="text-sm text-gray-600 mb-4">
          Generate a token to connect the Engagium browser extension with your account.
        </p>
        
        {tokenError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {tokenError}
          </div>
        )}
        
        {tokenSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {tokenSuccess}
          </div>
        )}

        {!showToken ? (
          <button
            onClick={generateExtensionToken}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Extension Token'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extension Token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={extensionToken}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">How to use this token:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Copy the token above</li>
                <li>Open the Engagium extension in your browser</li>
                <li>Go to the Options/Settings page</li>
                <li>Paste the token in the "Extension Token" field</li>
                <li>Click "Connect"</li>
              </ol>
            </div>
            <button
              onClick={generateExtensionToken}
              disabled={isGenerating}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Generate New Token
            </button>
          </div>
        )}
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                defaultValue={user?.first_name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                defaultValue={user?.last_name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              defaultValue={user?.email}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
        </div>
        <div className="mt-6">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            Save Changes
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-sm text-gray-700">Email notifications for new sessions</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-sm text-gray-700">Weekly participation summaries</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" />
            <span className="text-sm text-gray-700">Browser notifications</span>
          </label>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-gray-50 rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">More Settings Coming Soon</h3>
        <p className="text-gray-500">Additional customization options will be available in future updates</p>
      </div>
    </div>
  );
};

export default Settings;
