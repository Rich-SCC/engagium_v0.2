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
  ChatBubbleLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon,
  HeartIcon,
  MicrophoneIcon,
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

const fetchAllParticipationLogs = async (sessionId) => {
  const limit = 500;
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
};

const fetchSessionParticipation = async (session) => {
  const logs = await fetchAllParticipationLogs(session.id);

  return {
    sessionId: session.id,
    session,
    ...aggregateSessionLogs(logs),
  };
};

const fetchSessionAttendance = async (session) => {
  const response = await sessionsAPI.getAttendanceWithIntervals(session.id);
  const payload = response?.data || response;
  const attendance = payload?.data?.attendance || payload?.attendance || [];

  return {
    sessionId: session.id,
    attendance,
  };
};

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

const percentileScore = (value, values, higherIsBetter = true) => {
  const clean = values.map((item) => toNumber(item)).sort((a, b) => a - b);
  if (clean.length === 0) return 0;

  const lessOrEqual = clean.filter((item) => item <= toNumber(value)).length;
  const basePercentile = round((lessOrEqual / clean.length) * 100, 0);
  return higherIsBetter ? basePercentile : 100 - basePercentile;
};

const percentileLabel = (value) => {
  if (value >= 90) return 'Top 10%';
  if (value >= 75) return 'Top 25%';
  if (value >= 45) return 'Average';
  return 'Needs support';
};

