import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const LoginModal = ({ onClose, onSwitchToSignUp, onSwitchToForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) {
      onClose();
      navigate('/app/home');
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

        <h2 className="text-4xl font-bold text-gray-900 mb-2">Log In</h2>
        <p className="text-gray-600 mb-8">Please enter your details.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700 text-sm">
            {error}
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
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-300 focus:border-teal-600 focus:outline-none text-gray-700"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-900 font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full px-6 py-4 pr-14 rounded-2xl border-2 border-gray-300 focus:border-teal-600 focus:outline-none text-gray-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <button 
              type="button" 
              onClick={onSwitchToForgotPassword}
              className="text-gray-700 underline text-sm hover:text-gray-900"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold py-4 rounded-2xl transition text-xl disabled:opacity-50 shadow-md"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>

          <p className="text-center text-gray-700">
            Don't have an account?{' '}
            <button type="button" onClick={onSwitchToSignUp} className="underline font-semibold hover:text-gray-900">
              Sign Up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
