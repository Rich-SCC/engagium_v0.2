import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { classesAPI, participationAPI, sessionsAPI } from '@/services/api';
import DateRangePicker from './DateRangePicker';
import { aggregateSessionLogs, formatMinutes, round, toNumber } from '@/utils/analytics';

const TAB_DEFS = [
  { key: 'summary', label: 'Summary' },
  { key: 'student', label: 'Per-Student' },
  { key: 'session', label: 'Per-Session' },
  { key: 'trends', label: 'Trends' },
];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const getWeekStart = (date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day;
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const getSessionBucket = (bucketMap, sessionId) => {
  if (!bucketMap || !sessionId) return [];
  return bucketMap[sessionId] || bucketMap[String(sessionId)] || [];
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const EARLY_BUFFER_MINUTES = 30;
const OVERTIME_BUFFER_MINUTES = 90;

const TIMELINE_COLORS = {
  chat: '#557170',
  reaction: '#f59e0b',
  handRaise: '#22c55e',
  micToggle: '#3a5050',
  activity: '#64748b',
};

const parseTimeToMinutes = (value) => {
  if (!value || typeof value !== 'string') return null;
  const [hourText, minuteText] = value.trim().split(':');
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return (hour * 60) + minute;
};

const parseMeridiemTimeToMinutes = (value) => {
  if (!value || typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  if (!match) return null;

  const hourRaw = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2] || '0', 10);
  const modifier = match[3].toUpperCase();

  if (!Number.isInteger(hourRaw) || hourRaw < 1 || hourRaw > 12) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;

  let hour = hourRaw % 12;
  if (modifier === 'PM') hour += 12;
  return (hour * 60) + minute;
};

const parseLegacyTimeRange = (value) => {
  if (!value || typeof value !== 'string') return { startMinutes: null, endMinutes: null };
  const parts = value.split('-').map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 2) return { startMinutes: null, endMinutes: null };
  return {
    startMinutes: parseMeridiemTimeToMinutes(parts[0]),
    endMinutes: parseMeridiemTimeToMinutes(parts[1]),
  };
};

const normalizeSchedules = (scheduleData) => {
  if (!scheduleData) return [];
  const source = Array.isArray(scheduleData) ? scheduleData : [scheduleData];

  return source.map((entry, index) => {
    if (!entry || typeof entry !== 'object') return null;
    const days = Array.isArray(entry.days)
      ? entry.days
        .filter((day) => typeof day === 'string' && day.trim())
        .map((day) => day.trim().toLowerCase())
      : [];

    let startMinutes = parseTimeToMinutes(entry.startTime);
    let endMinutes = parseTimeToMinutes(entry.endTime);

    if (startMinutes === null || endMinutes === null) {
      const parsed = parseLegacyTimeRange(entry.time);
      if (startMinutes === null) startMinutes = parsed.startMinutes;
      if (endMinutes === null) endMinutes = parsed.endMinutes;
    }

    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) {
      return null;
    }

    return { index, days, startMinutes, endMinutes };
  }).filter(Boolean);
};

const toLocalDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateKeyToLocalDate = (dateKey) => {
  const [year, month, day] = String(dateKey || '').split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const buildLocalDateTime = (dateKey, minutes) => {
  const date = dateKeyToLocalDate(dateKey);
  if (!date || !Number.isFinite(minutes)) return null;
  return new Date(date.getTime() + (minutes * 60 * 1000));
};

const formatMinutesAsTime = (minutes) => {
  if (!Number.isFinite(minutes)) return null;
  const safe = Math.max(0, Math.floor(minutes));
  const hour = String(Math.floor(safe / 60)).padStart(2, '0');
  const minute = String(safe % 60).padStart(2, '0');
  return `${hour}:${minute}`;
};

const buildBundleLabel = (bundle, index = 0) => {
  const dateText = bundle?.date
    ? formatDate(bundle.date)
    : bundle?.planned_start_at
      ? formatDate(bundle.planned_start_at)
      : `Session ${index + 1}`;

  const start = bundle?.planned_start_time || null;
  const end = bundle?.planned_end_time || null;
  if (start && end) {
    return `${dateText} ${start}-${end}`;
  }

  return dateText;
};

const mergeAttendanceRowsForBundle = (rows = []) => {
  const statusPriority = { absent: 1, late: 2, present: 3 };
  const merged = new Map();

  rows.forEach((row) => {
    const participantName = String(row?.participant_name || row?.student_name || '').trim();
    const key = row?.student_id ? `student:${row.student_id}` : `name:${participantName.toLowerCase()}`;

    if (!merged.has(key)) {
      merged.set(key, {
        ...row,
        id: key,
        status: row?.status || 'absent',
        total_duration_minutes: 0,
      });
    }

    const current = merged.get(key);
    current.total_duration_minutes += toNumber(row?.total_duration_minutes);
    const incomingStatus = row?.status || 'absent';
    if ((statusPriority[incomingStatus] || 0) > (statusPriority[current.status] || 0)) {
      current.status = incomingStatus;
    }
  });

  return [...merged.values()];
};

const emptyParticipation = {
  total_interactions: 0,
  chat_messages: 0,
  reactions: 0,
  hand_raises: 0,
  mic_toggles: 0,
  speaking_proxy_minutes: 0,
};

const buildEngagementScore = (student, classMax) => {
  const presence = toNumber(student.attendance_rate);
  const speakingPart = classMax.speaking > 0 ? (toNumber(student.speaking_proxy_minutes) / classMax.speaking) * 100 : 0;
  const chatPart = classMax.chat > 0 ? (toNumber(student.chat_messages) / classMax.chat) * 100 : 0;
  const handRaisePart = classMax.handRaises > 0 ? (toNumber(student.hand_raises) / classMax.handRaises) * 100 : 0;
  const reactionPart = classMax.reactions > 0 ? (toNumber(student.reactions) / classMax.reactions) * 100 : 0;

  const participation = (
    (speakingPart * 0.4) +
    (chatPart * 0.25) +
    (handRaisePart * 0.2) +
    (reactionPart * 0.15)
  );

  return round((presence * 0.6) + (participation * 0.4), 1);
};

const hasValidNumericValue = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed);
};

const getRiskLabel = (student) => {
  if (toNumber(student.attendance_rate) < 70 && toNumber(student.engagement_score) < 45) return 'High';
  if (toNumber(student.attendance_rate) < 80 || toNumber(student.engagement_score) < 55) return 'Watch';
  return 'Stable';
};

const getRiskTone = (label) => {
  if (label === 'High') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (label === 'Watch') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getEntityKey = (entity) => {
  if (!entity) return null;
  if (entity.student_id) return `student:${String(entity.student_id)}`;

  const name = normalizeText(
    entity.student_name
    || entity.participant_name
    || entity.full_name
    || entity.name
  );
  return name ? `name:${name}` : null;
};

const formatRelativeTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (!date || Number.isNaN(date.getTime())) return '-';

  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const absDays = Math.abs(diffDays);

  if (absDays < 1) return diffDays <= 0 ? 'Today' : 'In less than a day';
  if (absDays === 1) return diffDays < 0 ? '1 day ago' : 'In 1 day';
  return diffDays < 0 ? `${absDays} days ago` : `In ${absDays} days`;
};

const buildSparklinePath = (values = [], width = 100, height = 30) => {
  if (!values.length) return '';
  const safeValues = values.map((value) => Number.isFinite(Number(value)) ? Number(value) : 0);
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || 1;

  return safeValues.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - (((value - min) / range) * height);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
};

const getStudentIdentityKeys = (student) => {
  const id = student?.id ? `student:${String(student.id)}` : null;
  const names = [student?.full_name, student?.student_name, student?.participant_name]
    .map(normalizeText)
    .filter(Boolean)
    .map((name) => `name:${name}`);
  return [id, ...names].filter(Boolean);
};

const entityMatchesStudent = (entity, student) => {
  if (!entity || !student) return false;

  const studentId = String(student.id || '').trim();
  if (studentId && String(entity.student_id || '').trim() === studentId) return true;

  const entityName = normalizeText(entity.full_name || entity.student_name || entity.participant_name || entity.name);
  const studentNames = [student.full_name, student.student_name, student.participant_name].map(normalizeText).filter(Boolean);
  return entityName ? studentNames.includes(entityName) : false;
};

const overlapMinutes = (startA, endA, startB, endB) => {
  if (!startA || !endA || !startB || !endB) return 0;
  const startMs = Math.max(startA.getTime(), startB.getTime());
  const endMs = Math.min(endA.getTime(), endB.getTime());
  if (endMs <= startMs) return 0;
  return diffMinutes(new Date(endMs), new Date(startMs));
};

const diffMinutes = (endDate, startDate) => {
  if (!endDate || !startDate) return 0;
  return Math.max(0, Math.round((endDate - startDate) / (1000 * 60)));
};

const buildStudentBundleSnapshot = (bundle, student, attendanceBySessionId, logsBySessionId) => {
  if (!bundle || !student) return null;

  const sourceSessionIds = Array.isArray(bundle.source_session_ids)
    ? bundle.source_session_ids.map((id) => String(id))
    : [];

  const studentAttendanceRows = sourceSessionIds.flatMap((sessionId) => {
    const rows = getSessionBucket(attendanceBySessionId, sessionId);
    return rows.filter((row) => entityMatchesStudent(row, student));
  });

  const studentLogs = sourceSessionIds.flatMap((sessionId) => {
    const logs = getSessionBucket(logsBySessionId, sessionId);
    return logs.filter((log) => entityMatchesStudent(log, student));
  });

  const signalSnapshot = aggregateSessionLogs(studentLogs);
  const totals = signalSnapshot.totals || {};

  const bundleStart = bundle.planned_start_at || bundle.actual_first_start_at || bundle.session_date || null;
  const bundleEnd = bundle.planned_end_at || bundle.actual_last_end_at || null;
  const sessionStart = bundleStart ? new Date(bundleStart) : null;
  const sessionEnd = bundleEnd ? new Date(bundleEnd) : null;
  const sessionSpanMinutes = sessionStart && sessionEnd ? Math.max(1, diffMinutes(sessionEnd, sessionStart)) : null;

  const intervals = studentAttendanceRows.flatMap((row) => {
    const sourceIntervals = Array.isArray(row?.intervals) ? row.intervals : [];
    return sourceIntervals.map((interval) => ({
      start: interval?.joined_at ? new Date(interval.joined_at) : null,
      end: interval?.left_at ? new Date(interval.left_at) : null,
    })).filter((interval) => interval.start && interval.end && !Number.isNaN(interval.start.getTime()) && !Number.isNaN(interval.end.getTime()));
  });

  const joinCount = intervals.length;
  const firstJoin = intervals.length > 0
    ? intervals.reduce((earliest, interval) => (interval.start < earliest ? interval.start : earliest), intervals[0].start)
    : null;
  const lastLeave = intervals.length > 0
    ? intervals.reduce((latest, interval) => (interval.end > latest ? interval.end : latest), intervals[0].end)
    : null;

  const totalDurationMinutes = studentAttendanceRows.reduce((sum, row) => sum + toNumber(row.total_duration_minutes), 0);
  const attendanceRate = sessionSpanMinutes ? round((totalDurationMinutes / sessionSpanMinutes) * 100, 1) : 0;
  const status = totalDurationMinutes <= 0 ? 'Absent' : attendanceRate >= 75 ? 'Present' : 'Partial';

  const punctualityDelta = firstJoin && sessionStart ? diffMinutes(firstJoin, sessionStart) : null;
  const punctuality = !firstJoin
    ? '-'
    : punctualityDelta <= 5
      ? 'On-time'
      : `Late (${punctualityDelta}m)`;

  const stabilityScore = joinCount <= 1
    ? 100
    : Math.max(0, 100 - ((joinCount - 1) * 20));
  const stabilityLabel = joinCount === 0 ? 'No joins' : joinCount >= 5 ? 'Unstable' : 'Stable';

  const directInteractions = toNumber(totals.hand_raise);
  const expressiveInteractions = toNumber(totals.reaction);
  const passiveInteractions = toNumber(totals.chat) + toNumber(totals.mic_toggle);
  const totalSignals = directInteractions + expressiveInteractions + passiveInteractions;
  const heatmapSignals = directInteractions + expressiveInteractions;

  return {
    id: bundle.id,
    date: bundle.session_date || bundle.date || bundle.planned_start_at || null,
    label: bundle.label || buildBundleLabel(bundle),
    status,
    attendanceRate,
    durationMinutes: totalDurationMinutes,
    sessionSpanMinutes: sessionSpanMinutes || 0,
    punctuality,
    punctualityDelta,
    joinCount,
    stabilityScore: round(stabilityScore, 1),
    stabilityLabel,
    stabilityText: joinCount === 0 ? 'No joins' : `${joinCount} Join${joinCount === 1 ? '' : 's'} (${stabilityLabel})`,
    directInteractions,
    expressiveInteractions,
    passiveInteractions,
    totalSignals,
    heatmapSignals,
    lastActiveAt: lastLeave,
    isLurker: attendanceRate >= 80 && totalSignals === 0,
  };
};

