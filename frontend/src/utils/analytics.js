const INTERACTION_TYPES = ['chat', 'reaction', 'mic_toggle', 'hand_raise', 'manual_entry', 'camera_toggle'];

export const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(toNumber(value) * factor) / factor;
};

export const formatMinutes = (minutes) => {
  const totalMinutes = Math.max(0, toNumber(minutes));

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.round(totalMinutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${Math.round(totalMinutes)}m`;
};

export const createEmptyInteractionTotals = () => ({
  totalInteractions: 0,
  chat: 0,
  reaction: 0,
  mic_toggle: 0,
  hand_raise: 0,
  manual_entry: 0,
  camera_toggle: 0,
  speakingProxySeconds: 0,
  uniqueStudents: 0,
});

export const createEmptyStudentParticipation = (studentId = null, displayName = 'Unknown participant') => ({
  student_id: studentId,
  full_name: displayName,
  student_name: displayName,
  participant_name: displayName,
  total_interactions: 0,
  chat_messages: 0,
  reactions: 0,
  hand_raises: 0,
  mic_toggles: 0,
  speaking_proxy_seconds: 0,
  sessions_with_activity: 0,
});

export const aggregateSessionLogs = (logs = []) => {
  const totals = createEmptyInteractionTotals();
  const studentMap = new Map();
  const activeStudentIds = new Set();

  logs.forEach((log) => {
    const interactionType = log?.interaction_type || 'unknown';
    if (INTERACTION_TYPES.includes(interactionType)) {
      totals[interactionType] += 1;
    }
    totals.totalInteractions += 1;

    if (interactionType === 'mic_toggle') {
      totals.speakingProxySeconds += toNumber(log?.additional_data?.speakingDurationSeconds);
    }

    const studentId = log?.student_id || null;
    if (!studentId) {
      return;
    }

    activeStudentIds.add(studentId);

    if (!studentMap.has(studentId)) {
      const displayName = log?.full_name || log?.student_name || log?.participant_name || 'Unknown participant';
      studentMap.set(studentId, createEmptyStudentParticipation(studentId, displayName));
    }

    const student = studentMap.get(studentId);
    student.total_interactions += 1;

    if (interactionType === 'chat') {
      student.chat_messages += 1;
    } else if (interactionType === 'reaction') {
      student.reactions += 1;
    } else if (interactionType === 'hand_raise') {
      student.hand_raises += 1;
    } else if (interactionType === 'mic_toggle') {
      student.mic_toggles += 1;
      student.speaking_proxy_seconds += toNumber(log?.additional_data?.speakingDurationSeconds);
    }
  });

  return {
    totals: {
      ...totals,
      speakingProxyMinutes: round(totals.speakingProxySeconds / 60, 1),
    },
    students: [...studentMap.values()].map((student) => ({
      ...student,
      speaking_proxy_minutes: round(student.speaking_proxy_seconds / 60, 1),
    })),
    uniqueStudents: activeStudentIds.size,
  };
};

export const mergeParticipationSnapshots = (snapshots = []) => {
  const totals = createEmptyInteractionTotals();
  const studentMap = new Map();
  const sessions = [];

  snapshots.forEach((snapshot) => {
    const sessionTotals = snapshot?.totals || createEmptyInteractionTotals();
    const sessionId = snapshot?.sessionId || snapshot?.session_id || snapshot?.id || null;

    totals.totalInteractions += toNumber(sessionTotals.totalInteractions);
    totals.chat += toNumber(sessionTotals.chat);
    totals.reaction += toNumber(sessionTotals.reaction);
    totals.mic_toggle += toNumber(sessionTotals.mic_toggle);
    totals.hand_raise += toNumber(sessionTotals.hand_raise);
    totals.manual_entry += toNumber(sessionTotals.manual_entry);
    totals.camera_toggle += toNumber(sessionTotals.camera_toggle);
    totals.speakingProxySeconds += toNumber(sessionTotals.speakingProxySeconds);
    totals.uniqueStudents += toNumber(snapshot?.uniqueStudents);

    sessions.push({
      sessionId,
      totals: {
        ...sessionTotals,
        speakingProxyMinutes: round(toNumber(sessionTotals.speakingProxySeconds) / 60, 1),
      },
      students: snapshot?.students || [],
    });

    (snapshot?.students || []).forEach((student) => {
      const studentId = student?.student_id || student?.id || null;
      if (!studentId) {
        return;
      }

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, createEmptyStudentParticipation(studentId, student?.full_name || student?.student_name || student?.participant_name || 'Unknown participant'));
      }

      const current = studentMap.get(studentId);
      current.full_name = current.full_name || student?.full_name || student?.student_name || student?.participant_name || 'Unknown participant';
      current.student_name = current.student_name || student?.student_name || current.full_name;
      current.participant_name = current.participant_name || student?.participant_name || current.full_name;
      current.total_interactions += toNumber(student?.total_interactions);
      current.chat_messages += toNumber(student?.chat_messages);
      current.reactions += toNumber(student?.reactions);
      current.hand_raises += toNumber(student?.hand_raises);
      current.mic_toggles += toNumber(student?.mic_toggles);
      current.speaking_proxy_seconds += toNumber(student?.speaking_proxy_seconds);
      current.sessions_with_activity += 1;
    });
  });

  const studentTotals = [...studentMap.values()].map((student) => ({
    ...student,
    speaking_proxy_minutes: round(student.speaking_proxy_seconds / 60, 1),
  }));

  studentTotals.sort((left, right) => {
    const totalGap = toNumber(right.total_interactions) - toNumber(left.total_interactions);
    if (totalGap !== 0) {
      return totalGap;
    }

    return toNumber(right.speaking_proxy_minutes) - toNumber(left.speaking_proxy_minutes);
  });

  return {
    totals: {
      ...totals,
      speakingProxyMinutes: round(totals.speakingProxySeconds / 60, 1),
    },
    students: studentTotals,
    sessions,
  };
};

export const computeEngagementScore = ({
  attendanceRate = 0,
  avgDurationMinutes = 0,
  totalInteractions = 0,
  speakingProxyMinutes = 0,
  classAverages = {},
  classMaxima = {},
}) => {
  const attendanceScore = clamp(toNumber(attendanceRate));
  const durationBaseline = toNumber(classAverages.avgDurationMinutes) || toNumber(avgDurationMinutes) || 0;
  const durationScore = durationBaseline > 0
    ? clamp((toNumber(avgDurationMinutes) / durationBaseline) * 100)
    : attendanceScore;

  const interactionScore = classMaxima.totalInteractions > 0
    ? clamp((toNumber(totalInteractions) / classMaxima.totalInteractions) * 100)
    : 0;

  const speakingScore = classMaxima.speakingProxyMinutes > 0
    ? clamp((toNumber(speakingProxyMinutes) / classMaxima.speakingProxyMinutes) * 100)
    : 0;

  return round(
    (attendanceScore * 0.45) +
    (durationScore * 0.15) +
    (interactionScore * 0.25) +
    (speakingScore * 0.15),
    1
  );
};

export const getParticipationSeries = (snapshot = {}) => ({
  chat: toNumber(snapshot?.totals?.chat),
  reaction: toNumber(snapshot?.totals?.reaction),
  mic_toggle: toNumber(snapshot?.totals?.mic_toggle),
  hand_raise: toNumber(snapshot?.totals?.hand_raise),
  speakingProxyMinutes: toNumber(snapshot?.totals?.speakingProxyMinutes),
  totalInteractions: toNumber(snapshot?.totals?.totalInteractions),
});
