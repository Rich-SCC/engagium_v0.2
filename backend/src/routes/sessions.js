const express = require('express');
const { instructorAuth } = require('../middleware/auth');
const {
  getSessions,
  getSession,
  createSession,
  updateSession,
  startSession,
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
  getClassSessions
} = require('../controllers/sessionController');

const router = express.Router();

// All session routes require instructor authentication
router.use(instructorAuth);

// Session collection routes
router.get('/', getSessions);
router.get('/stats', getSessionStats);
router.get('/date-range', getSessionsByDateRange);
router.get('/calendar', getCalendarData);
router.post('/', createSession);

// Individual session routes
router.get('/:id', getSession);
router.get('/:id/full', getSessionWithAttendance);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

// Session lifecycle management
router.put('/:id/start', startSession);
router.put('/:id/end', endSession);

// Session student management
router.get('/:id/students', getSessionStudents);

// Attendance routes
router.post('/:id/attendance/bulk', submitBulkAttendance);
router.get('/:id/attendance', getSessionAttendance);
router.get('/:id/attendance/stats', getAttendanceStats);

module.exports = router;