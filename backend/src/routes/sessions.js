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
  getSessionStudents
} = require('../controllers/sessionController');

const router = express.Router();

// All session routes require instructor authentication
router.use(instructorAuth);

// Session collection routes
router.get('/', getSessions);
router.get('/stats', getSessionStats);
router.post('/', createSession);

// Individual session routes
router.get('/:id', getSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

// Session lifecycle management
router.put('/:id/start', startSession);
router.put('/:id/end', endSession);

// Session student management
router.get('/:id/students', getSessionStudents);

module.exports = router;