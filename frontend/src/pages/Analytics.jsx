import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionsAPI, classesAPI } from '@/services/api';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { formatClassDisplay } from '@/utils/classFormatter';
import ClassAnalytics from '@/components/ClassAnalytics';
import StudentAnalytics from '@/components/StudentAnalytics';
import { ChevronDownIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const Analytics = () => {
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [view, setView] = useState('overview'); // 'overview', 'class', 'student'
  
  const queryClient = useQueryClient();
  const { socket } = useWebSocket();

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

  // Listen for session end events to refresh analytics
  useEffect(() => {
    if (!socket) return;

    const handleSessionUpdate = (data) => {
      console.log('Session update received:', data);
      
      // Invalidate analytics queries to trigger refresh
      if (selectedClassId) {
        queryClient.invalidateQueries(['classAnalytics', selectedClassId]);
      }
      if (selectedStudentId) {
        queryClient.invalidateQueries(['studentAnalytics', selectedClassId, selectedStudentId]);
      }
      
      // Also refresh overview stats
      queryClient.invalidateQueries(['sessions']);
      queryClient.invalidateQueries(['sessionStats']);
    };

    socket.on('session:ended', handleSessionUpdate);
    socket.on('session:updated', handleSessionUpdate);

    return () => {
      socket.off('session:ended', handleSessionUpdate);
      socket.off('session:updated', handleSessionUpdate);
    };
  }, [socket, queryClient, selectedClassId, selectedStudentId]);

  const handleClassSelect = (classId) => {
    setSelectedClassId(classId);
    setSelectedStudentId(null);
    setView('class');
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
    setView('student');
  };

  const handleBackToClass = () => {
    setSelectedStudentId(null);
    setView('class');
  };

  const handleBackToOverview = () => {
    setSelectedClassId(null);
    setSelectedStudentId(null);
    setView('overview');
  };

  // Render Student Analytics View
  if (view === 'student' && selectedClassId && selectedStudentId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            Student Analytics <span className="ml-2">👤</span>
          </h1>
          <button
            onClick={handleBackToOverview}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Overview
          </button>
        </div>
        <StudentAnalytics
          classId={selectedClassId}
          studentId={selectedStudentId}
          onBack={handleBackToClass}
        />
      </div>
    );
  }

  // Render Class Analytics View
  if (view === 'class' && selectedClassId) {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackToOverview}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center mt-2">
              {formatClassDisplay(selectedClass)} <span className="ml-2">📊</span>
            </h1>
            {selectedClass && (
              <div className="flex items-center gap-2 text-sm mt-2">
                {selectedClass.section && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Section: {selectedClass.section}</span>
                )}
                {selectedClass.subject && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Subject: {selectedClass.subject}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <ClassAnalytics
          classId={selectedClassId}
          onSelectStudent={handleStudentSelect}
        />
      </div>
    );
  }

  // Render Overview
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center">
        Analytics Overview <span className="ml-2">📊</span>
      </h1>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-8 text-center border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-700 mb-2">Total Classes</h3>
          <p className="text-6xl font-bold text-gray-900">
            {classesLoading ? '...' : (classStats.totalClasses || classes.length || 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-8 text-center border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-700 mb-2">Total Sessions</h3>
          <p className="text-6xl font-bold text-gray-900">
            {sessionsLoading ? '...' : (sessionStats.totalSessions || sessions.length || 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-md p-8 text-center border border-emerald-200">
          <h3 className="text-sm font-semibold text-emerald-700 mb-2">Completed Sessions</h3>
          <p className="text-6xl font-bold text-gray-900">{sessionStats.completedSessions || 0}</p>
        </div>
      </div>

      {/* Class Selector */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpenIcon className="w-6 h-6 text-accent-600" />
          Select a Class to View Analytics
        </h2>
        
        {classesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500 mb-4">You don't have any classes yet.</p>
            <a
              href="/app/classes"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-accent-600 hover:bg-accent-700 transition-colors"
            >
              Create Your First Class
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => (
              <button
                key={classItem.id}
                onClick={() => handleClassSelect(classItem.id)}
                className="text-left p-4 bg-gray-50 hover:bg-accent-50 border border-gray-200 hover:border-accent-300 rounded-lg transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-accent-700 transition-colors mb-2">
                      {formatClassDisplay(classItem)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {classItem.section && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {classItem.section}
                        </span>
                      )}
                      {classItem.subject && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {classItem.subject}
                        </span>
                      )}
                    </div>
                    {classItem.student_count !== undefined && (
                      <p className="text-xs text-gray-500">
                        {classItem.student_count} student{classItem.student_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <ChevronDownIcon className="w-5 h-5 text-gray-400 group-hover:text-accent-600 transform -rotate-90 transition-colors flex-shrink-0 ml-2" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Session Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Scheduled Sessions</h3>
          <p className="text-4xl font-bold text-blue-600">{sessionStats.scheduledSessions || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Active Sessions</h3>
          <p className="text-4xl font-bold text-green-600">{sessionStats.activeSessions || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Completed Sessions</h3>
          <p className="text-4xl font-bold text-gray-900">{sessionStats.completedSessions || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
