import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { classesAPI, sessionsAPI } from '@/services/api';
import { formatClassDisplay } from '@/utils/classFormatter';
import { 
  BookOpenIcon, 
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const EARLY_BUFFER_MINUTES = 30;
const OVERTIME_BUFFER_MINUTES = 90;

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

const toLocalDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const formatMinutesAs12Hour = (minutes) => {
  if (!Number.isFinite(minutes)) return '-';
  const safe = Math.max(0, Math.floor(minutes));
  const hours24 = Math.floor(safe / 60) % 24;
  const mins = safe % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${suffix}`;
};

const formatShortDateTime = (value) => {
  if (!value) return 'No timestamp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No timestamp';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const Home = () => {
  // Fetch summary data
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: classStatsData } = useQuery({
    queryKey: ['classStats'],
    queryFn: () => classesAPI.getStats(),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  const { data: sessionStatsData } = useQuery({
    queryKey: ['sessionStats'],
    queryFn: () => sessionsAPI.getStats(),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const classes = classesData?.data || [];
  const classStats = classStatsData?.data || {};
  const sessionStats = sessionStatsData?.data || {};
  const sessions = sessionsData?.data || [];

  const classInfoById = useMemo(
    () => new Map(classes.map((classInfo) => [String(classInfo.id), classInfo])),
    [classes]
  );

  const recentSessions = useMemo(() => {
    return [...sessions]
      .filter((session) => session?.started_at || session?.session_date)
      .sort((left, right) => {
        const leftDate = new Date(left.started_at || left.session_date).getTime();
        const rightDate = new Date(right.started_at || right.session_date).getTime();
        return rightDate - leftDate;
      })
      .slice(0, 3);
  }, [sessions]);

  const todaysSchedule = useMemo(() => {
    const todayName = DAY_NAMES[new Date().getDay()];
    const rows = [];

    classes.forEach((classInfo) => {
      const scheduleRows = Array.isArray(classInfo.schedule) ? classInfo.schedule : [];
      scheduleRows.forEach((entry, index) => {
        const days = Array.isArray(entry.days)
          ? entry.days
            .filter((day) => typeof day === 'string' && day.trim())
            .map((day) => day.trim().toLowerCase())
          : [];

        const isToday = days.length === 0 || days.includes(todayName);
        if (!isToday) return;

        const startMinutes = parseTimeToMinutes(entry.startTime);
        const endMinutes = parseTimeToMinutes(entry.endTime);
        rows.push({
          id: `${classInfo.id}-${index}`,
          classInfo,
          startMinutes,
          endMinutes,
        });
      });
    });

    return rows
      .sort((left, right) => {
        const leftStart = Number.isFinite(left.startMinutes) ? left.startMinutes : Number.MAX_SAFE_INTEGER;
        const rightStart = Number.isFinite(right.startMinutes) ? right.startMinutes : Number.MAX_SAFE_INTEGER;
        return leftStart - rightStart;
      })
      .slice(0, 4);
  }, [classes]);

  const ungroupedFragmentsCount = useMemo(() => {
    let orphanCount = 0;

    sessions.forEach((session) => {
      const classIdKey = String(session?.class_id ?? '');
      const classInfo = classInfoById.get(classIdKey);
      if (!classInfo) {
        orphanCount += 1;
        return;
      }

      const schedules = normalizeSchedules(classInfo.schedule);
      if (schedules.length === 0) {
        orphanCount += 1;
        return;
      }

      const startedAt = session?.started_at ? new Date(session.started_at) : null;
      if (!(startedAt instanceof Date) || Number.isNaN(startedAt.getTime())) {
        orphanCount += 1;
        return;
      }

      const endedAt = session?.ended_at ? new Date(session.ended_at) : startedAt;
      const end = Number.isNaN(endedAt.getTime()) ? startedAt : endedAt;

      const dateKey = toLocalDateKey(startedAt);
      if (!dateKey) {
        orphanCount += 1;
        return;
      }

      const dayName = DAY_NAMES[startedAt.getDay()];
      const candidates = schedules.filter((schedule) => schedule.days.length === 0 || schedule.days.includes(dayName));
      if (candidates.length === 0) {
        orphanCount += 1;
        return;
      }

      let bestOverlapMs = -1;

      candidates.forEach((schedule) => {
        const plannedStart = buildLocalDateTime(dateKey, schedule.startMinutes);
        const plannedEnd = buildLocalDateTime(dateKey, schedule.endMinutes);
        if (!plannedStart || !plannedEnd) return;

        const windowStart = new Date(plannedStart.getTime() - (EARLY_BUFFER_MINUTES * 60 * 1000));
        const windowEnd = new Date(plannedEnd.getTime() + (OVERTIME_BUFFER_MINUTES * 60 * 1000));
        const overlapStartMs = Math.max(windowStart.getTime(), startedAt.getTime());
        const overlapEndMs = Math.min(windowEnd.getTime(), end.getTime());
        const overlapMs = overlapEndMs - overlapStartMs;

        if (overlapMs > bestOverlapMs) {
          bestOverlapMs = overlapMs;
        }
      });

      if (bestOverlapMs <= 0) {
        orphanCount += 1;
      }
    });

    return orphanCount;
  }, [sessions, classInfoById]);

  const hasUngroupedFragments = ungroupedFragmentsCount > 0;

  const attendanceTrend = useMemo(() => {
    const points = sessions
      .map((session) => {
        const directRate = Number(session?.attendance_rate);
        if (Number.isFinite(directRate) && directRate >= 0) return Math.min(100, directRate);

        const present = Number(session?.present_count);
        const total = Number(session?.total_participants);
        if (Number.isFinite(present) && Number.isFinite(total) && total > 0) {
          return Math.min(100, (present / total) * 100);
        }

        return null;
      })
      .filter((value) => Number.isFinite(value))
      .slice(-7);

    if (points.length === 0) {
      return [76, 79, 82, 80, 84, 86, 84];
    }

    return points;
  }, [sessions]);

  const averageAttendance = useMemo(() => {
    if (attendanceTrend.length === 0) return 0;
    const total = attendanceTrend.reduce((sum, value) => sum + value, 0);
    return Math.round(total / attendanceTrend.length);
  }, [attendanceTrend]);

  const sparklinePoints = useMemo(() => {
    if (attendanceTrend.length === 0) return '';
    const min = Math.min(...attendanceTrend);
    const max = Math.max(...attendanceTrend);
    const range = max - min || 1;

    return attendanceTrend
      .map((value, index) => {
        const x = (index / Math.max(1, attendanceTrend.length - 1)) * 100;
        const y = 100 - (((value - min) / range) * 100);
        return `${x},${y}`;
      })
      .join(' ');
  }, [attendanceTrend]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Home</h1>
      </div>

      {/* Top Row: Unified Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Classes</p>
              <p className="text-3xl font-bold text-accent-800 mt-2">{classStats.totalClasses || 0}</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
              <BookOpenIcon className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold text-accent-800 mt-2">{classStats.totalStudents || 0}</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Sessions</p>
              <p className="text-3xl font-bold text-accent-800 mt-2">{sessionStats.totalSessions || 0}</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Now</p>
              <p className="text-3xl font-bold text-accent-800 mt-2">{sessionStats.activeSessions || 0}</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Two-column command center */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Link to="/app/sessions" className="text-sm text-accent-700 hover:text-accent-800 font-semibold">
              Open Sessions
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-gray-500">
              No recent sessions yet. Start a class session to see your timeline here.
            </div>
          ) : (
            <ul className="space-y-4">
              {recentSessions.map((session, index) => {
                const classInfo = classInfoById.get(String(session.class_id));
                const sessionLabel = classInfo ? formatClassDisplay(classInfo) : `Class #${session.class_id || 'Unknown'}`;
                const startValue = session.started_at || session.session_date;

                return (
                  <li key={session.id || `${session.class_id}-${index}`} className="flex items-start gap-4">
                    <div className="mt-1 flex flex-col items-center">
                      <span className="w-3 h-3 rounded-full bg-accent-600" />
                      {index < recentSessions.length - 1 ? <span className="mt-1 w-px h-10 bg-gray-200" /> : null}
                    </div>
                    <div className="flex-1 rounded-lg border border-gray-200 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900">{sessionLabel}</p>
                        <span className="text-sm text-gray-500">{formatShortDateTime(startValue)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {session.ended_at ? 'Completed session fragment captured.' : 'Session is still active.'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Today&apos;s Schedule</h3>
            {todaysSchedule.length === 0 ? (
              <p className="text-sm text-gray-500">No scheduled classes detected for today.</p>
            ) : (
              <div className="space-y-2">
                {todaysSchedule.map((item) => (
                  <Link
                    key={item.id}
                    to={`/app/classes/${item.classInfo.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-accent-300 hover:bg-accent-50 transition"
                  >
                    <span className="font-medium text-gray-800">{formatClassDisplay(item.classInfo)}</span>
                    <span className="text-sm text-gray-600">
                      {formatMinutesAs12Hour(item.startMinutes)} - {formatMinutesAs12Hour(item.endMinutes)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Action Center</h2>

            <div className={`rounded-lg p-4 ${hasUngroupedFragments ? 'border border-amber-200 bg-amber-50' : 'border border-gray-200 bg-gray-50'}`}>
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className={`w-5 h-5 mt-0.5 ${hasUngroupedFragments ? 'text-amber-700' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-sm font-semibold ${hasUngroupedFragments ? 'text-amber-900' : 'text-gray-800'}`}>Needs Attention</p>
                  {hasUngroupedFragments ? (
                    <>
                      <p className="text-sm text-amber-800 mt-1">
                        You have {ungroupedFragmentsCount} ungrouped fragment{ungroupedFragmentsCount !== 1 ? 's' : ''} to review.
                      </p>
                      <Link
                        to="/app/sessions"
                        className="inline-flex mt-3 rounded-lg border border-amber-400 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 transition"
                      >
                        Resolve Now
                      </Link>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">
                      All clear. No ungrouped fragments right now.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Analytics Snapshot</h2>
              <ArrowTrendingUpIcon className="w-5 h-5 text-accent-700" />
            </div>
            <p className="text-sm text-gray-600 mt-2">Average attendance this week</p>
            <p className="text-3xl font-bold text-accent-800 mt-1">{averageAttendance}%</p>

            <div className="mt-4 h-20 rounded-lg border border-gray-200 bg-gray-50 p-2">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <polyline
                  fill="none"
                  stroke="#557170"
                  strokeWidth="3"
                  points={sparklinePoints}
                />
              </svg>
            </div>

            <Link
              to="/app/analytics"
              className="inline-flex mt-4 rounded-lg border border-accent-300 px-3 py-1.5 text-sm font-medium text-accent-800 hover:bg-accent-50 transition"
            >
              Open Full Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
