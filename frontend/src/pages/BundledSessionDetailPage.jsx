import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { sessionsAPI, participationAPI, classesAPI } from '@/services/api';
import { formatClassDisplay } from '@/utils/classFormatter';
import AttendanceRoster from '@/components/Sessions/AttendanceRoster';
import ParticipationSummary from '@/components/Participation/ParticipationSummary';
import ParticipationFilters from '@/components/Participation/ParticipationFilters';
import ParticipationLogsList from '@/components/Participation/ParticipationLogsList';

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateLabel = (value) => {
  const date = toDate(value);
  if (!date) return '-';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTimeLabel = (value) => {
  const date = toDate(value);
  if (!date) return '-';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const statusPriority = {
  absent: 1,
  late: 2,
  present: 3,
};

const pickBetterStatus = (existing, incoming) => {
  const current = existing || 'absent';
  const next = incoming || 'absent';
  return (statusPriority[next] || 0) > (statusPriority[current] || 0) ? next : current;
};

const BundledSessionDetailPage = () => {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('attendance');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const bundleFromState = location.state?.bundle || null;

  const sessionIds = useMemo(() => {
    if (Array.isArray(bundleFromState?.session_ids) && bundleFromState.session_ids.length > 0) {
      return bundleFromState.session_ids.map((id) => String(id));
    }

    const idsParam = searchParams.get('ids');
    if (!idsParam) return [];

    return idsParam
      .split(',')
      .map((value) => decodeURIComponent(value).trim())
      .filter(Boolean);
  }, [bundleFromState, searchParams]);

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: bulkAttendanceData, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ['sessions-bundle-attendance', sessionIds],
    queryFn: () => sessionsAPI.getBulkAttendanceWithIntervals(sessionIds),
    enabled: sessionIds.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: bulkParticipationData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['sessions-bundle-participation', sessionIds],
    queryFn: () => participationAPI.getBulkLogs(sessionIds),
    enabled: activeTab === 'participation' && sessionIds.length > 0,
    staleTime: 60 * 1000,
  });

  const allSessions = sessionsData?.data || [];
  const allClasses = classesData?.data || [];

  const fragments = useMemo(() => {
    const byId = new Map(allSessions.map((session) => [String(session.id), session]));

    const fromApi = sessionIds
      .map((id) => byId.get(String(id)))
      .filter(Boolean);

    if (fromApi.length > 0) {
      return [...fromApi].sort((left, right) => {
        const leftTs = toDate(left.started_at || left.created_at)?.getTime() || 0;
        const rightTs = toDate(right.started_at || right.created_at)?.getTime() || 0;
        return leftTs - rightTs;
      });
    }

    if (Array.isArray(bundleFromState?.sessions)) {
      return [...bundleFromState.sessions].sort((left, right) => {
        const leftTs = toDate(left.start_at || left.started_at)?.getTime() || 0;
        const rightTs = toDate(right.start_at || right.started_at)?.getTime() || 0;
        return leftTs - rightTs;
      });
    }

    return [];
  }, [allSessions, sessionIds, bundleFromState]);

  const classInfo = useMemo(() => {
    if (bundleFromState?.classInfo) return bundleFromState.classInfo;
    const first = fragments[0];
    if (!first?.class_id) return null;
    return allClasses.find((value) => String(value.id) === String(first.class_id)) || null;
  }, [bundleFromState, fragments, allClasses]);

  const plannedStartAt = bundleFromState?.planned_start_at || null;
  const plannedEndAt = bundleFromState?.planned_end_at || null;

  const stitchedStartAt = useMemo(() => {
    const first = fragments.find((fragment) => toDate(fragment.started_at || fragment.start_at));
    return first ? (first.started_at || first.start_at) : null;
  }, [fragments]);

  const stitchedEndAt = useMemo(() => {
    const reversed = [...fragments].reverse();
    const first = reversed.find((fragment) => toDate(fragment.ended_at || fragment.end_at || fragment.started_at || fragment.start_at));
    return first ? (first.ended_at || first.end_at || first.started_at || first.start_at) : null;
  }, [fragments]);

  const stitchedAttendance = useMemo(() => {
    const grouped = bulkAttendanceData?.data || {};
    const merged = new Map();

    sessionIds.forEach((sessionId) => {
      const records = Array.isArray(grouped[sessionId]) ? grouped[sessionId] : [];

      records.forEach((record) => {
        const participantName = String(record.participant_name || '').trim();
        const key = record.student_id
          ? `student:${record.student_id}`
          : `name:${participantName.toLowerCase()}`;

        if (!merged.has(key)) {
          merged.set(key, {
            id: key,
            student_id: record.student_id || null,
            student_name: record.student_name || record.full_name || participantName || 'Unknown Participant',
            full_name: record.full_name || record.student_name || participantName || 'Unknown Participant',
            participant_name: participantName || record.student_name || record.full_name || 'Unknown Participant',
            status: record.status || 'absent',
            total_duration_minutes: 0,
            first_joined_at: null,
            last_left_at: null,
            intervals: [],
          });
        }

        const current = merged.get(key);
        current.status = pickBetterStatus(current.status, record.status);
        current.total_duration_minutes += Number(record.total_duration_minutes || 0) || 0;

        const joinedAt = toDate(record.first_joined_at);
        if (joinedAt && (!current.first_joined_at || joinedAt < toDate(current.first_joined_at))) {
          current.first_joined_at = joinedAt.toISOString();
        }

        const leftAt = toDate(record.last_left_at);
        if (leftAt && (!current.last_left_at || leftAt > toDate(current.last_left_at))) {
          current.last_left_at = leftAt.toISOString();
        }

        const intervals = Array.isArray(record.intervals) ? record.intervals : [];
        intervals.forEach((interval, index) => {
          current.intervals.push({
            ...interval,
            id: interval.id || `${key}:${sessionId}:${index}`,
            session_id: sessionId,
          });
        });
      });
    });

    return [...merged.values()].sort((left, right) => {
      const leftLabel = (left.student_name || left.participant_name || '').toLowerCase();
      const rightLabel = (right.student_name || right.participant_name || '').toLowerCase();
      return leftLabel.localeCompare(rightLabel);
    });
  }, [bulkAttendanceData, sessionIds]);

  const stitchedLogs = useMemo(() => {
    const grouped = bulkParticipationData?.data || {};
    return sessionIds
      .flatMap((sessionId) => Array.isArray(grouped[sessionId]) ? grouped[sessionId] : [])
      .sort((left, right) => {
        const leftTs = toDate(left.timestamp)?.getTime() || 0;
        const rightTs = toDate(right.timestamp)?.getTime() || 0;
        return rightTs - leftTs;
      });
  }, [bulkParticipationData, sessionIds]);

  const filteredLogs = useMemo(() => {
    return stitchedLogs.filter((log) => {
      if (selectedType && log.interaction_type !== selectedType) return false;

      if (searchTerm) {
        const name = String(log.full_name || log.student_name || log.participant_name || '').toLowerCase();
        if (!name.includes(searchTerm.toLowerCase())) return false;
      }

      return true;
    });
  }, [stitchedLogs, searchTerm, selectedType]);

  const participationSummaryData = useMemo(() => {
    const interactionCounter = stitchedLogs.reduce((accumulator, log) => {
      const key = String(log.interaction_type || 'unknown');
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const interactionSummary = Object.entries(interactionCounter).map(([interaction_type, count]) => ({
      interaction_type,
      count,
    }));

    const studentCounter = new Map();
    stitchedLogs.forEach((log) => {
      const key = log.student_id
        ? `student:${log.student_id}`
        : `name:${String(log.student_name || log.full_name || log.participant_name || '').trim().toLowerCase()}`;

      if (!studentCounter.has(key)) {
        studentCounter.set(key, {
          student_id: log.student_id || null,
          full_name: log.full_name || log.student_name || log.participant_name || 'Unknown Participant',
          total_interactions: 0,
        });
      }

      studentCounter.get(key).total_interactions += 1;
    });

    const studentSummary = [...studentCounter.values()].sort(
      (left, right) => right.total_interactions - left.total_interactions
    );

    return {
      summary: {
        stats: {
          total_interactions: stitchedLogs.length,
          unique_participants: studentCounter.size,
          total_students: stitchedAttendance.length,
        },
        session: {
          total_students: stitchedAttendance.length,
        },
        studentSummary,
      },
      interactionSummary,
    };
  }, [stitchedLogs, stitchedAttendance]);

  if (sessionsLoading && fragments.length === 0) {
    return <div className="text-center py-12 text-gray-500">Loading stitched session...</div>;
  }

  if (sessionIds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">This stitched session link is missing fragment IDs.</p>
        <button
          type="button"
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/sessions')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Session</h1>
            <p className="text-gray-700 mt-1">
              {classInfo ? formatClassDisplay(classInfo) : 'Class session'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Stitched from {fragments.length} fragment{fragments.length !== 1 ? 's' : ''}
              {bundleId ? ` • ${decodeURIComponent(bundleId)}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="flex items-start gap-3">
            <CalendarIcon className="w-6 h-6 text-gray-400 mt-1" />
            <div>
              <div className="text-sm text-gray-600">Session Date</div>
              <div className="font-semibold text-gray-900">{formatDateLabel(stitchedStartAt)}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ClockIcon className="w-6 h-6 text-gray-400 mt-1" />
            <div>
              <div className="text-sm text-gray-600">Planned Window</div>
              <div className="font-semibold text-gray-900">
                {formatTimeLabel(plannedStartAt)} - {formatTimeLabel(plannedEndAt)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ClockIcon className="w-6 h-6 text-gray-400 mt-1" />
            <div>
              <div className="text-sm text-gray-600">Actual Window</div>
              <div className="font-semibold text-gray-900">
                {formatTimeLabel(stitchedStartAt)} - {formatTimeLabel(stitchedEndAt)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Squares2X2Icon className="w-6 h-6 text-gray-400 mt-1" />
            <div>
              <div className="text-sm text-gray-600">Fragments</div>
              <div className="font-semibold text-gray-900">{fragments.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
          <h2 className="text-base font-semibold text-gray-900">Included Fragments</h2>
          <p className="text-sm text-gray-600 mt-1">Each fragment remains individually accessible.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fragment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Participants</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Present</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fragments.map((fragment) => (
                <tr key={fragment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {formatTimeLabel(fragment.started_at || fragment.start_at)} - {formatTimeLabel(fragment.ended_at || fragment.end_at)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">{fragment.status || 'ended'}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{Number(fragment.total_participants || 0)}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{Number(fragment.present_count || 0)}</td>
                  <td className="px-6 py-3 text-sm">
                    <Link
                      to={`/app/sessions/${fragment.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Open Fragment
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`py-4 border-b-2 font-medium ${
                activeTab === 'attendance'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Attendance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('participation')}
              className={`py-4 border-b-2 font-medium ${
                activeTab === 'participation'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Participation
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'attendance' ? (
            <AttendanceRoster
              attendance={stitchedAttendance}
              isLoading={attendanceLoading}
              sessionId={null}
              classId={classInfo?.id || null}
              onAddToRoster={null}
            />
          ) : (
            <div className="space-y-6">
              <ParticipationSummary
                summary={participationSummaryData.summary}
                interactionSummary={participationSummaryData.interactionSummary}
              />

              <ParticipationFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                onRefresh={() => {
                  refetchAttendance();
                  refetchLogs();
                }}
                isRefreshing={attendanceLoading || logsLoading}
              />

              <ParticipationLogsList
                logs={filteredLogs}
                isLoading={logsLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BundledSessionDetailPage;
