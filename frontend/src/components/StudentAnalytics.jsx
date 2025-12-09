import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';
import DateRangePicker from './DateRangePicker';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  UserIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const StudentAnalytics = ({ classId, studentId, onBack }) => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const handleQuickSelect = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['studentAnalytics', classId, studentId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () =>
      classesAPI.getStudentAnalytics(classId, studentId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    enabled: !!classId && !!studentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading student analytics: {error.message}</p>
      </div>
    );
  }

  const analytics = analyticsData?.data;

  if (!analytics) {
    return null;
  }

  const { student, overallStats, sessionHistory, timeline } = analytics;

  const hasData = sessionHistory?.length > 0;

  // Format timeline data for chart
  const timelineChartData = timeline?.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    attended: parseInt(day.attended),
    total: parseInt(day.total_sessions),
    duration: parseFloat(day.total_duration),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Class
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {student.full_name}
          </h2>
        </div>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onQuickSelect={handleQuickSelect}
      />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <UserIcon className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Session Data</h3>
          <p className="text-gray-500 text-center max-w-md mb-4">
            This student has no recorded attendance in the selected date range.
          </p>
          <p className="text-sm text-gray-400">
            Selected range: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium mb-1">Total Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">{overallStats.totalSessions}</p>
                </div>
                <CalendarIcon className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-md p-6 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-700 text-sm font-medium mb-1">Attendance Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{overallStats.attendanceRate}%</p>
                </div>
                <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-700 text-sm font-medium mb-1">Avg Duration</p>
                  <p className="text-3xl font-bold text-gray-900">{overallStats.avgDurationMinutes} <span className="text-lg">min</span></p>
                </div>
                <ClockIcon className="w-10 h-10 text-purple-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm font-medium mb-1">Total Time</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.floor(overallStats.totalDurationMinutes / 60)}
                    <span className="text-lg">h</span> {Math.round(overallStats.totalDurationMinutes % 60)}
                    <span className="text-lg">m</span>
                  </p>
                </div>
                <ClockIcon className="w-10 h-10 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Present</p>
              <p className="text-3xl font-bold text-emerald-600">{overallStats.sessionsAttended}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Late</p>
              <p className="text-3xl font-bold text-yellow-600">{overallStats.sessionsLate}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircleIcon className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Absent</p>
              <p className="text-3xl font-bold text-red-600">{overallStats.sessionsAbsent}</p>
            </div>
          </div>

          {/* Attendance Timeline */}
          {timelineChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Timeline</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={timelineChartData}>
                  <defs>
                    <linearGradient id="colorAttended" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#557170" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#557170" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="attended"
                    stroke="#557170"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAttended)"
                    name="Sessions Attended"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Session History Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Join/Leave Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessionHistory.map((session) => {
                    const intervals = session.intervals || [];
                    return (
                      <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{session.title}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(session.session_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {session.attendance_status ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                session.attendance_status === 'present'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : session.attendance_status === 'late'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {session.attendance_status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              absent
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                          {session.total_duration_minutes
                            ? `${Math.round(session.total_duration_minutes)} min`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                          {intervals.length > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="text-emerald-600 font-medium">{intervals.length}</span>
                              <span className="text-gray-500">join{intervals.length !== 1 ? 's' : ''}</span>
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAnalytics;
