const express = require('express');
const { instructorAuth } = require('../middleware/auth');
const { flexibleAuth } = require('../middleware/flexibleAuth');
const {
  getParticipationLogs,
  addParticipationLog,
  getSessionSummary,
  getRecentActivity,
  addBulkParticipationLogs
} = require('../controllers/participationController');

const router = express.Router();

// Routes that work with both web app (JWT) and extension (extension token)
router.post('/sessions/:sessionId/logs', flexibleAuth, addParticipationLog);
router.post('/sessions/:sessionId/logs/bulk', flexibleAuth, addBulkParticipationLogs);

// Web app only routes
router.use(instructorAuth);

// Session-specific participation routes
router.get('/sessions/:sessionId/logs', getParticipationLogs);
router.get('/sessions/:sessionId/summary', getSessionSummary);
router.get('/sessions/:sessionId/recent', getRecentActivity);

module.exports = router;