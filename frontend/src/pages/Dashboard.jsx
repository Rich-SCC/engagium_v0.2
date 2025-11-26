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

  // Fetch session stats
  const { data: sessionStatsData } = useQuery({
    queryKey: ['sessionStats'],
    queryFn: () => sessionsAPI.getStats(),
  });

  // Fetch classes for summary
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
  });

  // Fetch class stats
  const { data: classStatsData } = useQuery({
    queryKey: ['classStats'],
    queryFn: () => classesAPI.getStats(),
  });

  const sessions = sessionsData?.data || [];
  const classes = classesData?.data || [];
  const sessionStats = sessionStatsData?.data || {};
  const classStats = classStatsData?.data || {};

  // Get recent sessions (last 11)
  const recentSessions = sessions
    .sort((a, b) => new Date(b.started_at || b.created_at) - new Date(a.started_at || a.created_at))
    .slice(0, 11);

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

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    if (!endTime) return 'In Progress';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const durationMinutes = Math.floor(durationMs / 60000);
    
    const hrs = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    
    if (hrs > 0) {
      return `${hrs} hr ${mins} min`;
    }
    return `${mins} min`;
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
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-accent-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date/Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Participation</th>
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
                    <tr key={session.id} className="border-b border-gray-100 hover:bg-accent-50 transition-colors">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(session.started_at || session.created_at)} - {formatTime(session.started_at || session.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDuration(session.started_at, session.ended_at)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{classInfo?.name || session.title || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{session.participation_count || 0}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 text-center">
          <Link to="/app/sessions" className="text-sm text-accent-600 hover:text-accent-700 font-semibold">
            View All Activity →
          </Link>
        </div>
      </div>

      {/* Bottom Row: Class Summary, Calendar, Session Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Summary */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Class Summary</h3>
          <div className="space-y-4">
            {classesLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : classes.length === 0 ? (
              <p className="text-gray-500">No classes yet</p>
            ) : (
              classes.slice(0, 3).map((cls) => (
                <div key={cls.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm text-gray-900">{cls.name}</span>
                    <span className="text-sm text-accent-600 font-medium">{cls.student_count || 0} students</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {cls.status === 'active' ? 'Active' : 'Archived'} • {cls.section || 'No section'}
                  </p>
                </div>
              ))
            )}
          </div>
          {/* Stats Display */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-600">{classStats.totalClasses || 0}</div>
              <div className="text-sm text-gray-600 mt-2">Total Classes</div>
            </div>
            <div className="text-center mt-6">
              <div className="text-2xl font-bold text-gray-700">{classStats.totalStudents || 0}</div>
              <div className="text-xs text-gray-500 mt-2">Total Students</div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-gradient-to-br from-accent-50 to-gray-50 rounded-xl shadow-md p-6 border border-accent-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={previousMonth}
                className="p-1 hover:bg-accent-100 rounded transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-accent-600" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-accent-100 rounded transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-accent-600" />
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
                    ? 'bg-accent-500 text-white rounded-full font-bold'
                    : 'hover:bg-accent-100 rounded-full cursor-pointer text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Session Stats */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Session Stats</h3>
          <div className="space-y-6">
            <div className="text-center p-4 bg-accent-50 rounded-xl">
              <div className="text-3xl font-bold text-accent-600">{sessionStats.totalSessions || sessions.length}</div>
              <div className="text-sm text-gray-600 mt-2">Total Sessions</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-700">{sessionStats.activeSessions || 0}</div>
              <div className="text-sm text-gray-600 mt-2">Active Now</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-700">{sessionStats.completedToday || 0}</div>
              <div className="text-sm text-gray-600 mt-2">Completed Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
