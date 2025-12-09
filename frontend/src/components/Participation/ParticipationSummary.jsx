import React from 'react';
import {
  ChatBubbleLeftIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import InteractionTypeBadge from './InteractionTypeBadge';

const ParticipationSummary = ({ summary, interactionSummary }) => {
  if (!summary || !interactionSummary) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Loading participation summary...</p>
      </div>
    );
  }

  const totalInteractions = summary.stats?.total_interactions || 0;
  const uniqueStudents = summary.stats?.unique_participants || 0;
  const totalStudents = summary.session?.total_students || summary.stats?.total_students || 0;
  const participationRate = totalStudents > 0 
    ? ((uniqueStudents / totalStudents) * 100).toFixed(1) 
    : 0;

  // Find most active student from studentSummary
  const mostActive = summary.studentSummary?.reduce((max, student) => 
    (student.total_interactions > (max?.total_interactions || 0)) ? student : max
  , null);

  // Create interaction type breakdown - only actual participation events
  const interactionTypes = [
    { type: 'chat', label: 'Chat Messages', icon: ChatBubbleLeftIcon, color: 'blue' },
    { type: 'reaction', label: 'Reactions', icon: FaceSmileIcon, color: 'yellow' },
    { type: 'mic_toggle', label: 'Mic Toggles', icon: MicrophoneIcon, color: 'green' },
    { type: 'camera_toggle', label: 'Camera Toggles', icon: VideoCameraIcon, color: 'purple' }
  ];

  const getInteractionCount = (type) => {
    const item = interactionSummary.find(i => i.interaction_type === type);
    return item ? parseInt(item.count) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Participation Analytics</h2>
        <p className="text-sm text-gray-600">
          Real-time tracking of student interactions and engagement during the session.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Interactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Interactions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalInteractions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Unique Students */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Students Participated</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {uniqueStudents}
                <span className="text-sm text-gray-500 font-normal ml-1">/ {totalStudents}</span>
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Participation Rate */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Participation Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{participationRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${participationRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Most Active Student */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Most Active</p>
            <div className="p-2 bg-amber-100 rounded-lg">
              <FaceSmileIcon className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          {mostActive ? (
            <>
              <p className="text-lg font-semibold text-gray-900 truncate" title={mostActive.full_name}>
                {mostActive.full_name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {mostActive.total_interactions} interaction{mostActive.total_interactions !== 1 ? 's' : ''}
              </p>
            </>
          ) : (
            <p className="text-gray-400">No data yet</p>
          )}
        </div>
      </div>

      {/* Interaction Type Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interaction Types</h3>
        <p className="text-sm text-gray-500 mb-4">
          Participation events tracked during the session (excludes join/leave events)
        </p>
        <div className="space-y-4">
          {interactionTypes.map(({ type, label, icon: Icon, color }) => {
            const count = getInteractionCount(type);
            const percentage = totalInteractions > 0 
              ? ((count / totalInteractions) * 100).toFixed(1) 
              : 0;

            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${color}-100 rounded-lg`}>
                      <Icon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                    <span className="text-sm text-gray-500 w-12 text-right">{percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div
                    className={`bg-${color}-600 h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {totalInteractions === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>No participation data yet</p>
            <p className="text-sm mt-1">Data will appear as the extension captures events</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipationSummary;
