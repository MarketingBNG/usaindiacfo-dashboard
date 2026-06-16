const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => console.error('DB pool error:', err.message));

module.exports = {
  query: (sql, params) => pool.query(sql, params),

  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS platform_tokens (
        platform      TEXT PRIMARY KEY,
        access_token  TEXT NOT NULL,
        refresh_token TEXT,
        expires_at    TIMESTAMPTZ,
        metadata      JSONB DEFAULT '{}',
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS metrics_cache (
        platform   TEXT NOT NULL,
        cache_key  TEXT NOT NULL,
        data       JSONB NOT NULL,
        fetched_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (platform, cache_key)
      );
    `);
  },
};
