import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionsAPI, classesAPI } from '@/services/api';
import { formatClassDisplay } from '@/utils/classFormatter';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowsUpDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const EARLY_BUFFER_MINUTES = 30;
const OVERTIME_BUFFER_MINUTES = 90;
const DRIFT_VIS_MAX_MINUTES = 90;

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [listMode, setListMode] = useState('bundled'); // 'raw' or 'bundled'
  const [expandedBundleIds, setExpandedBundleIds] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [dismissedOrphanKeys, setDismissedOrphanKeys] = useState([]);
  const [selectedOrphanKeys, setSelectedOrphanKeys] = useState([]);
  const [orphanAssignmentMap, setOrphanAssignmentMap] = useState({});

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const deleteFragmentMutation = useMutation({
    mutationFn: (fragmentId) => sessionsAPI.delete(fragmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const deleteSelectedFragmentsMutation = useMutation({
    mutationFn: async (fragmentIds) => {
      await Promise.all(fragmentIds.map((fragmentId) => sessionsAPI.delete(fragmentId)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const sessions = sessionsData?.data || [];
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

  const classFilterOptions = useMemo(() => {
    const sorted = [...classes].sort((left, right) => {
      const leftLabel = formatClassDisplay(left) || '';
      const rightLabel = formatClassDisplay(right) || '';
      return leftLabel.localeCompare(rightLabel);
    });
    return sorted.map((classInfo) => ({
      id: String(classInfo.id),
      label: formatClassDisplay(classInfo),
    }));
  }, [classes]);

  const isDateWithinRange = (dateLike) => {
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) return true;

    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`);
      if (!Number.isNaN(from.getTime()) && date < from) return false;
    }

    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59.999`);
      if (!Number.isNaN(to.getTime()) && date > to) return false;
    }

    return true;
  };

  const filteredBundledRows = useMemo(() => {
    return bundledRows.filter((bundle) => {
      const classMatches = selectedClassId === 'all' || String(bundle.classInfo?.id) === selectedClassId;
      if (!classMatches) return false;

      const inRange = isDateWithinRange(bundle.date);
      return inRange;
    });
  }, [bundledRows, selectedClassId, dateFrom, dateTo]);

  const filteredOrphanRows = useMemo(() => {
    return orphanRows.filter((orphan) => {
      const classMatches = selectedClassId === 'all' || String(orphan.classInfo?.id) === selectedClassId;
      if (!classMatches) return false;

      const dateValue = orphan?.session?.started_at || orphan?.session?.session_date;
      if (dateValue && !isDateWithinRange(dateValue)) return false;

      return true;
    });
  }, [orphanRows, selectedClassId, dateFrom, dateTo]);

  const getOrphanKey = (orphan, fallbackIndex = 0) => {
    const fragmentId = orphan?.session?.id ?? `no-id-${fallbackIndex}`;
    const startedAt = orphan?.session?.started_at || orphan?.session?.session_date || 'na';
    const reason = orphan?.reason || 'unknown';
    return `${fragmentId}::${startedAt}::${reason}`;
  };

  const unresolvedOrphanRows = useMemo(() => {
    const dismissed = new Set(dismissedOrphanKeys);
    return filteredOrphanRows.filter((orphan, index) => !dismissed.has(getOrphanKey(orphan, index)));
  }, [filteredOrphanRows, dismissedOrphanKeys]);

  const filteredRawSessions = useMemo(() => {
    return sessions.filter((session) => {
      const classMatches = selectedClassId === 'all' || String(session.class_id) === selectedClassId;
      if (!classMatches) return false;

      const dateValue = session.started_at || session.session_date;
      if (dateValue && !isDateWithinRange(dateValue)) return false;

      return true;
    });
  }, [sessions, selectedClassId, dateFrom, dateTo]);

  const groupedBundledRows = useMemo(() => {
    const groups = new Map();
    filteredBundledRows.forEach((bundle) => {
      const dateKey = bundle.date;
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey).push(bundle);
    });

    return Array.from(groups.entries())
      .sort((left, right) => new Date(left[0]).getTime() - new Date(right[0]).getTime())
      .map(([date, items]) => ({ date, items }));
  }, [filteredBundledRows]);

  const orphanRowsWithKeys = useMemo(() => {
    return unresolvedOrphanRows.map((orphan, index) => ({
      key: getOrphanKey(orphan, index),
      orphan,
    }));
  }, [unresolvedOrphanRows]);

  const getOrphanSuggestedOptions = (orphan) => {
    const orphanClassId = String(orphan?.classInfo?.id ?? orphan?.session?.class_id ?? '');
    const orphanDateRaw = orphan?.session?.started_at || orphan?.session?.session_date;
    const orphanDate = orphanDateRaw ? new Date(orphanDateRaw) : null;
    const orphanTime = orphanDate && !Number.isNaN(orphanDate.getTime()) ? orphanDate.getTime() : null;

    return filteredBundledRows
      .filter((bundle) => String(bundle?.classInfo?.id ?? '') === orphanClassId)
      .map((bundle) => {
        const bundleStart = bundle.actual_first_start_at || bundle.planned_start_at || bundle.date;
        const bundleDate = bundleStart ? new Date(bundleStart) : null;
        const bundleTime = bundleDate && !Number.isNaN(bundleDate.getTime()) ? bundleDate.getTime() : null;
        const distanceMs = Number.isFinite(orphanTime) && Number.isFinite(bundleTime)
          ? Math.abs(orphanTime - bundleTime)
          : Number.MAX_SAFE_INTEGER;

        const className = bundle.classInfo ? formatClassDisplay(bundle.classInfo) : 'Unknown Class';
        const label = `${new Date(bundle.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${className} (${formatTimeLabel(bundle.planned_start_time)} - ${formatTimeLabel(bundle.planned_end_time)})`;

        return {
          value: bundle.bundle_id,
          label,
          distanceMs,
          bundle,
        };
      })
      .sort((left, right) => left.distanceMs - right.distanceMs)
      .slice(0, 8);
  };

  useEffect(() => {
    setExpandedBundleIds((previous) => {
      const validIds = new Set(bundledRows.map((bundle) => bundle.bundle_id));
      return previous.filter((id) => validIds.has(id));
    });
  }, [bundledRows]);

  useEffect(() => {
    const validKeys = new Set(orphanRowsWithKeys.map((item) => item.key));

    setSelectedOrphanKeys((previous) => previous.filter((key) => validKeys.has(key)));
    setOrphanAssignmentMap((previous) => {
      const next = {};
      Object.entries(previous).forEach(([key, value]) => {
        if (validKeys.has(key)) next[key] = value;
      });
      return next;
    });
  }, [orphanRowsWithKeys]);

  useEffect(() => {
    if (listMode !== 'bundled') return;

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
  }, [listMode, bundleDebug]);

  const bundlesLoading = listMode === 'bundled' && (isLoading || !classesData);

  const toggleBundleRow = (bundleId) => {
    setExpandedBundleIds((previous) => (
      previous.includes(bundleId)
        ? previous.filter((id) => id !== bundleId)
        : [...previous, bundleId]
    ));
  };

  const expandAllBundles = () => {
    setExpandedBundleIds(filteredBundledRows.map((bundle) => bundle.bundle_id));
  };

  const collapseAllBundles = () => {
    setExpandedBundleIds([]);
  };

  const areAllVisibleBundlesExpanded = filteredBundledRows.length > 0
    && filteredBundledRows.every((bundle) => expandedBundleIds.includes(bundle.bundle_id));

  const toggleExpandCollapseBundles = () => {
    if (areAllVisibleBundlesExpanded) {
      collapseAllBundles();
      return;
    }
    expandAllBundles();
  };

  const toggleOrphanSelection = (key) => {
    setSelectedOrphanKeys((previous) => (
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key]
    ));
  };

  const toggleSelectAllOrphans = () => {
    const allKeys = orphanRowsWithKeys.map((item) => item.key);
    const allSelected = allKeys.length > 0 && allKeys.every((key) => selectedOrphanKeys.includes(key));
    setSelectedOrphanKeys(allSelected ? [] : allKeys);
  };

  const dismissOrphanByKey = (key) => {
    setDismissedOrphanKeys((previous) => (previous.includes(key) ? previous : [...previous, key]));
    setSelectedOrphanKeys((previous) => previous.filter((item) => item !== key));
  };

  const dismissSelectedOrphans = () => {
    if (selectedOrphanKeys.length === 0) return;
    setDismissedOrphanKeys((previous) => Array.from(new Set([...previous, ...selectedOrphanKeys])));
    setSelectedOrphanKeys([]);
  };

  const deleteSelectedOrphans = () => {
    if (selectedOrphanKeys.length === 0) return;

    const selectedItems = orphanRowsWithKeys.filter((item) => selectedOrphanKeys.includes(item.key));
    const fragmentIds = selectedItems
      .map((item) => item?.orphan?.session?.id)
      .filter(Boolean);

    if (fragmentIds.length === 0) return;

    if (!window.confirm(`Delete ${fragmentIds.length} selected session fragment(s)? This cannot be undone.`)) {
      return;
    }

    deleteSelectedFragmentsMutation.mutate(fragmentIds, {
      onSuccess: () => {
        setDismissedOrphanKeys((previous) => Array.from(new Set([...previous, ...selectedOrphanKeys])));
        setSelectedOrphanKeys([]);
      },
    });
  };

  const handleAssignOrphan = (item, selectedBundleId) => {
    if (!selectedBundleId) return;

    const target = filteredBundledRows.find((bundle) => bundle.bundle_id === selectedBundleId);
    if (!target) return;

    navigate(`/app/sessions/bundled/${encodeURIComponent(target.bundle_id)}?ids=${encodeURIComponent(target.session_ids.join(','))}`, {
      state: {
        bundle: target,
        focusFragmentId: item?.orphan?.session?.id,
      },
    });
    setIsCleanupModalOpen(false);
  };

  const handleDeleteFragment = (fragmentId, orphanKey) => {
    if (!fragmentId) return;
    if (!window.confirm('Delete this session fragment? This cannot be undone.')) return;

    deleteFragmentMutation.mutate(fragmentId, {
      onSuccess: () => {
        dismissOrphanByKey(orphanKey);
      },
    });
  };

  const formatDurationMinutes = (startValue, endValue) => {
    if (!startValue || !endValue) return null;
    const start = new Date(startValue);
    const end = new Date(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    return `${minutes}m`;
  };

  function formatSessionTime(session) {
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
  }

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

  const getAttendanceTone = (rate) => {
    const numeric = Number(rate) || 0;
    if (numeric >= 90) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (numeric >= 70) return 'bg-amber-50 text-amber-800 border border-amber-200';
    return 'bg-rose-50 text-rose-700 border border-rose-200';
  };

  const getOvertimeTone = (minutes) => {
    const numeric = Number(minutes) || 0;
    if (numeric === 0) return 'text-gray-700';
    if (numeric <= 15) return 'text-amber-700 font-medium';
    return 'text-rose-700 font-semibold';
  };

  const renderWindowTimeline = (bundle) => {
    const plannedStart = bundle.planned_start_at ? new Date(bundle.planned_start_at) : null;
    const plannedEnd = bundle.planned_end_at ? new Date(bundle.planned_end_at) : null;
    const actualStart = bundle.actual_first_start_at ? new Date(bundle.actual_first_start_at) : null;
    const actualEnd = bundle.actual_last_end_at ? new Date(bundle.actual_last_end_at) : null;

    if (!plannedStart || !plannedEnd || !actualStart || !actualEnd) {
      return <span className="text-sm text-gray-500">-</span>;
    }

    const startDriftMinutes = Math.round((actualStart.getTime() - plannedStart.getTime()) / 60000);
    const endDriftMinutes = Math.round((actualEnd.getTime() - plannedEnd.getTime()) / 60000);

    const leftMagnitude = Math.max(0, -Math.min(startDriftMinutes, endDriftMinutes, 0));
    const rightMagnitude = Math.max(0, startDriftMinutes, endDriftMinutes, 0);

    const cappedLeftPct = (Math.min(leftMagnitude, DRIFT_VIS_MAX_MINUTES) / DRIFT_VIS_MAX_MINUTES) * 50;
    const cappedRightPct = (Math.min(rightMagnitude, DRIFT_VIS_MAX_MINUTES) / DRIFT_VIS_MAX_MINUTES) * 50;

    const formatSignedDrift = (value) => {
      if (value === 0) return 'on time';
      if (value < 0) return `${Math.abs(value)}m early`;
      return `${value}m late`;
    };

    return (
      <div className="min-w-[180px]">
        <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="absolute top-[-2px] bottom-[-2px] w-px bg-slate-500"
            style={{ left: '50%' }}
            title="Planned baseline"
          />
          {cappedLeftPct > 0 ? (
            <div
              className="absolute top-0 h-2 rounded-l-full bg-emerald-500"
              style={{ left: `${50 - cappedLeftPct}%`, width: `${cappedLeftPct}%` }}
              title={`${leftMagnitude}m early drift`}
            />
          ) : null}
          {cappedRightPct > 0 ? (
            <div
              className="absolute top-0 h-2 rounded-r-full bg-rose-500"
              style={{ left: '50%', width: `${cappedRightPct}%` }}
              title={`${rightMagnitude}m late drift`}
            />
          ) : null}
        </div>
        <div className="mt-1 text-xs text-gray-600">
          Start {formatSignedDrift(startDriftMinutes)}
          {' • '}
          End {formatSignedDrift(endDriftMinutes)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
        </div>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setListMode('bundled')}
            className={`px-4 py-2 text-sm font-medium ${
              listMode === 'bundled'
                ? 'bg-accent-700 text-white'
                : 'bg-white text-gray-700 hover:bg-accent-50 hover:text-accent-800'
            }`}
          >
            Session
          </button>
          <button
            onClick={() => setListMode('raw')}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
              listMode === 'raw'
                ? 'bg-accent-700 text-white'
                : 'bg-white text-gray-700 hover:bg-accent-50 hover:text-accent-800'
            }`}
          >
            Session Fragments
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[220px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="all">All classes</option>
              {classFilterOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1">Timespan</label>
            <div className="flex items-center rounded-md border border-gray-300 bg-white px-2 py-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="px-2 py-1 text-sm text-gray-800 focus:outline-none"
              />
              <span className="px-1 text-gray-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="px-2 py-1 text-sm text-gray-800 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedClassId('all');
              setDateFrom('');
              setDateTo('');
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-accent-50 hover:text-accent-800"
          >
            Reset filters
          </button>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3 text-sm text-gray-700">
          <span className="font-medium">({listMode === 'bundled' ? `${filteredBundledRows.length} sessions` : `${filteredRawSessions.length} session fragments`})</span>

          <button
            type="button"
            onClick={() => setIsCleanupModalOpen(true)}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
            title="Needs Attention"
            aria-label="Needs Attention"
          >
            <PuzzlePieceIcon className="h-5 w-5" />
            {orphanRowsWithKeys.length > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full border border-amber-400 bg-amber-200 px-1 text-[10px] font-bold text-amber-900">
                {orphanRowsWithKeys.length}
              </span>
            ) : null}
          </button>

          {listMode === 'bundled' ? (
            <button
              type="button"
              onClick={toggleExpandCollapseBundles}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-accent-50 hover:text-accent-800"
            >
              <ArrowsUpDownIcon className="h-4 w-4" />
              Expand/Collapse
            </button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              Loading sessions...
            </div>
          ) : listMode === 'raw' && filteredRawSessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No fragments yet</h3>
              <p className="text-gray-500">Session fragments are automatically created when you start tracking attendance via the browser extension</p>
            </div>
          ) : listMode === 'bundled' && bundlesLoading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              Loading session view...
            </div>
          ) : listMode === 'bundled' && filteredBundledRows.length === 0 && unresolvedOrphanRows.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🧩</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-500">No schedule-grouped sessions were found in the available session fragments for this account.</p>
            </div>
          ) : listMode === 'bundled' ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider"></th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Planned Window</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Actual Window</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Window Drift</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Fragments</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Early</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Overtime</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Break</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedBundledRows.map((group) => (
                    <React.Fragment key={`group-${group.date}`}>
                      <tr className="bg-slate-100/90">
                        <td colSpan={12} className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                          {new Date(group.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>

                      {group.items.map((bundle, rowIndex) => {
                        const isExpanded = expandedBundleIds.includes(bundle.bundle_id);
                        return (
                          <React.Fragment key={bundle.bundle_id}>
                            <tr
                              className={`group cursor-pointer transition-colors ${rowIndex % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/60'}`}
                              onClick={() => toggleBundleRow(bundle.bundle_id)}
                            >
                              <td className="px-4 py-5 whitespace-nowrap text-sm text-gray-700">
                                {isExpanded ? (
                                  <ChevronDownIcon className="w-4 h-4" />
                                ) : (
                                  <ChevronRightIcon className="w-4 h-4" />
                                )}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                                {new Date(bundle.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="px-6 py-5 text-sm font-bold text-gray-900">
                                {bundle.classInfo ? formatClassDisplay(bundle.classInfo) : 'N/A'}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">
                                {formatTimeLabel(bundle.planned_start_time)} - {formatTimeLabel(bundle.planned_end_time)}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                                {formatDateTimeLabel(bundle.actual_first_start_at)} - {formatDateTimeLabel(bundle.actual_last_end_at)}
                              </td>
                              <td className="px-6 py-5 text-sm text-gray-900">
                                {renderWindowTimeline(bundle)}
                              </td>
                              <td className="px-4 py-5 whitespace-nowrap text-right text-xs text-gray-700">{bundle.session_count || 0}</td>
                              <td className="px-4 py-5 whitespace-nowrap text-right text-sm text-gray-900">{bundle.early_start_minutes || 0}m</td>
                              <td className={`px-4 py-5 whitespace-nowrap text-right text-sm ${getOvertimeTone(bundle.overtime_minutes)}`}>{bundle.overtime_minutes || 0}m</td>
                              <td className="px-4 py-5 whitespace-nowrap text-right text-xs text-gray-700">{bundle.break_minutes || 0}m</td>
                              <td className="px-6 py-5 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${getAttendanceTone(bundle.attendance_rate || 0)}`}>
                                  {bundle.attendance_rate || 0}%
                                </span>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                                {Array.isArray(bundle.session_ids) && bundle.session_ids.length > 0 ? (
                                  <Link
                                    to={`/app/sessions/bundled/${encodeURIComponent(bundle.bundle_id)}?ids=${encodeURIComponent(bundle.session_ids.join(','))}`}
                                    state={{ bundle }}
                                    className="inline-flex items-center rounded-md border border-accent-200 bg-accent-50 px-2.5 py-1 text-accent-700 hover:bg-accent-100"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    View
                                  </Link>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </td>
                            </tr>
                            {isExpanded ? (
                              <tr className="bg-accent-50/60">
                                <td></td>
                                <td colSpan={11} className="px-6 py-4">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-accent-900 mb-3">Session fragments</div>
                                  <div className="rounded-md border border-accent-100 bg-white/90 divide-y divide-accent-100">
                                    {bundle.sessions.map((fragment) => (
                                      <div key={fragment.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 px-4 py-3 items-center">
                                        <div>
                                          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Fragment Time</div>
                                          <div className="text-sm font-medium text-gray-900">{formatFragmentWindow(fragment.start_at, fragment.end_at)}</div>
                                        </div>
                                        <div>
                                          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Participants</div>
                                          <div className="text-sm text-gray-900">{fragment.total_participants || 0}</div>
                                        </div>
                                        <div>
                                          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Present</div>
                                          <div className="text-sm text-gray-900">{fragment.present_count || 0}</div>
                                        </div>
                                        <div>
                                          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Status</div>
                                          <div className="text-sm text-gray-900">{fragment.status || 'ended'}</div>
                                        </div>
                                        <div className="md:text-right">
                                          <Link
                                            to={`/app/sessions/${fragment.id}`}
                                            className="text-sm text-accent-700 hover:text-accent-900 font-medium"
                                          >
                                            Open Fragment
                                          </Link>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              </div>

            </div>
          ) : null}

          {isCleanupModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-gray-900/40"
                onClick={() => setIsCleanupModalOpen(false)}
              />
              <div className="relative w-full max-w-7xl rounded-xl bg-white shadow-2xl border border-gray-200 max-h-[86vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Unassigned Activity Found</h3>
                  <p className="text-sm text-gray-600 mt-1">These tracking runs occurred outside of scheduled class times. Assign them to a session or dismiss them.</p>
                </div>

                <div className="px-6 py-3 border-b border-gray-200 bg-slate-50 flex items-center justify-between gap-3">
                  <div className="text-sm text-gray-700">{orphanRowsWithKeys.length} fragments need review</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={dismissSelectedOrphans}
                      disabled={selectedOrphanKeys.length === 0}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Dismiss Selected
                    </button>
                    <button
                      type="button"
                      onClick={deleteSelectedOrphans}
                      disabled={selectedOrphanKeys.length === 0 || deleteSelectedFragmentsMutation.isPending}
                      className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCleanupModalOpen(false)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="overflow-auto max-h-[62vh]">
                  {orphanRowsWithKeys.length === 0 ? (
                    <div className="px-6 py-10 text-center text-sm text-gray-600">No unassigned activity remains.</div>
                  ) : (
                    <table className="w-full table-fixed divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={orphanRowsWithKeys.length > 0 && orphanRowsWithKeys.every((item) => selectedOrphanKeys.includes(item.key))}
                              onChange={toggleSelectAllOrphans}
                              className="rounded border-gray-300"
                            />
                          </th>
                          <th className="w-[30%] px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fragment Details</th>
                          <th className="w-[28%] px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Suggested Session</th>
                          <th className="w-[42%] px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orphanRowsWithKeys.map((item) => {
                          const fragment = item.orphan.session || {};
                          const options = getOrphanSuggestedOptions(item.orphan);
                          const defaultSuggestion = options[0]?.value || '';
                          const selectedValue = orphanAssignmentMap[item.key] || defaultSuggestion;
                          const suggestionLabel = options[0]?.label || 'No nearby grouped session found';
                          const duration = formatDurationMinutes(fragment.started_at, fragment.ended_at);
                          const detailLabel = formatFragmentWindow(fragment.started_at, fragment.ended_at);

                          return (
                            <tr key={`cleanup-${item.key}`} className="hover:bg-slate-50">
                              <td className="px-4 py-3 align-top">
                                <input
                                  type="checkbox"
                                  checked={selectedOrphanKeys.includes(item.key)}
                                  onChange={() => toggleOrphanSelection(item.key)}
                                  className="mt-1 rounded border-gray-300"
                                />
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="text-sm font-medium text-gray-900">{detailLabel}{duration ? ` (${duration})` : ''}</div>
                                <div className="text-xs text-gray-600 mt-1 truncate">{item.orphan.classInfo ? formatClassDisplay(item.orphan.classInfo) : 'Unknown Class'}</div>
                                <div className="text-xs text-amber-800 mt-1 truncate">{item.orphan.reason}</div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="text-sm text-gray-800 leading-5">Occurred near: <span className="text-gray-700">{suggestionLabel}</span></div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    value={selectedValue}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      setOrphanAssignmentMap((previous) => ({ ...previous, [item.key]: value }));
                                    }}
                                    className="min-w-[260px] max-w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
                                  >
                                    <option value="">Assign to...</option>
                                    {options.map((option) => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleAssignOrphan(item, selectedValue)}
                                    disabled={!selectedValue}
                                    className="rounded-md border border-accent-200 bg-accent-50 px-3 py-1.5 text-sm text-accent-700 hover:bg-accent-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Assign
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => dismissOrphanByKey(item.key)}
                                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Dismiss
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFragment(fragment.id, item.key)}
                                    disabled={deleteFragmentMutation.isPending || !fragment.id}
                                    className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {listMode === 'raw' && filteredRawSessions.length > 0 ? (
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
                  {filteredRawSessions.map((session) => {
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
                            className="text-accent-700 hover:text-accent-900"
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
          ) : null}
    </div>
  );
};

export default Sessions;