const fetchAllParticipationLogs = async (sessionId) => {
  const limit = 500;
  try {
    const firstResponse = await participationAPI.getLogs(sessionId, { page: 1, limit });
    const firstPage = firstResponse?.data || {};
    const logs = [...(firstPage.data || [])];
    const totalPages = firstPage.pagination?.totalPages || 1;

    if (totalPages > 1) {
      const pageNumbers = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
      const remainingPages = await Promise.all(
        pageNumbers.map((page) => participationAPI.getLogs(sessionId, { page, limit }))
      );

      remainingPages.forEach((response) => {
        const page = response?.data || {};
        logs.push(...(page.data || []));
      });
    }

    return logs;
  } catch (error) {
    console.warn('Failed to fetch participation logs:', error);
    return [];
  }
};

const MetricCard = ({ label, value, hint, compact = false }) => (
  <article className={`rounded-xl border border-slate-200 bg-white shadow-sm ${compact ? 'p-3' : 'p-4'}`}>
    <div className="flex items-center gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {hint ? (
        <span className="group relative inline-flex">
          <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500">
            i
          </span>
          <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium normal-case tracking-normal text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
            {hint}
          </span>
        </span>
      ) : null}
    </div>
    <p className={`${compact ? 'mt-1 text-3xl' : 'mt-2 text-2xl'} font-bold text-slate-900`}>{value}</p>
    {!compact && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </article>
);

const TimelineTooltip = ({ active, payload, label }) => {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;

  const rows = payload.filter((item) => item?.dataKey !== 'activityShade');
  if (rows.length === 0) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <p className="mb-1 font-semibold text-slate-900">{label}</p>
      {rows.map((item) => (
        <p key={`${item.dataKey}-${item.name}`} style={{ color: item.color || '#0f172a' }}>
          {item.name}: {toNumber(item.value)}
        </p>
      ))}
    </div>
  );
};

const ChartCanvas = ({ height = 288, children }) => {
  const containerRef = React.useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const updateWidth = () => {
      const nextWidth = Math.floor(containerRef.current?.getBoundingClientRect()?.width || 0);
      if (nextWidth > 0) {
        setWidth(nextWidth);
      }
    };

    updateWidth();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateWidth();
      });
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateWidth);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full" style={{ height: `${height}px` }}>
      {width > 0 ? children(Math.max(320, width), height) : null}
    </div>
  );
};

