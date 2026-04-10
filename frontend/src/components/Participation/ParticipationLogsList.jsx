import React, { useState, useMemo } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import InteractionTypeBadge from './InteractionTypeBadge';

const ParticipationLogsList = ({ logs = [], isLoading = false }) => {
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const itemsPerPage = 50;

  const getAdditionalData = (log) => {
    if (log?._additionalData) return log._additionalData;
    if (!log?.additional_data) return null;
    if (typeof log.additional_data === 'string') {
      try {
        return JSON.parse(log.additional_data);
      } catch {
        return null;
      }
    }
    return log.additional_data;
  };

  const toTimestamp = (value) => {
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
  };

  const pairedLogs = useMemo(() => {
    const sortedByTime = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const pendingMicStarts = new Map();
    const rows = [];

    sortedByTime.forEach((log) => {
      if (log.interaction_type !== 'mic_toggle') {
        rows.push({ ...log, _additionalData: getAdditionalData(log) });
        return;
      }

      const additionalData = getAdditionalData(log) || {};
      const participantName = String(
        additionalData.participant_name || log.student_name || log.full_name || ''
      ).trim().toLowerCase();
      const sessionId = log.session_id || '';
      const micKey = `${sessionId}:${participantName}`;
      const isMuted = typeof additionalData.isMuted === 'boolean' ? additionalData.isMuted : null;

      if (isMuted === false) {
        pendingMicStarts.set(micKey, { log, additionalData });
        return;
      }

      if (isMuted === true && pendingMicStarts.has(micKey)) {
        const startEntry = pendingMicStarts.get(micKey);
        const unmutedAt = startEntry.log.timestamp;
        const mutedAt = log.timestamp;
        const startMs = toTimestamp(unmutedAt);
        const endMs = toTimestamp(mutedAt);

        const derivedDurationSeconds =
          Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs
            ? Math.round((endMs - startMs) / 1000)
            : null;

        rows.push({
          ...log,
          _isMicPair: true,
          _additionalData: {
            ...additionalData,
            speakingStartedAt: additionalData.speakingStartedAt || unmutedAt,
            speakingEndedAt: additionalData.speakingEndedAt || mutedAt,
            speakingDurationSeconds:
              Number(additionalData.speakingDurationSeconds) || derivedDurationSeconds,
            paired_unmuted_at: unmutedAt,
            paired_muted_at: mutedAt
          }
        });

        pendingMicStarts.delete(micKey);
        return;
      }

      rows.push({ ...log, _additionalData: additionalData });
    });

    pendingMicStarts.forEach(({ log, additionalData }) => {
      rows.push({ ...log, _additionalData: additionalData });
    });

    return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [logs]);

  // Sort and paginate logs
  const sortedAndPaginatedLogs = useMemo(() => {
    if (!pairedLogs.length) return [];

    // Sort
    const sorted = [...pairedLogs].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle student name sorting
      if (sortField === 'student_name') {
        aVal = (a.full_name || a.student_name || '').toLowerCase();
        bVal = (b.full_name || b.student_name || '').toLowerCase();
      }

      // Handle timestamp sorting
      if (sortField === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginate
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [pairedLogs, sortField, sortDirection, currentPage]);

  const totalPages = Math.ceil(pairedLogs.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const toggleRowExpansion = (logId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatSpeakingDuration = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    if (seconds < 60) return `${seconds}s`;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const renderInteractionValue = (log) => {
    if (log.interaction_type === 'hand_raise') {
      return 'raised hand';
    }

    if (log.interaction_type !== 'mic_toggle') {
      return log.interaction_value || '-';
    }

    const additionalData = getAdditionalData(log) || {};
    const isMuted = typeof additionalData.isMuted === 'boolean' ? additionalData.isMuted : null;
    const durationFromMetadata = Number(additionalData.speakingDurationSeconds);
    const durationLabel =
      additionalData.speakingDurationLabel ||
      formatSpeakingDuration(durationFromMetadata);

    if ((isMuted === true || log._isMicPair) && durationLabel) {
      return `spoke for ${durationLabel}`;
    }

    if (isMuted === false) {
      return 'unmuted mic';
    }

    return log.interaction_value || '-';
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading participation logs...</span>
        </div>
      </div>
    );
  }

  if (pairedLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <ClockIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Participation Logs</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          No participation data has been captured yet. Logs will appear here automatically when the 
          browser extension tracks student interactions during the session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Participation Logs</h3>
        <p className="text-sm text-gray-600 mt-1">
          Detailed chronological record of all student interactions during the session
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('student_name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-2">
                    Student Name
                    <SortIcon field="student_name" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('interaction_type')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-2">
                    Interaction Type
                    <SortIcon field="interaction_type" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('interaction_value')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-2">
                    Value
                    <SortIcon field="interaction_value" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('timestamp')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-2">
                    Timestamp
                    <SortIcon field="timestamp" />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Additional Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndPaginatedLogs.map((log) => {
                const isExpanded = expandedRows.has(log.id);
                const additionalData = getAdditionalData(log);
                const hasAdditionalData = additionalData && Object.keys(additionalData).length > 0;

                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {log.full_name || log.student_name}
                          </div>
                          {log.student_id && (
                            <div className="text-xs text-gray-500">{log.student_id}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <InteractionTypeBadge type={log.interaction_type} size="sm" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {renderInteractionValue(log)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {hasAdditionalData ? (
                          <button
                            onClick={() => toggleRowExpansion(log.id)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <InformationCircleIcon className="w-5 h-5" />
                            {isExpanded ? 'Hide' : 'View'}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && hasAdditionalData && (
                      <tr className="bg-gray-50">
                        <td colSpan="5" className="px-6 py-4">
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            {log.interaction_type === 'mic_toggle' && additionalData.paired_unmuted_at && additionalData.paired_muted_at && (
                              <div className="mb-3">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Mic Pair Timeline</h4>
                                <div className="text-xs text-gray-700 space-y-1">
                                  <p><span className="font-medium">Unmuted at:</span> {formatTimestamp(additionalData.paired_unmuted_at)}</p>
                                  <p><span className="font-medium">Muted at:</span> {formatTimestamp(additionalData.paired_muted_at)}</p>
                                </div>
                              </div>
                            )}

                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Data:</h4>
                            <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(
                                additionalData,
                                null, 
                                2
                              )}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, pairedLogs.length)} of {pairedLogs.length} logs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Show first, last, current, and adjacent pages
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipationLogsList;
