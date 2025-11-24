import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setError('Invalid or missing reset token');
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-gray-200 rounded-3xl p-12 max-w-md w-full shadow-2xl">
        <h2 className="text-4xl font-bold text-gray-900 mb-2 text-center">
          Reset Your Password
        </h2>
        <p className="text-gray-600 mb-8 text-center">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-gray-900 font-semibold mb-2">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-300 focus:border-teal-600 focus:outline-none text-gray-700"
              placeholder="**************"
              disabled={loading || !token}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-gray-900 font-semibold mb-2">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-300 focus:border-teal-600 focus:outline-none text-gray-700"
              placeholder="**************"
              disabled={loading || !token}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-100 border border-green-400 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-4 rounded-2xl transition text-xl disabled:opacity-50"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <p className="text-center text-gray-700">
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="underline font-semibold hover:text-gray-900"
            >
              Back to Home
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
