import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';
import DateRangePicker from './DateRangePicker';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  AcademicCapIcon, 
  ClockIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const ClassAnalytics = ({ classId, onSelectStudent }) => {
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
    queryKey: ['classAnalytics', classId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () =>
      classesAPI.getClassAnalytics(classId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    enabled: !!classId,
  });

  if (!classId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <UserGroupIcon className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Class</h3>
        <p className="text-gray-500 text-center max-w-md">
          Choose a class from the dropdown above to view detailed analytics and insights.
        </p>
      </div>
    );
  }

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
        <p className="text-red-800">Error loading analytics: {error.message}</p>
      </div>
    );
  }

  const analytics = analyticsData?.data;

  if (!analytics) {
    return null;
  }

  const { overallStats, sessionTrends, studentPerformance, heatmapData } = analytics;

  // Debug logging
  console.log('Analytics Data:', analytics);
  console.log('Session Trends:', sessionTrends);
  console.log('Date Range:', { startDate, endDate });

  // Check if there's any data
  const hasData = sessionTrends?.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onQuickSelect={handleQuickSelect}
        />
        
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ChartBarIcon className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Yet</h3>
          <p className="text-gray-500 text-center max-w-md mb-4">
            No sessions have been completed in this date range. Start or complete some sessions to see analytics here.
          </p>
          <p className="text-sm text-gray-400">
            Selected range: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  // Format data for charts
  const attendanceChartData = sessionTrends.map((session) => ({
    date: new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Attendance Rate': parseFloat(session.attendance_rate || 0),
    'Participants': parseInt(session.total_participants || 0),
    'Present': parseInt(session.present_count || 0),
    'Avg Duration (min)': parseFloat(session.avg_duration_minutes || 0),
    fullDate: session.session_date,
  }));

  // Top 5 and Bottom 5 students
  const topStudents = studentPerformance.slice(0, 5);
  const bottomStudents = studentPerformance.slice(-5).reverse();

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onQuickSelect={handleQuickSelect}
      />

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{overallStats.totalSessions}</p>
            </div>
            <AcademicCapIcon className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-md p-6 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-sm font-medium mb-1">Avg Attendance Rate</p>
              <p className="text-3xl font-bold text-gray-900">{overallStats.avgAttendanceRate}%</p>
            </div>
            <ChartBarIcon className="w-10 h-10 text-emerald-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-1">Avg Duration</p>
              <p className="text-3xl font-bold text-gray-900">{overallStats.avgDuration} <span className="text-lg">min</span></p>
            </div>
            <ClockIcon className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium mb-1">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{overallStats.totalStudents}</p>
            </div>
            <UserGroupIcon className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Attendance Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={attendanceChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280" 
              style={{ fontSize: '12px' }}
              label={{ value: 'Attendance Rate (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Attendance Rate" 
              stroke="#557170" 
              strokeWidth={3}
              dot={{ fill: '#557170', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Session Participation Bar Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Participation (Join/Leave Data)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={attendanceChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280" 
              style={{ fontSize: '12px' }}
              label={{ value: 'Number of Participants', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="Participants" fill="#3b82f6" name="Total Participants" />
            <Bar dataKey="Present" fill="#10b981" name="Marked Present" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-500 mt-2">
          This shows participants detected through join/leave events and their presence status
        </p>
      </div>

      {/* Duration Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Session Duration</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={attendanceChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280" 
              style={{ fontSize: '12px' }}
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
            />
            <Bar dataKey="Avg Duration (min)" fill="#a855f7" name="Avg Duration (minutes)" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-500 mt-2">
          Average time students spent in each session (calculated from join/leave intervals)
        </p>
      </div>

      {/* Top and Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
          </div>
          {topStudents.length > 0 ? (
            <div className="space-y-3">
              {topStudents.map((student, index) => (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent && onSelectStudent(student.id)}
                  className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.sessions_attended}/{student.total_sessions} sessions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-700">{student.attendance_rate}%</p>
                    <p className="text-xs text-gray-500">{student.avg_duration_minutes.toFixed(0)} min avg</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No student data available</p>
          )}
        </div>

        {/* Bottom Performers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ArrowTrendingDownIcon className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Needs Attention</h3>
          </div>
          {bottomStudents.length > 0 ? (
            <div className="space-y-3">
              {bottomStudents.map((student, index) => (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent && onSelectStudent(student.id)}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.sessions_attended}/{student.total_sessions} sessions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-700">{student.attendance_rate}%</p>
                    <p className="text-xs text-gray-500">{student.avg_duration_minutes.toFixed(0)} min avg</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No student data available</p>
          )}
        </div>
      </div>

      {/* All Students Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Students Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Duration
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Late
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentPerformance.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => onSelectStudent && onSelectStudent(student.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.full_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.attendance_rate >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : student.attendance_rate >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.attendance_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                    {student.sessions_attended}/{student.total_sessions}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                    {student.avg_duration_minutes.toFixed(0)} min
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-emerald-600 font-medium">
                    {student.present_count}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-yellow-600 font-medium">
                    {student.late_count}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-red-600 font-medium">
                    {student.absent_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassAnalytics;
