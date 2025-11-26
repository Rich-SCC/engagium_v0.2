const express = require('express');
const { auth } = require('../middleware/auth');
const {
  generateToken,
  getTokens,
  revokeToken,
  revokeAllTokens,
  verifyToken
} = require('../controllers/extensionTokenController');

const router = express.Router();

// All routes require authentication except verify
router.post('/generate', auth, generateToken);
router.get('/', auth, getTokens);
router.delete('/revoke-all', auth, revokeAllTokens);
router.delete('/:id', auth, revokeToken);

// Public route for extension to verify token
router.post('/verify', verifyToken);

module.exports = router;
