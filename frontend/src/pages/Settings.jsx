import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';

const Settings = () => {
  const { user } = useAuth();
  const [extensionToken, setExtensionToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenSuccess, setTokenSuccess] = useState('');
  const [copied, setCopied] = useState(false);

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

  const getInitials = () => {
    if (!user) return '?';
    const firstInitial = user.first_name?.[0]?.toUpperCase() || '';
    const lastInitial = user.last_name?.[0]?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || '?';
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
                    defaultValue={user?.first_name}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    defaultValue={user?.last_name}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div className="pt-2">
                <button className="bg-accent-600 text-white px-6 py-2 rounded-lg hover:bg-accent-700 transition font-medium">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
          <p className="text-sm text-gray-500 mt-1">Customize your experience</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Notification Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                <span className="text-sm text-gray-700">Email notifications for new sessions</span>
                <input type="checkbox" className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded" defaultChecked />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                <span className="text-sm text-gray-700">Weekly participation summaries</span>
                <input type="checkbox" className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded" defaultChecked />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                <span className="text-sm text-gray-700">Browser notifications</span>
                <input type="checkbox" className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded" />
              </label>
            </div>
          </div>
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
    </div>
  );
};

export default Settings;
