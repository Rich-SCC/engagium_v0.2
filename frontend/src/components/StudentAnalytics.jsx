import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { classesAPI, participationAPI } from '@/services/api';
import DateRangePicker from './DateRangePicker';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FaceSmileIcon,
  HandRaisedIcon,
  MicrophoneIcon,
  UserIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  aggregateSessionLogs,
  computeEngagementScore,
  formatMinutes,
  round,
  toNumber,
  mergeParticipationSnapshots,
} from '@/utils/analytics';

const fetchSessionParticipation = async (session) => {
  const limit = 500;
  const firstResponse = await participationAPI.getLogs(session.id, { page: 1, limit });
  const firstPage = firstResponse?.data || {};
  const logs = [...(firstPage.data || [])];
  const totalPages = firstPage.pagination?.totalPages || 1;

  if (totalPages > 1) {
    const pageNumbers = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
    const remainingPages = await Promise.all(
      pageNumbers.map((page) => participationAPI.getLogs(session.id, { page, limit }))
    );

    remainingPages.forEach((response) => {
      const page = response?.data || {};
      logs.push(...(page.data || []));
    });
  }

  return {
    sessionId: session.id,
    session,
    ...aggregateSessionLogs(logs),
  };
};

const resolveSessionDate = (session) => {
  if (session?.started_at) {
    const startedAt = new Date(session.started_at);
    if (!Number.isNaN(startedAt.getTime())) return startedAt;
  }

  if (session?.session_date) {
    const scheduledDate = new Date(session.session_date);
    if (!Number.isNaN(scheduledDate.getTime())) return scheduledDate;
  }

  return null;
};

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

  const { data: studentAnalyticsData, isLoading, error } = useQuery({
    queryKey: ['studentAnalytics', classId, studentId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () =>
      classesAPI.getStudentAnalytics(classId, studentId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    enabled: !!classId && !!studentId,
  });

  const studentAnalytics = studentAnalyticsData?.data;
  const sessionHistory = studentAnalytics?.sessionHistory || [];
  const timeline = studentAnalytics?.timeline || [];
  const student = studentAnalytics?.student;
  const overallStats = studentAnalytics?.overallStats || {};

  const { data: classAnalyticsData } = useQuery({
    queryKey: ['studentClassAnalytics', classId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () =>
      classesAPI.getClassAnalytics(classId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    enabled: !!classId,
  });

  const classAnalytics = classAnalyticsData?.data;
  const classSessionTrends = classAnalytics?.sessionTrends || [];
  const classStudentPerformance = classAnalytics?.studentPerformance || [];

  const { data: classParticipationSnapshots = [], isLoading: classParticipationLoading } = useQuery({
    queryKey: ['studentClassParticipation', classId, startDate.toISOString(), endDate.toISOString(), classSessionTrends.map((session) => session.id).join('|')],
    queryFn: async () => Promise.all(classSessionTrends.map(fetchSessionParticipation)),
    enabled: !!classId && classSessionTrends.length > 0,
  });

  const { data: studentParticipationSnapshots = [], isLoading: studentParticipationLoading } = useQuery({
    queryKey: ['studentParticipation', classId, studentId, startDate.toISOString(), endDate.toISOString(), sessionHistory.map((session) => session.id).join('|')],
    queryFn: async () => Promise.all(sessionHistory.map(fetchSessionParticipation)),
    enabled: !!classId && !!studentId && sessionHistory.length > 0,
  });

  const classParticipationSummary = useMemo(
    () => mergeParticipationSnapshots(classParticipationSnapshots),
    [classParticipationSnapshots]
  );
  const studentParticipationSummary = useMemo(
    () => mergeParticipationSnapshots(studentParticipationSnapshots),
    [studentParticipationSnapshots]
  );

  const studentParticipationMap = useMemo(
    () => new Map(studentParticipationSummary.students.map((entry) => [entry.student_id, entry])),
    [studentParticipationSummary.students]
  );

  const classStudentMap = useMemo(
    () => new Map(classParticipationSummary.students.map((entry) => [entry.student_id, entry])),
    [classParticipationSummary.students]
  );

  const classStudents = useMemo(() => {
    const classAverages = {
      avgDurationMinutes: classStudentPerformance.length > 0
        ? classStudentPerformance.reduce((sum, studentRow) => sum + toNumber(studentRow.avg_duration_minutes), 0) / classStudentPerformance.length
        : 0,
    };

    const merged = classStudentPerformance.map((studentRow) => {
      const participation = classStudentMap.get(studentRow.id) || {
        total_interactions: 0,
        chat_messages: 0,
        reactions: 0,
        hand_raises: 0,
        mic_toggles: 0,
        speaking_proxy_minutes: 0,
      };

      return {
        ...studentRow,
        total_interactions: participation.total_interactions,
        chat_messages: participation.chat_messages,
        reactions: participation.reactions,
        hand_raises: participation.hand_raises,
        mic_toggles: participation.mic_toggles,
        speaking_proxy_minutes: participation.speaking_proxy_minutes,
        engagement_score: computeEngagementScore({
          attendanceRate: toNumber(studentRow.attendance_rate),
          avgDurationMinutes: toNumber(studentRow.avg_duration_minutes),
          totalInteractions: toNumber(participation.total_interactions),
          speakingProxyMinutes: toNumber(participation.speaking_proxy_minutes),
          classAverages,
          classMaxima: {
            totalInteractions: 1,
            speakingProxyMinutes: 1,
          },
        }),
      };
    });

    const maxInteractions = merged.reduce((max, entry) => Math.max(max, toNumber(entry.total_interactions)), 0) || 1;
    const maxSpeakingProxyMinutes = merged.reduce((max, entry) => Math.max(max, toNumber(entry.speaking_proxy_minutes)), 0) || 1;

    return merged.map((entry) => ({
      ...entry,
      engagement_score: computeEngagementScore({
        attendanceRate: toNumber(entry.attendance_rate),
        avgDurationMinutes: toNumber(entry.avg_duration_minutes),
        totalInteractions: toNumber(entry.total_interactions),
        speakingProxyMinutes: toNumber(entry.speaking_proxy_minutes),
        classAverages,
        classMaxima: {
          totalInteractions: maxInteractions,
          speakingProxyMinutes: maxSpeakingProxyMinutes,
        },
      }),
    }));
  }, [classStudentPerformance, classStudentMap]);

  const studentParticipationEntry = useMemo(() => {
    if (!student) {
      return null;
    }

    return studentParticipationMap.get(student.id) || null;
  }, [studentParticipationMap, student]);

  const studentTimelineRows = useMemo(() => {
    return sessionHistory.map((session) => {
      const snapshot = studentParticipationSnapshots.find((entry) => entry.sessionId === session.id);
      const studentEntry = student ? (snapshot?.students || []).find((entry) =>
        entry.student_id === student.id || entry.full_name === student.full_name || entry.participant_name === student.full_name
      ) : null;
      const intervals = session.intervals || [];

      return {
        ...session,
        interval_count: intervals.length,
        chat_messages: toNumber(studentEntry?.chat_messages),
        reactions: toNumber(studentEntry?.reactions),
        hand_raises: toNumber(studentEntry?.hand_raises),
        mic_toggles: toNumber(studentEntry?.mic_toggles),
        speaking_proxy_minutes: toNumber(studentEntry?.speaking_proxy_minutes),
        total_interactions: toNumber(studentEntry?.total_interactions),
      };
    });
  }, [sessionHistory, studentParticipationSnapshots, student]);

  const attendanceTimelineChartData = useMemo(
    () => timeline.map((day) => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      attended: toNumber(day.attended),
      total: toNumber(day.total_sessions),
      duration: toNumber(day.total_duration),
    })),
    [timeline]
  );

  const participationTimelineChartData = useMemo(
    () => studentTimelineRows.map((session) => ({
      date: resolveSessionDate(session)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Unknown',
      chat: toNumber(session.chat_messages),
      reactions: toNumber(session.reactions),
      handRaises: toNumber(session.hand_raises),
      micToggles: toNumber(session.mic_toggles),
      speakingProxyMinutes: toNumber(session.speaking_proxy_minutes),
      interactions: toNumber(session.total_interactions),
    })),
    [studentTimelineRows]
  );

  const classAverages = useMemo(() => {
    const totalStudents = classAnalytics?.overallStats?.totalStudents || classStudentPerformance.length || 1;
    return {
      attendanceRate: toNumber(classAnalytics?.overallStats?.avgAttendanceRate),
      avgDurationMinutes: toNumber(classAnalytics?.overallStats?.avgDuration),
      interactionsPerStudent: totalStudents > 0 ? round((classParticipationSummary.totals?.totalInteractions || 0) / totalStudents, 1) : 0,
      speakingProxyMinutesPerStudent: totalStudents > 0 ? round((classParticipationSummary.totals?.speakingProxyMinutes || 0) / totalStudents, 1) : 0,
    };
  }, [classAnalytics, classParticipationSummary.totals, classStudentPerformance.length]);

  const studentEngagementScore = useMemo(() => {
    if (!student) {
      return 0;
    }

    const maxInteractions = Math.max(
      toNumber(studentParticipationSummary.totals?.totalInteractions),
      classStudents.reduce((max, entry) => Math.max(max, toNumber(entry.total_interactions)), 0),
      1
    );

    const maxSpeakingProxyMinutes = Math.max(
      toNumber(studentParticipationSummary.totals?.speakingProxyMinutes),
      classStudents.reduce((max, entry) => Math.max(max, toNumber(entry.speaking_proxy_minutes)), 0),
      1
    );

    return computeEngagementScore({
      attendanceRate: toNumber(overallStats.attendanceRate),
      avgDurationMinutes: toNumber(overallStats.avgDurationMinutes),
      totalInteractions: toNumber(studentParticipationSummary.totals?.totalInteractions),
      speakingProxyMinutes: toNumber(studentParticipationSummary.totals?.speakingProxyMinutes),
      classAverages,
      classMaxima: {
        totalInteractions: maxInteractions,
        speakingProxyMinutes: maxSpeakingProxyMinutes,
      },
    });
  }, [student, studentParticipationSummary.totals, classStudents, overallStats, classAverages]);

  const classAverageEngagement = useMemo(() => {
    if (classStudents.length === 0) {
      return 0;
    }

    return round(classStudents.reduce((sum, entry) => sum + toNumber(entry.engagement_score), 0) / classStudents.length, 1);
  }, [classStudents]);

  const hasData = sessionHistory.length > 0;
  const isParticipationLoading = classParticipationLoading || studentParticipationLoading;

  const totalInteractions = studentParticipationEntry?.total_interactions || 0;
  const chatCount = studentParticipationEntry?.chat_messages || 0;
  const reactionCount = studentParticipationEntry?.reactions || 0;
  const handRaiseCount = studentParticipationEntry?.hand_raises || 0;
  const micToggleCount = studentParticipationEntry?.mic_toggles || 0;
  const speakingProxyMinutes = studentParticipationEntry?.speaking_proxy_minutes || 0;
  const classAverageInteractions = classAverages.interactionsPerStudent;
  const classAverageSpeaking = classAverages.speakingProxyMinutesPerStudent;

  const insights = useMemo(() => {
    const items = [];
    if (toNumber(overallStats.attendanceRate) >= toNumber(classAverages.attendanceRate) && totalInteractions < classAverageInteractions) {
      items.push('Attendance is strong, but participation is below the class average.');
    }
    if (speakingProxyMinutes > classAverageSpeaking && chatCount + reactionCount < classAverageInteractions) {
      items.push('The student appears verbally active, but not as active in chat/reactions.');
    }
    if (sessionHistory.some((session) => (session.intervals || []).length > 1)) {
      items.push('There are repeat join/leave intervals in the selected range.');
    }

    return items;
  }, [overallStats.attendanceRate, classAverages.attendanceRate, totalInteractions, classAverageInteractions, speakingProxyMinutes, classAverageSpeaking, chatCount, reactionCount, sessionHistory]);

  if (isLoading || isParticipationLoading) {
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

  if (!studentAnalytics || !student) {
    return null;
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Class
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{student.full_name}</h2>
          </div>
        </div>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onQuickSelect={handleQuickSelect}
        />

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Class
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{student.full_name}</h2>
          <p className="text-sm text-gray-500">Attendance and participation detail for the selected range</p>
        </div>
      </div>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onQuickSelect={handleQuickSelect}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold text-gray-900">{toNumber(overallStats.attendanceRate)}%</p>
            </div>
            <CheckCircleIcon className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-md p-6 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-sm font-medium mb-1">Total Minutes</p>
              <p className="text-3xl font-bold text-gray-900">{formatMinutes(overallStats.totalDurationMinutes)}</p>
            </div>
            <ClockIcon className="w-10 h-10 text-emerald-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md p-6 border border-sky-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sky-700 text-sm font-medium mb-1">Interactions</p>
              <p className="text-3xl font-bold text-gray-900">{totalInteractions}</p>
            </div>
            <ChatBubbleLeftIcon className="w-10 h-10 text-sky-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-1">Speaking Proxy</p>
              <p className="text-3xl font-bold text-gray-900">{formatMinutes(speakingProxyMinutes)}</p>
            </div>
            <MicrophoneIcon className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-md p-6 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 text-sm font-medium mb-1">Engagement Score</p>
              <p className="text-3xl font-bold text-gray-900">{studentEngagementScore}</p>
            </div>
            <FaceSmileIcon className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{overallStats.totalSessions}</p>
            </div>
            <CalendarIcon className="w-10 h-10 text-gray-600" />
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Timeline</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={attendanceTimelineChartData}>
              <defs>
                <linearGradient id="colorAttended" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
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
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAttended)"
                name="Sessions Attended"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Participation Timeline</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={participationTimelineChartData}>
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
              <Legend />
              <Bar dataKey="chat" stackId="a" fill="#2563eb" name="Chat" />
              <Bar dataKey="reactions" stackId="a" fill="#f59e0b" name="Reactions" />
              <Bar dataKey="handRaises" stackId="a" fill="#10b981" name="Hand Raises" />
              <Bar dataKey="micToggles" stackId="a" fill="#8b5cf6" name="Mic Toggles" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Attendance vs Class</p>
              <p className="text-2xl font-bold text-gray-900">{toNumber(overallStats.attendanceRate)}%</p>
              <p className="text-sm text-gray-500">Class average {classAverages.attendanceRate}%</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Minutes vs Class</p>
              <p className="text-2xl font-bold text-gray-900">{formatMinutes(overallStats.avgDurationMinutes)}</p>
              <p className="text-sm text-gray-500">Class average {formatMinutes(classAverages.avgDurationMinutes)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Interactions vs Class</p>
              <p className="text-2xl font-bold text-gray-900">{totalInteractions}</p>
              <p className="text-sm text-gray-500">Class average {classAverageInteractions}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Speaking Proxy vs Class</p>
              <p className="text-2xl font-bold text-gray-900">{formatMinutes(speakingProxyMinutes)}</p>
              <p className="text-sm text-gray-500">Class average {formatMinutes(classAverageSpeaking)}</p>
            </div>
          </div>
          {insights.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h4 className="text-sm font-semibold text-amber-900 mb-2">Insights</h4>
              <ul className="space-y-2 text-sm text-amber-900">
                {insights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Participation Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs uppercase tracking-wider text-blue-700 mb-1">Chat Messages</p>
              <p className="text-2xl font-bold text-gray-900">{chatCount}</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wider text-amber-700 mb-1">Reactions</p>
              <p className="text-2xl font-bold text-gray-900">{reactionCount}</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wider text-emerald-700 mb-1">Hand Raises</p>
              <p className="text-2xl font-bold text-gray-900">{handRaiseCount}</p>
            </div>
            <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
              <p className="text-xs uppercase tracking-wider text-purple-700 mb-1">Mic Toggles</p>
              <p className="text-2xl font-bold text-gray-900">{micToggleCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Intervals</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chat</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Reactions</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hand Raises</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Mic Toggles</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Speaking Proxy</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentTimelineRows.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{session.title}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {resolveSessionDate(session)
                      ? resolveSessionDate(session).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                      : 'Unknown'}
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
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{formatMinutes(session.total_duration_minutes)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{session.interval_count}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{toNumber(session.chat_messages)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{toNumber(session.reactions)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{toNumber(session.hand_raises)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{toNumber(session.mic_toggles)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{formatMinutes(session.speaking_proxy_minutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
