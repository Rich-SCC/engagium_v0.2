const { Pool } = require('pg');
const { getSecret, assertSecretNotPlaceholder } = require('./secretLoader');

const isProduction = process.env.NODE_ENV === 'production';

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
};

const parseIntOrDefault = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const resolvePoolConfig = () => {
  const connectionString = getSecret('DATABASE_URL');
  const dbPassword = getSecret('DB_PASSWORD', {
    required: isProduction,
    fallback: isProduction ? undefined : 'engagium_password',
  });
  const hasExplicitDatabaseVars = Boolean(
    process.env.DB_HOST?.trim() ||
    process.env.DB_NAME?.trim() ||
    process.env.DB_USER?.trim() ||
    process.env.DB_PASSWORD?.trim() ||
    process.env.DB_PASSWORD_FILE?.trim()
  );
  const maxConnections = parseIntOrDefault(process.env.DB_POOL_MAX, isProduction ? 30 : 20);

  if (isProduction) {
    assertSecretNotPlaceholder('DB_PASSWORD', dbPassword);
  }

  if (connectionString && !hasExplicitDatabaseVars && !/CHANGE_ME|YOUR-|your-|example/i.test(connectionString)) {
    return {
      connectionString,
      max: maxConnections,
      idleTimeoutMillis: parseIntOrDefault(process.env.DB_IDLE_TIMEOUT_MS, 30000),
      connectionTimeoutMillis: parseIntOrDefault(process.env.DB_CONNECTION_TIMEOUT_MS, 2000),
    };
  }

  return {
    host: isProduction ? requireEnv('DB_HOST') : (process.env.DB_HOST || 'localhost'),
    port: parseIntOrDefault(process.env.DB_PORT, 5432),
    database: isProduction ? requireEnv('DB_NAME') : (process.env.DB_NAME || 'engagium'),
    user: isProduction ? requireEnv('DB_USER') : (process.env.DB_USER || 'engagium_user'),
    password: dbPassword,
    max: maxConnections,
    idleTimeoutMillis: parseIntOrDefault(process.env.DB_IDLE_TIMEOUT_MS, 30000),
    connectionTimeoutMillis: parseIntOrDefault(process.env.DB_CONNECTION_TIMEOUT_MS, 2000),
  };
};

const pool = new Pool({
  ...resolvePoolConfig(),
});

// Test database connection
pool.on('connect', () => {
  if (!isProduction) {
    console.log('📦 Connected to PostgreSQL database');
  }
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  ensureParticipationLogsSchema,
  checkDatabaseHealth,
  closePool,
};

async function ensureParticipationLogsSchema() {
  await pool.query(`
    ALTER TABLE IF EXISTS participation_logs
      ALTER COLUMN student_id DROP NOT NULL
  `);

  await pool.query(`
    ALTER TABLE IF EXISTS participation_logs
      DROP CONSTRAINT IF EXISTS participation_logs_student_id_fkey
  `);

  await pool.query(`
    ALTER TABLE IF EXISTS participation_logs
      ADD CONSTRAINT participation_logs_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
  `);
}

async function checkDatabaseHealth() {
  try {
    await pool.query('SELECT 1');
    return { ready: true };
  } catch (error) {
    return { ready: false, error };
  }
}

async function closePool() {
  await pool.end();
}