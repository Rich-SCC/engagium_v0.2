import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  UserPlusIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const AttendanceRoster = ({ 
  attendance = [], 
  isLoading = false, 
  sessionId = null,
  classId = null,
  onAddToRoster = null // Callback for adding participant to roster
}) => {
  const [expandedParticipant, setExpandedParticipant] = useState(null);
  const [addingToRoster, setAddingToRoster] = useState(null);

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return '-';
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const handleAddToRoster = async (record) => {
    if (!onAddToRoster || !sessionId) return;
    
    setAddingToRoster(record.participant_name);
    try {
      await onAddToRoster({
        sessionId,
        participantName: record.participant_name,
        createStudent: true
      });
      // The parent component will invalidate queries and refresh the data
      // The button will disappear on next render when student_id is populated
    } catch (error) {
      console.error('[AttendanceRoster] Failed to add to roster:', error);
    } finally {
      setAddingToRoster(null);
    }
  };

  const toggleIntervals = (participantName) => {
    setExpandedParticipant(
      expandedParticipant === participantName ? null : participantName
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        Loading attendance...
      </div>
    );
  }

  if (attendance.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No attendance records yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Records will appear here when the extension submits attendance data
        </p>
      </div>
    );
  }

  // Split into matched and unmatched
  const matchedRecords = attendance.filter(a => a.student_id);
  const unmatchedRecords = attendance.filter(a => !a.student_id);
  
  const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const attendanceRate = attendance.length > 0 
    ? ((presentCount / attendance.length) * 100).toFixed(1) 
    : 0;
  const totalMinutes = attendance.reduce((sum, a) => sum + (a.total_duration_minutes || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Participants</div>
          <div className="text-2xl font-bold text-gray-900">{attendance.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Present</div>
          <div className="text-2xl font-bold text-green-600">{presentCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Attendance Rate</div>
          <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Time</div>
          <div className="text-2xl font-bold text-purple-600">{formatDuration(totalMinutes)}</div>
        </div>
      </div>

      {/* Unmatched Participants Warning */}
      {unmatchedRecords.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <UserPlusIcon className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">
              {unmatchedRecords.length} unmatched participant{unmatchedRecords.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            These participants don't match any students in your roster. Click "Add to Roster" to create students from them.
          </p>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Join/Leave Times
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendance.map((record) => (
              <React.Fragment key={record.id || record.participant_name}>
                <tr className={`hover:bg-gray-50 ${!record.student_id ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {record.student_name || record.participant_name}
                      </div>
                      {record.student_id && record.participant_name !== record.student_name && (
                        <div className="text-xs text-gray-500">
                          Google Meet: {record.participant_name}
                        </div>
                      )}
                      {!record.student_id && (
                        <div className="text-xs text-yellow-600 font-medium">
                          Not in roster
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.status === 'present' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Present
                      </span>
                    ) : record.status === 'late' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Late
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Absent
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDuration(record.total_duration_minutes)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <span>
                        {formatTime(record.first_joined_at)} - {formatTime(record.last_left_at)}
                      </span>
                      {record.intervals && record.intervals.length > 1 && (
                        <button
                          onClick={() => toggleIntervals(record.participant_name)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          title="View all intervals"
                        >
                          {expandedParticipant === record.participant_name ? (
                            <ChevronUpIcon className="w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4" />
                          )}
                          <span className="text-xs ml-1">
                            ({record.intervals.length} intervals)
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!record.student_id && onAddToRoster && (
                      <button
                        onClick={() => handleAddToRoster(record)}
                        disabled={addingToRoster === record.participant_name}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                      >
                        <UserPlusIcon className="w-4 h-4 mr-1" />
                        {addingToRoster === record.participant_name ? 'Adding...' : 'Add to Roster'}
                      </button>
                    )}
                  </td>
                </tr>
                
                {/* Expanded Intervals Row */}
                {expandedParticipant === record.participant_name && record.intervals && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 bg-gray-50">
                      <div className="text-sm text-gray-700">
                        <div className="font-medium mb-2">Join/Leave History:</div>
                        <div className="space-y-1">
                          {record.intervals.map((interval, idx) => (
                            <div key={idx} className="flex items-center text-xs">
                              <span className="w-6 text-gray-400">#{idx + 1}</span>
                              <span className="text-green-600">
                                Joined: {formatTime(interval.joined_at)}
                              </span>
                              <span className="mx-2 text-gray-400">→</span>
                              <span className="text-red-600">
                                Left: {interval.left_at ? formatTime(interval.left_at) : 'Still present'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceRoster;
