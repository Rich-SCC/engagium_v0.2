import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

// Auth pages
import LandingPage from '@/pages/LandingPage';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Main pages
import Home from '@/pages/Home';
import LiveFeed from '@/pages/LiveFeed';
import Analytics from '@/pages/Analytics';
import MyClasses from '@/pages/MyClasses';
import ClassDetailsPage from '@/pages/ClassDetailsPage';
import Sessions from '@/pages/Sessions';
import SessionDetailPage from '@/pages/SessionDetailPage';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Public route component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/app/home" replace />;
};

function App() {
  return (
    <Routes>
      {/* Landing Page - Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Forgot Password - Public */}
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      {/* Reset Password route - needs token from email */}
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="live-feed" element={<LiveFeed />} />
        <Route path="classes" element={<MyClasses />} />
        <Route path="classes/:id" element={<ClassDetailsPage />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="sessions/:id" element={<SessionDetailPage />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        
        {/* Legacy redirect for old dashboard route */}
        <Route path="dashboard" element={<Navigate to="/app/home" replace />} />
      </Route>
    </Routes>
  );
}

export default App;