import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logoLight from '@/assets/images/logo-light.png';
import {
  HomeIcon,
  ChartBarIcon,
  BookOpenIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  RssIcon,
  CalendarIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('engagium.sidebar.collapsed') === 'true';
  });

  useEffect(() => {
    window.localStorage.setItem('engagium.sidebar.collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getInitials = () => {
    if (!user) return '?';
    const firstInitial = user.first_name?.[0]?.toUpperCase() || '';
    const lastInitial = user.last_name?.[0]?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || '?';
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
      <aside className={`group/sidebar fixed inset-y-0 left-0 bg-white shadow-xl border-r border-gray-200 transition-[width] duration-150 ease-out ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}>
        <div className={`flex h-full flex-col ${isSidebarCollapsed ? 'p-4 items-center justify-center gap-6' : 'p-8'}`}>
          {/* Logo/Brand */}
          <div className={`${isSidebarCollapsed ? 'w-full text-center' : 'mb-8 w-full text-center'}`}>
            {isSidebarCollapsed ? (
              <img
                src={logoLight}
                alt="Engagium"
                className="mx-auto h-8 w-auto object-contain"
              />
            ) : (
              <h1 className="text-3xl font-bold text-accent-500 tracking-tight">engagium</h1>
            )}
          </div>

          {/* Profile Section */}
          <div className={`${isSidebarCollapsed ? '' : 'border-b border-gray-200 mb-10 pb-8'}`}>
            <div className={`relative mx-auto ${isSidebarCollapsed ? 'w-12 h-12 mb-2' : 'w-24 h-24 mb-4'}`}>
              <div className="w-full h-full rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg overflow-hidden">
                <span className={`${isSidebarCollapsed ? 'text-lg' : 'text-3xl'} font-bold text-white`}>{getInitials()}</span>
              </div>
            </div>

            {/* User Info */}
            {!isSidebarCollapsed ? (
              <div className="text-center">
                <h2 className="text-gray-900 text-lg font-semibold mb-1">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : 'User'}
                </h2>
              </div>
            ) : null}
          </div>

          {/* Navigation Menu */}
          <nav className={`${isSidebarCollapsed ? 'w-full flex flex-col items-center space-y-2' : 'flex-1 space-y-2'}`}>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-accent-50 hover:text-accent-700'
                  } ${isSidebarCollapsed ? 'justify-center h-11 w-11 px-0' : ''}`}
                >
                  <item.icon className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
                  {!isSidebarCollapsed ? <span>{item.name}</span> : null}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? 'Logout' : undefined}
            className={`${isSidebarCollapsed ? 'h-11 w-11 mt-1 px-0 py-0' : 'w-full mt-6 px-4 py-3 space-x-2'} bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors flex items-center justify-center`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            {!isSidebarCollapsed ? <span>Logout</span> : null}
          </button>
        </div>

        {/* Top-right inline collapse control */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((previous) => !previous)}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`absolute inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-500 shadow-sm transition-colors duration-150 hover:bg-accent-50 hover:text-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-300 ${isSidebarCollapsed ? 'top-2 left-1/2 -translate-x-1/2' : 'top-3 right-3'}`}
        >
          {isSidebarCollapsed ? <ChevronDoubleRightIcon className="w-3.5 h-3.5 mx-auto" /> : <ChevronDoubleLeftIcon className="w-3.5 h-3.5 mx-auto" />}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className={`min-h-screen transition-[margin-left] duration-150 ease-out ${isSidebarCollapsed ? 'ml-24' : 'ml-72'}`}>
        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;