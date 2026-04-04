const Class = require('../models/Class');
const SessionLink = require('../models/SessionLink');
const ExemptedAccount = require('../models/ExemptedAccount');

const DEFAULT_SCHEDULE_DURATION_MINUTES = 90;
const DEFAULT_EARLY_BUFFER_MINUTES = 30;
const DEFAULT_OVERTIME_BUFFER_MINUTES = 90;
const DEFAULT_MIN_OVERLAP_MINUTES = 5;
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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
  if (modifier === 'PM') {
    hour += 12;
  }

  return (hour * 60) + minute;
};

const parseLegacyTimeRange = (value) => {
  if (!value || typeof value !== 'string') return { startMinutes: null, endMinutes: null };
  const parts = value.split('-').map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 2) return { startMinutes: null, endMinutes: null };

  const startMinutes = parseMeridiemTimeToMinutes(parts[0]);
  const endMinutes = parseMeridiemTimeToMinutes(parts[1]);
  return { startMinutes, endMinutes };
};

const dateKeyToUtcDate = (dateKey) => {
  if (!dateKey || typeof dateKey !== 'string') return null;
  const [year, month, day] = dateKey.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

const buildUtcDateTime = (dateKey, minutes) => {
  const date = dateKeyToUtcDate(dateKey);
  if (!date || !Number.isFinite(minutes)) return null;
  return new Date(date.getTime() + (minutes * 60 * 1000));
};

const toDateKey = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
};

const diffMinutes = (end, start) => {
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return null;
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return null;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
};

const formatMinutesAsTime = (minutes) => {
  if (!Number.isFinite(minutes)) return null;
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hour = String(Math.floor(safeMinutes / 60)).padStart(2, '0');
  const minute = String(safeMinutes % 60).padStart(2, '0');
  return `${hour}:${minute}`;
};

const formatIsoTime = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const getDayNameForDateKey = (dateKey) => {
  const date = dateKeyToUtcDate(dateKey);
  if (!date) return null;
  return DAY_NAMES[date.getUTCDay()] || null;
};

const normalizeClassSchedules = (scheduleData) => {
  if (!scheduleData) return [];

  const rawSchedules = Array.isArray(scheduleData)
    ? scheduleData
    : [scheduleData];

  return rawSchedules
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null;

      const days = Array.isArray(entry.days)
        ? entry.days
          .filter((day) => typeof day === 'string' && day.trim())
          .map((day) => day.trim().toLowerCase())
        : [];

      let startMinutes = parseTimeToMinutes(entry.startTime);
      let endMinutes = parseTimeToMinutes(entry.endTime);

      if (startMinutes === null || endMinutes === null) {
        const parsedRange = parseLegacyTimeRange(entry.time);
        if (startMinutes === null) startMinutes = parsedRange.startMinutes;
        if (endMinutes === null) endMinutes = parsedRange.endMinutes;
      }

      if (startMinutes === null && endMinutes !== null) {
        startMinutes = Math.max(0, endMinutes - DEFAULT_SCHEDULE_DURATION_MINUTES);
      }

      if (startMinutes !== null && endMinutes === null) {
        endMinutes = startMinutes + DEFAULT_SCHEDULE_DURATION_MINUTES;
      }

      if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
        return null;
      }

      return {
        index,
        days,
        startMinutes,
        endMinutes,
      };
    })
    .filter(Boolean);
};

const resolveSessionRange = (session) => {
  const startedAt = session.started_at ? new Date(session.started_at) : null;
  const endedAt = session.ended_at ? new Date(session.ended_at) : null;

  const startedAtValid = startedAt instanceof Date && !Number.isNaN(startedAt.getTime())
    ? startedAt
    : null;
  const endedAtValid = endedAt instanceof Date && !Number.isNaN(endedAt.getTime())
    ? endedAt
    : null;

  const dateKey = startedAtValid
    ? startedAtValid.toISOString().slice(0, 10)
    : toDateKey(session.session_date);
  if (!dateKey) return null;

  const sessionTimeText = typeof session.session_time === 'string'
    ? session.session_time.slice(0, 5)
    : null;
  const sessionStartMinutes = parseTimeToMinutes(sessionTimeText);

  const avgDuration = Number.parseFloat(session.avg_duration_minutes || 0);
  const durationMinutes = Number.isFinite(avgDuration) && avgDuration > 0
    ? Math.max(1, Math.round(avgDuration))
    : 0;

  let start = startedAtValid;
  if (!start && Number.isFinite(sessionStartMinutes)) {
    start = buildUtcDateTime(dateKey, sessionStartMinutes);
  }

  if (!start) {
    return null;
  }

  let end = endedAtValid;
  if (!end && durationMinutes > 0) {
    end = new Date(start.getTime() + (durationMinutes * 60 * 1000));
  }

  if (!end || end.getTime() < start.getTime()) {
    end = start;
  }

  return {
    dateKey,
    start,
    end,
    durationMinutes: diffMinutes(end, start) || durationMinutes || 0,
  };
};

