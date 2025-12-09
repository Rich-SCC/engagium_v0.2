import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  ChartBarIcon,
  BookOpenIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  RssIcon,
  CalendarIcon,
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
    { name: 'Home', href: '/app/home', icon: HomeIcon },
    { name: 'Live Feed', href: '/app/live-feed', icon: RssIcon },
    { name: 'My Classes', href: '/app/classes', icon: BookOpenIcon },
    { name: 'Sessions', href: '/app/sessions', icon: CalendarIcon },
    { name: 'Analytics', href: '/app/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/app/settings', icon: CogIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl border-r border-gray-200">
        <div className="flex h-full flex-col p-8">
          {/* Logo/Brand */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-accent-500 tracking-tight">engagium</h1>
          </div>

          {/* Profile Section */}
          <div className="mb-10 pb-8 border-b border-gray-200">
            <div className="relative w-24 h-24 mx-auto mb-4">
              {/* Profile Image Placeholder */}
              <div className="w-full h-full rounded-full bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center border-2 border-accent-300 overflow-hidden">
                <span className="text-4xl text-accent-600">👤</span>
              </div>
            </div>

            {/* User Info */}
            <div className="text-center">
              <h2 className="text-gray-900 text-lg font-semibold mb-1">
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : 'User'}
              </h2>
              <p className="text-gray-500 text-sm font-medium">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Instructor'}
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
                  className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-accent-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-accent-50 hover:text-accent-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-6 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-72 min-h-screen">
        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;