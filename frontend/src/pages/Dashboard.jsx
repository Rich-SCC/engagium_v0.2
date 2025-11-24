import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sessionsAPI, classesAPI } from '@/services/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch recent sessions for activity
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll(),
  });

  // Fetch classes for summary
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
  });

  const sessions = sessionsData?.data || [];
  const classes = classesData?.data || [];

  // Get recent sessions (last 11)
  const recentSessions = sessions
    .sort((a, b) => new Date(b.start_time || b.created_at) - new Date(a.start_time || a.created_at))
    .slice(0, 11);

  // Calculate class summary stats
  const classStats = classes.slice(0, 3).map((cls, idx) => {
    const avgScores = [90, 66, 55];
    const statuses = ['Highly Engaged', 'Good Participation', 'Attention Needed'];
    return {
      ...cls,
      code: cls.name || `Class ${idx + 1}`,
      avgScore: avgScores[idx] || 50,
      status: statuses[idx] || 'Pending'
    };
  });

  // Calendar logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const formatDuration = (duration) => {
    if (!duration) return '0 min 0s';
    const hrs = Math.floor(duration / 60);
    const mins = duration % 60;
    const secs = Math.floor(Math.random() * 60);
    if (hrs > 0) {
      return `${hrs} hr ${mins} min ${secs}s`;
    }
    return `${mins} min ${secs}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-6">
      {/* Recent Activity Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity Table</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date/Time</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Duration</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Subject</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Total Participation</th>
              </tr>
            </thead>
            <tbody>
              {sessionsLoading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : recentSessions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No recent activity
                  </td>
                </tr>
              ) : (
                recentSessions.map((session, index) => {
                  const classInfo = classes.find(c => c.id === session.class_id);
                  return (
                    <tr key={session.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(session.start_time || session.created_at)} - {formatTime(session.start_time || session.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDuration(session.duration || Math.floor(Math.random() * 120) + 30)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{classInfo?.name || session.title || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{Math.floor(Math.random() * 50) + 10}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <Link to="/app/sessions" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            View All Activity
          </Link>
        </div>
      </div>

      {/* Bottom Row: Class Summary, Calendar, Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Class Summary</h3>
          <div className="space-y-4">
            {classesLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : classStats.length === 0 ? (
              <p className="text-gray-500">No classes yet</p>
            ) : (
              classStats.map((cls) => (
                <div key={cls.id} className="border-b pb-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{cls.code}</span>
                    <span className="text-sm font-bold">{cls.avgScore}%</span>
                  </div>
                  <p className="text-xs text-gray-600">{cls.status}</p>
                </div>
              ))
            )}
          </div>
          {/* Pie Chart Placeholder */}
          <div className="mt-6 flex justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="20"
                  strokeDasharray={`${(classStats[0]?.avgScore || 0) * 2.51} 251`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600">
                25%
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-gray-200 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={previousMonth}
                className="p-1 hover:bg-gray-300 rounded"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-gray-300 rounded"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="font-semibold text-gray-700 py-2">{day}</div>
            ))}
            {getDaysInMonth(currentDate).map((day, index) => (
              <div
                key={index}
                className={`py-2 ${
                  day === null
                    ? ''
                    : day === new Date().getDate() &&
                      currentDate.getMonth() === new Date().getMonth() &&
                      currentDate.getFullYear() === new Date().getFullYear()
                    ? 'bg-gray-700 text-white rounded-full font-bold'
                    : 'hover:bg-gray-300 rounded-full cursor-pointer'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Code Section */}
          <div className="mt-6 bg-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Code</span>
              <button className="text-gray-600 hover:text-gray-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <p className="text-lg font-bold">nrs-oxnj-njd</p>
            <p className="text-2xl font-bold">868 0678 3998</p>
          </div>
        </div>

        {/* Notification */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Notification</h3>
            <button className="text-sm text-gray-600 hover:text-gray-900">•••</button>
          </div>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">Upcoming Class</h4>
                <button className="text-gray-400 hover:text-gray-600">•••</button>
              </div>
              <p className="text-xs text-gray-600 mb-1">
                1st Year - D (CS101 Functions in Python)
              </p>
              <p className="text-xs text-gray-500">📅 Thu, 24 Nov · ⏰ 08:00 AM</p>
            </div>
            <div className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">Upcoming Class</h4>
                <button className="text-gray-400 hover:text-gray-600">•••</button>
              </div>
              <p className="text-xs text-gray-600 mb-1">
                3rd Year - A (CS305 Calculus III)
              </p>
              <p className="text-xs text-gray-500">📅 Thu, 24 Nov · ⏰ 10:30 AM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