const buildScheduleBundles = ({ schedules, sessions }) => {
  if (!Array.isArray(schedules) || schedules.length === 0 || !Array.isArray(sessions) || sessions.length === 0) {
    return [];
  }

  const bundles = new Map();

  const getBundleKey = (dateKey, scheduleIndex) => `${dateKey}::${scheduleIndex}`;

  const findOrCreateBundle = (dateKey, schedule) => {
    const key = getBundleKey(dateKey, schedule.index);
    if (bundles.has(key)) return bundles.get(key);

    const plannedStart = buildUtcDateTime(dateKey, schedule.startMinutes);
    const plannedEnd = buildUtcDateTime(dateKey, schedule.endMinutes);
    const bundle = {
      bundle_id: key,
      date: dateKey,
      day_name: getDayNameForDateKey(dateKey),
      schedule_index: schedule.index,
      planned_start_time: formatMinutesAsTime(schedule.startMinutes),
      planned_end_time: formatMinutesAsTime(schedule.endMinutes),
      planned_minutes: Math.max(0, schedule.endMinutes - schedule.startMinutes),
      planned_start_at: formatIsoTime(plannedStart),
      planned_end_at: formatIsoTime(plannedEnd),
      session_count: 0,
      session_ids: [],
      sessions: [],
      total_participants: 0,
      present_count: 0,
      attendance_rate: 0,
      actual_total_minutes: 0,
      actual_first_start_at: null,
      actual_last_end_at: null,
      early_start_minutes: 0,
      overtime_minutes: 0,
      break_minutes: 0,
    };

    bundles.set(key, bundle);
    return bundle;
  };

  sessions.forEach((session) => {
    const range = resolveSessionRange(session);
    if (!range) return;

    const dayName = getDayNameForDateKey(range.dateKey);
    if (!dayName) return;

    const candidates = schedules.filter((schedule) => schedule.days.length === 0 || schedule.days.includes(dayName));
    if (candidates.length === 0) return;

    const scoredCandidates = candidates.map((schedule) => {
      const plannedStart = buildUtcDateTime(range.dateKey, schedule.startMinutes);
      const plannedEnd = buildUtcDateTime(range.dateKey, schedule.endMinutes);
      if (!plannedStart || !plannedEnd) {
        return null;
      }

      const windowStart = new Date(plannedStart.getTime() - (DEFAULT_EARLY_BUFFER_MINUTES * 60 * 1000));
      const windowEnd = new Date(plannedEnd.getTime() + (DEFAULT_OVERTIME_BUFFER_MINUTES * 60 * 1000));
      const overlapStart = new Date(Math.max(windowStart.getTime(), range.start.getTime()));
      const overlapEnd = new Date(Math.min(windowEnd.getTime(), range.end.getTime()));
      const overlapMinutes = diffMinutes(overlapEnd, overlapStart) || 0;

      return {
        schedule,
        overlapMinutes,
      };
    }).filter(Boolean);

    if (scoredCandidates.length === 0) return;

    scoredCandidates.sort((left, right) => right.overlapMinutes - left.overlapMinutes);
    const best = scoredCandidates[0];
    if (!best || best.overlapMinutes < DEFAULT_MIN_OVERLAP_MINUTES) {
      return;
    }

    const bundle = findOrCreateBundle(range.dateKey, best.schedule);
    bundle.session_count += 1;
    bundle.session_ids.push(session.id);
    bundle.sessions.push({
      id: session.id,
      title: session.title,
      start_at: formatIsoTime(range.start),
      end_at: formatIsoTime(range.end),
      duration_minutes: range.durationMinutes,
      attendance_rate: Number.parseFloat(session.attendance_rate || 0),
      total_participants: Number.parseInt(session.total_participants || 0, 10) || 0,
      present_count: Number.parseInt(session.present_count || 0, 10) || 0,
    });
  });

  const finalized = Array.from(bundles.values()).map((bundle) => {
    const sortedSessions = [...bundle.sessions].sort((left, right) => new Date(left.start_at).getTime() - new Date(right.start_at).getTime());
    bundle.sessions = sortedSessions;

    const firstStart = sortedSessions.length > 0 ? new Date(sortedSessions[0].start_at) : null;
    const lastEnd = sortedSessions.length > 0 ? new Date(sortedSessions[sortedSessions.length - 1].end_at) : null;

    bundle.actual_first_start_at = formatIsoTime(firstStart);
    bundle.actual_last_end_at = formatIsoTime(lastEnd);

    bundle.actual_total_minutes = sortedSessions.reduce(
      (sum, item) => sum + (Number.parseInt(item.duration_minutes || 0, 10) || 0),
      0
    );
    bundle.total_participants = sortedSessions.reduce(
      (sum, item) => sum + (Number.parseInt(item.total_participants || 0, 10) || 0),
      0
    );
    bundle.present_count = sortedSessions.reduce(
      (sum, item) => sum + (Number.parseInt(item.present_count || 0, 10) || 0),
      0
    );

    bundle.attendance_rate = bundle.total_participants > 0
      ? Number(((bundle.present_count / bundle.total_participants) * 100).toFixed(2))
      : 0;

    const plannedStart = bundle.planned_start_at ? new Date(bundle.planned_start_at) : null;
    const plannedEnd = bundle.planned_end_at ? new Date(bundle.planned_end_at) : null;
    const actualStart = bundle.actual_first_start_at ? new Date(bundle.actual_first_start_at) : null;
    const actualEnd = bundle.actual_last_end_at ? new Date(bundle.actual_last_end_at) : null;

    if (plannedStart && actualStart) {
      bundle.early_start_minutes = Math.max(0, diffMinutes(plannedStart, actualStart) || 0);
    }

    if (plannedEnd && actualEnd) {
      bundle.overtime_minutes = Math.max(0, diffMinutes(actualEnd, plannedEnd) || 0);
    }

    let breakMinutes = 0;
    for (let index = 1; index < sortedSessions.length; index += 1) {
      const previousEnd = new Date(sortedSessions[index - 1].end_at);
      const currentStart = new Date(sortedSessions[index].start_at);
      const gap = diffMinutes(currentStart, previousEnd) || 0;
      breakMinutes += gap;
    }
    bundle.break_minutes = breakMinutes;

    return bundle;
  });

  finalized.sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }
    return left.schedule_index - right.schedule_index;
  });

  return finalized;
};

