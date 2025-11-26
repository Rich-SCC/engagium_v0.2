const express = require('express');
const { instructorAuth } = require('../middleware/auth');
const { flexibleAuth } = require('../middleware/flexibleAuth');
const {
  getSessions,
  getSession,
  updateSession,
  endSession,
  deleteSession,
  getSessionStats,
  getSessionStudents,
  getSessionWithAttendance,
  submitBulkAttendance,
  getSessionAttendance,
  getAttendanceStats,
  getSessionsByDateRange,
  getCalendarData,
  getClassSessions,
  startSessionFromMeeting,
  endSessionWithTimestamp
} = require('../controllers/sessionController');

const router = express.Router();

// Stats route MUST come before param routes
router.get('/stats', instructorAuth, getSessionStats);
router.get('/date-range', instructorAuth, getSessionsByDateRange);
router.get('/calendar', instructorAuth, getCalendarData);

// Routes that work with both web app (JWT) and extension (extension token)
router.post('/start-from-meeting', flexibleAuth, startSessionFromMeeting);
router.put('/:id/end-with-timestamp', flexibleAuth, endSessionWithTimestamp);
router.get('/:id', flexibleAuth, getSession);
router.get('/:id/students', flexibleAuth, getSessionStudents);

// All other routes require instructor authentication (web app only)
router.use(instructorAuth);

// Session collection routes
router.get('/', getSessions);

// Individual session routes
router.get('/:id/full', getSessionWithAttendance);
router.put('/:id', updateSession); // Only allows title updates post-session
router.delete('/:id', deleteSession);

// Session lifecycle management
router.put('/:id/end', endSession); // Manual end (legacy)

// Attendance routes
router.post('/:id/attendance/bulk', submitBulkAttendance);
router.get('/:id/attendance', getSessionAttendance);
router.get('/:id/attendance/stats', getAttendanceStats);

module.exports = router;