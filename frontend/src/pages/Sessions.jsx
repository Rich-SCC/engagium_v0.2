import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sessionsAPI, classesAPI } from '@/services/api';
import { formatClassDisplay } from '@/utils/classFormatter';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import SessionCalendarView from '@/components/Sessions/SessionCalendarView';

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

const diffMinutes = (end, start) => {
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return 0;
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
};

const formatMinutesAsTime = (minutes) => {
  if (!Number.isFinite(minutes)) return null;
  const safe = Math.max(0, Math.floor(minutes));
  const hour = String(Math.floor(safe / 60)).padStart(2, '0');
  const minute = String(safe % 60).padStart(2, '0');
  return `${hour}:${minute}`;
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

const Sessions = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [listMode, setListMode] = useState('bundled'); // 'raw' or 'bundled'
  const [expandedBundleIds, setExpandedBundleIds] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ['sessions-calendar', currentYear, currentMonth],
    queryFn: () => sessionsAPI.getCalendarData(currentYear, currentMonth),
    enabled: viewMode === 'calendar',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const sessions = sessionsData?.data || [];
  const calendarSessions = calendarData?.data || [];
  const classes = classesData?.data || [];
  const classInfoById = new Map(classes.map((classInfo) => [String(classInfo.id), classInfo]));

  const bundledComputation = useMemo(() => {
    const debug = {
      totalSessions: Array.isArray(sessions) ? sessions.length : 0,
      totalClasses: Array.isArray(classes) ? classes.length : 0,
      classMapSize: classInfoById.size,
      skippedMissingClass: 0,
      skippedNoSchedule: 0,
      skippedInvalidStartedAt: 0,
      skippedNoDayMatch: 0,
      skippedLowOverlap: 0,
      acceptedSessions: 0,
      sampleSkippedSessionIds: [],
      sampleAcceptedSessionIds: [],
    };
    const orphans = [];

    const rememberSkipped = (sessionId, reason, session, classInfo) => {
      if (debug.sampleSkippedSessionIds.length < 20) {
        debug.sampleSkippedSessionIds.push(sessionId);
      }

      orphans.push({
        session,
        classInfo,
        reason,
      });
    };

    const rememberAccepted = (sessionId) => {
      if (debug.sampleAcceptedSessionIds.length < 20) {
        debug.sampleAcceptedSessionIds.push(sessionId);
      }
    };

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return {
        rows: [],
        debug,
        orphans,
      };
    }

    const bundles = new Map();

    sessions.forEach((session) => {
      const classIdKey = String(session?.class_id ?? '');
      const classInfo = classInfoById.get(classIdKey);
      if (!classInfo) {
        debug.skippedMissingClass += 1;
        rememberSkipped(session?.id, 'Class record not found for this fragment', session, null);
        return;
      }

      const schedules = normalizeSchedules(classInfo.schedule);
      if (schedules.length === 0) {
        debug.skippedNoSchedule += 1;
        rememberSkipped(session?.id, 'Class has no valid session window configured', session, classInfo);
        return;
      }

      const startedAt = session?.started_at ? new Date(session.started_at) : null;
      if (!(startedAt instanceof Date) || Number.isNaN(startedAt.getTime())) {
        debug.skippedInvalidStartedAt += 1;
        rememberSkipped(session?.id, 'Fragment started_at is missing or invalid', session, classInfo);
        return;
      }

      const endedAt = session?.ended_at ? new Date(session.ended_at) : startedAt;
      const end = Number.isNaN(endedAt.getTime()) ? startedAt : endedAt;

      const dateKey = toLocalDateKey(startedAt);
      if (!dateKey) {
        debug.skippedInvalidStartedAt += 1;
        rememberSkipped(session?.id, 'Fragment date key could not be derived', session, classInfo);
        return;
      }

      const dayName = DAY_NAMES[startedAt.getDay()];
      const candidates = schedules.filter((schedule) => schedule.days.length === 0 || schedule.days.includes(dayName));
      if (candidates.length === 0) {
        debug.skippedNoDayMatch += 1;
        rememberSkipped(session?.id, 'No class session window matches this fragment day', session, classInfo);
        return;
      }

      let bestSchedule = null;
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
          bestSchedule = schedule;
        }
      });

      if (!bestSchedule || bestOverlapMs <= 0) {
        debug.skippedLowOverlap += 1;
        rememberSkipped(session?.id, 'Fragment does not intersect any session window', session, classInfo);
        return;
      }

      debug.acceptedSessions += 1;
      rememberAccepted(session?.id);

      const bundleKey = `${classIdKey}::${dateKey}::${bestSchedule.index}`;
      const plannedStart = buildLocalDateTime(dateKey, bestSchedule.startMinutes);
      const plannedEnd = buildLocalDateTime(dateKey, bestSchedule.endMinutes);

      if (!bundles.has(bundleKey)) {
        bundles.set(bundleKey, {
          bundle_id: bundleKey,
          date: dateKey,
          schedule_index: bestSchedule.index,
          planned_start_time: formatMinutesAsTime(bestSchedule.startMinutes),
          planned_end_time: formatMinutesAsTime(bestSchedule.endMinutes),
          planned_start_at: plannedStart?.toISOString() || null,
          planned_end_at: plannedEnd?.toISOString() || null,
          session_count: 0,
          session_ids: [],
          sessions: [],
          total_participants: 0,
          present_count: 0,
          attendance_rate: 0,
          actual_first_start_at: null,
          actual_last_end_at: null,
          early_start_minutes: 0,
          overtime_minutes: 0,
          break_minutes: 0,
          classInfo,
        });
      }

      const bundle = bundles.get(bundleKey);
      bundle.session_count += 1;
      bundle.session_ids.push(session.id);
      bundle.sessions.push({
        id: session.id,
        status: session.status,
        start_at: startedAt.toISOString(),
        end_at: end.toISOString(),
        total_participants: Number.parseInt(session.total_participants || 0, 10) || 0,
        present_count: Number.parseInt(session.present_count || 0, 10) || 0,
      });
      bundle.total_participants += Number.parseInt(session.total_participants || 0, 10) || 0;
      bundle.present_count += Number.parseInt(session.present_count || 0, 10) || 0;
    });

    const rows = Array.from(bundles.values())
      .map((bundle) => {
        const sorted = [...bundle.sessions].sort((left, right) => new Date(left.start_at).getTime() - new Date(right.start_at).getTime());
        if (sorted.length > 0) {
          bundle.actual_first_start_at = sorted[0].start_at;
          bundle.actual_last_end_at = sorted[sorted.length - 1].end_at;
        }

        const plannedStart = bundle.planned_start_at ? new Date(bundle.planned_start_at) : null;
        const plannedEnd = bundle.planned_end_at ? new Date(bundle.planned_end_at) : null;
        const actualStart = bundle.actual_first_start_at ? new Date(bundle.actual_first_start_at) : null;
        const actualEnd = bundle.actual_last_end_at ? new Date(bundle.actual_last_end_at) : null;

        bundle.early_start_minutes = plannedStart && actualStart ? diffMinutes(plannedStart, actualStart) : 0;
        bundle.overtime_minutes = plannedEnd && actualEnd ? diffMinutes(actualEnd, plannedEnd) : 0;

        let breakMinutes = 0;
        for (let index = 1; index < sorted.length; index += 1) {
          breakMinutes += diffMinutes(new Date(sorted[index].start_at), new Date(sorted[index - 1].end_at));
        }
        bundle.break_minutes = breakMinutes;
        bundle.attendance_rate = bundle.total_participants > 0
          ? Number(((bundle.present_count / bundle.total_participants) * 100).toFixed(2))
          : 0;

        return bundle;
      })
      .sort((left, right) => {
        const leftDate = new Date(left.date);
        const rightDate = new Date(right.date);
        const dateDiff = leftDate.getTime() - rightDate.getTime();
        if (dateDiff !== 0) return dateDiff;
        return (left.schedule_index || 0) - (right.schedule_index || 0);
      });

    debug.bundleCount = rows.length;
    return {
      rows,
      debug,
      orphans,
    };
  }, [sessions, classes, classInfoById]);

  const bundledRows = bundledComputation.rows;
  const bundleDebug = bundledComputation.debug;
  const orphanRows = bundledComputation.orphans || [];

  useEffect(() => {
    setExpandedBundleIds((previous) => {
      const validIds = new Set(bundledRows.map((bundle) => bundle.bundle_id));
      return previous.filter((id) => validIds.has(id));
    });
  }, [bundledRows]);

  useEffect(() => {
    if (viewMode !== 'list' || listMode !== 'bundled') return;

    console.group('[Sessions Bundling Debug]');
    console.log('Summary:', {
      totalSessions: bundleDebug.totalSessions,
      totalClasses: bundleDebug.totalClasses,
      classMapSize: bundleDebug.classMapSize,
      bundleCount: bundleDebug.bundleCount || 0,
      acceptedSessions: bundleDebug.acceptedSessions,
    });
    console.log('Skipped reasons:', {
      missingClass: bundleDebug.skippedMissingClass,
      noSchedule: bundleDebug.skippedNoSchedule,
      invalidStartedAt: bundleDebug.skippedInvalidStartedAt,
      noDayMatch: bundleDebug.skippedNoDayMatch,
      lowOverlap: bundleDebug.skippedLowOverlap,
    });
    console.log('Sample accepted session IDs:', bundleDebug.sampleAcceptedSessionIds);
    console.log('Sample skipped session IDs:', bundleDebug.sampleSkippedSessionIds);
    console.groupEnd();
  }, [viewMode, listMode, bundleDebug]);

  const bundlesLoading = listMode === 'bundled' && (isLoading || !classesData);

  const toggleBundleRow = (bundleId) => {
    setExpandedBundleIds((previous) => (
      previous.includes(bundleId)
        ? previous.filter((id) => id !== bundleId)
        : [...previous, bundleId]
    ));
  };

  const expandAllBundles = () => {
    setExpandedBundleIds(bundledRows.map((bundle) => bundle.bundle_id));
  };

  const collapseAllBundles = () => {
    setExpandedBundleIds([]);
  };

  const formatSessionTime = (session) => {
    // Format: "Dec 8 • 7:35 PM - 8:20 PM"
    if (session.started_at) {
      const startDate = new Date(session.started_at);
      const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      
      if (session.ended_at) {
        const endDate = new Date(session.ended_at);
        const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${dateStr} • ${startTime} - ${endTime}`;
      }
      
      return `${dateStr} • ${startTime} - In Progress`;
    }
    
    // Fallback for scheduled sessions
    if (session.session_date) {
      const date = new Date(session.session_date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (session.session_time) {
        const timeStr = session.session_time.substring(0, 5);
        return `${dateStr} • ${timeStr}`;
      }
      return dateStr;
    }
    
    return 'N/A';
  };

  const formatTimeLabel = (timeText) => {
    if (!timeText || typeof timeText !== 'string') return '-';
    const normalized = timeText.slice(0, 5);
    if (!/^\d{2}:\d{2}$/.test(normalized)) return normalized;

    const [hoursText, minutesText] = normalized.split(':');
    const hours = Number.parseInt(hoursText, 10);
    const minutes = Number.parseInt(minutesText, 10);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
      return normalized;
    }

    const asDate = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
    return asDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
  };

  const formatDateTimeLabel = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatFragmentWindow = (startValue, endValue) => {
    if (!startValue) return '-';
    const start = new Date(startValue);
    if (Number.isNaN(start.getTime())) return '-';

    const startLabel = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (!endValue) return `${startLabel} - In Progress`;
    const end = new Date(endValue);
    if (Number.isNaN(end.getTime())) return `${startLabel} - In Progress`;

    const endLabel = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${startLabel} - ${endLabel}`;
  };

  const handleMonthChange = (year, month) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
          <p className="mt-2 text-sm text-gray-600">
            A session is the scheduled class window. Session fragments are raw tracking runs captured by the browser extension.
          </p>
        </div>
        <div className="flex gap-3">
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ListBulletIcon className="w-5 h-5" />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 flex items-center gap-2 border-l border-gray-300 ${
                viewMode === 'calendar'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'calendar' ? (
        calendarLoading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            Loading calendar...
          </div>
        ) : (
          <SessionCalendarView
            sessions={calendarSessions}
            onMonthChange={handleMonthChange}
          />
        )
      ) : (
        <>
          <div className="flex items-center justify-between">
            {listMode === 'bundled' ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-600">{bundledRows.length} sessions</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">{orphanRows.length} ungrouped fragments</span>
                <button
                  type="button"
                  onClick={expandAllBundles}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Expand all
                </button>
                <button
                  type="button"
                  onClick={collapseAllBundles}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Collapse all
                </button>
              </div>
            ) : <div />}

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setListMode('raw')}
                className={`px-4 py-2 text-sm font-medium ${
                  listMode === 'raw'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Session Fragments
              </button>
              <button
                onClick={() => setListMode('bundled')}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
                  listMode === 'bundled'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sessions
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              Loading sessions...
            </div>
          ) : listMode === 'raw' && sessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No fragments yet</h3>
              <p className="text-gray-500">Session fragments are automatically created when you start tracking attendance via the browser extension</p>
            </div>
          ) : listMode === 'bundled' && bundlesLoading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              Loading session view...
            </div>
          ) : listMode === 'bundled' && bundledRows.length === 0 && orphanRows.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🧩</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-500">No schedule-grouped sessions were found in the available session fragments for this account.</p>
            </div>
          ) : listMode === 'bundled' ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Planned Window</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actual Window</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Fragments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Early</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Overtime</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Break</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bundledRows.map((bundle) => {
                    const isExpanded = expandedBundleIds.includes(bundle.bundle_id);
                    return (
                    <React.Fragment key={bundle.bundle_id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleBundleRow(bundle.bundle_id)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {isExpanded ? (
                          <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(bundle.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {bundle.classInfo ? formatClassDisplay(bundle.classInfo) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimeLabel(bundle.planned_start_time)} - {formatTimeLabel(bundle.planned_end_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTimeLabel(bundle.actual_first_start_at)} - {formatDateTimeLabel(bundle.actual_last_end_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bundle.session_count || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bundle.early_start_minutes || 0}m</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bundle.overtime_minutes || 0}m</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bundle.break_minutes || 0}m</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bundle.attendance_rate || 0}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {Array.isArray(bundle.session_ids) && bundle.session_ids.length > 0 ? (
                          <Link
                            to={`/app/sessions/${bundle.session_ids[0]}`}
                            className="text-blue-600 hover:text-blue-900"
                            onClick={(event) => event.stopPropagation()}
                          >
                            View First Fragment
                          </Link>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr className="bg-gray-50/50">
                        <td></td>
                        <td colSpan={10} className="px-6 py-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">Session fragments</div>
                          <div className="overflow-x-auto border border-gray-200 rounded-md bg-white">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fragment Time</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Participants</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Present</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {bundle.sessions.map((fragment) => (
                                  <tr key={fragment.id}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{formatFragmentWindow(fragment.start_at, fragment.end_at)}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{fragment.total_participants || 0}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{fragment.present_count || 0}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{fragment.status || 'ended'}</td>
                                    <td className="px-4 py-2 text-sm">
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
                        </td>
                      </tr>
                    ) : null}
                    </React.Fragment>
                  );
                  })}
                </tbody>
              </table>
              </div>

              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Ungrouped Session Fragments</h3>
                  <p className="text-sm text-gray-600 mt-1">Fragments that did not fit any session window.</p>
                </div>
                {orphanRows.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-gray-500">No ungrouped fragments.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Fragment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orphanRows.map((orphan) => (
                        <tr key={`orphan-${orphan.session?.id}-${orphan.reason}`} className="bg-amber-50/50 hover:bg-amber-100/40">
                          <td className="px-6 py-3 text-sm text-gray-900">{formatSessionTime(orphan.session)}</td>
                          <td className="px-6 py-3 text-sm text-gray-900">{orphan.classInfo ? formatClassDisplay(orphan.classInfo) : 'Unknown Class'}</td>
                          <td className="px-6 py-3 text-sm text-amber-900">{orphan.reason}</td>
                          <td className="px-6 py-3 text-sm">
                            <Link
                              to={`/app/sessions/${orphan.session?.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Fragment
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Fragment Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => {
                    const classInfo = classes.find(c => c.id === session.class_id);
                    const sessionTime = formatSessionTime(session);
                    return (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{sessionTime}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{classInfo ? formatClassDisplay(classInfo) : 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              session.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : session.status === 'ended'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/app/sessions/${session.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Sessions;
