import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const sanitizeFileToken = (value) => {
  const token = String(value || 'session_bundle')
    .trim()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

  return token || 'session_bundle';
};

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTimeForExport = (value) => {
  const date = toDate(value);
  if (!date) return '';

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatTimeForExport = (value) => {
  const date = toDate(value);
  if (!date) return '';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const toAttendanceLabel = (status) => {
  const normalized = String(status || 'absent').trim().toLowerCase();

  if (normalized === 'present') return 'Present';
  if (normalized === 'late') return 'Late';
  if (normalized === 'absent') return 'Absent';

  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Absent';
};

const toMatchLabel = (studentId) => (studentId ? 'Check' : 'X');

const formatIntervalDetails = (intervals = [], { timeOnly = false } = {}) => {
  if (!Array.isArray(intervals) || intervals.length === 0) {
    return 'No intervals recorded';
  }

  return intervals
    .map((interval, index) => {
      const formatter = timeOnly ? formatTimeForExport : formatDateTimeForExport;
      const joinedAt = formatter(
        interval.joined_at || interval.join_at || interval.start_at || interval.started_at
      );
      const leftAt = formatter(
        interval.left_at || interval.leave_at || interval.end_at || interval.ended_at
      );
      const duration = Number(interval.duration_minutes || interval.duration || 0);
      const durationLabel = duration > 0 ? ` (${duration} min)` : '';

      return `${index + 1}) ${joinedAt || '-'} to ${leftAt || '-'}${durationLabel}`;
    })
    .join(' | ');
};

const buildAttendanceRows = (attendance = [], { intervalTimeOnly = false } = {}) => {
  return attendance.map((record) => {
    const intervals = Array.isArray(record.intervals) ? record.intervals : [];
    return {
      studentName: record.student_name || record.full_name || record.participant_name || 'Unknown Student',
      attendanceStatus: toAttendanceLabel(record.status),
      attendanceMatch: toMatchLabel(record.student_id),
      timeInClassMinutes: Number(record.total_duration_minutes || 0),
      firstJoinAt: record.first_joined_at || null,
      lastLeaveAt: record.last_left_at || null,
      firstJoinTime: formatDateTimeForExport(record.first_joined_at),
      lastLeaveTime: formatDateTimeForExport(record.last_left_at),
      timesJoined: intervals.length,
      intervalDetails: formatIntervalDetails(intervals, { timeOnly: intervalTimeOnly }),
    };
  });
};

const categoryLabels = {
  chat: 'Chat Message',
  reaction: 'Reaction',
  hand_raise: 'Hand Raise',
  mic_toggle: 'Microphone Activity',
  poll_response: 'Poll Response',
  join: 'Join',
  leave: 'Leave',
};

const toCategory = (interactionType) => {
  const raw = String(interactionType || '').trim().toLowerCase();
  return categoryLabels[raw] || (raw ? raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Other');
};

const summarizeParticipation = (logs = []) => {
  const participantMap = new Map();

  logs.forEach((log) => {
    const studentName = String(log.full_name || log.student_name || '').trim();
    const meetingName = String(log.participant_name || '').trim();
    const displayName = studentName || meetingName || 'Unknown Participant';
    const key = log.student_id
      ? `student:${log.student_id}`
      : `name:${displayName.toLowerCase()}`;

    if (!participantMap.has(key)) {
      participantMap.set(key, {
        studentName: displayName,
        totalInteractions: 0,
        firstActivityAt: null,
        lastActivityAt: null,
        countsByCategory: {},
      });
    }

    const bucket = participantMap.get(key);
    const category = toCategory(log.interaction_type);
    const timestamp = toDate(log.timestamp);

    bucket.totalInteractions += 1;
    bucket.countsByCategory[category] = (bucket.countsByCategory[category] || 0) + 1;

    if (timestamp && (!bucket.firstActivityAt || timestamp < bucket.firstActivityAt)) {
      bucket.firstActivityAt = timestamp;
    }
    if (timestamp && (!bucket.lastActivityAt || timestamp > bucket.lastActivityAt)) {
      bucket.lastActivityAt = timestamp;
    }
  });

  const categories = [...new Set(logs.map((log) => toCategory(log.interaction_type)))].sort((a, b) =>
    a.localeCompare(b)
  );

  const participants = [...participantMap.values()].sort((left, right) =>
    left.studentName.localeCompare(right.studentName)
  );

  return { categories, participants };
};

const drawPdfHeader = (doc, { reportTitle, sessionDate, plannedWindow, actualWindow }) => {
  doc.setFontSize(14);
  doc.text(reportTitle, 40, 36);

  doc.setFontSize(10);
  doc.text(`Session Date: ${sessionDate || '-'}`, 40, 54);
  doc.text(`Planned Window: ${plannedWindow || '-'}`, 40, 68);
  doc.text(`Actual Window: ${actualWindow || '-'}`, 40, 82);
};

const drawPdfFooter = (doc, generatedAt) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(9);
  doc.text(`Generated: ${generatedAt}`, 40, pageHeight - 16);

  const pageNumber = doc.getCurrentPageInfo().pageNumber;
  doc.text(`Page ${pageNumber}`, pageWidth - 70, pageHeight - 16);
};

const excelSafeValue = (value) => {
  const stringValue = String(value ?? '');

  if (/^[=+\-@]/.test(stringValue)) {
    return `'${stringValue}`;
  }

  return stringValue;
};

const csvCell = (value) => {
  const safe = excelSafeValue(value);
  const escaped = safe.replace(/"/g, '""');
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

const buildCsv = (headers, rows) => {
  const headerLine = headers.map(csvCell).join(',');
  const rowLines = rows.map((row) => row.map(csvCell).join(','));
  // UTF-8 BOM + CRLF helps Excel detect encoding and line breaks correctly.
  return `\ufeff${[headerLine, ...rowLines].join('\r\n')}\r\n`;
};

export const buildAttendanceBundleCsv = ({ attendance = [] } = {}) => {
  const attendanceRows = buildAttendanceRows(attendance);
  const headers = [
    'student_name',
    'attendance_status',
    'attendance_match',
    'time_in_class_minutes',
    'first_join_time',
    'last_leave_time',
    'times_joined',
    'interval_details',
  ];

  const rows = attendanceRows.map((row) => [
    row.studentName,
    row.attendanceStatus,
    row.attendanceMatch,
    row.timeInClassMinutes,
    row.firstJoinTime,
    row.lastLeaveTime,
    row.timesJoined,
    row.intervalDetails,
  ]);

  return buildCsv(headers, rows);
};

export const buildParticipationBundleCsv = ({ logs = [] } = {}) => {
  const { categories, participants } = summarizeParticipation(logs);

  const headers = [
    'student_name',
    'total_participation_events',
    'first_participation_time',
    'last_participation_time',
    ...categories,
  ];

  const rows = participants.map((participant) => [
      participant.studentName,
      participant.totalInteractions,
      formatDateTimeForExport(participant.firstActivityAt),
      formatDateTimeForExport(participant.lastActivityAt),
      ...categories.map((category) => participant.countsByCategory[category] || 0),
    ]);

  return buildCsv(headers, rows);
};

export const buildAttendanceBundlePdf = ({
  attendance = [],
  reportTitle = 'Attendance Report',
  sessionDate = '-',
  plannedWindow = '-',
  actualWindow = '-',
} = {}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const generatedAt = formatDateTimeForExport(new Date());
  const attendanceRows = buildAttendanceRows(attendance, { intervalTimeOnly: true });
  drawPdfHeader(doc, { reportTitle, sessionDate, plannedWindow, actualWindow });

  autoTable(doc, {
    startY: 96,
    head: [[
      'Student Name',
      'Status',
      'Matched',
      'Minutes in Class',
      'First Join',
      'Last Leave',
      'Times Joined',
      'Interval Details',
    ]],
    body: attendanceRows.map((row) => [
      row.studentName,
      row.attendanceStatus,
      row.attendanceMatch,
      row.timeInClassMinutes,
      formatTimeForExport(row.firstJoinAt),
      formatTimeForExport(row.lastLeaveAt),
      row.timesJoined,
      row.intervalDetails,
    ]),
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: [31, 41, 55] },
    margin: { bottom: 30 },
    didDrawPage: () => {
      drawPdfFooter(doc, generatedAt);
    },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 55 },
      2: { cellWidth: 45 },
      3: { cellWidth: 60 },
      4: { cellWidth: 75 },
      5: { cellWidth: 75 },
      6: { cellWidth: 50 },
      7: { cellWidth: 250 },
    },
  });

  return doc;
};

export const buildParticipationBundlePdf = ({
  logs = [],
  reportTitle = 'Participation Summary Report',
  sessionDate = '-',
  plannedWindow = '-',
  actualWindow = '-',
} = {}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const generatedAt = formatDateTimeForExport(new Date());
  const { categories, participants } = summarizeParticipation(logs);
  drawPdfHeader(doc, { reportTitle, sessionDate, plannedWindow, actualWindow });

  autoTable(doc, {
    startY: 96,
    head: [[
      'Student Name',
      'Total Events',
      'First Participation',
      'Last Participation',
      ...categories,
    ]],
    body: participants.map((participant) => [
      participant.studentName,
      participant.totalInteractions,
      formatTimeForExport(participant.firstActivityAt),
      formatTimeForExport(participant.lastActivityAt),
      ...categories.map((category) => participant.countsByCategory[category] || 0),
    ]),
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: [31, 41, 55] },
    margin: { bottom: 30 },
    didDrawPage: () => {
      drawPdfFooter(doc, generatedAt);
    },
  });

  return doc;
};

export const downloadCsvFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
};

export const downloadPdfFile = (doc, filename) => {
  doc.save(filename);
};

export const makeReportBaseName = ({ classInfo, bundleId }) => {
  const classCode = sanitizeFileToken(classInfo?.class_code || classInfo?.name || 'class');
  const bundleToken = sanitizeFileToken(bundleId || 'bundle');
  return `${classCode}_${bundleToken}`;
};
