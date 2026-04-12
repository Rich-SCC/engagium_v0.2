require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./src/routes/auth');
const classRoutes = require('./src/routes/classes');
const sessionRoutes = require('./src/routes/sessions');
const participationRoutes = require('./src/routes/participation');
const extensionTokenRoutes = require('./src/routes/extensionTokens');

// Import socket handlers
const socketHandler = require('./src/socket/socketHandler');
const {
  closePool,
  ensureParticipationLogsSchema,
  checkDatabaseHealth,
} = require('./src/config/database');
const { assertJwtSecretsConfigured } = require('./src/config/jwt');

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const parseTrustProxy = () => {
  const raw = process.env.TRUST_PROXY;
  if (!raw) {
    return 1;
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  if (normalized === 'loopback') return 'loopback';
  if (normalized === 'linklocal') return 'linklocal';
  if (normalized === 'uniquelocal') return 'uniquelocal';

  const numeric = Number.parseInt(normalized, 10);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return raw;
};

const parseAllowedOrigins = () => {
  const rawOrigins = process.env.CORS_ORIGIN;
  if (!rawOrigins) {
    return [
      'http://localhost:5173',
      'http://localhost:8888',
      'https://dev.engagium.app'
    ];
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

if (isProduction && allowedOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must be configured with at least one origin in production');
}

if (isProduction) {
  assertJwtSecretsConfigured();
}

// Store app globally for socket handler access
global.app = app;

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.disable('x-powered-by');
app.set('trust proxy', parseTrustProxy());

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const extractRateLimitIdentity = (req) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    // Key by token string prefix to avoid grouping all users behind one proxy IP.
    return `jwt:${authHeader.slice(7, 39)}`;
  }

  const extensionToken = req.headers['x-extension-token'];
  if (typeof extensionToken === 'string' && extensionToken.length > 0) {
    return `ext:${extensionToken.slice(0, 32)}`;
  }

  return req.ip;
};

const limiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '', 10) || (15 * 60 * 1000),
  max: Number.parseInt(process.env.RATE_LIMIT_MAX || '', 10) || 400,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: extractRateLimitIdentity,
});
app.use('/api/', limiter);

// Health check
app.get('/health', async (req, res) => {
  const databaseHealth = await checkDatabaseHealth();

  if (!databaseHealth.ready) {
    return res.status(503).json({
      status: 'NOT_READY',
      timestamp: new Date().toISOString(),
      database: 'unavailable'
    });
  }

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'ready'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/participation', participationRoutes);
app.use('/api/extension-tokens', extensionTokenRoutes);

// Socket connection handling
socketHandler(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await ensureParticipationLogsSchema();
  } catch (error) {
    console.error('❌ Failed to apply participation log schema migration:', error);
    if (isProduction) {
      process.exit(1);
    }
  }

  if (isProduction) {
    const databaseHealth = await checkDatabaseHealth();
    if (!databaseHealth.ready) {
      console.error('❌ Database is not ready during startup. Aborting server start.');
      process.exit(1);
    }
  }

  server.listen(PORT, () => {
    console.log(`🚀 Engagium Backend Server running on port ${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    console.log(`🔌 Socket.io server ready for connections`);
  });
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
  } else {
    console.error('❌ Server startup error:', error);
  }
  process.exit(1);
});

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down HTTP server...`);

  try {
    await new Promise((resolve) => server.close(resolve));

    if (global.io) {
      await new Promise((resolve) => global.io.close(resolve));
    }

    await closePool();

    console.log('HTTP server closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();