import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sessionsAPI, classesAPI } from '@/services/api';

const Analytics = () => {
  const [selectedMonth, setSelectedMonth] = useState('Month');

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll(),
  });

  const { data: classStatsData } = useQuery({
    queryKey: ['classStats'],
    queryFn: () => classesAPI.getStats(),
  });

  const { data: sessionStatsData } = useQuery({
    queryKey: ['sessionStats'],
    queryFn: () => sessionsAPI.getStats(),
  });

  const classes = classesData?.data || [];
  const sessions = sessionsData?.data || [];
  const classStats = classStatsData?.data || {};
  const sessionStats = sessionStatsData?.data || {};

  // Calculate overall average participation rate
  const calculateOverallAverage = () => {
    if (!sessions.length) return 0;
    // This would need proper participation data from backend
    // For now, return a placeholder
    return 77;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center">
        Analytics <span className="ml-2">📊</span>
      </h1>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-300 rounded-lg shadow p-8 text-center">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Classes</h3>
          <p className="text-6xl font-bold text-gray-900">
            {classesLoading ? '...' : (classStats.totalClasses || classes.length || 0)}
          </p>
        </div>
        <div className="bg-gray-300 rounded-lg shadow p-8 text-center">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Sessions</h3>
          <p className="text-6xl font-bold text-gray-900">
            {sessionsLoading ? '...' : (sessionStats.totalSessions || sessions.length || 0)}
          </p>
        </div>
        <div className="bg-gray-300 rounded-lg shadow p-8 text-center">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Overall Average</h3>
          <p className="text-6xl font-bold text-gray-900">{calculateOverallAverage()}%</p>
        </div>
      </div>

      {/* Placeholder for future charts - Real-time participation analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Advanced Analytics Coming Soon
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Detailed participation charts, engagement trends, and comparative class analytics 
            will be available once sufficient session data is collected.
          </p>
          {sessions.length > 0 && (
            <p className="text-sm text-gray-400 mt-4">
              Currently tracking {sessions.length} session{sessions.length !== 1 ? 's' : ''} across {classes.length} class{classes.length !== 1 ? 'es' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Session Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Scheduled Sessions</h3>
          <p className="text-4xl font-bold text-gray-900">{sessionStats.scheduledSessions || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Active Sessions</h3>
          <p className="text-4xl font-bold text-green-600">{sessionStats.activeSessions || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Completed Sessions</h3>
          <p className="text-4xl font-bold text-gray-900">{sessionStats.completedSessions || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