// Get all classes for current instructor
const getClasses = async (req, res) => {
  try {
    const includeArchived = req.query.include_archived === 'true';
    const classes = await Class.findByInstructorId(req.user.id, includeArchived);

    // Fetch session links for each class
    const classesWithLinks = await Promise.all(
      classes.map(async (classItem) => {
        const links = await SessionLink.findByClassId(classItem.id);
        return {
          ...classItem,
          links
        };
      })
    );

    res.json({
      success: true,
      data: classesWithLinks
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get single class with details
const getClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Check if user owns this class
    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Fetch session links for this class
    const links = await SessionLink.findByClassId(id);

    res.json({
      success: true,
      data: {
        ...classData,
        links
      }
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Create new class
const createClass = async (req, res) => {
  try {
    const { name, subject, section, description, schedule } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Class name is required'
      });
    }

    const classData = await Class.create({
      instructor_id: req.user.id,
      name,
      subject,
      section,
      description,
      schedule
    });

    res.status(201).json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, section, description, schedule, status } = req.body;

    // First get the class to check ownership
    const existingClass = await Class.findById(id);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Check if user owns this class
    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Class name is required'
      });
    }

    const updatedClass = await Class.update(id, {
      name,
      subject,
      section,
      description,
      schedule,
      status
    });

    res.json({
      success: true,
      data: updatedClass
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the class to check ownership
    const existingClass = await Class.findById(id);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Check if user owns this class
    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await Class.delete(id);

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);

    if (error.message === 'Cannot delete class with existing sessions') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete class with existing sessions'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get class statistics
const getClassStats = async (req, res) => {
  try {
    const classes = await Class.findByInstructorId(req.user.id);
    const stats = {
      totalClasses: classes.length,
      totalStudents: classes.reduce((sum, cls) => sum + parseInt(cls.student_count || 0), 0),
      recentClasses: classes.slice(0, 5)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get class stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update class status (active/archived)
const updateClassStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['active', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "active" or "archived"'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(id);
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updatedClass = await Class.updateStatus(id, status);

    res.json({
      success: true,
      data: updatedClass
    });
  } catch (error) {
    console.error('Update class status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update class schedule
const updateClassSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { schedule } = req.body;

    // Check ownership
    const existingClass = await Class.findById(id);
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updatedClass = await Class.updateSchedule(id, schedule);

    res.json({
      success: true,
      data: updatedClass
    });
  } catch (error) {
    console.error('Update class schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Session Links Management
const getClassLinks = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existingClass = await Class.findById(id);
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const links = await SessionLink.findByClassId(id);

    res.json({
      success: true,
      data: links
    });
  } catch (error) {
    console.error('Get class links error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const addClassLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { link_url, link_type, label, zoom_meeting_id, zoom_passcode, is_primary } = req.body;

    // Validation
    if (!link_url) {
      return res.status(400).json({
        success: false,
        error: 'Link URL is required'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(id);
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const link = await SessionLink.create({
      class_id: id,
      link_url,
      link_type,
      label,
      zoom_meeting_id,
      zoom_passcode,
      is_primary
    });

    res.status(201).json({
      success: true,
      data: link
    });
  } catch (error) {
    console.error('Add class link error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const updateClassLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { link_url, link_type, label, zoom_meeting_id, zoom_passcode, is_primary } = req.body;

    const link = await SessionLink.findById(linkId);
    if (!link) {
      return res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(link.class_id);
    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updatedLink = await SessionLink.update(linkId, {
      link_url,
      link_type,
      label,
      zoom_meeting_id,
      zoom_passcode,
      is_primary
    });

    res.json({
      success: true,
      data: updatedLink
    });
  } catch (error) {
    console.error('Update class link error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const deleteClassLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const link = await SessionLink.findById(linkId);
    if (!link) {
      return res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(link.class_id);
    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await SessionLink.delete(linkId);

    res.json({
      success: true,
      message: 'Link deleted successfully'
    });
  } catch (error) {
    console.error('Delete class link error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Exempted Accounts Management
const getExemptedAccounts = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existingClass = await Class.findById(id);
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const exemptions = await ExemptedAccount.findByClassId(id);

    res.json({
      success: true,
      data: exemptions
    });
  } catch (error) {
    console.error('Get exempted accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const addExemptedAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { account_identifier, reason } = req.body;

    // Validation
    if (!account_identifier) {
      return res.status(400).json({
        success: false,
        error: 'Account identifier is required'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(id);
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const exemption = await ExemptedAccount.create({
      class_id: id,
      account_identifier,
      reason
    });

    res.status(201).json({
      success: true,
      data: exemption
    });
  } catch (error) {
    console.error('Add exempted account error:', error);
    
    if (error.message.includes('already exempted')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const deleteExemptedAccount = async (req, res) => {
  try {
    const { exemptionId } = req.params;

    const exemption = await ExemptedAccount.findById(exemptionId);
    if (!exemption) {
      return res.status(404).json({
        success: false,
        error: 'Exemption not found'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(exemption.class_id);
    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await ExemptedAccount.delete(exemptionId);

    res.json({
      success: true,
      message: 'Exemption removed successfully'
    });
  } catch (error) {
    console.error('Delete exempted account error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get class analytics
const getClassAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Check ownership
    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const pool = require('../config/database');

    // Parse dates - extract just the date part for comparison
    const start = startDate ? new Date(startDate).toISOString().split('T')[0] : '2020-01-01';
    const end = endDate ? new Date(endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    console.log('Analytics Date Range:', { classId: id, startDate, endDate, start, end });

    // Get session attendance data within date range
    const sessionsQuery = `
      SELECT 
        s.id,
        s.title,
        DATE(s.started_at) as session_date,
        CAST(s.started_at AS TIME) as session_time,
        s.started_at,
        s.ended_at,
        s.status,
        COUNT(DISTINCT ar.id) as total_participants,
        COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.id END) as present_count,
        COALESCE(ROUND((COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.id END)::numeric / 
                 NULLIF(COUNT(DISTINCT ar.id), 0) * 100), 2), 0) as attendance_rate,
        COALESCE(AVG(ar.total_duration_minutes), 0) as avg_duration_minutes
      FROM sessions s
      LEFT JOIN attendance_records ar ON s.id = ar.session_id
      WHERE s.class_id = $1 
        AND DATE(s.started_at) >= $2
        AND DATE(s.started_at) <= $3
        AND s.status IN ('active', 'ended')
      GROUP BY s.id, s.title, DATE(s.started_at), CAST(s.started_at AS TIME), s.started_at, s.ended_at, s.status
      ORDER BY DATE(s.started_at) ASC, CAST(s.started_at AS TIME) ASC
    `;

    const sessionsResult = await pool.query(sessionsQuery, [id, start, end]);
    
    console.log('Sessions Query Result:', { 
      rowCount: sessionsResult.rows.length,
      params: [id, start, end]
    });

    // Get student performance data
    const studentPerformanceQuery = `
      SELECT 
        st.id,
        st.student_id as student_number,
        st.full_name,
        COUNT(DISTINCT ar.session_id) as sessions_attended,
        COUNT(DISTINCT s.id) as total_sessions,
        COALESCE(ROUND((COUNT(DISTINCT ar.session_id)::numeric / 
                 NULLIF(COUNT(DISTINCT s.id), 0) * 100), 2), 0) as attendance_rate,
        COALESCE(AVG(ar.total_duration_minutes), 0) as avg_duration_minutes,
        COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.id END) as present_count,
        COUNT(DISTINCT CASE WHEN ar.status = 'late' THEN ar.id END) as late_count,
        COUNT(DISTINCT CASE WHEN ar.status = 'absent' THEN ar.id END) as absent_count
      FROM students st
      CROSS JOIN sessions s
      LEFT JOIN attendance_records ar ON ar.student_id = st.id AND ar.session_id = s.id
      WHERE st.class_id = $1
        AND s.class_id = $1
        AND DATE(s.started_at) >= $2
        AND DATE(s.started_at) <= $3
        AND s.status IN ('active', 'ended')
        AND st.deleted_at IS NULL
      GROUP BY st.id, st.full_name
      ORDER BY attendance_rate DESC, sessions_attended DESC
    `;

    const studentPerformanceResult = await pool.query(studentPerformanceQuery, [id, start, end]);

    // Get daily attendance heatmap data
    const heatmapQuery = `
      SELECT 
        DATE(s.started_at) as date,
        EXTRACT(DOW FROM DATE(s.started_at)) as day_of_week,
        EXTRACT(HOUR FROM CAST(s.started_at AS TIME)) as hour,
        COUNT(DISTINCT ar.id) as total_participants,
        COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.id END) as present_count,
        COALESCE(ROUND((COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.id END)::numeric / 
                 NULLIF(COUNT(DISTINCT ar.id), 0) * 100), 2), 0) as attendance_rate
      FROM sessions s
      LEFT JOIN attendance_records ar ON s.id = ar.session_id
      WHERE s.class_id = $1
        AND DATE(s.started_at) >= $2
        AND DATE(s.started_at) <= $3
        AND s.status IN ('active', 'ended')
      GROUP BY DATE(s.started_at), EXTRACT(DOW FROM DATE(s.started_at)), EXTRACT(HOUR FROM CAST(s.started_at AS TIME))
      ORDER BY date ASC
    `;

    const heatmapResult = await pool.query(heatmapQuery, [id, start, end]);

    const normalizedSchedules = normalizeClassSchedules(classData.schedule);
    const scheduleBundles = buildScheduleBundles({
      schedules: normalizedSchedules,
      sessions: sessionsResult.rows,
    });

    // Calculate overall statistics
    const overallStats = {
      totalSessions: sessionsResult.rows.length,
      avgAttendanceRate: sessionsResult.rows.length > 0
        ? (sessionsResult.rows.reduce((sum, s) => sum + parseFloat(s.attendance_rate || 0), 0) / sessionsResult.rows.length).toFixed(2)
        : 0,
      avgDuration: sessionsResult.rows.length > 0
        ? (sessionsResult.rows.reduce((sum, s) => sum + parseFloat(s.avg_duration_minutes || 0), 0) / sessionsResult.rows.length).toFixed(2)
        : 0,
      totalStudents: studentPerformanceResult.rows.length,
    };

    res.json({
      success: true,
      data: {
        class: classData,
        dateRange: { startDate: start, endDate: end },
        overallStats,
        sessionTrends: sessionsResult.rows,
        scheduleBundles,
        studentPerformance: studentPerformanceResult.rows,
        heatmapData: heatmapResult.rows,
      }
    });
  } catch (error) {
    console.error('Get class analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassStats,
  updateClassStatus,
  updateClassSchedule,
  getClassLinks,
  addClassLink,
  updateClassLink,
  deleteClassLink,
  getExemptedAccounts,
  addExemptedAccount,
  deleteExemptedAccount,
  getClassAnalytics
};
