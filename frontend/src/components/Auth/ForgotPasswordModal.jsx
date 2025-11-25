import React, { useState } from 'react';

const ForgotPasswordModal = ({ onClose, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess('If an account exists with that email, a password reset link has been sent. Please check your inbox.');
      setEmail('');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-200 rounded-3xl p-12 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition"
        >
          ✕
        </button>

        <h2 className="text-4xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
        <p className="text-gray-600 mb-8">Enter your email address and we'll send you a link to reset your password.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-900 font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="profeasestclare.scc@gmail.com"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-300 focus:border-teal-600 focus:outline-none text-gray-700"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-4 rounded-2xl transition text-xl disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <p className="text-center text-gray-700">
            Remember your password?{' '}
            <button type="button" onClick={onBackToLogin} className="underline font-semibold hover:text-gray-900">
              Back to Log In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
