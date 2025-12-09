import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sessionsAPI, classesAPI } from '@/services/api';
import { formatClassDisplay } from '@/utils/classFormatter';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import SessionCalendarView from '@/components/Sessions/SessionCalendarView';

const Sessions = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ['sessions-calendar', currentYear, currentMonth],
    queryFn: () => sessionsAPI.getCalendarData(currentYear, currentMonth),
    enabled: viewMode === 'calendar',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const sessions = sessionsData?.data || [];
  const calendarSessions = calendarData?.data || [];
  const classes = classesData?.data || [];

  const formatSessionTime = (session) => {
    // Format: "Dec 8 • 7:35 PM - 8:20 PM"
    if (session.started_at) {
      const startDate = new Date(session.started_at);
      const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      
      if (session.ended_at) {
        const endDate = new Date(session.ended_at);
        const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${dateStr} • ${startTime} - ${endTime}`;
      }
      
      return `${dateStr} • ${startTime} - In Progress`;
    }
    
    // Fallback for scheduled sessions
    if (session.session_date) {
      const date = new Date(session.session_date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (session.session_time) {
        const timeStr = session.session_time.substring(0, 5);
        return `${dateStr} • ${timeStr}`;
      }
      return dateStr;
    }
    
    return 'N/A';
  };

  const handleMonthChange = (year, month) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sessions are automatically created when you start tracking via the browser extension
          </p>
        </div>
        <div className="flex gap-3">
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ListBulletIcon className="w-5 h-5" />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 flex items-center gap-2 border-l border-gray-300 ${
                viewMode === 'calendar'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'calendar' ? (
        calendarLoading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            Loading calendar...
          </div>
        ) : (
          <SessionCalendarView
            sessions={calendarSessions}
            onMonthChange={handleMonthChange}
          />
        )
      ) : (
        <>
          {isLoading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-500">Sessions are automatically created when you start tracking attendance via the browser extension</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Session Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => {
                    const classInfo = classes.find(c => c.id === session.class_id);
                    const sessionTime = formatSessionTime(session);
                    return (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{sessionTime}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{classInfo ? formatClassDisplay(classInfo) : 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              session.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : session.status === 'ended'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/app/sessions/${session.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Sessions;
