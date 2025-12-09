import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { classesAPI, sessionsAPI } from '@/services/api';
import { formatClassDisplay } from '@/utils/classFormatter';
import { 
  BookOpenIcon, 
  ChartBarIcon, 
  CalendarIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  // Fetch summary data
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: classStatsData } = useQuery({
    queryKey: ['classStats'],
    queryFn: () => classesAPI.getStats(),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  const { data: sessionStatsData } = useQuery({
    queryKey: ['sessionStats'],
    queryFn: () => sessionsAPI.getStats(),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  const classes = classesData?.data || [];
  const classStats = classStatsData?.data || {};
  const sessionStats = sessionStatsData?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-600 mt-2">Here's an overview of your teaching activities</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Total Classes</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{classStats.totalClasses || 0}</p>
            </div>
            <BookOpenIcon className="w-12 h-12 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{classStats.totalStudents || 0}</p>
            </div>
            <UserGroupIcon className="w-12 h-12 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">Total Sessions</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{sessionStats.totalSessions || 0}</p>
            </div>
            <CalendarIcon className="w-12 h-12 text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium">Active Now</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">{sessionStats.activeSessions || 0}</p>
            </div>
            <ClockIcon className="w-12 h-12 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/app/classes"
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            <BookOpenIcon className="w-6 h-6 text-blue-600 mr-3" />
            <span className="font-medium text-blue-900">Manage Classes</span>
          </Link>
          
          <Link
            to="/app/live-feed"
            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
          >
            <ClockIcon className="w-6 h-6 text-green-600 mr-3" />
            <span className="font-medium text-green-900">View Live Feed</span>
          </Link>
          
          <Link
            to="/app/analytics"
            className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
          >
            <ChartBarIcon className="w-6 h-6 text-purple-600 mr-3" />
            <span className="font-medium text-purple-900">View Analytics</span>
          </Link>
        </div>
      </div>

      {/* Recent Classes */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Your Classes</h2>
          <Link to="/app/classes" className="text-sm text-accent-600 hover:text-accent-700 font-semibold">
            View All →
          </Link>
        </div>
        
        {classes.length === 0 ? (
          <div className="text-center py-8">
            <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No classes yet</p>
            <Link
              to="/app/classes"
              className="inline-block bg-accent-500 text-white px-6 py-2 rounded-lg hover:bg-accent-600 transition"
            >
              Create Your First Class
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.slice(0, 6).map((cls) => (
              <Link
                key={cls.id}
                to={`/app/classes/${cls.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-accent-300 hover:shadow-md transition"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{formatClassDisplay(cls)}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{cls.description ? cls.description.substring(0, 50) + '...' : 'No description'}</span>
                  <span className="flex items-center">
                    <UserGroupIcon className="w-4 h-4 mr-1" />
                    {cls.student_count || 0}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    cls.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {cls.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
