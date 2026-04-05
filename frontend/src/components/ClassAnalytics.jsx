import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { classesAPI, participationAPI, sessionsAPI } from '@/services/api';
import DateRangePicker from './DateRangePicker';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AcademicCapIcon,
  BoltIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon,
  HeartIcon,
  InformationCircleIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  aggregateSessionLogs,
  computeEngagementScore,
  createEmptyInteractionTotals,
  formatMinutes,
  round,
  toNumber,
  mergeParticipationSnapshots,
} from '@/utils/analytics';

const WEIGHTS = {
  mic: 1.2,
  reaction: 0.4,
  chat: 0.6,
};

const TIMELINE_COLORS = {
  chat: '#2563eb',
  reaction: '#f59e0b',
  handRaise: '#22c55e',
  micToggle: '#7c3aed',
};
const TIMELINE_TOTAL_COLOR = '#0f172a';

const TIMELINE_SERIES = [
  { key: 'chat', label: 'Chat', color: TIMELINE_COLORS.chat },
  { key: 'handRaise', label: 'Hand Raises', color: TIMELINE_COLORS.handRaise },
  { key: 'micToggle', label: 'Mic Toggles', color: TIMELINE_COLORS.micToggle },
  { key: 'reaction', label: 'Reactions', color: TIMELINE_COLORS.reaction },
];

const getSessionBucket = (bucketMap, sessionId) => {
  if (!bucketMap || !sessionId) return [];
  return bucketMap[sessionId] || bucketMap[String(sessionId)] || [];
};

const buildSessionParticipationSnapshot = (session, logs = []) => ({
  sessionId: session.id,
  session,
  ...aggregateSessionLogs(logs),
});

const formatTimeLabel = (timeValue) => {
  if (!timeValue || typeof timeValue !== 'string') return '-';
  const value = timeValue.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(value)) return value;

  const [hoursText, minutesText] = value.split(':');
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return value;
  }

  const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
};

const formatDateTimeLabel = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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

const resolveSessionEnd = (session) => {
  if (session?.ended_at) {
    const endedAt = new Date(session.ended_at);
    if (!Number.isNaN(endedAt.getTime())) return endedAt;
  }

  const start = resolveSessionDate(session);
  if (!start) return null;

  const durationMinutes = Math.max(1, toNumber(session.avg_duration_minutes));
  return new Date(start.getTime() + durationMinutes * 60 * 1000);
};

const diffMinutes = (left, right) => Math.max(0, (left.getTime() - right.getTime()) / (60 * 1000));

const overlapMinutes = (startA, endA, startB, endB) => {
  const start = Math.max(startA.getTime(), startB.getTime());
  const end = Math.min(endA.getTime(), endB.getTime());
  if (end <= start) return 0;
  return (end - start) / (60 * 1000);
};

const getWeekKey = (date) => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

const normalizeName = (value) => String(value || '').trim().toLowerCase();

const toTimeText = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const mergeAttendanceRecords = (records = []) => {
  const statusPriority = { absent: 1, late: 2, present: 3 };
  const merged = new Map();

  records.forEach((record) => {
    const participantName = String(record?.participant_name || '').trim();
    const key = record?.student_id
      ? `student:${record.student_id}`
      : `name:${participantName.toLowerCase()}`;

    if (!merged.has(key)) {
      merged.set(key, {
        ...record,
        id: key,
        status: record?.status || 'absent',
        total_duration_minutes: 0,
        intervals: [],
        first_joined_at: null,
        last_left_at: null,
      });
    }

    const current = merged.get(key);
    const incomingStatus = record?.status || 'absent';
    if ((statusPriority[incomingStatus] || 0) > (statusPriority[current.status] || 0)) {
      current.status = incomingStatus;
    }

    current.total_duration_minutes += toNumber(record?.total_duration_minutes);

    const joined = record?.first_joined_at ? new Date(record.first_joined_at) : null;
    if (joined && !Number.isNaN(joined.getTime())) {
      const existingJoined = current.first_joined_at ? new Date(current.first_joined_at) : null;
      if (!existingJoined || Number.isNaN(existingJoined.getTime()) || joined < existingJoined) {
        current.first_joined_at = joined.toISOString();
      }
    }

    const left = record?.last_left_at ? new Date(record.last_left_at) : null;
    if (left && !Number.isNaN(left.getTime())) {
      const existingLeft = current.last_left_at ? new Date(current.last_left_at) : null;
      if (!existingLeft || Number.isNaN(existingLeft.getTime()) || left > existingLeft) {
        current.last_left_at = left.toISOString();
      }
    }

    const intervals = Array.isArray(record?.intervals) ? record.intervals : [];
    intervals.forEach((interval, index) => {
      current.intervals.push({
        ...interval,
        id: interval.id || `${key}:${index}`,
      });
    });
  });

  return Array.from(merged.values());
};

const buildPulseWindowFromBundle = (bundle) => {
  if (!bundle) return null;

  const fallbackStart = bundle?.actual_first_start_at ? new Date(bundle.actual_first_start_at) : null;
  const fallbackEnd = bundle?.actual_last_end_at ? new Date(bundle.actual_last_end_at) : null;
  const coreStart = bundle?.planned_start_at ? new Date(bundle.planned_start_at) : fallbackStart;
  const coreEnd = bundle?.planned_end_at ? new Date(bundle.planned_end_at) : fallbackEnd;

  if (!coreStart || !coreEnd || Number.isNaN(coreStart.getTime()) || Number.isNaN(coreEnd.getTime())) {
    return null;
  }

  const sessions = [...(bundle?.sessions || [])].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const breakSegments = [];

  for (let index = 1; index < sessions.length; index += 1) {
    const previousEnd = new Date(sessions[index - 1].end_at);
    const currentStart = new Date(sessions[index].start_at);
    if (!Number.isNaN(previousEnd.getTime()) && !Number.isNaN(currentStart.getTime()) && currentStart > previousEnd) {
      breakSegments.push({ start: previousEnd, end: currentStart });
    }
  }

  const totalMinutes = Math.max(1, diffMinutes(coreEnd, coreStart));
  const breakMinutes = breakSegments.reduce(
    (sum, segment) => sum + overlapMinutes(segment.start, segment.end, coreStart, coreEnd),
    0
  );

  return {
    start: coreStart,
    end: coreEnd,
    breakSegments,
    spanMinutes: totalMinutes,
    creditMinutes: Math.max(1, totalMinutes - breakMinutes),
  };
};

const LIFETIME_BASELINE_START_ISO = '2000-01-01T00:00:00.000Z';

const getPreviousEquivalentRange = (start, end) => {
  if (!(start instanceof Date) || !(end instanceof Date)) return null;
  const currentStart = start.getTime();
  const currentEnd = end.getTime();
  if (!Number.isFinite(currentStart) || !Number.isFinite(currentEnd) || currentEnd <= currentStart) return null;

  const spanMs = currentEnd - currentStart;
  const previousEnd = new Date(currentStart - 1);
  const previousStart = new Date(previousEnd.getTime() - spanMs);
  return { previousStart, previousEnd };
};

const createSessionRows = ({ sessions = [], snapshotById = new Map(), attendanceBySessionId = new Map() }) => (
  sessions
    .map((session) => {
      const sessionDate = resolveSessionDate(session);
      const durationMinutes = Math.max(0, toNumber(session.avg_duration_minutes));
      const snapshot = snapshotById.get(session.id) || { totals: createEmptyInteractionTotals(), uniqueStudents: 0 };
      const mergedAttendanceRows = mergeAttendanceRecords(attendanceBySessionId.get(session.id) || []);
      const rosterCount = mergedAttendanceRows.length;
      const presentCount = mergedAttendanceRows.filter(
        (row) => toNumber(row.total_duration_minutes) > 0 || ['present', 'late'].includes(row.status)
      ).length;
      const inferredActiveCount = Math.max(
        0,
        toNumber(snapshot.uniqueStudents) || (Array.isArray(snapshot.students) ? snapshot.students.length : 0)
      );
      const activeCount = Math.min(presentCount || 0, inferredActiveCount);

      const presenceRate = rosterCount > 0
        ? round((presentCount / rosterCount) * 100, 1)
        : round(toNumber(session.attendance_rate), 1);
      const participationRate = presentCount > 0 ? round((activeCount / presentCount) * 100, 1) : 0;
      const efficiencyGap = round(Math.abs(presenceRate - participationRate), 1);
      const interactions = Math.max(0, toNumber(snapshot.totals?.totalInteractions));
      const speakingMinutes = Math.max(0, toNumber(snapshot.totals?.speakingProxyMinutes));

      return {
        sessionId: session.id,
        sessionDate,
        dateLabel: sessionDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Unknown',
        weekKey: sessionDate ? getWeekKey(sessionDate) : 'unknown-week',
        durationMinutes,
        rosterCount,
        presentCount,
        activeCount,
        presenceRate,
        participationRate,
        efficiencyGap,
        interactions,
        speakingMinutes,
        interactionsPerSession: interactions,
        interactionsPerHour: durationMinutes > 0 ? round(interactions / (durationMinutes / 60), 2) : 0,
        talkSharePct: durationMinutes > 0 ? round((speakingMinutes / durationMinutes) * 100, 1) : 0,
        pulseScore: round(toNumber(session.pulse_engagement_score), 2),
      };
    })
    .sort((left, right) => {
      if (!left.sessionDate && !right.sessionDate) return 0;
      if (!left.sessionDate) return -1;
      if (!right.sessionDate) return 1;
      return left.sessionDate.getTime() - right.sessionDate.getTime();
    })
);

