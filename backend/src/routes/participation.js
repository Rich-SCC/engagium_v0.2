const express = require('express');
const { instructorAuth } = require('../middleware/auth');
const {
  getParticipationLogs,
  addParticipationLog,
  getSessionSummary,
  getRecentActivity,
  addBulkParticipationLogs
} = require('../controllers/participationController');

const router = express.Router();

// All participation routes require instructor authentication
router.use(instructorAuth);

// Session-specific participation routes
router.get('/sessions/:sessionId/logs', getParticipationLogs);
router.post('/sessions/:sessionId/logs', addParticipationLog);
router.post('/sessions/:sessionId/logs/bulk', addBulkParticipationLogs);
router.get('/sessions/:sessionId/summary', getSessionSummary);
router.get('/sessions/:sessionId/recent', getRecentActivity);

module.exports = router;