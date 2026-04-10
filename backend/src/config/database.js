const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'engagium',
  user: process.env.DB_USER || 'engagium_user',
  password: process.env.DB_PASSWORD || 'engagium_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  ensureParticipationLogsSchema
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