const ClassAnalytics = ({ classId }) => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedTrendPulseWeekKey, setSelectedTrendPulseWeekKey] = useState('');

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['classAnalytics', classId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () => classesAPI.getClassAnalytics(classId, { startDate, endDate }),
    enabled: Boolean(classId),
    refetchOnWindowFocus: false,
  });

  const analytics = analyticsData?.data || {};
  const sessionTrends = analytics.sessionTrends || [];
  const studentPerformance = analytics.studentPerformance || [];
  const classInfo = analytics.class || null;
  const scheduleBundles = analytics.scheduleBundles || [];

  const sessionIds = useMemo(
    () => sessionTrends.map((session) => session.id).filter(Boolean),
    [sessionTrends]
  );

  const { data: bulkParticipationData, isLoading: participationLoading } = useQuery({
    queryKey: ['classParticipationAnalytics', classId, sessionIds.join('|')],
    queryFn: () => participationAPI.getBulkLogs(sessionIds),
    enabled: Boolean(classId) && sessionIds.length > 0,
    staleTime: 120000,
    refetchOnWindowFocus: false,
  });

  const { data: bulkAttendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['classAttendanceAnalytics', classId, sessionIds.join('|')],
    queryFn: () => sessionsAPI.getBulkAttendanceWithIntervals(sessionIds),
    enabled: Boolean(classId) && sessionIds.length > 0,
    staleTime: 120000,
    refetchOnWindowFocus: false,
  });

  const logsBySessionId = bulkParticipationData?.data || {};
  const attendanceBySessionId = bulkAttendanceData?.data || {};

  const sessionRows = useMemo(() => {
    return sessionTrends.map((session) => {
      const logs = getSessionBucket(logsBySessionId, session.id);
      const attendanceRows = getSessionBucket(attendanceBySessionId, session.id);
      const participationSnapshot = aggregateSessionLogs(logs);

      return {
        id: session.id,
        title: session.title || null,
        session_date: session.session_date || session.started_at,
        started_at: session.started_at || null,
        ended_at: session.ended_at || null,
        label: session.title || formatDate(session.session_date || session.started_at),
        attendance_rate: toNumber(session.attendance_rate),
        avg_duration_minutes: toNumber(session.avg_duration_minutes),
        total_participants: toNumber(session.total_participants),
        present_count: toNumber(session.present_count),
        interactions: toNumber(participationSnapshot.totals.totalInteractions),
        chat: toNumber(participationSnapshot.totals.chat),
        reaction: toNumber(participationSnapshot.totals.reaction),
        hand_raise: toNumber(participationSnapshot.totals.hand_raise),
        mic_toggle: toNumber(participationSnapshot.totals.mic_toggle),
        speaking_proxy_minutes: toNumber(participationSnapshot.totals.speakingProxyMinutes),
        attendanceRows,
      };
    });
  }, [sessionTrends, logsBySessionId, attendanceBySessionId]);

  const participationByStudent = useMemo(() => {
    const merged = new Map();

    sessionIds.forEach((sessionId) => {
      const logs = getSessionBucket(logsBySessionId, sessionId);
      const snapshot = aggregateSessionLogs(logs);

      snapshot.students.forEach((student) => {
        const key = student.student_id ? String(student.student_id) : `name:${String(student.full_name || '').toLowerCase()}`;
        if (!merged.has(key)) {
          merged.set(key, {
            ...emptyParticipation,
            student_id: student.student_id,
            full_name: student.full_name,
          });
        }

        const current = merged.get(key);
        current.total_interactions += toNumber(student.total_interactions);
        current.chat_messages += toNumber(student.chat_messages);
        current.reactions += toNumber(student.reactions);
        current.hand_raises += toNumber(student.hand_raises);
        current.mic_toggles += toNumber(student.mic_toggles);
        current.speaking_proxy_minutes += toNumber(student.speaking_proxy_minutes);
      });
    });

    return merged;
  }, [sessionIds, logsBySessionId]);

  const studentRows = useMemo(() => {
    const rows = studentPerformance.map((student) => {
      const studentIdKey = student.id ? String(student.id) : null;
      const nameKey = `name:${String(student.full_name || '').toLowerCase()}`;
      const participation = (studentIdKey && participationByStudent.get(studentIdKey)) || participationByStudent.get(nameKey) || emptyParticipation;

      const chatMessages = hasValidNumericValue(student.chat_messages)
        ? toNumber(student.chat_messages)
        : toNumber(student.chat_count, toNumber(participation.chat_messages));
      const reactions = hasValidNumericValue(student.reactions)
        ? toNumber(student.reactions)
        : toNumber(student.reaction_count, toNumber(participation.reactions));
      const handRaises = hasValidNumericValue(student.hand_raises)
        ? toNumber(student.hand_raises)
        : toNumber(student.hand_raise_count, toNumber(participation.hand_raises));
      const micToggles = hasValidNumericValue(student.mic_toggles)
        ? toNumber(student.mic_toggles)
        : toNumber(student.mic_toggle_count, toNumber(participation.mic_toggles));
      const speakingProxyMinutes = hasValidNumericValue(student.speaking_proxy_minutes)
        ? toNumber(student.speaking_proxy_minutes)
        : toNumber(participation.speaking_proxy_minutes);
      const totalInteractions = hasValidNumericValue(student.total_interactions)
        ? toNumber(student.total_interactions)
        : toNumber(participation.total_interactions);

      return {
        ...student,
        ...participation,
        chat_messages: chatMessages,
        reactions,
        hand_raises: handRaises,
        mic_toggles: micToggles,
        speaking_proxy_minutes: speakingProxyMinutes,
        total_interactions: totalInteractions,
      };
    });

    const maxValues = rows.reduce(
      (acc, row) => ({
        speaking: Math.max(acc.speaking, toNumber(row.speaking_proxy_minutes)),
        chat: Math.max(acc.chat, toNumber(row.chat_messages)),
        handRaises: Math.max(acc.handRaises, toNumber(row.hand_raises)),
        reactions: Math.max(acc.reactions, toNumber(row.reactions)),
      }),
      { speaking: 0, chat: 0, handRaises: 0, reactions: 0 }
    );

    return rows
      .map((row) => {
        const engagementScore = hasValidNumericValue(row.engagement_score)
          ? round(toNumber(row.engagement_score), 1)
          : buildEngagementScore(row, maxValues);
        const risk = getRiskLabel({ ...row, engagement_score: engagementScore });
        return {
          ...row,
          engagement_score: engagementScore,
          risk,
        };
      })
      .sort((left, right) => toNumber(right.engagement_score) - toNumber(left.engagement_score));
  }, [studentPerformance, participationByStudent]);

  useEffect(() => {
    if (!selectedStudentId && studentRows.length > 0) {
      setSelectedStudentId(String(studentRows[0].id));
    }
  }, [studentRows, selectedStudentId]);

  const selectedStudent = useMemo(
    () => studentRows.find((row) => String(row.id) === String(selectedStudentId)) || studentRows[0] || null,
    [studentRows, selectedStudentId]
  );

  const bundledSessionRows = useMemo(() => {
    const sessionById = new Map(sessionRows.map((row) => [String(row.id), row]));
    const normalizedSchedules = normalizeSchedules(classInfo?.schedule);

    if (normalizedSchedules.length > 0) {
      const bundles = new Map();

      sessionRows.forEach((row) => {
        const startedAt = row.started_at ? new Date(row.started_at) : null;
        if (!startedAt || Number.isNaN(startedAt.getTime())) return;

        const fallbackEndAt = new Date(startedAt.getTime() + (Math.max(1, toNumber(row.avg_duration_minutes)) * 60 * 1000));
        const endedAt = row.ended_at ? new Date(row.ended_at) : fallbackEndAt;
        const safeEnd = Number.isNaN(endedAt.getTime()) ? fallbackEndAt : endedAt;

        const dateKey = toLocalDateKey(startedAt);
        if (!dateKey) return;

        const dayName = DAY_NAMES[startedAt.getDay()];
        const candidates = normalizedSchedules.filter((schedule) => schedule.days.length === 0 || schedule.days.includes(dayName));
        if (candidates.length === 0) return;

        let bestSchedule = null;
        let bestOverlapMs = -1;

        candidates.forEach((schedule) => {
          const plannedStart = buildLocalDateTime(dateKey, schedule.startMinutes);
          const plannedEnd = buildLocalDateTime(dateKey, schedule.endMinutes);
          if (!plannedStart || !plannedEnd) return;

          const windowStart = new Date(plannedStart.getTime() - (EARLY_BUFFER_MINUTES * 60 * 1000));
          const windowEnd = new Date(plannedEnd.getTime() + (OVERTIME_BUFFER_MINUTES * 60 * 1000));
          const overlapStartMs = Math.max(windowStart.getTime(), startedAt.getTime());
          const overlapEndMs = Math.min(windowEnd.getTime(), safeEnd.getTime());
          const overlapMs = overlapEndMs - overlapStartMs;

          if (overlapMs > bestOverlapMs) {
            bestOverlapMs = overlapMs;
            bestSchedule = schedule;
          }
        });

        if (!bestSchedule || bestOverlapMs <= 0) return;

        const bundleKey = `${dateKey}::${bestSchedule.index}`;
        const plannedStart = buildLocalDateTime(dateKey, bestSchedule.startMinutes);
        const plannedEnd = buildLocalDateTime(dateKey, bestSchedule.endMinutes);

        if (!bundles.has(bundleKey)) {
          bundles.set(bundleKey, {
            id: bundleKey,
            date: dateKey,
            schedule_index: bestSchedule.index,
            planned_start_time: formatMinutesAsTime(bestSchedule.startMinutes),
            planned_end_time: formatMinutesAsTime(bestSchedule.endMinutes),
            planned_start_at: plannedStart?.toISOString() || null,
            planned_end_at: plannedEnd?.toISOString() || null,
            session_count: 0,
            source_session_ids: [],
            sessions: [],
            total_participants: 0,
            present_count: 0,
            attendance_rate: 0,
            actual_first_start_at: null,
            actual_last_end_at: null,
            avg_duration_minutes: 0,
            interactions: 0,
            chat: 0,
            reaction: 0,
            hand_raise: 0,
            mic_toggle: 0,
            speaking_proxy_minutes: 0,
            allAttendanceRows: [],
          });
        }

        const bundle = bundles.get(bundleKey);
        bundle.session_count += 1;
        bundle.source_session_ids.push(String(row.id));
        bundle.sessions.push({
          id: String(row.id),
          start_at: startedAt.toISOString(),
          end_at: safeEnd.toISOString(),
        });
        bundle.total_participants += toNumber(row.total_participants);
        bundle.present_count += toNumber(row.present_count);
        bundle.avg_duration_minutes += toNumber(row.avg_duration_minutes);
        bundle.interactions += toNumber(row.interactions);
        bundle.chat += toNumber(row.chat);
        bundle.reaction += toNumber(row.reaction);
        bundle.hand_raise += toNumber(row.hand_raise);
        bundle.mic_toggle += toNumber(row.mic_toggle);
        bundle.speaking_proxy_minutes += toNumber(row.speaking_proxy_minutes);
        bundle.allAttendanceRows.push(...(row.attendanceRows || []));
      });

      return [...bundles.values()]
        .map((bundle, index) => {
          const sorted = [...bundle.sessions].sort((left, right) => new Date(left.start_at).getTime() - new Date(right.start_at).getTime());
          const mergedAttendanceRows = mergeAttendanceRowsForBundle(bundle.allAttendanceRows || []);
          const participants = mergedAttendanceRows.length;
          const presentCount = mergedAttendanceRows.filter(
            (row) => row.status === 'present' || row.status === 'late' || toNumber(row.total_duration_minutes) > 0
          ).length;

          if (sorted.length > 0) {
            bundle.actual_first_start_at = sorted[0].start_at;
            bundle.actual_last_end_at = sorted[sorted.length - 1].end_at;
          }

          bundle.attendance_rate = participants > 0
            ? round((presentCount / participants) * 100, 1)
            : 0;

          return {
            ...bundle,
            id: String(bundle.id || `bundle-${index + 1}`),
            label: buildBundleLabel(bundle, index),
            session_date: bundle.date || bundle.planned_start_at || null,
            total_participants: participants,
            present_count: presentCount,
            avg_duration_minutes: bundle.session_count > 0 ? round(bundle.avg_duration_minutes / bundle.session_count, 1) : 0,
            interactions: round(bundle.interactions, 1),
            chat: round(bundle.chat, 1),
            reaction: round(bundle.reaction, 1),
            hand_raise: round(bundle.hand_raise, 1),
            mic_toggle: round(bundle.mic_toggle, 1),
            speaking_proxy_minutes: round(bundle.speaking_proxy_minutes, 1),
            attendanceRows: mergedAttendanceRows,
          };
        })
        .sort((left, right) => {
          const leftDate = left?.session_date ? new Date(left.session_date) : null;
          const rightDate = right?.session_date ? new Date(right.session_date) : null;
          const leftTime = leftDate && !Number.isNaN(leftDate.getTime()) ? leftDate.getTime() : 0;
          const rightTime = rightDate && !Number.isNaN(rightDate.getTime()) ? rightDate.getTime() : 0;
          if (leftTime !== rightTime) return leftTime - rightTime;
          return toNumber(left.schedule_index) - toNumber(right.schedule_index);
        });
    }

    if (scheduleBundles.length > 0) {
      return scheduleBundles.map((bundle, index) => {
        const bundleSessionIds = Array.isArray(bundle?.session_ids)
          ? bundle.session_ids.map((id) => String(id))
          : [];

        const matchedRows = bundleSessionIds
          .map((id) => sessionById.get(id))
          .filter(Boolean);

        const mergedAttendanceRows = mergeAttendanceRowsForBundle(
          matchedRows.flatMap((row) => row.attendanceRows || [])
        );

        const participants = mergedAttendanceRows.length;
        const presentCount = mergedAttendanceRows.filter(
          (row) => row.status === 'present' || row.status === 'late' || toNumber(row.total_duration_minutes) > 0
        ).length;

        const fallbackAttendance = matchedRows.length > 0
          ? round(matchedRows.reduce((sum, row) => sum + toNumber(row.attendance_rate), 0) / matchedRows.length, 1)
          : 0;

        return {
          id: String(bundle?.bundle_id || `bundle-${index + 1}`),
          label: buildBundleLabel(bundle, index),
          session_date: bundle?.date || bundle?.planned_start_at || matchedRows[0]?.session_date || null,
          source_session_ids: bundleSessionIds,
          attendance_rate: participants > 0 ? round((presentCount / participants) * 100, 1) : fallbackAttendance,
          total_participants: participants,
          present_count: presentCount,
          avg_duration_minutes: matchedRows.length > 0
            ? round(matchedRows.reduce((sum, row) => sum + toNumber(row.avg_duration_minutes), 0) / matchedRows.length, 1)
            : 0,
          interactions: round(matchedRows.reduce((sum, row) => sum + toNumber(row.interactions), 0), 1),
          chat: round(matchedRows.reduce((sum, row) => sum + toNumber(row.chat), 0), 1),
          reaction: round(matchedRows.reduce((sum, row) => sum + toNumber(row.reaction), 0), 1),
          hand_raise: round(matchedRows.reduce((sum, row) => sum + toNumber(row.hand_raise), 0), 1),
          mic_toggle: round(matchedRows.reduce((sum, row) => sum + toNumber(row.mic_toggle), 0), 1),
          speaking_proxy_minutes: round(matchedRows.reduce((sum, row) => sum + toNumber(row.speaking_proxy_minutes), 0), 1),
          attendanceRows: mergedAttendanceRows,
        };
      });
    }

    // Fallback when no schedule bundles are returned: treat each fragment as one session.
    return sessionRows.map((row, index) => ({
      ...row,
      id: String(row.id || `session-${index + 1}`),
      source_session_ids: [String(row.id)],
    }));
  }, [classInfo, scheduleBundles, sessionRows]);

  useEffect(() => {
    if (!selectedSessionId && bundledSessionRows.length > 0) {
      setSelectedSessionId(String(bundledSessionRows[bundledSessionRows.length - 1].id));
      return;
    }

    if (selectedSessionId && !bundledSessionRows.some((row) => String(row.id) === String(selectedSessionId))) {
      setSelectedSessionId(bundledSessionRows.length > 0 ? String(bundledSessionRows[bundledSessionRows.length - 1].id) : null);
    }
  }, [bundledSessionRows, selectedSessionId]);

  const selectedSession = useMemo(
    () => bundledSessionRows.find((row) => String(row.id) === String(selectedSessionId)) || bundledSessionRows[bundledSessionRows.length - 1] || null,
    [bundledSessionRows, selectedSessionId]
  );

  const studentHistoryMap = useMemo(() => {
    const map = new Map();

    studentRows.forEach((student) => {
      const history = bundledSessionRows
        .map((bundle) => buildStudentBundleSnapshot(bundle, student, attendanceBySessionId, logsBySessionId))
        .filter(Boolean)
        .sort((left, right) => {
          const leftTime = left?.date ? new Date(left.date).getTime() : 0;
          const rightTime = right?.date ? new Date(right.date).getTime() : 0;
          return leftTime - rightTime;
        });

      getStudentIdentityKeys(student).forEach((key) => {
        map.set(key, history);
      });
    });

    return map;
  }, [studentRows, bundledSessionRows, attendanceBySessionId, logsBySessionId]);

  const selectedStudentHistory = useMemo(() => {
    if (!selectedStudent) return [];

    const keys = getStudentIdentityKeys(selectedStudent);
    for (const key of keys) {
      const history = studentHistoryMap.get(key);
      if (history) return history;
    }

    return [];
  }, [selectedStudent, studentHistoryMap]);

  const selectedStudentClassAverages = useMemo(() => {
    const totals = studentRows.reduce(
      (acc, student) => {
        acc.attendance += toNumber(student.attendance_rate);
        acc.engagement += toNumber(student.engagement_score);
        acc.count += 1;
        return acc;
      },
      { attendance: 0, engagement: 0, count: 0 }
    );

    return {
      attendance: totals.count > 0 ? round(totals.attendance / totals.count, 1) : 0,
      engagement: totals.count > 0 ? round(totals.engagement / totals.count, 1) : 0,
    };
  }, [studentRows]);

  const selectedStudentRecentHistory = useMemo(() => {
    if (selectedStudentHistory.length === 0) return [];

    const lastDate = selectedStudentHistory[selectedStudentHistory.length - 1]?.date;
    const lastDateObject = lastDate ? new Date(lastDate) : null;
    if (!lastDateObject || Number.isNaN(lastDateObject.getTime())) {
      return selectedStudentHistory.slice(-5);
    }

    const cutoff = new Date(lastDateObject);
    cutoff.setDate(cutoff.getDate() - 7);

    const weeklyHistory = selectedStudentHistory.filter((entry) => {
      const entryDate = entry?.date ? new Date(entry.date) : null;
      return entryDate && !Number.isNaN(entryDate.getTime()) && entryDate >= cutoff;
    });

    return weeklyHistory.length > 0 ? weeklyHistory : selectedStudentHistory.slice(-5);
  }, [selectedStudentHistory]);

  const selectedStudentBehavior = useMemo(() => {
    if (!selectedStudent) {
      return {
        relativeStanding: 'No student selected',
        reliabilityScore: 0,
        reliabilityLabel: 'Unknown',
        velocityDelta: 0,
        velocityDirection: 'flat',
        semesterSignalAverage: 0,
        recentSignalAverage: 0,
        historyCount: 0,
        lurker: false,
        signalMix: {
          direct: 0,
          expressive: 0,
          passive: 0,
        },
      };
    }

    const semesterSignalAverage = selectedStudentHistory.length > 0
      ? round(selectedStudentHistory.reduce((sum, row) => sum + toNumber(row.heatmapSignals), 0) / selectedStudentHistory.length, 1)
      : 0;

    const recentSignalAverage = selectedStudentRecentHistory.length > 0
      ? round(selectedStudentRecentHistory.reduce((sum, row) => sum + toNumber(row.heatmapSignals), 0) / selectedStudentRecentHistory.length, 1)
      : 0;

    const velocityDelta = round(recentSignalAverage - semesterSignalAverage, 1);
    const velocityDirection = velocityDelta > 0 ? 'up' : velocityDelta < 0 ? 'down' : 'flat';
    const reliabilityScore = selectedStudentHistory.length > 0
      ? round(selectedStudentHistory.reduce((sum, row) => sum + toNumber(row.stabilityScore), 0) / selectedStudentHistory.length, 1)
      : 0;
    const reliabilityLabel = reliabilityScore >= 80 ? 'High Stability' : reliabilityScore >= 55 ? 'Moderate Stability' : 'Low Stability';

    const signalMix = selectedStudentHistory.reduce(
      (acc, row) => {
        acc.direct += toNumber(row.directInteractions);
        acc.expressive += toNumber(row.expressiveInteractions);
        acc.passive += toNumber(row.passiveInteractions);
        return acc;
      },
      { direct: 0, expressive: 0, passive: 0 }
    );

    const attendanceAverage = toNumber(selectedStudent.attendance_rate);
    const engagementAverage = toNumber(selectedStudent.engagement_score);
    const classAttendanceAverage = selectedStudentClassAverages.attendance;
    const classEngagementAverage = selectedStudentClassAverages.engagement;

    let relativeStanding = 'Typical';
    if (attendanceAverage >= classAttendanceAverage + 10 && engagementAverage >= classEngagementAverage + 10) {
      relativeStanding = 'Active Participant';
    } else if (attendanceAverage >= classAttendanceAverage + 10 && engagementAverage <= classEngagementAverage - 10) {
      relativeStanding = 'Quiet but Present';
    } else if (velocityDelta >= 3) {
      relativeStanding = 'Improving';
    } else if (attendanceAverage <= classAttendanceAverage - 10 || engagementAverage <= classEngagementAverage - 10) {
      relativeStanding = 'Concerning';
    }

    return {
      relativeStanding,
      reliabilityScore,
      reliabilityLabel,
      velocityDelta,
      velocityDirection,
      semesterSignalAverage,
      recentSignalAverage,
      historyCount: selectedStudentHistory.length,
      lurker: selectedStudent.attendance_rate >= 80 && signalMix.direct + signalMix.expressive === 0,
      signalMix,
    };
  }, [selectedStudent, selectedStudentHistory, selectedStudentRecentHistory, selectedStudentClassAverages]);

  const studentOverviewRows = useMemo(() => {
    return studentRows.map((student) => {
      const history = getStudentIdentityKeys(student).map((key) => studentHistoryMap.get(key)).find(Boolean) || [];
      const sparklineValues = history.slice(-5).map((row) => toNumber(row.heatmapSignals));
      const lastKnownRow = [...history].reverse().find((row) => row.status !== 'Absent') || history[history.length - 1] || null;
      const lastActiveAt = lastKnownRow?.lastActiveAt || lastKnownRow?.date || null;
      const lastActiveDate = lastActiveAt ? new Date(lastActiveAt) : null;
      const isCurrentSession = lastActiveDate && !Number.isNaN(lastActiveDate.getTime())
        ? Date.now() - lastActiveDate.getTime() < (24 * 60 * 60 * 1000)
        : false;

      return {
        ...student,
        history,
        sparklineValues,
        lastActiveAt,
        lastActiveLabel: isCurrentSession ? 'Current Session' : formatRelativeTime(lastActiveAt),
        lurker: history.some((row) => row.isLurker),
      };
    });
  }, [studentRows, studentHistoryMap]);

  const selectedStudentSignalMixData = useMemo(() => ([
    { name: 'Direct Interaction', value: selectedStudentBehavior.signalMix.direct, color: '#557170' },
    { name: 'Expressive Interaction', value: selectedStudentBehavior.signalMix.expressive, color: '#f59e0b' },
    { name: 'Passive Metadata', value: selectedStudentBehavior.signalMix.passive, color: '#64748b' },
  ]), [selectedStudentBehavior]);

  const selectedStudentHeatmapMax = useMemo(() => {
    return Math.max(1, ...selectedStudentHistory.map((row) => toNumber(row.heatmapSignals)));
  }, [selectedStudentHistory]);

  const selectedStudentHeatmapSummary = useMemo(() => {
    const totalSignals = selectedStudentHistory.reduce((sum, row) => sum + toNumber(row.heatmapSignals), 0);
    const peakRow = selectedStudentHistory.reduce((best, row) => {
      if (!best) return row;
      return toNumber(row.heatmapSignals) > toNumber(best.heatmapSignals) ? row : best;
    }, null);

    return {
      sessionsTracked: selectedStudentHistory.length,
      totalSignals: round(totalSignals, 1),
      averageSignals: selectedStudentHistory.length > 0 ? round(totalSignals / selectedStudentHistory.length, 1) : 0,
      peakSignals: peakRow ? round(toNumber(peakRow.heatmapSignals), 1) : 0,
      peakDate: peakRow?.date || null,
    };
  }, [selectedStudentHistory]);

  const synchronizedTimeline = useMemo(() => {
    if (!selectedSession) return [];

    const sourceSessionIds = Array.isArray(selectedSession.source_session_ids)
      ? selectedSession.source_session_ids.map((id) => String(id))
      : selectedSession?.id
        ? [String(selectedSession.id)]
        : [];

    const sourceSessions = sourceSessionIds
      .map((sessionId) => sessionRows.find((row) => String(row.id) === sessionId))
      .filter(Boolean);

    const starts = sourceSessions
      .map((session) => session?.started_at ? new Date(session.started_at) : null)
      .filter((date) => date && !Number.isNaN(date.getTime()));
    const ends = sourceSessions
      .map((session) => session?.ended_at ? new Date(session.ended_at) : null)
      .filter((date) => date && !Number.isNaN(date.getTime()));

    let sessionStart = starts.length > 0 ? new Date(Math.min(...starts.map((date) => date.getTime()))) : null;
    let sessionEnd = ends.length > 0 ? new Date(Math.max(...ends.map((date) => date.getTime()))) : null;

    if (!sessionStart || Number.isNaN(sessionStart.getTime())) {
      const fallbackStart = selectedSession?.session_date ? new Date(selectedSession.session_date) : null;
      sessionStart = fallbackStart && !Number.isNaN(fallbackStart.getTime()) ? fallbackStart : null;
    }
    if ((!sessionEnd || Number.isNaN(sessionEnd.getTime())) && sessionStart) {
      sessionEnd = new Date(sessionStart.getTime() + (Math.max(1, toNumber(selectedSession.avg_duration_minutes)) * 60 * 1000));
    }
    if (!sessionStart || !sessionEnd || Number.isNaN(sessionStart.getTime()) || Number.isNaN(sessionEnd.getTime()) || sessionEnd <= sessionStart) {
      return [];
    }

    const allLogs = sourceSessionIds.flatMap((sessionId) => getSessionBucket(logsBySessionId, sessionId));
    const spanMinutes = Math.max(1, diffMinutes(sessionEnd, sessionStart));
    const bucketSize = spanMinutes > 120 ? 10 : 5;
    const bucketCount = Math.max(1, Math.ceil(spanMinutes / bucketSize) + 1);
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const minute = index * bucketSize;
      return {
        minute,
        label: `${minute}m`,
        chat: 0,
        reaction: 0,
        handRaise: 0,
        micToggle: 0,
        activity: 0,
        activityShade: 0,
      };
    });

    allLogs.forEach((log) => {
      const timestamp = log?.timestamp ? new Date(log.timestamp) : null;
      if (!timestamp || Number.isNaN(timestamp.getTime())) return;
      if (timestamp < sessionStart || timestamp > sessionEnd) return;

      const minuteOffset = diffMinutes(timestamp, sessionStart);
      const bucketIndex = Math.min(buckets.length - 1, Math.floor(minuteOffset / bucketSize));
      const bucket = buckets[bucketIndex];
      const interaction = log?.interaction_type;

      if (interaction === 'chat') bucket.chat += 1;
      if (interaction === 'reaction') bucket.reaction += 1;
      if (interaction === 'hand_raise') bucket.handRaise += 1;
      if (interaction === 'mic_toggle') bucket.micToggle += 1;
      bucket.activity = bucket.chat + bucket.reaction + bucket.handRaise + bucket.micToggle;
      bucket.activityShade = bucket.activity;
    });

    return buckets;
  }, [selectedSession, logsBySessionId, sessionRows]);

  const selectedSessionWindow = useMemo(() => {
    if (!selectedSession) return null;

    const fragments = [];
    if (Array.isArray(selectedSession.sessions) && selectedSession.sessions.length > 0) {
      selectedSession.sessions.forEach((fragment) => {
        const start = fragment?.start_at ? new Date(fragment.start_at) : null;
        const end = fragment?.end_at ? new Date(fragment.end_at) : null;
        if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return;
        fragments.push({ start, end });
      });
    }

    if (fragments.length === 0 && Array.isArray(selectedSession.source_session_ids)) {
      selectedSession.source_session_ids.forEach((sessionId) => {
        const source = sessionRows.find((row) => String(row.id) === String(sessionId));
        if (!source?.started_at) return;

        const start = new Date(source.started_at);
        const fallbackEnd = new Date(start.getTime() + (Math.max(1, toNumber(source.avg_duration_minutes)) * 60 * 1000));
        const parsedEnd = source.ended_at ? new Date(source.ended_at) : fallbackEnd;
        const end = Number.isNaN(parsedEnd.getTime()) ? fallbackEnd : parsedEnd;

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return;
        fragments.push({ start, end });
      });
    }

    if (fragments.length === 0) return null;

    const sorted = [...fragments].sort((left, right) => left.start.getTime() - right.start.getTime());
    const start = sorted[0].start;
    const end = sorted[sorted.length - 1].end;
    const breakSegments = [];

    for (let index = 0; index < sorted.length - 1; index += 1) {
      const current = sorted[index];
      const next = sorted[index + 1];
      if (next.start <= current.end) continue;
      breakSegments.push({ start: current.end, end: next.start });
    }

    const spanMinutes = Math.max(1, diffMinutes(end, start));
    const breakMinutes = breakSegments.reduce((sum, segment) => sum + diffMinutes(segment.end, segment.start), 0);

    return {
      start,
      end,
      spanMinutes,
      breakSegments,
      breakMinutes,
      creditMinutes: Math.max(1, spanMinutes - breakMinutes),
    };
  }, [selectedSession, sessionRows]);

  const presenceRows = useMemo(() => {
    if (!selectedSession || !selectedSessionWindow) return [];

    const sourceSessionIds = Array.isArray(selectedSession.source_session_ids)
      ? selectedSession.source_session_ids.map((id) => String(id))
      : [];

    const flattenedRows = sourceSessionIds.flatMap((sessionId) => {
      const rows = getSessionBucket(attendanceBySessionId, sessionId);
      return rows.map((row) => ({ ...row, _sessionId: sessionId }));
    });

    if (flattenedRows.length === 0) return [];

    const merged = new Map();

    flattenedRows.forEach((row) => {
      const participantName = String(row?.student_name || row?.participant_name || 'Unknown participant').trim();
      const key = row?.student_id ? `student:${row.student_id}` : `name:${participantName.toLowerCase()}`;

      if (!merged.has(key)) {
        merged.set(key, {
          key,
          studentId: row?.student_id || null,
          name: participantName || 'Unknown participant',
          intervals: [],
        });
      }

      const current = merged.get(key);
      const intervals = Array.isArray(row?.intervals) ? row.intervals : [];

      intervals.forEach((interval) => {
        const start = interval?.joined_at ? new Date(interval.joined_at) : null;
        const end = interval?.left_at ? new Date(interval.left_at) : selectedSessionWindow.end;
        if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
        if (end <= selectedSessionWindow.start || start >= selectedSessionWindow.end) return;

        const clippedStart = new Date(Math.max(start.getTime(), selectedSessionWindow.start.getTime()));
        const clippedEnd = new Date(Math.min(end.getTime(), selectedSessionWindow.end.getTime()));
        if (clippedEnd <= clippedStart) return;

        current.intervals.push({
          start: clippedStart,
          end: clippedEnd,
        });
      });
    });

    return [...merged.values()]
      .map((row) => {
        const sortedIntervals = [...row.intervals].sort((left, right) => left.start.getTime() - right.start.getTime());
        const attendanceMinutes = sortedIntervals.reduce((sum, interval) => sum + diffMinutes(interval.end, interval.start), 0);
        const deductedBreakMinutes = selectedSessionWindow.breakSegments.reduce(
          (sum, segment) => sum + sortedIntervals.reduce(
            (inner, interval) => inner + overlapMinutes(interval.start, interval.end, segment.start, segment.end),
            0
          ),
          0
        );
        const creditedMinutes = Math.max(0, attendanceMinutes - deductedBreakMinutes);

        const renderedIntervals = sortedIntervals.map((interval) => {
          const leftPct = ((interval.start.getTime() - selectedSessionWindow.start.getTime()) / (selectedSessionWindow.spanMinutes * 60 * 1000)) * 100;
          const widthPct = ((interval.end.getTime() - interval.start.getTime()) / (selectedSessionWindow.spanMinutes * 60 * 1000)) * 100;

          return {
            ...interval,
            leftPct,
            widthPct,
          };
        });

        return {
          ...row,
          intervals: renderedIntervals,
          attendanceMinutes,
          creditedMinutes,
          creditedPct: round((creditedMinutes / selectedSessionWindow.creditMinutes) * 100, 1),
        };
      })
      .sort((left, right) => right.creditedMinutes - left.creditedMinutes);
  }, [selectedSession, selectedSessionWindow, attendanceBySessionId]);

  const summary = useMemo(() => {
    if (bundledSessionRows.length === 0) {
      return {
        avgAttendanceRate: 0,
        avgDuration: 0,
        interactionsPerSession: 0,
        totalSpeakingMinutes: 0,
        signalsPerPresentStudent: 0,
      };
    }

    const totals = bundledSessionRows.reduce(
      (acc, row) => {
        acc.attendance += toNumber(row.attendance_rate);
        acc.duration += toNumber(row.avg_duration_minutes);
        acc.interactions += toNumber(row.interactions);
        acc.speaking += toNumber(row.speaking_proxy_minutes);
        return acc;
      },
      { attendance: 0, duration: 0, interactions: 0, speaking: 0 }
    );

    const totalPresent = bundledSessionRows.reduce((sum, row) => sum + toNumber(row.present_count), 0);

    return {
      avgAttendanceRate: round(totals.attendance / bundledSessionRows.length, 1),
      avgDuration: round(totals.duration / bundledSessionRows.length, 1),
      interactionsPerSession: round(totals.interactions / bundledSessionRows.length, 1),
      totalSpeakingMinutes: round(totals.speaking, 1),
      signalsPerPresentStudent: totalPresent > 0 ? round(totals.interactions / totalPresent, 2) : 0,
      avgEngagementScore: hasValidNumericValue(analytics?.overallStats?.avgEngagementScore)
        ? round(toNumber(analytics.overallStats.avgEngagementScore), 1)
        : round(
          studentRows.reduce((sum, row) => sum + toNumber(row.engagement_score), 0) / (studentRows.length || 1),
          1
        ),
    };
  }, [analytics, bundledSessionRows, studentRows]);

  const weeklyTrends = useMemo(() => {
    const weeklyMap = new Map();
    const aliasToCanonical = new Map();
    const rosterCanonicalSet = new Set();

    studentRows.forEach((student) => {
      const canonical = student?.id
        ? `student:${String(student.id)}`
        : `name:${normalizeText(student?.full_name || student?.student_name || student?.participant_name)}`;

      getStudentIdentityKeys(student).forEach((key) => {
        aliasToCanonical.set(key, canonical);
      });
    });

    sessionRows.forEach((row) => {
      (row.attendanceRows || []).forEach((attendanceRow) => {
        const attendanceKey = getEntityKey(attendanceRow);
        if (!attendanceKey) return;
        const canonicalAttendanceKey = aliasToCanonical.get(attendanceKey) || attendanceKey;
        aliasToCanonical.set(attendanceKey, canonicalAttendanceKey);
        rosterCanonicalSet.add(canonicalAttendanceKey);
      });
    });

    const classStudentCount = Math.max(1, rosterCanonicalSet.size, studentRows.length);

    sessionRows.forEach((row) => {
      const rawDate = row.session_date ? new Date(row.session_date) : null;
      if (!rawDate || Number.isNaN(rawDate.getTime())) return;

      const weekStart = getWeekStart(rawDate);
      const key = weekStart.toISOString();

      if (!weeklyMap.has(key)) {
        weeklyMap.set(key, {
          weekKey: key,
          week: weekStart.toLocaleDateString(),
          weekStart,
          sessions: 0,
          attendanceTotal: 0,
          engagementTotal: 0,
          activeStudentCount: 0,
          activeRateTotal: 0,
          activeStudentSet: new Set(),
          retainedStudents: 0,
          attendanceRowsTotal: 0,
          chat: 0,
          reaction: 0,
          handRaise: 0,
          micToggle: 0,
          eventTags: [],
        });
      }

      const bucket = weeklyMap.get(key);
      bucket.sessions += 1;
      bucket.attendanceTotal += toNumber(row.attendance_rate);
      bucket.engagementTotal += toNumber(row.interactions);
      bucket.chat += toNumber(row.chat);
      bucket.reaction += toNumber(row.reaction);
      bucket.handRaise += toNumber(row.hand_raise);
      bucket.micToggle += toNumber(row.mic_toggle);

      const presentRosterSet = new Set();

      (row.attendanceRows || []).forEach((attendanceRow) => {
        bucket.attendanceRowsTotal += 1;

        const attendanceKey = getEntityKey(attendanceRow);
        const canonicalAttendanceKey = attendanceKey
          ? (aliasToCanonical.get(attendanceKey) || attendanceKey)
          : null;

        if (
          canonicalAttendanceKey
          && (
            attendanceRow?.status === 'present'
            || attendanceRow?.status === 'late'
            || toNumber(attendanceRow?.total_duration_minutes) > 0
          )
        ) {
          presentRosterSet.add(canonicalAttendanceKey);
        }

        const sessionDuration = row.started_at && row.ended_at
          ? diffMinutes(new Date(row.ended_at), new Date(row.started_at))
          : toNumber(row.avg_duration_minutes);
        if (sessionDuration > 0 && toNumber(attendanceRow?.total_duration_minutes) >= (sessionDuration * 0.9)) {
          bucket.retainedStudents += 1;
        }
      });

      const markerLabel = row.title || row.label || null;
      if (markerLabel && !bucket.eventTags.includes(markerLabel)) {
        bucket.eventTags.push(markerLabel);
      }

      const sessionLogs = getSessionBucket(logsBySessionId, row.id);
      const sessionActiveSet = new Set();
      sessionLogs.forEach((log) => {
        const studentKey = getEntityKey(log);
        const interaction = log?.interaction_type;
        if (!studentKey) return;
        if (!['chat', 'reaction', 'hand_raise', 'mic_toggle'].includes(interaction)) return;
        const canonical = aliasToCanonical.get(studentKey)
          || (rosterCanonicalSet.has(studentKey) ? studentKey : null);
        if (!canonical) return;
        if (presentRosterSet.size > 0 && !presentRosterSet.has(canonical)) return;
        sessionActiveSet.add(canonical);
        bucket.activeStudentSet.add(canonical);
      });

      const sessionActiveRate = classStudentCount > 0
        ? round((sessionActiveSet.size / classStudentCount) * 100, 1)
        : 0;
      bucket.activeRateTotal += sessionActiveRate;
      bucket.activeStudentCount = bucket.activeStudentSet.size;
      bucket.retentionRate = bucket.attendanceRowsTotal > 0 ? round((bucket.retainedStudents / bucket.attendanceRowsTotal) * 100, 1) : 0;
      bucket.breadthSignals = bucket.activeStudentSet.size;
    });

    const ordered = [...weeklyMap.values()]
      .map((bucket) => ({
        ...bucket,
        attendanceRate: round(bucket.attendanceTotal / bucket.sessions, 1),
        activeStudentRate: round(bucket.activeRateTotal / bucket.sessions, 1),
        interactionsPerSession: round(bucket.engagementTotal / bucket.sessions, 1),
      }))
      .map((bucket) => ({
        ...bucket,
        activeStudentRate: Number.isFinite(bucket.activeStudentRate) ? bucket.activeStudentRate : 0,
        retentionRate: Number.isFinite(bucket.retentionRate) ? bucket.retentionRate : 0,
      }))
      .sort((left, right) => new Date(left.week).getTime() - new Date(right.week).getTime());
    const baselines = ordered.length > 0
      ? ordered.reduce(
        (acc, row) => {
          acc.attendance += toNumber(row.attendanceRate);
          acc.breadth += toNumber(row.activeStudentRate);
          return acc;
        },
        { attendance: 0, breadth: 0 }
      )
      : { attendance: 0, breadth: 0 };

    const attendanceBaseline = ordered.length > 0 ? round(baselines.attendance / ordered.length, 1) : 0;
    const breadthBaseline = ordered.length > 0 ? round(baselines.breadth / ordered.length, 1) : 0;

    return ordered.map((bucket, index) => {
      const priorWindow = ordered.slice(Math.max(0, index - 4), index);
      const attendanceBenchmark = priorWindow.length > 0
        ? round(priorWindow.reduce((sum, row) => sum + toNumber(row.attendanceRate), 0) / priorWindow.length, 1)
        : attendanceBaseline;
      const breadthBenchmark = priorWindow.length > 0
        ? round(priorWindow.reduce((sum, row) => sum + toNumber(row.activeStudentRate), 0) / priorWindow.length, 1)
        : breadthBaseline;
      const benchmarkTolerance = 1.5;
      const attendanceHigh = (bucket.attendanceRate - attendanceBenchmark) >= benchmarkTolerance
        || bucket.attendanceRate >= 85;
      const breadthHigh = (bucket.activeStudentRate - breadthBenchmark) >= benchmarkTolerance
        || bucket.activeStudentRate >= 55;
      return {
        ...bucket,
        attendanceBenchmark,
        breadthBenchmark,
        healthQuadrant: attendanceHigh && breadthHigh
          ? 'Vibrant'
          : attendanceHigh && !breadthHigh
            ? 'Spectator'
            : !attendanceHigh && breadthHigh
              ? 'Fragmented'
              : 'Disengaged',
      };
    });
  }, [logsBySessionId, sessionRows, studentRows]);

  const trendEventMarkers = useMemo(() => {
    return weeklyTrends.flatMap((week) => {
      const tags = Array.isArray(week.eventTags) ? [...new Set(week.eventTags)] : [];
      if (tags.length === 0) return [];

      return tags.slice(0, 2).map((tag, index) => ({
        id: `${week.weekKey}-${index}`,
        weekLabel: week.week,
        tag,
      }));
    });
  }, [weeklyTrends]);

  useEffect(() => {
    if (weeklyTrends.length === 0) {
      setSelectedTrendPulseWeekKey('');
      return;
    }

    const latestWeekKey = weeklyTrends[weeklyTrends.length - 1]?.weekKey || '';
    const hasSelection = weeklyTrends.some((week) => week.weekKey === selectedTrendPulseWeekKey);
    if (!selectedTrendPulseWeekKey || !hasSelection) {
      setSelectedTrendPulseWeekKey(latestWeekKey);
    }
  }, [selectedTrendPulseWeekKey, weeklyTrends]);

  const selectedTrendPulseWeek = useMemo(
    () => weeklyTrends.find((week) => week.weekKey === selectedTrendPulseWeekKey) || weeklyTrends[weeklyTrends.length - 1] || null,
    [selectedTrendPulseWeekKey, weeklyTrends]
  );

  const trendPulseData = useMemo(() => {
    if (weeklyTrends.length === 0) return [];

    const pulseWeekKey = selectedTrendPulseWeek?.weekKey || weeklyTrends[weeklyTrends.length - 1]?.weekKey;
    if (!pulseWeekKey) return [];

    const bundledSessionsInWeek = bundledSessionRows.filter((row) => {
      const rawDate = row.session_date ? new Date(row.session_date) : null;
      if (!rawDate || Number.isNaN(rawDate.getTime())) return false;
      return getWeekStart(rawDate).toISOString() === pulseWeekKey;
    });
    if (bundledSessionsInWeek.length === 0) return [];

    const sessionById = new Map(sessionRows.map((row) => [String(row.id), row]));
    const bundleWindows = bundledSessionsInWeek
      .map((bundle) => {
        const sourceSessionIds = Array.isArray(bundle.source_session_ids)
          ? bundle.source_session_ids.map((id) => String(id))
          : [];
        const matched = sourceSessionIds
          .map((sessionId) => sessionById.get(sessionId))
          .filter(Boolean);

        const starts = matched
          .map((session) => session?.started_at ? new Date(session.started_at) : null)
          .filter((date) => date && !Number.isNaN(date.getTime()));
        const ends = matched
          .map((session) => session?.ended_at ? new Date(session.ended_at) : null)
          .filter((date) => date && !Number.isNaN(date.getTime()));

        let start = starts.length > 0 ? new Date(Math.min(...starts.map((date) => date.getTime()))) : null;
        let end = ends.length > 0 ? new Date(Math.max(...ends.map((date) => date.getTime()))) : null;

        if (!start || Number.isNaN(start.getTime())) {
          const fallback = bundle.session_date ? new Date(bundle.session_date) : null;
          start = fallback && !Number.isNaN(fallback.getTime()) ? fallback : null;
        }
        if ((!end || Number.isNaN(end.getTime())) && start) {
          end = new Date(start.getTime() + (Math.max(1, toNumber(bundle.avg_duration_minutes)) * 60 * 1000));
        }
        if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

        return {
          start,
          end,
          sourceSessionIds,
          spanMinutes: Math.max(1, diffMinutes(end, start)),
        };
      })
      .filter(Boolean);
    if (bundleWindows.length === 0) return [];

    const longestSpanMinutes = Math.max(...bundleWindows.map((bundle) => bundle.spanMinutes));
    const bucketSizeMinutes = 5;
    const totalBuckets = Math.max(1, Math.ceil(longestSpanMinutes / bucketSizeMinutes) + 1);

    const pulseMap = new Map();

    for (let index = 0; index < totalBuckets; index += 1) {
      const minute = index * bucketSizeMinutes;
      pulseMap.set(index, {
        index,
        minute,
        label: `${minute}m`,
        activity: 0,
        chat: 0,
        reaction: 0,
        handRaise: 0,
        micToggle: 0,
      });
    }

    bundleWindows.forEach((bundle) => {
      bundle.sourceSessionIds.forEach((sessionId) => {
        const logs = getSessionBucket(logsBySessionId, sessionId);
        logs.forEach((log) => {
          const timestamp = log?.timestamp ? new Date(log.timestamp) : null;
          if (!timestamp || Number.isNaN(timestamp.getTime())) return;

          const minuteOffset = diffMinutes(timestamp, bundle.start);
          if (minuteOffset < 0) return;

          const index = Math.min(totalBuckets - 1, Math.floor(minuteOffset / bucketSizeMinutes));
          const bucket = pulseMap.get(index);
          if (!bucket) return;

          const interaction = log?.interaction_type;
          if (interaction === 'chat') bucket.chat += 1;
          if (interaction === 'reaction') bucket.reaction += 1;
          if (interaction === 'hand_raise') bucket.handRaise += 1;
          if (interaction === 'mic_toggle') bucket.micToggle += 1;
          bucket.activity = bucket.chat + bucket.reaction + bucket.handRaise + bucket.micToggle;
        });
      });
    });

    return [...pulseMap.values()].sort((left, right) => left.index - right.index);
  }, [bundledSessionRows, logsBySessionId, selectedTrendPulseWeek, sessionRows, weeklyTrends]);

  const trendMovers = useMemo(() => {
    const rows = studentRows.map((student) => {
      const history = getStudentIdentityKeys(student)
        .map((key) => studentHistoryMap.get(key))
        .find(Boolean) || [];

      const lastWindow = history.slice(-7);
      const priorWindow = history.slice(-14, -7);
      const lastAverage = lastWindow.length > 0 ? lastWindow.reduce((sum, row) => sum + toNumber(row.heatmapSignals), 0) / lastWindow.length : 0;
      const priorAverage = priorWindow.length > 0 ? priorWindow.reduce((sum, row) => sum + toNumber(row.heatmapSignals), 0) / priorWindow.length : 0;

      return {
        id: student.id,
        name: student.full_name,
        delta: round(lastAverage - priorAverage, 1),
        current: round(lastAverage, 1),
        previous: round(priorAverage, 1),
      };
    });

    return {
      climbers: [...rows].sort((left, right) => right.delta - left.delta).filter((row) => row.delta > 0).slice(0, 3),
      sliders: [...rows].sort((left, right) => left.delta - right.delta).filter((row) => row.delta < 0).slice(0, 3),
    };
  }, [studentHistoryMap, studentRows]);

  const latestTrendWeek = weeklyTrends[weeklyTrends.length - 1] || null;

  const trendSummary = useMemo(() => {
    if (weeklyTrends.length === 0) {
      return {
        retentionRate: 0,
        activeStudentRate: 0,
        attendanceRate: 0,
        classHealth: 'No data',
        breadthTrend: 0,
      };
    }

    const totals = weeklyTrends.reduce(
      (acc, row) => {
        const sessionWeight = Math.max(1, toNumber(row.sessions));
        acc.weight += sessionWeight;
        acc.retention += toNumber(row.retentionRate) * sessionWeight;
        acc.active += toNumber(row.activeStudentRate) * sessionWeight;
        acc.attendance += toNumber(row.attendanceRate) * sessionWeight;
        if (acc.quadrants[row.healthQuadrant] !== undefined) {
          acc.quadrants[row.healthQuadrant] += 1;
        }
        return acc;
      },
      {
        weight: 0,
        retention: 0,
        active: 0,
        attendance: 0,
        quadrants: {
          Vibrant: 0,
          Spectator: 0,
          Fragmented: 0,
          Disengaged: 0,
        },
      }
    );

    const dominantHealth = Object.entries(totals.quadrants)
      .sort((left, right) => right[1] - left[1])[0]?.[0] || 'No data';

    const firstBreadth = toNumber(weeklyTrends[0]?.activeStudentRate);
    const lastBreadth = toNumber(weeklyTrends[weeklyTrends.length - 1]?.activeStudentRate);

    return {
      retentionRate: totals.weight > 0 ? round(totals.retention / totals.weight, 1) : 0,
      activeStudentRate: totals.weight > 0 ? round(totals.active / totals.weight, 1) : 0,
      attendanceRate: totals.weight > 0 ? round(totals.attendance / totals.weight, 1) : 0,
      breadthTrend: weeklyTrends.length > 1 ? round(lastBreadth - firstBreadth, 1) : 0,
      classHealth: dominantHealth,
    };
  }, [weeklyTrends]);

  const trendQuadrants = useMemo(() => {
    const counts = {
      Vibrant: 0,
      Spectator: 0,
      Fragmented: 0,
      Disengaged: 0,
    };

    weeklyTrends.forEach((row) => {
      if (counts[row.healthQuadrant] !== undefined) {
        counts[row.healthQuadrant] += 1;
      }
    });

    return {
      counts,
      latest: latestTrendWeek?.healthQuadrant || 'No data',
    };
  }, [latestTrendWeek, weeklyTrends]);

  const atRiskStudents = useMemo(
    () => studentRows.filter((student) => student.risk !== 'Stable').slice(0, 6),
    [studentRows]
  );

  const loading = analyticsLoading || participationLoading || attendanceLoading;

  const onQuickSelect = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-accent-600"></div>
        <p className="mt-3 text-sm text-slate-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 rounded-lg bg-slate-100 p-1">
            {TAB_DEFS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-accent-700 text-white'
                    : 'text-slate-700 hover:bg-accent-100 hover:text-accent-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <DateRangePicker
            variant="compact"
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onQuickSelect={onQuickSelect}
          />
        </div>
      </div>

      {activeTab === 'summary' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Attendance Rate" value={`${summary.avgAttendanceRate}%`} hint="Average across sessions in range" />
            <MetricCard label="Minutes Present" value={formatMinutes(summary.avgDuration)} hint="Average student presence per session" />
            <MetricCard label="Engagement Signals" value={String(summary.interactionsPerSession)} hint="Avg. logged interactions per session" />
            <MetricCard label="Signals / Present Student" value={String(summary.signalsPerPresentStudent)} hint="Total interactions divided by total present students across sessions" />
            <MetricCard label="Avg Engagement" value={String(summary.avgEngagementScore)} hint="Average student engagement score" />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Attendance vs Engagement by Session</h3>
              <p className="text-xs text-slate-500">Helps answer whether strong attendance also leads to active participation.</p>
              <div className="mt-4 h-72">
                <ChartCanvas height={288}>
                  {(chartWidth, chartHeight) => (
                  <LineChart width={chartWidth} height={chartHeight} data={bundledSessionRows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="attendance_rate" name="Attendance %" stroke="#0f766e" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="interactions" name="Interactions" stroke="#1d4ed8" strokeWidth={2} />
                  </LineChart>
                  )}
                </ChartCanvas>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Students Needing Attention</h3>
              <p className="text-xs text-slate-500">Flagged when attendance or engagement is consistently low.</p>
              {atRiskStudents.length === 0 ? (
                <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  No immediate risk flags in the selected range.
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {atRiskStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <div>
                        <p className="font-medium text-slate-900">{student.full_name}</p>
                        <p className="text-xs text-slate-600">
                          Attendance {round(student.attendance_rate, 1)}% · Engagement {round(student.engagement_score, 1)}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getRiskTone(student.risk)}`}>
                        {student.risk}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      ) : null}

      {activeTab === 'student' ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1.75fr)]">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Class Student Overview</h3>
                <p className="text-xs text-slate-500">Tiny sparklines show the last 5 sessions of engagement intensity.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                Lurker = high attendance, zero signals
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Consistency</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Active</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Lurker</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {studentOverviewRows.map((student) => {
                    const sparklinePath = buildSparklinePath(student.sparklineValues, 88, 24);

                    return (
                      <tr
                        key={student.id}
                        className={`cursor-pointer transition hover:bg-slate-50 ${selectedStudent?.id === student.id ? 'bg-accent-50' : ''}`}
                        onClick={() => setSelectedStudentId(String(student.id))}
                      >
                        <td className="px-3 py-3 align-middle text-sm font-medium text-slate-900">{student.full_name}</td>
                        <td className="px-3 py-3 align-middle">
                          {sparklinePath ? (
                            <svg viewBox="0 0 88 24" className="h-6 w-[88px] overflow-visible">
                              <path d={sparklinePath} fill="none" stroke="#557170" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              {student.sparklineValues.map((value, index) => {
                                const x = student.sparklineValues.length === 1 ? 44 : (index / (student.sparklineValues.length - 1)) * 88;
                                const min = Math.min(...student.sparklineValues);
                                const max = Math.max(...student.sparklineValues);
                                const range = max - min || 1;
                                const y = 24 - (((value - min) / range) * 24);
                                return <circle key={`${student.id}-spark-${index}`} cx={x} cy={y} r="1.8" fill="#557170" />;
                              })}
                            </svg>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm text-slate-700">{student.lastActiveLabel}</td>
                        <td className="px-3 py-3 align-middle">
                          {student.lurker ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">Lurker</span>
                          ) : (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {selectedStudent ? (
              <>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] xl:items-start">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Engagement Snapshot</p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-900">{selectedStudent.full_name}</h3>
                      <p className="mt-1 text-sm text-slate-600">A quick read on whether this student looks typical, improving, or concerning.</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full border px-3 py-1 font-semibold ${selectedStudentBehavior.relativeStanding === 'Concerning' ? 'border-rose-200 bg-rose-50 text-rose-700' : selectedStudentBehavior.relativeStanding === 'Improving' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                          {selectedStudentBehavior.relativeStanding}
                        </span>
                        <span className={`rounded-full border px-3 py-1 font-semibold ${selectedStudentBehavior.reliabilityScore >= 80 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : selectedStudentBehavior.reliabilityScore >= 55 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                          {selectedStudentBehavior.reliabilityLabel} · {round(selectedStudentBehavior.reliabilityScore, 1)}/100
                        </span>
                        <span className={`rounded-full border px-3 py-1 font-semibold ${selectedStudentBehavior.velocityDirection === 'up' ? 'border-accent-200 bg-accent-50 text-accent-700' : selectedStudentBehavior.velocityDirection === 'down' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                          {selectedStudentBehavior.velocityDirection === 'up' ? '▲' : selectedStudentBehavior.velocityDirection === 'down' ? '▼' : '•'} {selectedStudentBehavior.velocityDelta > 0 ? '+' : ''}{selectedStudentBehavior.velocityDelta} this week vs semester avg
                        </span>
                        {selectedStudentBehavior.lurker ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">Lurker flag</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <MetricCard compact label="Attendance" value={`${round(selectedStudent.attendance_rate, 1)}%`} hint={`Class average ${selectedStudentClassAverages.attendance}%`} />
                      <MetricCard compact label="Engagement" value={String(round(selectedStudent.engagement_score, 1))} hint={`Class average ${selectedStudentClassAverages.engagement}`} />
                      <MetricCard compact label="Reliability" value={`${round(selectedStudentBehavior.reliabilityScore, 0)}/100`} hint={`Join/leave stability across ${selectedStudentBehavior.historyCount} sessions`} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h4 className="text-base font-semibold text-slate-900">Activity Heatmap</h4>
                    <p className="text-xs text-slate-500">Each dot is a session. Darker means more hand raises and reactions.</p>

                    {selectedStudentHistory.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-600">No session history available for this student.</p>
                    ) : (
                      <>
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <div className="overflow-x-auto pb-2">
                            <div className="flex min-w-max items-end gap-2">
                              {selectedStudentHistory.map((row, index) => {
                                const intensityRatio = toNumber(row.heatmapSignals) / selectedStudentHeatmapMax;
                                const opacity = Math.max(0.18, Math.min(1, 0.18 + (intensityRatio * 0.82)));
                                return (
                                  <div key={`${row.id || row.date || index}`} className="flex flex-col items-center gap-1">
                                    <span
                                      title={`${formatDate(row.date)} · ${row.heatmapSignals} signal(s)`}
                                      className="h-5 w-5 rounded-full border border-accent-300 shadow-sm"
                                      style={{ backgroundColor: `rgba(85, 113, 112, ${opacity})` }}
                                    />
                                    <span className="text-[10px] text-slate-400">{formatDate(row.date)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                            <span>Left: early semester</span>
                            <span>Right: recent sessions</span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Sessions tracked: <strong className="text-slate-900">{selectedStudentHeatmapSummary.sessionsTracked}</strong></span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Total signals: <strong className="text-slate-900">{selectedStudentHeatmapSummary.totalSignals}</strong></span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Avg/session: <strong className="text-slate-900">{selectedStudentHeatmapSummary.averageSignals}</strong></span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Peak: <strong className="text-slate-900">{selectedStudentHeatmapSummary.peakSignals}</strong> on {formatDate(selectedStudentHeatmapSummary.peakDate)}</span>
                        </div>
                      </>
                    )}
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-base font-semibold text-slate-900">Signal Mix</h4>
                    <p className="text-xs text-slate-500">Direct interaction, expressive interaction, and passive metadata.</p>

                    {selectedStudentHistory.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-600">No signal data available for this student.</p>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-[260px_1fr] sm:items-center">
                        <div className="h-64">
                          <ChartCanvas height={256}>
                            {(chartWidth, chartHeight) => (
                              <PieChart width={chartWidth} height={chartHeight}>
                                <Tooltip />
                                <Pie
                                  data={selectedStudentSignalMixData}
                                  dataKey="value"
                                  nameKey="name"
                                  innerRadius={54}
                                  outerRadius={82}
                                  paddingAngle={3}
                                >
                                  {selectedStudentSignalMixData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Legend />
                              </PieChart>
                            )}
                          </ChartCanvas>
                        </div>

                        <div className="space-y-3 text-sm text-slate-700">
                          {selectedStudentSignalMixData.map((entry) => (
                            <div key={entry.name} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span>{entry.name}</span>
                              </div>
                              <span className="font-semibold text-slate-900">{toNumber(entry.value)}</span>
                            </div>
                          ))}
                          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            Direct interaction means hand raises. Expressive interaction means reactions. Passive metadata combines chat and mic toggles.
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">Diagnostic Attendance Log</h4>
                      <p className="text-xs text-slate-500">Tracks punctuality, stability, and whether the student may have been fighting the connection.</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                      5+ joins in a session = unstable
                    </span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Punctuality</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Stability</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedStudentHistory.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-3 py-4 text-sm text-slate-600">No attendance records found for this student.</td>
                          </tr>
                        ) : selectedStudentHistory.map((row) => (
                          <tr key={`${row.id}-${row.date}`} className={row.isLurker ? 'bg-amber-50/50' : ''}>
                            <td className="px-3 py-2 text-sm text-slate-900">{formatDate(row.date)}</td>
                            <td className="px-3 py-2 text-sm text-slate-700">{row.status}</td>
                            <td className="px-3 py-2 text-sm text-slate-700">{row.durationMinutes > 0 ? `${formatMinutes(row.durationMinutes)} / ${formatMinutes(row.sessionSpanMinutes)}` : '0m'}</td>
                            <td className="px-3 py-2 text-sm text-slate-700">{row.punctuality}</td>
                            <td className="px-3 py-2 text-sm text-slate-700">
                              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${row.stabilityLabel === 'Unstable' ? 'border border-amber-200 bg-amber-50 text-amber-700' : row.stabilityLabel === 'No joins' ? 'border border-slate-200 bg-slate-50 text-slate-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                                {row.stabilityText}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : (
              <p className="text-sm text-slate-600">No student data in this range.</p>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === 'session' ? (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session</label>
                <select
                  value={String(selectedSession?.id || '')}
                  onChange={(event) => setSelectedSessionId(String(event.target.value))}
                  className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {bundledSessionRows.map((session) => (
                    <option key={session.id} value={String(session.id)}>
                      {session.label} ({formatDate(session.session_date)})
                      {Number.isFinite(toNumber(session.session_count)) && toNumber(session.session_count) > 1
                        ? ` • ${toNumber(session.session_count)} fragments`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500">Snapshot answers: who attended, for how long, and how engaged they were in this session.</p>
            </div>

            {selectedSession ? (
              <div className="mt-4 grid grid-cols-7 gap-3">
                <MetricCard compact label="Attendance" value={`${round(selectedSession.attendance_rate, 1)}%`} hint="Present out of participants" />
                <MetricCard compact label="Participants" value={String(selectedSession.total_participants)} hint="Students with attendance records" />
                <MetricCard compact label="Avg Minutes" value={formatMinutes(selectedSession.avg_duration_minutes)} hint="Average time present" />
                <MetricCard compact label="Chat" value={String(selectedSession.chat)} hint="Chat activity count" />
                <MetricCard compact label="Reactions" value={String(selectedSession.reaction)} hint="Reaction activity count" />
                <MetricCard compact label="Hands" value={String(selectedSession.hand_raise)} hint="Hand raise events" />
                <MetricCard compact label="Speaking" value={formatMinutes(selectedSession.speaking_proxy_minutes)} hint="Mic-toggle speaking proxy" />
              </div>
            ) : null}
          </section>

          {selectedSession ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Synchronized Timeline</h3>
                <p className="text-xs text-slate-500">Engagement spikes throughout the session - how interactions clustered over time.</p>
                {synchronizedTimeline.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    No participation logs available for this session.
                  </div>
                ) : (
                  <div className="mt-4 h-72">
                    <ChartCanvas height={288}>
                      {(chartWidth, chartHeight) => (
                      <ComposedChart width={chartWidth} height={chartHeight} data={synchronizedTimeline}>
                        <defs>
                          <linearGradient id="timelineActivityShade" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={TIMELINE_COLORS.activity} stopOpacity={0.26} />
                            <stop offset="95%" stopColor={TIMELINE_COLORS.activity} stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <Tooltip content={<TimelineTooltip />} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="activityShade"
                          name="Total Activity Shade"
                          stroke="none"
                          fill="url(#timelineActivityShade)"
                          isAnimationActive={false}
                          legendType="none"
                        />
                        <Line type="monotone" dataKey="activity" stroke={TIMELINE_COLORS.activity} strokeWidth={3} name="Total Activity" isAnimationActive={false} />
                        <Line type="monotone" dataKey="chat" stroke={TIMELINE_COLORS.chat} strokeWidth={2} name="Chat" isAnimationActive={false} />
                        <Line type="monotone" dataKey="reaction" stroke={TIMELINE_COLORS.reaction} strokeWidth={2} name="Reactions" isAnimationActive={false} />
                        <Line type="monotone" dataKey="handRaise" stroke={TIMELINE_COLORS.handRaise} strokeWidth={2} name="Hand Raises" isAnimationActive={false} />
                        <Line type="monotone" dataKey="micToggle" stroke={TIMELINE_COLORS.micToggle} strokeWidth={2} name="Mic Toggles" isAnimationActive={false} />
                      </ComposedChart>
                      )}
                    </ChartCanvas>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Attendance Roster Snapshot</h3>
                <p className="text-xs text-slate-500">Duration is total recorded minutes for this session.</p>
                <div className="mt-3 max-h-72 overflow-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Minutes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedSession.attendanceRows.map((row) => (
                        <tr key={row.id || `${row.participant_name}-${row.student_id || 'na'}`}>
                          <td className="px-3 py-2 text-sm text-slate-800">{row.student_name || row.participant_name || 'Unknown'}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{row.status || 'unknown'}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{formatMinutes(toNumber(row.total_duration_minutes))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : null}

          {selectedSession ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Presence Gantt</h3>
              <p className="text-xs text-slate-500">Join and leave intervals per student across the selected bundled session.</p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded" style={{ backgroundColor: '#0284c7' }}></span>Present</span>
                {selectedSessionWindow && selectedSessionWindow.breakSegments.length > 0 ? (
                  <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded" style={{ backgroundColor: '#cbd5e1' }}></span>Breaktime</span>
                ) : null}
              </div>

              {!selectedSessionWindow || presenceRows.length === 0 ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  No interval-based attendance data available for this session.
                </div>
              ) : (
                <div className="mt-4 max-h-96 space-y-3 overflow-auto pr-1">
                  {presenceRows.map((row) => (
                    <div key={row.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{row.name}</span>
                        <span className="text-slate-600">{formatMinutes(row.creditedMinutes)} ({row.creditedPct}%)</span>
                      </div>

                      <div className="relative h-6 overflow-hidden rounded-md border border-slate-200" style={{ backgroundColor: '#f8fafc' }}>
                        {selectedSessionWindow.breakSegments.map((segment, index) => {
                          const leftPct = ((segment.start.getTime() - selectedSessionWindow.start.getTime()) / (selectedSessionWindow.spanMinutes * 60 * 1000)) * 100;
                          const widthPct = ((segment.end.getTime() - segment.start.getTime()) / (selectedSessionWindow.spanMinutes * 60 * 1000)) * 100;
                          return (
                            <div
                              key={`${row.key}-break-${index}`}
                              className="absolute inset-y-0"
                              style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: '#cbd5e1', zIndex: 1 }}
                            />
                          );
                        })}

                        {row.intervals.map((interval, index) => (
                          <div
                            key={`${row.key}-interval-${index}`}
                            className="absolute inset-y-0 rounded"
                            style={{ left: `${interval.leftPct}%`, width: `${Math.max(interval.widthPct, 0.8)}%`, backgroundColor: '#0284c7', zIndex: 2 }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'trends' ? (
        <div className="grid grid-cols-1 gap-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Trend Snapshot</h3>
            <p className="text-xs text-slate-500">Class health favors breadth and consistency over raw totals.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard compact label="Retention Rate" value={`${trendSummary.retentionRate}%`} hint="Timespan average of students who stayed for more than 90% of each session" />
              <MetricCard compact label="Active Student %" value={`${trendSummary.activeStudentRate}%`} hint="Timespan average of per-session students who sent at least one signal" />
              <MetricCard compact label="Attendance" value={`${trendSummary.attendanceRate}%`} hint="Timespan average attendance" />
              <MetricCard compact label="Class Health" value={trendSummary.classHealth} hint="Most frequent quadrant across the selected timespan" />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Weekly Attendance, Breadth, and Baseline</h3>
                <p className="text-xs text-slate-500">Breadth is the average per-session percent of students who sent at least one signal. Dashed lines show the recent benchmark.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Most recent calendar week: {latestTrendWeek?.week || 'n/a'}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Breadth trend: {trendSummary.breadthTrend > 0 ? '+' : ''}{trendSummary.breadthTrend}%</span>
              </div>
            </div>

            <div className="mt-4 h-80">
              <ChartCanvas height={320}>
                {(chartWidth, chartHeight) => (
                  <ComposedChart width={chartWidth} height={chartHeight} data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="attendanceRate" name="Attendance %" stroke="#0f766e" strokeWidth={2} dot={{ r: 2 }} />
                    <Line yAxisId="right" type="monotone" dataKey="activeStudentRate" name="Active Student %" stroke="#557170" strokeWidth={2} dot={{ r: 2 }} />
                    <Line yAxisId="left" type="monotone" dataKey="attendanceBenchmark" name="Attendance Benchmark" stroke="#94a3b8" strokeDasharray="5 5" strokeOpacity={0.55} strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="breadthBenchmark" name="Breadth Benchmark" stroke="#cbd5e1" strokeDasharray="5 5" strokeOpacity={0.75} strokeWidth={2} dot={false} />
                    {weeklyTrends.map((week) => {
                      const markerText = Array.isArray(week.eventTags) ? week.eventTags.slice(0, 2).join(' / ') : '';
                      if (!markerText) return null;
                      return (
                        <ReferenceLine
                          key={week.weekKey}
                          x={week.week}
                          stroke="#cbd5e1"
                          strokeDasharray="3 3"
                          ifOverflow="extendDomain"
                          label={{ value: markerText, position: 'top', fill: '#64748b', fontSize: 10 }}
                        />
                      );
                    })}
                  </ComposedChart>
                )}
              </ChartCanvas>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Signal Pulse</h3>
                <p className="text-xs text-slate-500">Shows when interactions happen in the selected calendar week bucket, scaled to that week's longest bundled session timeline.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600">
                {weeklyTrends.length > 1 ? (
                  <select
                    value={selectedTrendPulseWeek?.weekKey || ''}
                    onChange={(event) => setSelectedTrendPulseWeekKey(event.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700"
                    aria-label="Signal pulse week selector"
                  >
                    {weeklyTrends.map((week) => (
                      <option key={week.weekKey} value={week.weekKey}>
                        Week of {week.week}
                      </option>
                    ))}
                  </select>
                ) : null}
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">{selectedTrendPulseWeek?.week || 'n/a'}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">5-minute bins</span>
              </div>
            </div>

            {trendPulseData.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No pulse data in the selected range.</p>
            ) : (
              <div className="mt-4 h-64">
                <ChartCanvas height={256}>
                  {(chartWidth, chartHeight) => (
                    <AreaChart width={chartWidth} height={chartHeight} data={trendPulseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="activity" name="Activity Pulse" stroke="#557170" fill="#dce7e6" fillOpacity={0.7} />
                      <Line type="monotone" dataKey="chat" name="Chat" stroke="#557170" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="reaction" name="Reactions" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="handRaise" name="Hand Raises" stroke="#16a34a" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="micToggle" name="Mic Toggles" stroke="#3a5050" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  )}
                </ChartCanvas>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Engagement Quadrant</h3>
            <p className="text-xs text-slate-500">Weekly states are based on attendance versus active breadth in the selected range.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.35fr]">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'Vibrant', title: 'Vibrant', hint: 'High Attendance + High Breadth', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                  { key: 'Spectator', title: 'Spectator', hint: 'High Attendance + Low Breadth', tone: 'border-amber-200 bg-amber-50 text-amber-700' },
                  { key: 'Fragmented', title: 'Fragmented', hint: 'Low Attendance + High Breadth', tone: 'border-accent-200 bg-accent-50 text-accent-700' },
                  { key: 'Disengaged', title: 'Disengaged', hint: 'Low Attendance + Low Breadth', tone: 'border-rose-200 bg-rose-50 text-rose-700' },
                ].map((cell) => (
                  <div
                    key={cell.key}
                    className={`rounded-xl border p-3 ${cell.tone} ${trendQuadrants.latest === cell.key ? 'ring-2 ring-slate-900/10' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{cell.title}</p>
                      <span className="text-xs font-bold">{trendQuadrants.counts[cell.key]}</span>
                    </div>
                    <p className="mt-1 text-[11px] opacity-80">{cell.hint}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Most Recent Week Health</p>
                <p className="mt-1 text-xs text-slate-500">{latestTrendWeek?.week || 'No week selected'} · {trendQuadrants.latest}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Attendance</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{latestTrendWeek ? `${latestTrendWeek.attendanceRate}%` : '-'}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Breadth</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{latestTrendWeek ? `${latestTrendWeek.activeStudentRate}%` : '-'}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">Breadth reflects the percentage of students who sent at least one signal in the week.</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">The Climbers & Sliders</h3>
                <p className="text-xs text-slate-500">Students with the biggest week-over-week change in signal intensity.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                Based on the last 7 days vs the previous 7 days
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="text-sm font-semibold text-emerald-800">Climbers</h4>
                <div className="mt-3 space-y-2">
                  {trendMovers.climbers.length === 0 ? (
                    <p className="text-sm text-emerald-700/80">No clear improvers in this range.</p>
                  ) : trendMovers.climbers.map((student) => (
                    <div key={student.id} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm">
                      <span className="font-medium text-slate-900">{student.name}</span>
                      <span className="font-semibold text-emerald-700">+{student.delta}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <h4 className="text-sm font-semibold text-rose-800">Sliders</h4>
                <div className="mt-3 space-y-2">
                  {trendMovers.sliders.length === 0 ? (
                    <p className="text-sm text-rose-700/80">No clear declines in this range.</p>
                  ) : trendMovers.sliders.map((student) => (
                    <div key={student.id} className="flex items-center justify-between rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm">
                      <span className="font-medium text-slate-900">{student.name}</span>
                      <span className="font-semibold text-rose-700">{student.delta}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {bundledSessionRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-base font-semibold text-slate-900">No analytics data in this range</p>
          <p className="mt-2 text-sm text-slate-600">Try widening the date range or ensure sessions have ended with saved attendance.</p>
        </div>
      ) : null}
    </div>
  );
};

export default ClassAnalytics;