const createTimeAgnosticSummary = (rows = []) => {
  if (rows.length === 0) {
    return {
      sessions: 0,
      interactionsPerSession: 0,
      interactionsPerHour: 0,
      presenceRate: 0,
      participationRate: 0,
      efficiencyGap: 0,
      talkSharePct: 0,
      consistencyIndex: 0,
    };
  }

  const totals = rows.reduce(
    (acc, row) => {
      acc.sessions += 1;
      acc.durationMinutes += Math.max(0, toNumber(row.durationMinutes));
      acc.interactions += Math.max(0, toNumber(row.interactions));
      acc.speakingMinutes += Math.max(0, toNumber(row.speakingMinutes));
      acc.roster += Math.max(0, toNumber(row.rosterCount));
      acc.present += Math.max(0, toNumber(row.presentCount));
      acc.active += Math.max(0, toNumber(row.activeCount));
      return acc;
    },
    { sessions: 0, durationMinutes: 0, interactions: 0, speakingMinutes: 0, roster: 0, present: 0, active: 0 }
  );

  const interactionsPerSession = totals.sessions > 0 ? round(totals.interactions / totals.sessions, 2) : 0;
  const interactionsPerHour = totals.durationMinutes > 0 ? round(totals.interactions / (totals.durationMinutes / 60), 2) : 0;
  const presenceRate = totals.roster > 0 ? round((totals.present / totals.roster) * 100, 1) : 0;
  const participationRate = totals.present > 0 ? round((totals.active / totals.present) * 100, 1) : 0;
  const efficiencyGap = round(Math.abs(presenceRate - participationRate), 1);
  const talkSharePct = totals.durationMinutes > 0 ? round((totals.speakingMinutes / totals.durationMinutes) * 100, 1) : 0;

  const perSessionRatios = rows.map((row) => toNumber(row.interactionsPerHour)).filter((value) => Number.isFinite(value));
  const mean = perSessionRatios.length > 0
    ? perSessionRatios.reduce((sum, value) => sum + value, 0) / perSessionRatios.length
    : 0;
  const variance = perSessionRatios.length > 0
    ? perSessionRatios.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / perSessionRatios.length
    : 0;
  const stdev = Math.sqrt(Math.max(0, variance));
  const consistencyIndex = mean > 0 ? round(Math.max(0, 100 - ((stdev / mean) * 100)), 1) : 0;

  return {
    sessions: totals.sessions,
    interactionsPerSession,
    interactionsPerHour,
    presenceRate,
    participationRate,
    efficiencyGap,
    talkSharePct,
    consistencyIndex,
  };
};

const computeDelta = (currentValue, baselineValue) => {
  const current = toNumber(currentValue);
  const baseline = toNumber(baselineValue);
  if (baseline <= 0) return null;
  return round(((current - baseline) / baseline) * 100, 1);
};

const hasMeaningfulBaseline = (currentSummary, baselineSummary) => {
  if (!currentSummary || !baselineSummary) return false;
  if (baselineSummary.sessions <= 0) return false;

  const comparableKeys = [
    'interactionsPerSession',
    'interactionsPerHour',
    'presenceRate',
    'participationRate',
    'efficiencyGap',
    'talkSharePct',
    'consistencyIndex',
  ];

  const differs = comparableKeys.some((key) => Math.abs(toNumber(currentSummary[key]) - toNumber(baselineSummary[key])) > 0.01);
  return differs;
};

const getDeltaTone = (delta, lowerIsBetter = false) => {
  if (delta === null || !Number.isFinite(delta)) {
    return {
      chip: 'border-slate-200 bg-slate-50 text-slate-600',
      text: 'No baseline',
      detail: 'Awaiting baseline',
    };
  }

  const score = lowerIsBetter ? -delta : delta;
  if (score >= 8) {
    return {
      chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      text: `${delta > 0 ? '+' : ''}${delta}%`,
      detail: 'Above baseline',
    };
  }

  if (score <= -8) {
    return {
      chip: 'border-rose-200 bg-rose-50 text-rose-700',
      text: `${delta > 0 ? '+' : ''}${delta}%`,
      detail: 'Below baseline',
    };
  }

  return {
    chip: 'border-amber-200 bg-amber-50 text-amber-700',
    text: `${delta > 0 ? '+' : ''}${delta}%`,
    detail: 'Near baseline',
  };
};

