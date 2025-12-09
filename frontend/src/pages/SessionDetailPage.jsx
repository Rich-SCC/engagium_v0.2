import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsAPI, participationAPI, classesAPI } from '@/services/api';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  StopIcon,
  CalendarIcon,
  ClockIcon,
  LinkIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import AttendanceRoster from '@/components/Sessions/AttendanceRoster';
import SessionFormModal from '@/components/Sessions/SessionFormModal';
import ParticipationSummary from '@/components/Participation/ParticipationSummary';
import ParticipationFilters from '@/components/Participation/ParticipationFilters';
import ParticipationLogsList from '@/components/Participation/ParticipationLogsList';
import { formatMeetingLinkForDisplay, getMeetingLinkText } from '@/utils/urlUtils';

const SessionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance'); // attendance, participation, details

  // Participation filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Queries
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionsAPI.getWithAttendance(id),
  });

  const { data: participationData, isLoading: isLoadingParticipation, refetch: refetchParticipation } = useQuery({
    queryKey: ['participation', id],
    queryFn: () => participationAPI.getSummary(id),
    enabled: activeTab === 'participation'
  });

  const { data: participationLogsData, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['participation-logs', id, selectedType],
    queryFn: () => participationAPI.getLogs(id, { interaction_type: selectedType || undefined }),
    enabled: activeTab === 'participation'
  });

  const session = sessionData?.data;
  const participation = participationData?.data;
  const participationLogs = participationLogsData?.data?.data || [];

  // Mutations
  const updateSessionMutation = useMutation({
    mutationFn: (data) => sessionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['session', id]);
      queryClient.invalidateQueries(['sessions']);
      queryClient.refetchQueries(['session', id]); // Force immediate refetch
      queryClient.refetchQueries(['sessions']); // Force immediate refetch
      setShowEditModal(false);
    }
  });

  // Mutation for adding participant to roster
  const addToRosterMutation = useMutation({
    mutationFn: async ({ sessionId, participantName, createStudent }) => {
      console.log('[SessionDetail] Adding participant to roster:', { sessionId, participantName, createStudent });
      return sessionsAPI.linkParticipantToStudent(sessionId, {
        participant_name: participantName,
        create_student: createStudent
      });
    },
    onSuccess: (data) => {
      console.log('[SessionDetail] Successfully added to roster:', data);
      queryClient.invalidateQueries(['session', id]);
      queryClient.refetchQueries(['session', id]); // Force immediate refetch
      
      const message = data?.data?.created_new 
        ? `Successfully created new student: ${data?.data?.student?.full_name || 'Unknown'}`
        : `Successfully linked to existing student: ${data?.data?.student?.full_name || 'Unknown'}`;
      
      alert(message);
    },
    onError: (error) => {
      console.error('[SessionDetail] Failed to add to roster:', error);
      
      let errorMessage = 'Failed to add participant to roster';
      if (error.response?.data?.error) {
        errorMessage += ': ' + error.response.data.error;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      alert(errorMessage);
    }
  });

  const handleAddToRoster = async ({ sessionId, participantName, createStudent }) => {
    await addToRosterMutation.mutateAsync({ sessionId, participantName, createStudent });
  };

  const deleteSessionMutation = useMutation({
    mutationFn: () => sessionsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions']);
      navigate('/app/sessions');
    }
  });

  const startSessionMutation = useMutation({
    mutationFn: () => sessionsAPI.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['session', id]);
      queryClient.invalidateQueries(['sessions']);
      queryClient.refetchQueries(['session', id]); // Force immediate refetch
      queryClient.refetchQueries(['sessions']); // Force immediate refetch
    }
  });

  const endSessionMutation = useMutation({
    mutationFn: () => sessionsAPI.end(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['session', id]);
      queryClient.invalidateQueries(['sessions']);
      queryClient.refetchQueries(['session', id]); // Force immediate refetch
      queryClient.refetchQueries(['sessions']); // Force immediate refetch
    }
  });

  const handleDelete = () => {
    if (confirm('Delete this session? This will also delete all attendance and participation records.')) {
      deleteSessionMutation.mutate();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading session...</div>;
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Session not found</p>
        <button
          onClick={() => navigate('/app/sessions')}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Sessions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/sessions')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-gray-600 mt-1">{session.class_name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {session.status === 'scheduled' && (
            <>
              <button
                onClick={() => startSessionMutation.mutate()}
                disabled={startSessionMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <PlayIcon className="w-5 h-5" />
                Start Session
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <PencilIcon className="w-5 h-5" />
                Edit
              </button>
            </>
          )}
          {session.status === 'active' && (
            <button
              onClick={() => endSessionMutation.mutate()}
              disabled={endSessionMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <StopIcon className="w-5 h-5" />
              End Session
            </button>
          )}
          {/* Delete button - available for all statuses */}
          <button
            onClick={handleDelete}
            disabled={deleteSessionMutation.isPending}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <TrashIcon className="w-5 h-5" />
            Delete
          </button>
        </div>
      </div>

      {/* Session Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <CalendarIcon className="w-6 h-6 text-gray-400 mt-1" />
            <div>
              <div className="text-sm text-gray-600">Date</div>
              <div className="font-semibold text-gray-900">{formatDate(session.session_date)}</div>
            </div>
          </div>

          {session.session_time && (
            <div className="flex items-start gap-3">
              <ClockIcon className="w-6 h-6 text-gray-400 mt-1" />
              <div>
                <div className="text-sm text-gray-600">Time</div>
                <div className="font-semibold text-gray-900">{formatTime(session.session_time)}</div>
              </div>
            </div>
          )}

          <div>
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                session.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : session.status === 'ended'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {session.status}
            </span>
          </div>

          {session.meeting_link && (
            <div className="flex items-start gap-3">
              <LinkIcon className="w-6 h-6 text-gray-400 mt-1" />
              <div>
                <div className="text-sm text-gray-600 mb-1">Meeting Link</div>
                <a
                  href={formatMeetingLinkForDisplay(session.meeting_link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm break-all"
                >
                  {getMeetingLinkText(session.meeting_link)} →
                </a>
              </div>
            </div>
          )}
        </div>

        {(session.topic || session.description) && (
          <div className="mt-6 pt-6 border-t">
            {session.topic && (
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">Topic</div>
                <div className="text-gray-900">{session.topic}</div>
              </div>
            )}
            {session.description && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Description</div>
                <div className="text-gray-900">{session.description}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-4 px-2 border-b-2 font-medium transition ${
                activeTab === 'attendance'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5" />
                Attendance
              </div>
            </button>
            <button
              onClick={() => setActiveTab('participation')}
              className={`py-4 px-2 border-b-2 font-medium transition ${
                activeTab === 'participation'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                Participation
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'attendance' && (
            <AttendanceRoster 
              attendance={session.attendance || []} 
              sessionId={session.id}
              classId={session.class_id}
              onAddToRoster={handleAddToRoster}
            />
          )}

          {activeTab === 'participation' && (
            <div className="space-y-6">
              {/* Participation Summary */}
              <ParticipationSummary 
                summary={participation}
                interactionSummary={participation?.interactionSummary || []}
              />

              {/* Filters */}
              <ParticipationFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                onRefresh={() => {
                  refetchParticipation();
                  refetchLogs();
                }}
                isRefreshing={isLoadingParticipation || isLoadingLogs}
              />

              {/* Logs List */}
              <ParticipationLogsList
                logs={participationLogs.filter(log => {
                  // Filter by search term
                  if (searchTerm) {
                    const fullName = (log.full_name || log.student_name || '').toLowerCase();
                    if (!fullName.includes(searchTerm.toLowerCase())) {
                      return false;
                    }
                  }
                  return true;
                })}
                isLoading={isLoadingLogs}
              />
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <SessionFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={(data) => updateSessionMutation.mutate(data)}
        initialData={session}
        isLoading={updateSessionMutation.isPending}
      />
    </div>
  );
};

export default SessionDetailPage;
