import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  BellIcon,
  ChartBarIcon,
  BookOpenIcon,
  CogIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/app/dashboard', icon: HomeIcon },
    { name: 'Notification', href: '/app/notifications', icon: BellIcon },
    { name: 'Analytics', href: '/app/analytics', icon: ChartBarIcon },
    { name: 'My Classes', href: '/app/classes', icon: BookOpenIcon },
    { name: 'Settings', href: '/app/settings', icon: CogIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-400 shadow-lg">
        <div className="flex h-full flex-col p-6">
          {/* Profile Section */}
          <div className="mb-8">
            <div className="relative w-32 h-32 mx-auto mb-4">
              {/* Profile Image Placeholder */}
              <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center border-4 border-white overflow-hidden">
                <div className="text-center">
                  <div className="text-5xl">👤</div>
                </div>
              </div>
              {/* Edit Button */}
              <button className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50">
                <PencilIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* User Info */}
            <div className="text-center">
              <h2 className="text-white text-xl font-bold mb-1">
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : 'User'}
              </h2>
              <p className="text-white text-xs mb-1">
                {user?.role?.toUpperCase() || 'INSTRUCTOR'} OF SCIENCE IN COMPUTER SCIENCE
              </p>
              <p className="text-white text-sm font-semibold">
                {user?.student_id || '20221524'}
              </p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 rounded-full text-white font-medium transition-all ${
                    isActive
                      ? 'bg-white text-gray-800 shadow-md'
                      : 'hover:bg-gray-500'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                  {isActive && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-4 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-all flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome Back, {user?.first_name || 'User'}!
              </h1>
              <p className="text-sm text-red-600 font-semibold">
                You have 1 class!
              </p>
            </div>
            <div className="flex items-center">
              <input
                type="search"
                placeholder="Search..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;