const ClassAnalytics = ({ classId, onSelectStudent }) => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [profiledStudentId, setProfiledStudentId] = useState(null);

  const handleQuickSelect = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['classAnalytics', classId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () =>
      classesAPI.getClassAnalytics(classId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    enabled: !!classId,
  });

  const analytics = analyticsData?.data;
  const sessionTrends = analytics?.sessionTrends || [];
  const scheduleBundles = analytics?.scheduleBundles || [];
  const studentPerformance = analytics?.studentPerformance || [];

  const sessionIds = useMemo(() => sessionTrends.map((session) => session.id).filter(Boolean), [sessionTrends]);

  const { data: participationSnapshots = [], isLoading: participationLoading } = useQuery({
    queryKey: ['classParticipationAnalytics', classId, startDate.toISOString(), endDate.toISOString(), sessionIds.join('|')],
    queryFn: async () => Promise.all(sessionTrends.map(fetchSessionParticipation)),
    enabled: !!classId && sessionTrends.length > 0,
  });

  const { data: attendanceSnapshots = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['classAttendanceAnalytics', classId, startDate.toISOString(), endDate.toISOString(), sessionIds.join('|')],
    queryFn: async () => Promise.all(sessionTrends.map(fetchSessionAttendance)),
    enabled: !!classId && sessionTrends.length > 0,
  });

  const participationSummary = useMemo(() => mergeParticipationSnapshots(participationSnapshots), [participationSnapshots]);

  const sessionSnapshotById = useMemo(
    () => new Map(participationSummary.sessions.map((snapshot) => [snapshot.sessionId, snapshot])),
    [participationSummary.sessions]
  );

  const studentParticipationById = useMemo(
    () => new Map(participationSummary.students.map((student) => [student.student_id, student])),
    [participationSummary.students]
  );

  const attendanceBySessionId = useMemo(
    () => new Map(attendanceSnapshots.map((snapshot) => [snapshot.sessionId, snapshot.attendance || []])),
    [attendanceSnapshots]
  );

  const enrichedStudents = useMemo(() => {
    const classAverages = {
      avgDurationMinutes:
        studentPerformance.length > 0
          ? studentPerformance.reduce((sum, student) => sum + toNumber(student.avg_duration_minutes), 0) / studentPerformance.length
          : 0,
    };

    const merged = studentPerformance.map((student) => {
      const participation = studentParticipationById.get(student.id) || {
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
  }, [studentPerformance, studentParticipationById]);

  const classAverages = useMemo(
    () => ({
      totalSessions: sessionTrends.length,
      avgAttendanceRate: toNumber(analytics?.overallStats?.avgAttendanceRate),
      avgDuration: toNumber(analytics?.overallStats?.avgDuration),
    }),
    [analytics?.overallStats, sessionTrends.length]
  );

  const classEngagement = useMemo(() => {
    if (enrichedStudents.length === 0) {
      return 0;
    }

    return round(
      enrichedStudents.reduce((sum, student) => sum + toNumber(student.engagement_score), 0) / enrichedStudents.length,
      1
    );
  }, [enrichedStudents]);

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
    if (!selectedSessionId && enrichedSessions.length > 0) {
      setSelectedSessionId(enrichedSessions[enrichedSessions.length - 1].id);
    }
  }, [enrichedSessions, selectedSessionId]);

  useEffect(() => {
    if (!profiledStudentId && enrichedStudents.length > 0) {
      setProfiledStudentId(enrichedStudents[0].id);
    }
  }, [enrichedStudents, profiledStudentId]);

  const selectedSession = useMemo(
    () => enrichedSessions.find((session) => session.id === selectedSessionId) || null,
    [enrichedSessions, selectedSessionId]
  );

  const chartSessions = useMemo(
    () =>
      enrichedSessions.map((session) => ({
        date: resolveSessionDate(session)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Unknown',
        attendanceRate: toNumber(session.attendance_rate),
        avgDuration: toNumber(session.avg_duration_minutes),
        normalizedAttendance: toNumber(session.normalized_attendance_pct),
        pulseScore: toNumber(session.pulse_engagement_score),
      })),
    [enrichedSessions]
  );

  const { data: selectedSessionLogs = [] } = useQuery({
    queryKey: ['selectedSessionLogs', classId, selectedSessionId],
    queryFn: async () => fetchAllParticipationLogs(selectedSessionId),
    enabled: !!classId && !!selectedSessionId,
  });

  const selectedAttendanceRows = useMemo(
    () => attendanceBySessionId.get(selectedSessionId) || [],
    [attendanceBySessionId, selectedSessionId]
  );

  const selectedBundle = useMemo(
    () => bundleBySessionId.get(selectedSessionId) || null,
    [bundleBySessionId, selectedSessionId]
  );

  const pulseWindow = useMemo(() => {
    if (!selectedSession) return null;

    const fallbackStart = resolveSessionDate(selectedSession);
    const fallbackEnd = resolveSessionEnd(selectedSession);
    const coreStart = selectedBundle?.planned_start_at ? new Date(selectedBundle.planned_start_at) : fallbackStart;
    const coreEnd = selectedBundle?.planned_end_at ? new Date(selectedBundle.planned_end_at) : fallbackEnd;

    if (!coreStart || !coreEnd || Number.isNaN(coreStart.getTime()) || Number.isNaN(coreEnd.getTime())) {
      return null;
    }

    const sessions = [...(selectedBundle?.sessions || [])].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
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
  }, [selectedSession, selectedBundle]);

  const synchronizedTimeline = useMemo(() => {
    if (!selectedSession || !pulseWindow) return [];

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
  }, [selectedSession, selectedSessionLogs, pulseWindow]);

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
    selectedSessionLogs.forEach((log) => {
      if (log?.interaction_type !== 'reaction') return;
      const studentId = log?.student_id;
      if (!studentId) return;
      const reaction = log?.additional_data?.reaction || log?.interaction_value || log?.reaction || 'reaction';
      if (!map.has(studentId)) map.set(studentId, new Set());
      map.get(studentId).add(String(reaction));
    });
    return map;
  }, [selectedSessionLogs]);

  const firstResponseLatencyByStudent = useMemo(() => {
    if (!pulseWindow) return new Map();

    const firstByStudent = new Map();
    selectedSessionLogs.forEach((log) => {
      const studentId = log?.student_id;
      const ts = log?.timestamp ? new Date(log.timestamp) : null;
      if (!studentId || !ts || Number.isNaN(ts.getTime()) || ts < pulseWindow.start) return;

      const existing = firstByStudent.get(studentId);
      if (!existing || ts < existing) {
        firstByStudent.set(studentId, ts);
      }
    });

    const latencyMap = new Map();
    firstByStudent.forEach((timestamp, studentId) => {
      latencyMap.set(studentId, Math.max(0, Math.round(diffMinutes(timestamp, pulseWindow.start) * 60)));
    });
    return latencyMap;
  }, [selectedSessionLogs, pulseWindow]);

  const profiledStudent = useMemo(
    () => enrichedStudents.find((student) => student.id === profiledStudentId) || null,
    [enrichedStudents, profiledStudentId]
  );

  const profileRadarData = useMemo(() => {
    if (!profiledStudent) return [];

    const maxChat = Math.max(1, ...enrichedStudents.map((item) => toNumber(item.chat_messages)));
    const maxSpeak = Math.max(1, ...enrichedStudents.map((item) => toNumber(item.speaking_proxy_minutes)));
    const maxHandRaise = Math.max(1, ...enrichedStudents.map((item) => toNumber(item.hand_raises)));
    const diversityValues = enrichedStudents.map((item) => reactionDiversityByStudent.get(item.id)?.size || 0);
    const maxDiversity = Math.max(1, ...diversityValues);

    return [
      { axis: 'Attendance', value: toNumber(profiledStudent.attendance_rate) },
      { axis: 'Mic Usage', value: round((toNumber(profiledStudent.speaking_proxy_minutes) / maxSpeak) * 100, 1) },
      { axis: 'Chat Frequency', value: round((toNumber(profiledStudent.chat_messages) / maxChat) * 100, 1) },
      {
        axis: 'Reaction Diversity',
        value: round(((reactionDiversityByStudent.get(profiledStudent.id)?.size || 0) / maxDiversity) * 100, 1),
      },
      { axis: 'Hand Raises', value: round((toNumber(profiledStudent.hand_raises) / maxHandRaise) * 100, 1) },
    ];
  }, [profiledStudent, enrichedStudents, reactionDiversityByStudent]);

  const resilienceByStudent = useMemo(() => {
    const map = new Map();
    if (!pulseWindow || pulseWindow.breakSegments.length === 0) {
      return map;
    }

    const meaningfulBreaks = pulseWindow.breakSegments.filter(
      (segment) => diffMinutes(segment.end, segment.start) >= 20
    );

    if (meaningfulBreaks.length === 0) return map;

    presenceRows.forEach((row) => {
      const resilient = meaningfulBreaks.some((breakSegment) => {
        const before = row.intervals.some((segment) => segment.start < breakSegment.start);
        const after = row.intervals.some((segment) => segment.end > breakSegment.end);
        return before && after;
      });
      map.set(row.studentId, resilient);
    });

    return map;
  }, [presenceRows, pulseWindow]);

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

  const profileRows = useMemo(() => {
    if (!profiledStudent) return [];

    const attendanceValues = enrichedStudents.map((student) => toNumber(student.attendance_rate));
    const micToggleDurations = enrichedStudents.map((student) => {
      const toggles = Math.max(1, toNumber(student.mic_toggles));
      return (toNumber(student.speaking_proxy_minutes) * 60) / toggles;
    });
    const latencyValues = lateJoinerData.map((item) => toNumber(item.avgLateMinutes));

    const studentMicSeconds = (toNumber(profiledStudent.speaking_proxy_minutes) * 60) / Math.max(1, toNumber(profiledStudent.mic_toggles));
    const studentLatencyMinutes = toNumber(
      lateJoinerData.find((item) => item.studentId === profiledStudent.id)?.avgLateMinutes,
      0
    );

    const selectedSessionLatencySeconds = toNumber(firstResponseLatencyByStudent.get(profiledStudent.id), 0);

    return [
      {
        metric: 'Attendance',
        value: `${toNumber(profiledStudent.attendance_rate)}%`,
        percentile: percentileLabel(percentileScore(toNumber(profiledStudent.attendance_rate), attendanceValues, true)),
      },
      {
        metric: 'Avg Mic Toggle',
        value: `${Math.round(studentMicSeconds)}s`,
        percentile: percentileLabel(percentileScore(studentMicSeconds, micToggleDurations, true)),
      },
      {
        metric: 'Response Latency',
        value: `${selectedSessionLatencySeconds}s (pulse) / ${studentLatencyMinutes}m (overall late-join)`,
        percentile: percentileLabel(percentileScore(studentLatencyMinutes, latencyValues, false)),
      },
      {
        metric: 'Fragment Resilience',
        value: resilienceByStudent.get(profiledStudent.id) ? 'Rejoined after gap' : 'No post-gap rejoin signal',
        percentile: resilienceByStudent.get(profiledStudent.id) ? 'High signal' : 'Watchlist',
      },
    ];
  }, [profiledStudent, enrichedStudents, lateJoinerData, resilienceByStudent, firstResponseLatencyByStudent]);

  const totalStudents = toNumber(analytics?.overallStats?.totalStudents) || studentPerformance.length;
  const participatingStudents = enrichedStudents.filter((student) => toNumber(student.total_interactions) > 0).length;
  const participationRate = totalStudents > 0 ? round((participatingStudents / totalStudents) * 100, 1) : 0;
  const totalInteractions = participationSummary.totals?.totalInteractions || 0;
  const totalSpeakingProxyMinutes = participationSummary.totals?.speakingProxyMinutes || 0;

  const hasData = enrichedSessions.length > 0;
  const hasBundleData = bundleRows.length > 0;
  const isBusy = isLoading || participationLoading || attendanceLoading;

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
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onQuickSelect={handleQuickSelect}
        />

        <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AcademicCapIcon className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Yet</h3>
          <p className="text-gray-500 text-center max-w-md mb-4">
            No sessions have been completed in this date range. Start or complete some sessions to see analytics here.
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
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onQuickSelect={handleQuickSelect}
      />

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-200">Normalization-First Analytics</p>
            <h2 className="text-2xl font-bold mt-1">Engagement and Consistency Storyline</h2>
            <p className="text-sm text-slate-200 mt-2">
              Core credit window = scheduled minutes - break gaps. Early arrivals are bonus, dead-time is excluded.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-200">Sessions</p>
              <p className="text-xl font-semibold">{classAverages.totalSessions}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-200">Participation</p>
              <p className="text-xl font-semibold">{participationRate}%</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-200">Interactions</p>
              <p className="text-xl font-semibold">{totalInteractions}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-200">Avg Engagement</p>
              <p className="text-xl font-semibold">{classEngagement}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-5 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{classAverages.totalSessions}</p>
            </div>
            <AcademicCapIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-md p-5 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-sm font-medium mb-1">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{classAverages.avgAttendanceRate}%</p>
            </div>
            <UserGroupIcon className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl shadow-md p-5 border border-violet-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-700 text-sm font-medium mb-1">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatMinutes(classAverages.avgDuration)}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-violet-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md p-5 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium mb-1">Participation Rate</p>
              <p className="text-2xl font-bold text-gray-900">{participationRate}%</p>
            </div>
            <SparklesIcon className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md p-5 border border-sky-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sky-700 text-sm font-medium mb-1">Total Interactions</p>
              <p className="text-2xl font-bold text-gray-900">{totalInteractions}</p>
            </div>
            <ChatBubbleLeftIcon className="w-8 h-8 text-sky-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-md p-5 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-700 text-sm font-medium mb-1">Speaking Proxy</p>
              <p className="text-2xl font-bold text-gray-900">{formatMinutes(totalSpeakingProxyMinutes)}</p>
            </div>
            <MicrophoneIcon className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">1. Per-Session Analytics: Class Pulse</h3>
            <p className="text-sm text-gray-600">Inspect synchronized activity, presence stability, and normalized core credit.</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="session-select" className="text-sm font-medium text-gray-700">Pulse Session</label>
            <select
              id="session-select"
              value={selectedSessionId || ''}
              onChange={(event) => setSelectedSessionId(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {enrichedSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {resolveSessionDate(session)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Unknown'} - {session.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Pulse Engagement Score</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{toNumber(selectedSession?.pulse_engagement_score)}</p>
            <p className="text-sm text-gray-500 mt-2">
              E = (Mic x {WEIGHTS.mic} + Reactions x {WEIGHTS.reaction} + Chat x {WEIGHTS.chat}) / Session Minutes
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Core Credit</p>
                <p className="font-semibold text-slate-900">{formatMinutes(selectedSession?.core_credit_minutes)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Normalized Attendance</p>
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
              <BoltIcon className="w-5 h-5 text-amber-500" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={synchronizedTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="chat" stackId="1" stroke={TIMELINE_COLORS.chat} fill={TIMELINE_COLORS.chat} name="Chat" />
                <Area type="monotone" dataKey="reaction" stackId="1" stroke={TIMELINE_COLORS.reaction} fill={TIMELINE_COLORS.reaction} name="Reactions" />
                <Area type="monotone" dataKey="handRaise" stackId="1" stroke={TIMELINE_COLORS.handRaise} fill={TIMELINE_COLORS.handRaise} name="Hand Raises" />
                <Area type="monotone" dataKey="micToggle" stackId="1" stroke={TIMELINE_COLORS.micToggle} fill={TIMELINE_COLORS.micToggle} name="Mic Toggles" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900">Presence Gantt</h4>
            <ClockIcon className="w-5 h-5 text-slate-500" />
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {presenceRows.length === 0 && (
              <p className="text-sm text-gray-500">No attendance interval data for the selected session.</p>
            )}
            {presenceRows.map((row) => (
              <div key={row.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => row.studentId && setProfiledStudentId(row.studentId)}
                    className="font-medium text-gray-800 hover:text-blue-700"
                  >
                    {row.name}
                  </button>
                  <span className="text-gray-500">{row.creditedPct}% credit</span>
                </div>
                <div className="relative h-5 rounded bg-slate-100 overflow-hidden">
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
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="text-xl font-semibold text-gray-900">2. Per-Student Analytics: Individual Profile</h3>
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
                {enrichedStudents.map((student) => (
                  <option key={student.id} value={student.id}>{student.full_name}</option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={profileRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.5} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            {profiledStudent && (
              <div className="text-sm text-gray-600 mt-2">
                {profiledStudent.full_name} - engagement score {profiledStudent.engagement_score}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">Micro-Behaviors Table</h4>
              <HeartIcon className="w-5 h-5 text-rose-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Metric</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Value</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Percentile (vs Class)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {profileRows.map((row) => (
                    <tr key={row.metric}>
                      <td className="px-3 py-3 font-medium text-gray-800">{row.metric}</td>
                      <td className="px-3 py-3 text-gray-700">{row.value}</td>
                      <td className="px-3 py-3 text-gray-700">{row.percentile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900 flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 mt-0.5" />
              <p>Fragment resilience checks whether a student returned after a 20+ minute schedule gap.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="text-xl font-semibold text-gray-900">3. Longitudinal Analytics: Growth and Burnout</h3>
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
                <XAxis type="number" dataKey="sessions" name="Sessions Observed" stroke="#6b7280" />
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
      </div>

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
              {[...enrichedStudents]
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

      {hasBundleData && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Core Credit Window Reporting</h3>
              <p className="text-sm text-gray-500">Scheduled windows, breaks, and overtime separated for fair normalization.</p>
            </div>
            <CalendarDaysIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule Day</th>
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

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Session Drilldown</h3>
          <HandRaisedIcon className="w-5 h-5 text-sky-600" />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartSessions}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="attendanceRate" stroke="#2563eb" strokeWidth={2} name="Attendance %" />
            <Line type="monotone" dataKey="normalizedAttendance" stroke="#16a34a" strokeWidth={2} name="Normalized %" />
            <Line type="monotone" dataKey="pulseScore" stroke="#f97316" strokeWidth={2} name="Pulse E" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ClassAnalytics;