const ClassAnalytics = ({ classId, onSelectStudent }) => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const [selectedBundleId, setSelectedBundleId] = useState(null);
  const [selectedStudentBundleId, setSelectedStudentBundleId] = useState(null);
  const [profiledStudentId, setProfiledStudentId] = useState(null);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('summary');
  const [studentScope, setStudentScope] = useState('date-range');
  const [showPulseFormula, setShowPulseFormula] = useState(false);
  const [timelineVisibility, setTimelineVisibility] = useState({
    total: true,
    chat: true,
    handRaise: true,
    micToggle: true,
    reaction: true,
  });

  const handleQuickSelect = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const previousRange = useMemo(() => getPreviousEquivalentRange(startDate, endDate), [startDate, endDate]);

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['classAnalytics', classId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () =>
      classesAPI.getClassAnalytics(classId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    enabled: !!classId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const analytics = analyticsData?.data;
  const sessionTrends = analytics?.sessionTrends || [];
  const scheduleBundles = analytics?.scheduleBundles || [];
  const studentPerformance = analytics?.studentPerformance || [];

  const { data: previousAnalyticsData } = useQuery({
    queryKey: [
      'classAnalyticsPreviousPeriod',
      classId,
      previousRange?.previousStart?.toISOString(),
      previousRange?.previousEnd?.toISOString(),
    ],
    queryFn: () =>
      classesAPI.getClassAnalytics(classId, {
        startDate: previousRange.previousStart.toISOString(),
        endDate: previousRange.previousEnd.toISOString(),
      }),
    enabled: !!classId && !!previousRange,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const previousAnalytics = previousAnalyticsData?.data;
  const previousSessionTrends = previousAnalytics?.sessionTrends || [];

  const { data: lifetimeAnalyticsData } = useQuery({
    queryKey: ['classAnalyticsLifetime', classId],
    queryFn: () =>
      classesAPI.getClassAnalytics(classId, {
        startDate: LIFETIME_BASELINE_START_ISO,
        endDate: new Date().toISOString(),
      }),
    enabled: !!classId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const lifetimeAnalytics = lifetimeAnalyticsData?.data;
  const lifetimeSessionTrends = lifetimeAnalytics?.sessionTrends || [];

  const sessionIds = useMemo(() => sessionTrends.map((session) => session.id).filter(Boolean), [sessionTrends]);
  const previousSessionIds = useMemo(
    () => previousSessionTrends.map((session) => session.id).filter(Boolean),
    [previousSessionTrends]
  );
  const lifetimeSessionIds = useMemo(
    () => lifetimeSessionTrends.map((session) => session.id).filter(Boolean),
    [lifetimeSessionTrends]
  );

  const { data: bulkParticipationData, isLoading: participationLoading } = useQuery({
    queryKey: ['classParticipationAnalytics', classId, startDate.toISOString(), endDate.toISOString(), sessionIds.join('|')],
    queryFn: () => participationAPI.getBulkLogs(sessionIds),
    enabled: !!classId && sessionTrends.length > 0,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: bulkAttendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['classAttendanceAnalytics', classId, startDate.toISOString(), endDate.toISOString(), sessionIds.join('|')],
    queryFn: () => sessionsAPI.getBulkAttendanceWithIntervals(sessionIds),
    enabled: !!classId && sessionTrends.length > 0,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: previousBulkParticipationData } = useQuery({
    queryKey: ['classParticipationPreviousPeriod', classId, previousSessionIds.join('|')],
    queryFn: () => participationAPI.getBulkLogs(previousSessionIds),
    enabled: !!classId && previousSessionIds.length > 0,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: previousBulkAttendanceData } = useQuery({
    queryKey: ['classAttendancePreviousPeriod', classId, previousSessionIds.join('|')],
    queryFn: () => sessionsAPI.getBulkAttendanceWithIntervals(previousSessionIds),
    enabled: !!classId && previousSessionIds.length > 0,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: lifetimeBulkParticipationData } = useQuery({
    queryKey: ['classParticipationLifetime', classId, lifetimeSessionIds.join('|')],
    queryFn: () => participationAPI.getBulkLogs(lifetimeSessionIds),
    enabled: !!classId && lifetimeSessionIds.length > 0,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: lifetimeBulkAttendanceData } = useQuery({
    queryKey: ['classAttendanceLifetime', classId, lifetimeSessionIds.join('|')],
    queryFn: () => sessionsAPI.getBulkAttendanceWithIntervals(lifetimeSessionIds),
    enabled: !!classId && lifetimeSessionIds.length > 0,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const logsBySessionId = bulkParticipationData?.data || {};
  const attendanceBySessionPayload = bulkAttendanceData?.data || {};
  const previousLogsBySessionId = previousBulkParticipationData?.data || {};
  const previousAttendanceBySessionPayload = previousBulkAttendanceData?.data || {};
  const lifetimeLogsBySessionId = lifetimeBulkParticipationData?.data || {};
  const lifetimeAttendanceBySessionPayload = lifetimeBulkAttendanceData?.data || {};

  const participationSnapshots = useMemo(
    () => sessionTrends.map((session) => buildSessionParticipationSnapshot(session, getSessionBucket(logsBySessionId, session.id))),
    [sessionTrends, logsBySessionId]
  );

  const participationSummary = useMemo(() => mergeParticipationSnapshots(participationSnapshots), [participationSnapshots]);

  const sessionSnapshotById = useMemo(
    () => new Map(participationSummary.sessions.map((snapshot) => [snapshot.sessionId, snapshot])),
    [participationSummary.sessions]
  );

  const previousSessionSnapshotById = useMemo(() => {
    const snapshots = previousSessionTrends.map((session) => (
      buildSessionParticipationSnapshot(session, getSessionBucket(previousLogsBySessionId, session.id))
    ));
    return new Map(snapshots.map((snapshot) => [snapshot.sessionId, snapshot]));
  }, [previousSessionTrends, previousLogsBySessionId]);

  const lifetimeSessionSnapshotById = useMemo(() => {
    const snapshots = lifetimeSessionTrends.map((session) => (
      buildSessionParticipationSnapshot(session, getSessionBucket(lifetimeLogsBySessionId, session.id))
    ));
    return new Map(snapshots.map((snapshot) => [snapshot.sessionId, snapshot]));
  }, [lifetimeSessionTrends, lifetimeLogsBySessionId]);

  const studentParticipationById = useMemo(
    () => new Map(
      participationSummary.students
        .filter((student) => student?.student_id)
        .map((student) => [String(student.student_id), student])
    ),
    [participationSummary.students]
  );

  const studentParticipationByNumber = useMemo(
    () => new Map(
      participationSummary.students
        .filter((student) => student?.student_number)
        .map((student) => [String(student.student_number), student])
    ),
    [participationSummary.students]
  );

  const studentParticipationByName = useMemo(
    () => new Map(
      participationSummary.students
        .filter((student) => normalizeName(student?.full_name || student?.student_name || student?.participant_name))
        .map((student) => [normalizeName(student.full_name || student.student_name || student.participant_name), student])
    ),
    [participationSummary.students]
  );

  const attendanceBySessionId = useMemo(() => {
    const map = new Map();
    sessionIds.forEach((sessionId) => {
      map.set(sessionId, getSessionBucket(attendanceBySessionPayload, sessionId));
    });
    return map;
  }, [attendanceBySessionPayload, sessionIds]);

  const previousAttendanceBySessionId = useMemo(() => {
    const map = new Map();
    previousSessionIds.forEach((sessionId) => {
      map.set(sessionId, getSessionBucket(previousAttendanceBySessionPayload, sessionId));
    });
    return map;
  }, [previousAttendanceBySessionPayload, previousSessionIds]);

  const lifetimeAttendanceBySessionId = useMemo(() => {
    const map = new Map();
    lifetimeSessionIds.forEach((sessionId) => {
      map.set(sessionId, getSessionBucket(lifetimeAttendanceBySessionPayload, sessionId));
    });
    return map;
  }, [lifetimeAttendanceBySessionPayload, lifetimeSessionIds]);

  const enrichedStudents = useMemo(() => {
    const classAverages = {
      avgDurationMinutes:
        studentPerformance.length > 0
          ? studentPerformance.reduce((sum, student) => sum + toNumber(student.avg_duration_minutes), 0) / studentPerformance.length
          : 0,
    };

    const merged = studentPerformance.map((student) => {
      const participation = studentParticipationById.get(String(student.id))
        || studentParticipationByNumber.get(String(student.student_number || ''))
        || studentParticipationByName.get(normalizeName(student.full_name))
        || {
        total_interactions: 0,
        chat_messages: 0,
        reactions: 0,
        hand_raises: 0,
        mic_toggles: 0,
        speaking_proxy_minutes: 0,
        sessions_with_activity: 0,
      };

      return {
        ...student,
        total_interactions: participation.total_interactions,
        chat_messages: participation.chat_messages,
        reactions: participation.reactions,
        hand_raises: participation.hand_raises,
        mic_toggles: participation.mic_toggles,
        speaking_proxy_minutes: participation.speaking_proxy_minutes,
        sessions_with_activity: participation.sessions_with_activity,
        engagement_score: computeEngagementScore({
          attendanceRate: toNumber(student.attendance_rate),
          avgDurationMinutes: toNumber(student.avg_duration_minutes),
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

    const maxInteractions = merged.reduce((max, student) => Math.max(max, toNumber(student.total_interactions)), 0) || 1;
    const maxSpeakingProxyMinutes = merged.reduce((max, student) => Math.max(max, toNumber(student.speaking_proxy_minutes)), 0) || 1;

    return merged.map((student) => ({
      ...student,
      engagement_score: computeEngagementScore({
        attendanceRate: toNumber(student.attendance_rate),
        avgDurationMinutes: toNumber(student.avg_duration_minutes),
        totalInteractions: toNumber(student.total_interactions),
        speakingProxyMinutes: toNumber(student.speaking_proxy_minutes),
        classAverages,
        classMaxima: {
          totalInteractions: maxInteractions,
          speakingProxyMinutes: maxSpeakingProxyMinutes,
        },
      }),
    }));
  }, [studentPerformance, studentParticipationById, studentParticipationByNumber, studentParticipationByName]);

  const bundleRows = useMemo(
    () =>
      scheduleBundles.map((bundle) => {
        const sessionIdsInBundle = Array.isArray(bundle.session_ids) ? bundle.session_ids : [];
        const participationTotals = sessionIdsInBundle.reduce(
          (totals, sessionId) => {
            const snapshot = sessionSnapshotById.get(sessionId);
            if (!snapshot) return totals;

            totals.chat += toNumber(snapshot.totals?.chat);
            totals.reaction += toNumber(snapshot.totals?.reaction);
            totals.hand_raise += toNumber(snapshot.totals?.hand_raise);
            totals.mic_toggle += toNumber(snapshot.totals?.mic_toggle);
            totals.speakingProxyMinutes += toNumber(snapshot.totals?.speakingProxyMinutes);
            totals.totalInteractions += toNumber(snapshot.totals?.totalInteractions);
            return totals;
          },
          {
            chat: 0,
            reaction: 0,
            hand_raise: 0,
            mic_toggle: 0,
            speakingProxyMinutes: 0,
            totalInteractions: 0,
          }
        );

        return {
          ...bundle,
          core_credit_minutes: Math.max(1, toNumber(bundle.planned_minutes) - toNumber(bundle.break_minutes)),
          participationTotals,
        };
      }),
    [scheduleBundles, sessionSnapshotById]
  );

  const effectiveBundleRows = useMemo(() => {
    if (bundleRows.length > 0) return bundleRows;

    const toLocalDateKey = (date) => {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const fallbackSessions = sessionTrends
      .map((session) => {
        const startedAt = resolveSessionDate(session);
        const endedAt = resolveSessionEnd(session);
        if (!startedAt || !endedAt || Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
          return null;
        }

        const snapshot = sessionSnapshotById.get(session.id);
        return {
          session,
          start: startedAt,
          end: endedAt,
          durationMinutes: Math.max(1, toNumber(session.avg_duration_minutes)),
          dateKey: toLocalDateKey(startedAt),
          totals: {
            chat: toNumber(snapshot?.totals?.chat),
            reaction: toNumber(snapshot?.totals?.reaction),
            hand_raise: toNumber(snapshot?.totals?.hand_raise),
            mic_toggle: toNumber(snapshot?.totals?.mic_toggle),
            speakingProxyMinutes: toNumber(snapshot?.totals?.speakingProxyMinutes),
            totalInteractions: toNumber(snapshot?.totals?.totalInteractions),
          },
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.start.getTime() - right.start.getTime());

    if (fallbackSessions.length === 0) return [];

    const MAX_GAP_MINUTES_FOR_SAME_SESSION = 25;
    const bundles = [];
    let current = null;

    fallbackSessions.forEach((item) => {
      const startIso = item.start.toISOString();
      const endIso = item.end.toISOString();

      if (!current) {
        current = {
          bundle_id: `synthetic-${item.dateKey}-${item.session.id}`,
          date: item.dateKey,
          day_name: item.start.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          schedule_index: bundles.length,
          planned_start_time: toTimeText(item.start),
          planned_end_time: toTimeText(item.end),
          planned_start_at: startIso,
          planned_end_at: endIso,
          actual_first_start_at: startIso,
          actual_last_end_at: endIso,
          actual_total_minutes: item.durationMinutes,
          break_minutes: 0,
          core_credit_minutes: item.durationMinutes,
          session_ids: [item.session.id],
          sessions: [{ id: item.session.id, start_at: startIso, end_at: endIso }],
          participationTotals: { ...item.totals },
        };
        return;
      }

      const currentEnd = new Date(current.actual_last_end_at);
      const gapMinutes = diffMinutes(item.start, currentEnd);
      const isSameDay = current.date === item.dateKey;
      const shouldMerge = isSameDay && gapMinutes <= MAX_GAP_MINUTES_FOR_SAME_SESSION;

      if (!shouldMerge) {
        current.core_credit_minutes = Math.max(1, current.actual_total_minutes - current.break_minutes);
        bundles.push(current);
        current = {
          bundle_id: `synthetic-${item.dateKey}-${item.session.id}`,
          date: item.dateKey,
          day_name: item.start.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          schedule_index: bundles.length,
          planned_start_time: toTimeText(item.start),
          planned_end_time: toTimeText(item.end),
          planned_start_at: startIso,
          planned_end_at: endIso,
          actual_first_start_at: startIso,
          actual_last_end_at: endIso,
          actual_total_minutes: item.durationMinutes,
          break_minutes: 0,
          core_credit_minutes: item.durationMinutes,
          session_ids: [item.session.id],
          sessions: [{ id: item.session.id, start_at: startIso, end_at: endIso }],
          participationTotals: { ...item.totals },
        };
        return;
      }

      current.actual_last_end_at = endIso;
      current.planned_end_at = endIso;
      current.planned_end_time = toTimeText(item.end);
      current.actual_total_minutes += item.durationMinutes;
      current.break_minutes += Math.max(0, gapMinutes);
      current.session_ids.push(item.session.id);
      current.sessions.push({ id: item.session.id, start_at: startIso, end_at: endIso });
      current.participationTotals.chat += item.totals.chat;
      current.participationTotals.reaction += item.totals.reaction;
      current.participationTotals.hand_raise += item.totals.hand_raise;
      current.participationTotals.mic_toggle += item.totals.mic_toggle;
      current.participationTotals.speakingProxyMinutes += item.totals.speakingProxyMinutes;
      current.participationTotals.totalInteractions += item.totals.totalInteractions;
    });

    if (current) {
      current.core_credit_minutes = Math.max(1, current.actual_total_minutes - current.break_minutes);
      bundles.push(current);
    }

    return bundles;
  }, [bundleRows, sessionTrends, sessionSnapshotById]);

  const bundleBySessionId = useMemo(() => {
    const map = new Map();
    bundleRows.forEach((bundle) => {
      (bundle.session_ids || []).forEach((sessionId) => {
        map.set(sessionId, bundle);
      });
    });
    return map;
  }, [bundleRows]);

  const enrichedSessions = useMemo(
    () =>
      sessionTrends.map((session) => {
        const snapshot = sessionSnapshotById.get(session.id) || { totals: createEmptyInteractionTotals(), students: [] };
        const bundle = bundleBySessionId.get(session.id);
        const duration = toNumber(session.avg_duration_minutes);
        const coreCreditMinutes = Math.max(1, toNumber(bundle?.core_credit_minutes) || duration || 1);
        const normalizedAttendancePct = round((duration / coreCreditMinutes) * 100, 1);
        const pulseEngagementScore = round(
          ((toNumber(snapshot.totals.speakingProxyMinutes) * WEIGHTS.mic) +
            (toNumber(snapshot.totals.reaction) * WEIGHTS.reaction) +
            (toNumber(snapshot.totals.chat) * WEIGHTS.chat)) /
            Math.max(1, duration),
          2
        );

        return {
          ...session,
          chat_count: snapshot.totals.chat,
          reaction_count: snapshot.totals.reaction,
          mic_toggle_count: snapshot.totals.mic_toggle,
          hand_raise_count: snapshot.totals.hand_raise,
          speaking_proxy_minutes: snapshot.totals.speakingProxyMinutes,
          total_interactions: snapshot.totals.totalInteractions,
          participating_students: snapshot.uniqueStudents || snapshot.students.length || 0,
          core_credit_minutes: coreCreditMinutes,
          normalized_attendance_pct: normalizedAttendancePct,
          pulse_engagement_score: pulseEngagementScore,
        };
      }),
    [sessionTrends, sessionSnapshotById, bundleBySessionId]
  );

  useEffect(() => {
    if (!selectedBundleId && effectiveBundleRows.length > 0) {
      setSelectedBundleId(effectiveBundleRows[effectiveBundleRows.length - 1].bundle_id);
    }
  }, [effectiveBundleRows, selectedBundleId]);

  useEffect(() => {
    if (effectiveBundleRows.length === 0) {
      setSelectedStudentBundleId(null);
      return;
    }

    const hasCurrent = effectiveBundleRows.some((bundle) => bundle.bundle_id === selectedStudentBundleId);
    if (!hasCurrent) {
      setSelectedStudentBundleId(effectiveBundleRows[effectiveBundleRows.length - 1].bundle_id);
    }
  }, [effectiveBundleRows, selectedStudentBundleId]);

  const selectedBundle = useMemo(
    () => effectiveBundleRows.find((bundle) => bundle.bundle_id === selectedBundleId) || null,
    [effectiveBundleRows, selectedBundleId]
  );

  const selectedStudentBundle = useMemo(
    () => effectiveBundleRows.find((bundle) => bundle.bundle_id === selectedStudentBundleId) || null,
    [effectiveBundleRows, selectedStudentBundleId]
  );

  const currentSessionRows = useMemo(
    () => createSessionRows({
      sessions: enrichedSessions,
      snapshotById: sessionSnapshotById,
      attendanceBySessionId,
    }),
    [enrichedSessions, sessionSnapshotById, attendanceBySessionId]
  );

  const previousSessionRows = useMemo(
    () => createSessionRows({
      sessions: previousSessionTrends,
      snapshotById: previousSessionSnapshotById,
      attendanceBySessionId: previousAttendanceBySessionId,
    }),
    [previousSessionTrends, previousSessionSnapshotById, previousAttendanceBySessionId]
  );

  const lifetimeSessionRows = useMemo(
    () => createSessionRows({
      sessions: lifetimeSessionTrends,
      snapshotById: lifetimeSessionSnapshotById,
      attendanceBySessionId: lifetimeAttendanceBySessionId,
    }),
    [lifetimeSessionTrends, lifetimeSessionSnapshotById, lifetimeAttendanceBySessionId]
  );

  const currentSummary = useMemo(() => createTimeAgnosticSummary(currentSessionRows), [currentSessionRows]);
  const previousSummary = useMemo(() => createTimeAgnosticSummary(previousSessionRows), [previousSessionRows]);
  const lifetimeSummary = useMemo(() => createTimeAgnosticSummary(lifetimeSessionRows), [lifetimeSessionRows]);

  const baselineSummary = previousSummary.sessions > 0 ? previousSummary : lifetimeSummary;
  const baselineModeLabel = previousSummary.sessions > 0 ? 'previous equivalent period' : 'class lifetime average';
  const showBaselineDelta = hasMeaningfulBaseline(currentSummary, baselineSummary);

  const engagementEfficiencyBand = currentSummary.efficiencyGap <= 12
    ? { label: 'Healthy', tone: 'text-emerald-700 border-emerald-200 bg-emerald-50' }
    : currentSummary.efficiencyGap <= 24
      ? { label: 'Watch', tone: 'text-amber-700 border-amber-200 bg-amber-50' }
      : { label: 'Critical', tone: 'text-rose-700 border-rose-200 bg-rose-50' };

  const talkShareRatio = useMemo(() => {
    const talk = Math.max(0, toNumber(currentSummary.talkSharePct));
    const listen = Math.max(0, 100 - talk);
    return `${round(talk, 1)}:${round(listen, 1)}`;
  }, [currentSummary.talkSharePct]);

  const summaryCards = useMemo(
    () => [
      {
        id: 'interaction-intensity',
        title: 'Interaction Intensity',
        value: `${currentSummary.interactionsPerSession}`,
        subtitle: `${currentSummary.interactionsPerHour}/hour`,
        delta: showBaselineDelta ? computeDelta(currentSummary.interactionsPerSession, baselineSummary.interactionsPerSession) : null,
        lowerIsBetter: false,
        footprint: 'xl:col-span-3',
      },
      {
        id: 'engagement-efficiency',
        title: 'Engagement Efficiency Gap',
        value: `${currentSummary.efficiencyGap}%`,
        subtitle: `Presence ${currentSummary.presenceRate}% vs participation ${currentSummary.participationRate}%`,
        delta: showBaselineDelta ? computeDelta(currentSummary.efficiencyGap, baselineSummary.efficiencyGap) : null,
        lowerIsBetter: true,
        footprint: 'xl:col-span-3',
      },
      {
        id: 'talk-share',
        title: 'Instructor Talk Share (Proxy)',
        value: `${currentSummary.talkSharePct}%`,
        subtitle: `Talk-to-listen ${talkShareRatio}`,
        delta: showBaselineDelta ? computeDelta(currentSummary.talkSharePct, baselineSummary.talkSharePct) : null,
        lowerIsBetter: true,
        footprint: 'xl:col-span-2',
      },
      {
        id: 'session-consistency',
        title: 'Session Consistency',
        value: `${currentSummary.consistencyIndex}%`,
        subtitle: `${currentSummary.sessions} sessions in range`,
        delta: showBaselineDelta ? computeDelta(currentSummary.consistencyIndex, baselineSummary.consistencyIndex) : null,
        lowerIsBetter: false,
        footprint: 'xl:col-span-2',
      },
      {
        id: 'active-participation',
        title: 'Active Participation',
        value: `${currentSummary.participationRate}%`,
        subtitle: `Logged-in presence ${currentSummary.presenceRate}%`,
        delta: showBaselineDelta ? computeDelta(currentSummary.participationRate, baselineSummary.participationRate) : null,
        lowerIsBetter: false,
        footprint: 'xl:col-span-2',
      },
    ],
    [baselineSummary, currentSummary, talkShareRatio]
  );

  const drilldownMode = currentSessionRows.length <= 24 ? 'session' : 'weekly';

  const fragmentDrilldownData = useMemo(() => {
    if (drilldownMode === 'session') {
      return currentSessionRows.map((row) => ({
        label: row.dateLabel,
        bucketSize: 1,
        interactionsPerHour: row.interactionsPerHour,
        presenceRate: row.presenceRate,
        participationRate: row.participationRate,
        efficiencyGap: row.efficiencyGap,
      }));
    }

    const weekly = new Map();
    currentSessionRows.forEach((row) => {
      if (!weekly.has(row.weekKey)) {
        weekly.set(row.weekKey, {
          label: row.weekKey,
          sessions: 0,
          interactionsPerHourSum: 0,
          presenceRateSum: 0,
          participationRateSum: 0,
          efficiencyGapSum: 0,
        });
      }

      const bucket = weekly.get(row.weekKey);
      bucket.sessions += 1;
      bucket.interactionsPerHourSum += toNumber(row.interactionsPerHour);
      bucket.presenceRateSum += toNumber(row.presenceRate);
      bucket.participationRateSum += toNumber(row.participationRate);
      bucket.efficiencyGapSum += toNumber(row.efficiencyGap);
    });

    return Array.from(weekly.values())
      .sort((left, right) => left.label.localeCompare(right.label))
      .map((bucket) => ({
        label: bucket.label,
        bucketSize: bucket.sessions,
        interactionsPerHour: round(bucket.interactionsPerHourSum / Math.max(1, bucket.sessions), 2),
        presenceRate: round(bucket.presenceRateSum / Math.max(1, bucket.sessions), 1),
        participationRate: round(bucket.participationRateSum / Math.max(1, bucket.sessions), 1),
        efficiencyGap: round(bucket.efficiencyGapSum / Math.max(1, bucket.sessions), 1),
      }));
  }, [currentSessionRows, drilldownMode]);

  const selectedSessionLogs = useMemo(
    () =>
      (selectedBundle?.session_ids || []).flatMap((sessionId) => getSessionBucket(logsBySessionId, sessionId)),
    [logsBySessionId, selectedBundle]
  );

  const selectedStudentSessionLogs = useMemo(
    () =>
      (selectedStudentBundle?.session_ids || []).flatMap((sessionId) => getSessionBucket(logsBySessionId, sessionId)),
    [logsBySessionId, selectedStudentBundle]
  );

  const allSessionLogs = useMemo(
    () => sessionIds.flatMap((sessionId) => getSessionBucket(logsBySessionId, sessionId)),
    [sessionIds, logsBySessionId]
  );

  const selectedAttendanceRows = useMemo(
    () => {
      const rawRows = (selectedBundle?.session_ids || []).flatMap((sessionId) => attendanceBySessionId.get(sessionId) || []);
      return mergeAttendanceRecords(rawRows);
    },
    [attendanceBySessionId, selectedBundle]
  );

  const selectedStudentAttendanceRows = useMemo(
    () => {
      const rawRows = (selectedStudentBundle?.session_ids || []).flatMap((sessionId) => attendanceBySessionId.get(sessionId) || []);
      return mergeAttendanceRecords(rawRows);
    },
    [attendanceBySessionId, selectedStudentBundle]
  );

  const selectedSession = useMemo(() => {
    if (!selectedBundle) return null;

    const totals = selectedBundle.participationTotals || createEmptyInteractionTotals();
    const duration = Math.max(1, toNumber(selectedBundle.actual_total_minutes));
    const coreCreditMinutes = Math.max(1, toNumber(selectedBundle.core_credit_minutes));
    const pulseEngagementScore = round(
      ((toNumber(totals.speakingProxyMinutes) * WEIGHTS.mic) +
        (toNumber(totals.reaction) * WEIGHTS.reaction) +
        (toNumber(totals.chat) * WEIGHTS.chat)) /
        duration,
      2
    );

    return {
      pulse_engagement_score: pulseEngagementScore,
      core_credit_minutes: coreCreditMinutes,
      normalized_attendance_pct: round((duration / coreCreditMinutes) * 100, 1),
    };
  }, [selectedBundle]);

  const pulseWindow = useMemo(() => {
    return buildPulseWindowFromBundle(selectedBundle);
  }, [selectedBundle]);

  const studentPulseWindow = useMemo(() => buildPulseWindowFromBundle(selectedStudentBundle), [selectedStudentBundle]);

  const studentsForProfile = useMemo(() => {
    if (studentScope !== 'pulse-session' || !studentPulseWindow) {
      return enrichedStudents;
    }

    const parseAdditionalData = (log) => {
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

    const byStudent = new Map();

    selectedStudentAttendanceRows.forEach((row) => {
      const key = row.student_id
        ? `student:${row.student_id}`
        : `name:${normalizeName(row.student_name || row.participant_name)}`;

      const durationMinutes = toNumber(row.total_duration_minutes);
      const attendanceRate = round((durationMinutes / Math.max(1, studentPulseWindow.creditMinutes)) * 100, 1);

      byStudent.set(key, {
        id: row.student_id || key,
        full_name: row.student_name || row.participant_name || 'Unknown student',
        student_id: row.student_id || null,
        student_number: row.student_number || null,
        attendance_rate: attendanceRate,
        avg_duration_minutes: durationMinutes,
        total_interactions: 0,
        chat_messages: 0,
        reactions: 0,
        hand_raises: 0,
        mic_toggles: 0,
        speaking_proxy_minutes: 0,
        sessions_with_activity: 0,
      });
    });

    selectedStudentSessionLogs.forEach((log) => {
      const fallbackName = log.full_name || log.student_name || log.participant_name || 'Unknown student';
      const key = log.student_id
        ? `student:${log.student_id}`
        : `name:${normalizeName(fallbackName)}`;

      if (!byStudent.has(key)) {
        byStudent.set(key, {
          id: log.student_id || key,
          full_name: fallbackName,
          student_id: log.student_id || null,
          student_number: log.student_number || null,
          attendance_rate: 0,
          avg_duration_minutes: 0,
          total_interactions: 0,
          chat_messages: 0,
          reactions: 0,
          hand_raises: 0,
          mic_toggles: 0,
          speaking_proxy_minutes: 0,
          sessions_with_activity: 0,
        });
      }

      const entry = byStudent.get(key);
      entry.total_interactions += 1;

      if (log.interaction_type === 'chat') entry.chat_messages += 1;
      if (log.interaction_type === 'reaction') entry.reactions += 1;
      if (log.interaction_type === 'hand_raise') entry.hand_raises += 1;
      if (log.interaction_type === 'mic_toggle') {
        entry.mic_toggles += 1;
        const additional = parseAdditionalData(log) || {};
        const speakingSeconds = toNumber(additional.speakingDurationSeconds || additional.speaking_duration_seconds);
        if (speakingSeconds > 0) {
          entry.speaking_proxy_minutes += speakingSeconds / 60;
        }
      }
    });

    const rows = Array.from(byStudent.values());
    const classAveragesScoped = {
      avgDurationMinutes: rows.length > 0
        ? rows.reduce((sum, row) => sum + toNumber(row.avg_duration_minutes), 0) / rows.length
        : 0,
    };
    const maxInteractions = Math.max(1, ...rows.map((row) => toNumber(row.total_interactions)));
    const maxSpeaking = Math.max(1, ...rows.map((row) => toNumber(row.speaking_proxy_minutes)));

    return rows
      .map((row) => ({
        ...row,
        sessions_with_activity: row.total_interactions > 0 ? 1 : 0,
        speaking_proxy_minutes: round(row.speaking_proxy_minutes, 2),
        engagement_score: computeEngagementScore({
          attendanceRate: toNumber(row.attendance_rate),
          avgDurationMinutes: toNumber(row.avg_duration_minutes),
          totalInteractions: toNumber(row.total_interactions),
          speakingProxyMinutes: toNumber(row.speaking_proxy_minutes),
          classAverages: classAveragesScoped,
          classMaxima: {
            totalInteractions: maxInteractions,
            speakingProxyMinutes: maxSpeaking,
          },
        }),
      }))
      .sort((left, right) => left.full_name.localeCompare(right.full_name));
  }, [studentScope, enrichedStudents, selectedStudentAttendanceRows, selectedStudentSessionLogs, studentPulseWindow]);

  useEffect(() => {
    if (studentsForProfile.length === 0) {
      setProfiledStudentId(null);
      return;
    }

    const hasCurrent = studentsForProfile.some((student) => String(student.id) === String(profiledStudentId));
    if (!hasCurrent) {
      setProfiledStudentId(studentsForProfile[0].id);
    }
  }, [studentsForProfile, profiledStudentId]);

  const synchronizedTimeline = useMemo(() => {
    if (!selectedBundle || !pulseWindow) return [];

    const bucketSize = pulseWindow.spanMinutes > 120 ? 10 : 5;
    const bucketCount = Math.max(1, Math.ceil(pulseWindow.spanMinutes / bucketSize));
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const minute = index * bucketSize;
      const labelTime = new Date(pulseWindow.start.getTime() + minute * 60 * 1000);
      return {
        minute,
        label: labelTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        chat: 0,
        reaction: 0,
        handRaise: 0,
        micToggle: 0,
        activity: 0,
      };
    });

    selectedSessionLogs.forEach((log) => {
      const timestamp = log?.timestamp ? new Date(log.timestamp) : null;
      if (!timestamp || Number.isNaN(timestamp.getTime())) return;
      if (timestamp < pulseWindow.start || timestamp > pulseWindow.end) return;

      const minuteOffset = diffMinutes(timestamp, pulseWindow.start);
      const bucketIndex = Math.min(buckets.length - 1, Math.floor(minuteOffset / bucketSize));
      const bucket = buckets[bucketIndex];
      const interaction = log?.interaction_type;

      if (interaction === 'chat') bucket.chat += 1;
      if (interaction === 'reaction') bucket.reaction += 1;
      if (interaction === 'hand_raise') bucket.handRaise += 1;
      if (interaction === 'mic_toggle') bucket.micToggle += 1;
      bucket.activity = bucket.chat + bucket.reaction + bucket.handRaise + bucket.micToggle;
    });

    return buckets;
  }, [selectedBundle, selectedSessionLogs, pulseWindow]);

  const peakMoment = useMemo(() => {
    if (synchronizedTimeline.length === 0) return null;
    return [...synchronizedTimeline].sort((left, right) => right.reaction - left.reaction || right.activity - left.activity)[0];
  }, [synchronizedTimeline]);

  const presenceRows = useMemo(() => {
    if (!pulseWindow) return [];

    return selectedAttendanceRows
      .map((record) => {
        const intervals = (record.intervals || [])
          .map((interval) => {
            const start = new Date(interval.joined_at);
            const end = interval.left_at ? new Date(interval.left_at) : pulseWindow.end;
            if (
              Number.isNaN(start.getTime()) ||
              Number.isNaN(end.getTime()) ||
              end <= pulseWindow.start ||
              start >= pulseWindow.end
            ) {
              return null;
            }

            const clippedStart = new Date(Math.max(start.getTime(), pulseWindow.start.getTime()));
            const clippedEnd = new Date(Math.min(end.getTime(), pulseWindow.end.getTime()));

            const leftPct = ((clippedStart.getTime() - pulseWindow.start.getTime()) / (pulseWindow.spanMinutes * 60 * 1000)) * 100;
            const widthPct = ((clippedEnd.getTime() - clippedStart.getTime()) / (pulseWindow.spanMinutes * 60 * 1000)) * 100;

            return {
              start: clippedStart,
              end: clippedEnd,
              leftPct,
              widthPct,
            };
          })
          .filter(Boolean);

        const rawMinutes = intervals.reduce((sum, segment) => sum + diffMinutes(segment.end, segment.start), 0);
        const deductedBreakMinutes = pulseWindow.breakSegments.reduce((sum, breakSegment) => {
          return (
            sum +
            intervals.reduce(
              (inner, interval) => inner + overlapMinutes(interval.start, interval.end, breakSegment.start, breakSegment.end),
              0
            )
          );
        }, 0);

        const creditedMinutes = Math.max(0, rawMinutes - deductedBreakMinutes);

        return {
          id: record.student_id || record.participant_name,
          studentId: record.student_id,
          name: record.student_name || record.participant_name || 'Unknown participant',
          intervals,
          creditedPct: round((creditedMinutes / pulseWindow.creditMinutes) * 100, 1),
        };
      })
      .sort((left, right) => right.creditedPct - left.creditedPct);
  }, [selectedAttendanceRows, pulseWindow]);

  const reactionDiversityByStudent = useMemo(() => {
    const map = new Map();
    const sourceLogs = studentScope === 'pulse-session' ? selectedStudentSessionLogs : allSessionLogs;

    sourceLogs.forEach((log) => {
      if (log?.interaction_type !== 'reaction') return;
      const studentId = log?.student_id;
      if (!studentId) return;
      const reaction = log?.additional_data?.reaction || log?.interaction_value || log?.reaction || 'reaction';
      if (!map.has(studentId)) map.set(studentId, new Set());
      map.get(studentId).add(String(reaction));
    });
    return map;
  }, [studentScope, selectedStudentSessionLogs, allSessionLogs]);

  const profiledStudent = useMemo(
    () => studentsForProfile.find((student) => String(student.id) === String(profiledStudentId)) || null,
    [studentsForProfile, profiledStudentId]
  );

  const profileRadarComparisonData = useMemo(() => {
    if (!profiledStudent || studentsForProfile.length === 0) return [];

    const avg = (values) => {
      if (!Array.isArray(values) || values.length === 0) return 0;
      return values.reduce((sum, value) => sum + toNumber(value), 0) / values.length;
    };

    const maxChat = Math.max(1, ...studentsForProfile.map((item) => toNumber(item.chat_messages)));
    const maxSpeak = Math.max(1, ...studentsForProfile.map((item) => toNumber(item.speaking_proxy_minutes)));
    const maxHandRaise = Math.max(1, ...studentsForProfile.map((item) => toNumber(item.hand_raises)));
    const diversityValues = studentsForProfile.map((item) => reactionDiversityByStudent.get(item.id)?.size || 0);
    const maxDiversity = Math.max(1, ...diversityValues);

    return [
      {
        axis: 'Attendance',
        student: toNumber(profiledStudent.attendance_rate),
        classAvg: avg(studentsForProfile.map((item) => toNumber(item.attendance_rate))),
      },
      {
        axis: 'Mic Usage',
        student: round((toNumber(profiledStudent.speaking_proxy_minutes) / maxSpeak) * 100, 1),
        classAvg: round(avg(studentsForProfile.map((item) => (toNumber(item.speaking_proxy_minutes) / maxSpeak) * 100)), 1),
      },
      {
        axis: 'Chat Frequency',
        student: round((toNumber(profiledStudent.chat_messages) / maxChat) * 100, 1),
        classAvg: round(avg(studentsForProfile.map((item) => (toNumber(item.chat_messages) / maxChat) * 100)), 1),
      },
      {
        axis: 'Reaction Diversity',
        student: round(((reactionDiversityByStudent.get(profiledStudent.id)?.size || 0) / maxDiversity) * 100, 1),
        classAvg: round(avg(studentsForProfile.map((item) => ((reactionDiversityByStudent.get(item.id)?.size || 0) / maxDiversity) * 100)), 1),
      },
      {
        axis: 'Hand Raises',
        student: round((toNumber(profiledStudent.hand_raises) / maxHandRaise) * 100, 1),
        classAvg: round(avg(studentsForProfile.map((item) => (toNumber(item.hand_raises) / maxHandRaise) * 100)), 1),
      },
    ];
  }, [profiledStudent, studentsForProfile, reactionDiversityByStudent]);

  const studentPersona = useMemo(() => {
    if (!profiledStudent) return 'N/A';

    const attendance = toNumber(profiledStudent.attendance_rate);
    const chat = toNumber(profiledStudent.chat_messages);
    const speak = toNumber(profiledStudent.speaking_proxy_minutes);

    if (attendance >= 85 && (chat >= 8 || speak >= 5)) return 'Vocal Contributor';
    if (attendance >= 85 && chat < 8 && speak < 5) return 'Reliable Listener';
    if (attendance >= 70 && (chat >= 5 || speak >= 3)) return 'Consistent Participant';
    if (attendance < 70 && (chat < 3 && speak < 2)) return 'Passive Observer';
    return 'Emerging Participant';
  }, [profiledStudent]);

  const resilienceByStudent = useMemo(() => {
    const map = new Map();
    if (studentScope !== 'pulse-session' || !studentPulseWindow || studentPulseWindow.breakSegments.length === 0) {
      return map;
    }

    const meaningfulBreaks = studentPulseWindow.breakSegments.filter(
      (segment) => diffMinutes(segment.end, segment.start) >= 20
    );

    if (meaningfulBreaks.length === 0) return map;

    selectedStudentAttendanceRows.forEach((row) => {
      const rowKey = row.student_id || `name:${normalizeName(row.student_name || row.participant_name)}`;
      const rowIntervals = (row.intervals || [])
        .map((interval) => {
          const start = interval?.joined_at ? new Date(interval.joined_at) : null;
          const end = interval?.left_at ? new Date(interval.left_at) : studentPulseWindow.end;
          if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
          return { start, end };
        })
        .filter(Boolean);

      const resilient = meaningfulBreaks.some((breakSegment) => {
        const before = rowIntervals.some((segment) => segment.start < breakSegment.start);
        const after = rowIntervals.some((segment) => segment.end > breakSegment.end);
        return before && after;
      });

      map.set(rowKey, resilient);
      if (row.student_id) {
        map.set(row.student_id, resilient);
      }
    });

    return map;
  }, [studentScope, selectedStudentAttendanceRows, studentPulseWindow]);

  const longitudinalAttendanceData = useMemo(() => {
    return enrichedSessions.map((session) => {
      const attendanceRows = attendanceBySessionId.get(session.id) || [];
      const minutesAttended = round(attendanceRows.reduce((sum, row) => sum + toNumber(row.total_duration_minutes), 0), 1);

      return {
        date: resolveSessionDate(session)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Unknown',
        minutesAttended,
        normalizedAttendance: toNumber(session.normalized_attendance_pct),
      };
    });
  }, [enrichedSessions, attendanceBySessionId]);

  const lateJoinerData = useMemo(() => {
    const byStudent = new Map();

    enrichedSessions.forEach((session) => {
      const sessionStart = resolveSessionDate(session);
      if (!sessionStart) return;

      const attendanceRows = attendanceBySessionId.get(session.id) || [];
      attendanceRows.forEach((row) => {
        if (!row.student_id) return;
        const firstJoined = row.first_joined_at
          ? new Date(row.first_joined_at)
          : row.intervals?.[0]?.joined_at
            ? new Date(row.intervals[0].joined_at)
            : null;

        if (!firstJoined || Number.isNaN(firstJoined.getTime())) return;

        const lateMinutes = Math.max(0, diffMinutes(firstJoined, sessionStart));
        if (!byStudent.has(row.student_id)) {
          byStudent.set(row.student_id, {
            studentId: row.student_id,
            name: row.student_name || row.participant_name || 'Unknown student',
            totalLateMinutes: 0,
            sessions: 0,
          });
        }

        const item = byStudent.get(row.student_id);
        item.totalLateMinutes += lateMinutes;
        item.sessions += 1;
      });
    });

    return Array.from(byStudent.values()).map((item) => ({
      studentId: item.studentId,
      name: item.name,
      avgLateMinutes: round(item.totalLateMinutes / Math.max(1, item.sessions), 1),
      sessions: item.sessions,
    }));
  }, [enrichedSessions, attendanceBySessionId]);

  const studentHighlights = useMemo(() => {
    if (!profiledStudent) return { strengths: [], concerns: [], resilience: null };

    const total = Math.max(1, studentsForProfile.length);
    const rankDesc = (selector) => {
      const sorted = [...studentsForProfile].sort((left, right) => toNumber(selector(right)) - toNumber(selector(left)));
      const index = sorted.findIndex((student) => String(student.id) === String(profiledStudent.id));
      return index >= 0 ? index + 1 : total;
    };

    const attendanceRank = rankDesc((student) => student.attendance_rate);
    const engagementRank = rankDesc((student) => student.engagement_score);

    let classAvgLate = 0;
    let studentLate = 0;

    if (studentScope === 'pulse-session') {
      const latencyRows = selectedStudentAttendanceRows
        .map((row) => {
          const firstJoined = row.first_joined_at ? new Date(row.first_joined_at) : null;
          if (!firstJoined || !studentPulseWindow || Number.isNaN(firstJoined.getTime())) return null;
          return {
            id: row.student_id || `name:${normalizeName(row.student_name || row.participant_name)}`,
            lateMinutes: Math.max(0, diffMinutes(firstJoined, studentPulseWindow.start)),
          };
        })
        .filter(Boolean);

      classAvgLate = latencyRows.length > 0
        ? latencyRows.reduce((sum, row) => sum + toNumber(row.lateMinutes), 0) / latencyRows.length
        : 0;
      studentLate = toNumber(
        latencyRows.find((row) => String(row.id) === String(profiledStudent.id))?.lateMinutes,
        0
      );
    } else {
      classAvgLate = lateJoinerData.length > 0
        ? lateJoinerData.reduce((sum, row) => sum + toNumber(row.avgLateMinutes), 0) / lateJoinerData.length
        : 0;
      studentLate = toNumber(lateJoinerData.find((row) => String(row.studentId) === String(profiledStudent.id))?.avgLateMinutes, 0);
    }

    const meaningfulBreakCount = (studentPulseWindow?.breakSegments || []).filter(
      (segment) => diffMinutes(segment.end, segment.start) >= 20
    ).length;
    const hasMeaningfulBreaks = meaningfulBreakCount > 0;
    const isResilient = hasMeaningfulBreaks ? !!resilienceByStudent.get(profiledStudent.id) : null;

    const strengths = [];
    const concerns = [];

    if (attendanceRank <= Math.max(1, Math.ceil(total * 0.3))) {
      strengths.push(`Attendance strength: ranked #${attendanceRank} of ${total}.`);
    }

    if (engagementRank <= Math.max(1, Math.ceil(total * 0.35))) {
      strengths.push(`Engagement strength: ranked #${engagementRank} of ${total}.`);
    }

    if (classAvgLate > 0 && studentLate <= classAvgLate * 0.6) {
      strengths.push(`Joins ${round(classAvgLate - studentLate, 1)}m earlier than class average.`);
    }

    if (hasMeaningfulBreaks && !isResilient) {
      const firstBreak = studentPulseWindow?.breakSegments?.[0] || null;
      const gapText = firstBreak
        ? `${firstBreak.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${firstBreak.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
        : 'post-break';
      concerns.push(`Dropout risk: did not return after ${gapText}.`);
    }

    if (attendanceRank > Math.ceil(total * 0.7)) {
      concerns.push(`Attendance concern: ranked #${attendanceRank} of ${total}.`);
    }

    if (classAvgLate > 0 && studentLate >= classAvgLate * 1.4) {
      concerns.push(`Late-join concern: joins ${round(studentLate - classAvgLate, 1)}m later than class average.`);
    }

    return {
      strengths: strengths.slice(0, 2),
      concerns: concerns.slice(0, 2),
      resilience: isResilient,
      hasMeaningfulBreaks,
    };
  }, [
    profiledStudent,
    studentsForProfile,
    studentScope,
    selectedStudentAttendanceRows,
    lateJoinerData,
    resilienceByStudent,
    studentPulseWindow,
  ]);

  const weeklyActivePassiveData = useMemo(() => {
    const map = new Map();

    enrichedSessions.forEach((session) => {
      const date = resolveSessionDate(session);
      if (!date) return;

      const weekKey = getWeekKey(date);
      const attendanceRows = attendanceBySessionId.get(session.id) || [];
      const totalMinutes = attendanceRows.reduce((sum, row) => sum + toNumber(row.total_duration_minutes), 0);

      const activeMinutes =
        toNumber(session.speaking_proxy_minutes) +
        toNumber(session.chat_count) * 0.2 +
        toNumber(session.reaction_count) * 0.1 +
        toNumber(session.hand_raise_count) * 0.2 +
        toNumber(session.mic_toggle_count) * 0.1;

      if (!map.has(weekKey)) {
        map.set(weekKey, { week: weekKey, active: 0, passive: 0 });
      }

      const week = map.get(weekKey);
      week.active += activeMinutes;
      week.passive += Math.max(0, totalMinutes - activeMinutes);
    });

    return Array.from(map.values())
      .sort((left, right) => left.week.localeCompare(right.week))
      .map((item) => ({
        week: item.week,
        active: round(item.active, 1),
        passive: round(item.passive, 1),
      }));
  }, [enrichedSessions, attendanceBySessionId]);

  const pulseScore = toNumber(selectedSession?.pulse_engagement_score);

  const pulseBand = pulseScore >= 1.25
    ? { label: 'Good', tone: 'text-emerald-700 border-emerald-200 bg-emerald-50' }
    : pulseScore >= 0.8
      ? { label: 'Average', tone: 'text-amber-700 border-amber-200 bg-amber-50' }
      : { label: 'Low', tone: 'text-rose-700 border-rose-200 bg-rose-50' };

  const pulseRingClass = pulseBand.label === 'Good'
    ? 'border-emerald-500'
    : pulseBand.label === 'Average'
      ? 'border-amber-500'
      : 'border-rose-500';

  const toggleTimelineSeries = (key) => {
    setTimelineVisibility((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const hasData = enrichedSessions.length > 0;
  const hasBundleData = bundleRows.length > 0;
  const isBusy = isLoading || participationLoading || attendanceLoading;
  const showSummaryTab = activeAnalyticsTab === 'summary';
  const showSessionTab = activeAnalyticsTab === 'session';
  const showStudentTab = activeAnalyticsTab === 'student';
  const showTrendsTab = activeAnalyticsTab === 'trends';

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

  if (isBusy) {
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

  if (!analytics) {
    return null;
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onQuickSelect={handleQuickSelect}
            variant="compact"
          />
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AcademicCapIcon className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Yet</h3>
          <p className="text-gray-500 text-center max-w-md mb-4">
            No session fragments were completed in this date range. Start or complete some fragments to see analytics here.
          </p>
          <p className="text-sm text-gray-400">
            Selected range: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveAnalyticsTab('summary')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              showSummaryTab ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveAnalyticsTab('session')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              showSessionTab ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Per-Session
          </button>
          <button
            type="button"
            onClick={() => setActiveAnalyticsTab('student')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              showStudentTab ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Per-Student
          </button>
          <button
            type="button"
            onClick={() => setActiveAnalyticsTab('trends')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              showTrendsTab ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Trends
          </button>
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onQuickSelect={handleQuickSelect}
            variant="compact"
          />
        </div>
      </div>

      {showSummaryTab ? (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Analytics Summary</p>
            <button
              type="button"
              title="Core credit window = session minutes - break gaps. Early arrivals are bonus, dead-time is excluded."
              className="text-slate-400 hover:text-slate-600"
            >
              <InformationCircleIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Baseline comparison mode: {baselineModeLabel}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {summaryCards.map((card) => {
            const tone = getDeltaTone(card.delta, card.lowerIsBetter);
            return (
              <div key={card.id} className={`rounded-xl border border-slate-200 bg-white p-4 ${card.footprint}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.title}</p>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${tone.chip}`}>
                    {tone.text}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="mt-1 text-xs text-slate-600">{card.subtitle}</p>
                <p className="mt-2 text-[11px] font-medium text-slate-500">{tone.detail}</p>
              </div>
            );
          })}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 xl:col-span-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Presence vs Participation</p>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${engagementEfficiencyBand.tone}`}>
                {engagementEfficiencyBand.label}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs text-slate-500">Presence</p>
                <p className="text-lg font-semibold text-slate-900">{currentSummary.presenceRate}%</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs text-slate-500">Participation</p>
                <p className="text-lg font-semibold text-slate-900">{currentSummary.participationRate}%</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs text-slate-500">Efficiency Gap</p>
                <p className="text-lg font-semibold text-slate-900">{currentSummary.efficiencyGap}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      {showSessionTab ? (
      <section className="space-y-5 rounded-2xl border border-gray-200 bg-gray-50/40 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Per-Session Analytics</h3>
            <p className="text-sm text-gray-600">Inspect synchronized activity, stitched presence stability, and normalized core credit.</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="session-select" className="text-sm font-medium text-gray-700">Pulse Session</label>
            <select
              id="session-select"
              value={selectedBundleId || ''}
              onChange={(event) => setSelectedBundleId(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {effectiveBundleRows.map((bundle) => (
                <option key={bundle.bundle_id} value={bundle.bundle_id}>
                  {bundle.date ? new Date(bundle.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}
                  {' - '}
                  {bundle.planned_start_time
                    ? formatTimeLabel(bundle.planned_start_time)
                    : formatDateTimeLabel(bundle.planned_start_at || bundle.actual_first_start_at)}
                  {' to '}
                  {bundle.planned_end_time
                    ? formatTimeLabel(bundle.planned_end_time)
                    : formatDateTimeLabel(bundle.planned_end_at || bundle.actual_last_end_at)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-500">Pulse Engagement Score</p>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${pulseBand.tone}`}>
                {pulseBand.label}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4 min-h-[84px]">
              <div className={`h-20 w-20 rounded-full border-4 flex items-center justify-center ${pulseRingClass}`}>
                <span className="text-2xl font-bold text-gray-900">{pulseScore}</span>
              </div>
              <div className="text-sm text-gray-500 flex flex-col justify-center">
                <p className="text-gray-700 font-medium">Session energy signal</p>
                <button
                  type="button"
                  onClick={() => setShowPulseFormula((previous) => !previous)}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  <InformationCircleIcon className="w-4 h-4" />
                  {showPulseFormula ? 'Hide formula' : 'Show formula'}
                </button>
              </div>
            </div>
            {showPulseFormula ? (
              <p className="text-xs text-slate-500 mt-3 text-center">
                E = (Mic x {WEIGHTS.mic} + Reactions x {WEIGHTS.reaction} + Chat x {WEIGHTS.chat}) / Session Minutes
              </p>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Core Credit</p>
                <p className="font-semibold text-slate-900">{formatMinutes(selectedSession?.core_credit_minutes)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-1">
                  <p className="text-slate-500">Normalized Attendance</p>
                  <span
                    className="text-slate-400"
                    title="Can exceed 100% when credited minutes are higher than planned core credit window (for example, sustained attendance/overtime beyond planned minutes)."
                  >
                    <InformationCircleIcon className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="font-semibold text-slate-900">{toNumber(selectedSession?.normalized_attendance_pct)}%</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm text-amber-900 flex items-start gap-2">
              <BoltIcon className="w-5 h-5 mt-0.5" />
              <p>
                {peakMoment
                  ? `Peak moment: ${peakMoment.label} produced the highest reaction burst.`
                  : 'Peak moment appears when timestamped reactions are present.'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">Synchronized Timeline</h4>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => toggleTimelineSeries('total')}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    timelineVisibility.total ? 'border-gray-300 bg-white text-gray-800' : 'border-gray-200 bg-gray-100 text-gray-400'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TIMELINE_TOTAL_COLOR, opacity: timelineVisibility.total ? 1 : 0.35 }} />
                  Total
                </button>
                {TIMELINE_SERIES.map((series) => {
                  const active = timelineVisibility[series.key];
                  return (
                    <button
                      key={series.key}
                      type="button"
                      onClick={() => toggleTimelineSeries(series.key)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        active ? 'border-gray-300 bg-white text-gray-800' : 'border-gray-200 bg-gray-100 text-gray-400'
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color, opacity: active ? 1 : 0.35 }} />
                      {series.label}
                    </button>
                  );
                })}
                <BoltIcon className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={synchronizedTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="activity"
                  stroke="none"
                  fill={TIMELINE_TOTAL_COLOR}
                  fillOpacity={0.08}
                  name="Total Envelope"
                  hide={!timelineVisibility.total}
                />
                <Line
                  type="monotone"
                  dataKey="activity"
                  stroke={TIMELINE_TOTAL_COLOR}
                  strokeWidth={3.25}
                  dot={false}
                  name="Total Activity"
                  hide={!timelineVisibility.total}
                />
                <Area
                  type="monotone"
                  dataKey="chat"
                  stroke={TIMELINE_COLORS.chat}
                  strokeWidth={2}
                  fill={TIMELINE_COLORS.chat}
                  fillOpacity={0.2}
                  name="Chat"
                  hide={!timelineVisibility.chat}
                />
                <Area
                  type="monotone"
                  dataKey="reaction"
                  stroke={TIMELINE_COLORS.reaction}
                  strokeWidth={2}
                  fill={TIMELINE_COLORS.reaction}
                  fillOpacity={0.2}
                  name="Reactions"
                  hide={!timelineVisibility.reaction}
                />
                <Area
                  type="monotone"
                  dataKey="handRaise"
                  stroke={TIMELINE_COLORS.handRaise}
                  strokeWidth={2}
                  fill={TIMELINE_COLORS.handRaise}
                  fillOpacity={0.2}
                  name="Hand Raises"
                  hide={!timelineVisibility.handRaise}
                />
                <Area
                  type="monotone"
                  dataKey="micToggle"
                  stroke={TIMELINE_COLORS.micToggle}
                  strokeWidth={2}
                  fill={TIMELINE_COLORS.micToggle}
                  fillOpacity={0.2}
                  name="Mic Toggles"
                  hide={!timelineVisibility.micToggle}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900">Presence Gantt</h4>
            <ClockIcon className="w-5 h-5 text-slate-500" />
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {presenceRows.length === 0 && (
              <p className="text-sm text-gray-500">No attendance interval data for the selected session.</p>
            )}
            {presenceRows.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-[180px_1fr_90px] gap-2 md:gap-3 items-center">
                <div className="text-xs md:text-sm">
                  <button
                    type="button"
                    onClick={() => row.studentId && setProfiledStudentId(row.studentId)}
                    className="font-medium text-gray-800 hover:text-blue-700 truncate text-left w-full"
                    title={row.name}
                  >
                    {row.name}
                  </button>
                </div>
                <div className="relative h-4 rounded bg-slate-100 overflow-hidden">
                  {row.intervals.map((segment, index) => (
                    <span
                      key={`${row.id}-segment-${index}`}
                      className="absolute top-0 h-full bg-sky-500/75"
                      style={{ left: `${segment.leftPct}%`, width: `${segment.widthPct}%` }}
                    />
                  ))}
                  {(pulseWindow?.breakSegments || []).map((segment, index) => {
                    const left = ((segment.start.getTime() - pulseWindow.start.getTime()) / (pulseWindow.spanMinutes * 60 * 1000)) * 100;
                    const width = ((segment.end.getTime() - segment.start.getTime()) / (pulseWindow.spanMinutes * 60 * 1000)) * 100;
                    return (
                      <span
                        key={`break-${index}`}
                        className="absolute top-0 h-full bg-rose-200/80"
                        style={{ left: `${left}%`, width: `${width}%` }}
                      />
                    );
                  })}
                </div>
                <div className="text-xs font-semibold text-slate-700 text-right">
                  {row.creditedPct}% credit
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {showStudentTab ? (
      <section className="space-y-5 rounded-2xl border border-gray-200 bg-gray-50/40 p-5">
        <h3 className="text-xl font-semibold text-gray-900">Per-Student Analytics</h3>
        <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student Scope</span>
          <button
            type="button"
            onClick={() => setStudentScope('date-range')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              studentScope === 'date-range'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Date Range
          </button>
          <button
            type="button"
            onClick={() => setStudentScope('pulse-session')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              studentScope === 'pulse-session'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Pulse Session
          </button>
          <span className="text-xs text-slate-500">
            {studentScope === 'pulse-session'
              ? 'Student metrics are focused on the pulse session selected below (independent from Per-Session tab).'
              : 'Student metrics reflect the active date range filter.'}
          </span>
        </div>
        {studentScope === 'pulse-session' ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <label htmlFor="student-pulse-session-select" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Student Pulse Session
            </label>
            <select
              id="student-pulse-session-select"
              value={selectedStudentBundleId || ''}
              onChange={(event) => setSelectedStudentBundleId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {effectiveBundleRows.map((bundle) => (
                <option key={bundle.bundle_id} value={bundle.bundle_id}>
                  {bundle.date ? new Date(bundle.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}
                  {' - '}
                  {bundle.planned_start_time
                    ? formatTimeLabel(bundle.planned_start_time)
                    : formatDateTimeLabel(bundle.planned_start_at || bundle.actual_first_start_at)}
                  {' to '}
                  {bundle.planned_end_time
                    ? formatTimeLabel(bundle.planned_end_time)
                    : formatDateTimeLabel(bundle.planned_end_at || bundle.actual_last_end_at)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {profiledStudent ? (
          <div className={`rounded-lg border px-3 py-2 text-sm font-medium inline-flex items-center gap-2 ${
            studentHighlights.resilience === true
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : studentHighlights.resilience === false
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}>
            {studentHighlights.resilience === true
              ? 'Resilient'
              : studentHighlights.resilience === false
                ? 'Dropout Risk'
                : 'No Major Gap'}
            <span className="text-xs font-semibold opacity-80">
              {studentHighlights.resilience === true
                ? 'Returned after major gaps'
                : studentHighlights.resilience === false
                  ? 'Did not return after a major gap'
                  : 'No 20+ minute break in selected pulse session'}
            </span>
          </div>
        ) : null}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">Participation Radar</h4>
              <SparklesIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div className="mb-3">
              <label htmlFor="student-select" className="text-xs uppercase tracking-wide text-gray-500">Profiled Student</label>
              <select
                id="student-select"
                value={profiledStudentId || ''}
                onChange={(event) => setProfiledStudentId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {studentsForProfile.map((student) => (
                  <option key={student.id} value={student.id}>{student.full_name}</option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={profileRadarComparisonData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar dataKey="classAvg" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.25} name="Class Average" />
                <Radar dataKey="student" stroke="#2563eb" fill="#2563eb" fillOpacity={0.45} name="Student" />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            {profiledStudent && (
              <div className="text-sm text-gray-600 mt-2">
                {profiledStudent.full_name} - engagement score {profiledStudent.engagement_score} • {studentPersona}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">Highs & Lows</h4>
              <HeartIcon className="w-5 h-5 text-rose-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-wide font-semibold text-emerald-800">Strengths</p>
                <div className="mt-2 space-y-2">
                  {studentHighlights.strengths.length === 0 ? (
                    <p className="text-sm text-emerald-900">
                      {studentScope === 'pulse-session'
                        ? 'No clear outlier strengths in this pulse session yet.'
                        : 'No clear outlier strengths yet for this date range.'}
                    </p>
                  ) : studentHighlights.strengths.map((line) => (
                    <p key={line} className="text-sm text-emerald-900">{line}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs uppercase tracking-wide font-semibold text-rose-800">Concerns</p>
                <div className="mt-2 space-y-2">
                  {studentHighlights.concerns.length === 0 ? (
                    <p className="text-sm text-rose-900">No critical concerns detected for this student in the selected range.</p>
                  ) : studentHighlights.concerns.map((line) => (
                    <p key={line} className="text-sm text-rose-900">{line}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 text-slate-500" />
              <p>
                Response latency compares this student against class late-join baseline.
                Resilience checks whether the student returns after 20+ minute session gaps.
              </p>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {showTrendsTab ? (
      <section className="space-y-5 rounded-2xl border border-gray-200 bg-gray-50/40 p-5">
        <h3 className="text-xl font-semibold text-gray-900">Trends</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Attendance Decay Line</h4>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={longitudinalAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="minutesAttended" stroke="#2563eb" strokeWidth={3} name="Minutes Attended" />
                <Line type="monotone" dataKey="normalizedAttendance" stroke="#16a34a" strokeWidth={2} name="Normalized Attendance %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Late-Joiner Trend</h4>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" dataKey="sessions" name="Fragments Observed" stroke="#6b7280" />
                <YAxis type="number" dataKey="avgLateMinutes" name="Avg Late Minutes" stroke="#6b7280" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
                />
                <Scatter name="Students" data={lateJoinerData} fill="#f97316">
                  {lateJoinerData.map((entry) => (
                    <Cell key={entry.studentId} fill="#f97316" />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Active vs Passive Ratio by Week</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyActivePassiveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" stackId="a" fill="#10b981" name="Active" />
              <Bar dataKey="passive" stackId="a" fill="#94a3b8" name="Passive" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      ) : null}

      {showStudentTab ? (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Students Overview</h3>
          <UserGroupIcon className="w-5 h-5 text-slate-600" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Interactions</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Speaking</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...studentsForProfile]
                .sort((left, right) => toNumber(right.engagement_score) - toNumber(left.engagement_score))
                .map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{student.full_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{toNumber(student.attendance_rate)}%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{toNumber(student.total_interactions)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{formatMinutes(student.speaking_proxy_minutes)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-semibold text-gray-900">{student.engagement_score}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setProfiledStudentId(student.id)}
                          className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectStudent && onSelectStudent(student.id)}
                          className="px-2.5 py-1 rounded bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                        >
                          Open
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}

      {showSessionTab && hasBundleData && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Core Credit Window Reporting</h3>
              <p className="text-sm text-gray-500">Session windows, breaks, and overtime separated for fair normalization.</p>
            </div>
            <CalendarDaysIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Day</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Window</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Window</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Core Credit</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Early</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Break</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Interactions</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Speaking Proxy</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bundleRows.map((bundle) => (
                  <tr key={bundle.bundle_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(bundle.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{bundle.day_name || 'unspecified'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {formatTimeLabel(bundle.planned_start_time)} - {formatTimeLabel(bundle.planned_end_time)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {formatDateTimeLabel(bundle.actual_first_start_at)} - {formatDateTimeLabel(bundle.actual_last_end_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{formatMinutes(bundle.core_credit_minutes)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{formatMinutes(bundle.early_start_minutes)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{formatMinutes(bundle.break_minutes)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{formatMinutes(bundle.overtime_minutes)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{toNumber(bundle.participationTotals.totalInteractions)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{formatMinutes(bundle.participationTotals.speakingProxyMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSessionTab ? (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col gap-2 mb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sessions Drilldown</h3>
            <p className="text-sm text-gray-500">
              {drilldownMode === 'session'
                ? 'Per-session points are shown for short windows.'
                : 'Data is automatically bucketed by week to keep long-range trends readable.'}
            </p>
          </div>
          <HandRaisedIcon className="w-5 h-5 text-sky-600" />
        </div>
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Legend Guide</p>
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
            <p><span className="font-semibold text-sky-700">Interactions / Hour</span>: event density normalized by session length.</p>
            <p><span className="font-semibold text-emerald-700">Presence %</span>: students present out of rostered students.</p>
            <p><span className="font-semibold text-amber-700">Participation %</span>: active participants out of present students.</p>
            <p><span className="font-semibold text-rose-700">Gap (pp)</span>: Presence % minus Participation % (lower is better).</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={fragmentDrilldownData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="percent" domain={[0, 100]} stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="intensity" orientation="right" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              formatter={(value, seriesName, context) => {
                if (seriesName === 'Gap (pp)' || seriesName === 'Presence %' || seriesName === 'Participation %') {
                  return [`${value}%`, seriesName];
                }

                if (seriesName === 'Interactions / Hour') {
                  const bucketSize = context?.payload?.bucketSize || 1;
                  const suffix = drilldownMode === 'weekly' ? ` (${bucketSize} sessions)` : '';
                  return [value, `${seriesName}${suffix}`];
                }

                return [value, seriesName];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="interactionsPerHour"
              yAxisId="intensity"
              stroke="#0284c7"
              strokeWidth={2.5}
              name="Interactions / Hour"
              dot={drilldownMode === 'session' ? { r: 3 } : false}
            />
            <Line
              type="monotone"
              dataKey="presenceRate"
              yAxisId="percent"
              stroke="#059669"
              strokeWidth={2}
              name="Presence %"
              dot={drilldownMode === 'session' ? { r: 2.5 } : false}
            />
            <Line
              type="monotone"
              dataKey="participationRate"
              yAxisId="percent"
              stroke="#d97706"
              strokeWidth={2}
              name="Participation %"
              dot={drilldownMode === 'session' ? { r: 2.5 } : false}
            />
            <Line
              type="monotone"
              dataKey="efficiencyGap"
              yAxisId="percent"
              stroke="#e11d48"
              strokeWidth={2}
              name="Gap (pp)"
              dot={drilldownMode === 'session' ? { r: 2.5 } : false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      ) : null}
    </div>
  );
};

export default ClassAnalytics;
