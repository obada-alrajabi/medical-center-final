import pg from 'pg';
const { Pool } = pg;

// Prevent pg from converting DATE columns (OID 1082) to JS Date objects.
// This preserves the database date string (e.g. '2026-07-10') exactly as is,
// preventing any timezone-shifting issues when serializing to JSON.
pg.types.setTypeParser(1082, (val) => val);

// Support both DATABASE_URL (Replit) and individual PG* env vars (Hostinger/cPanel)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432'),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: false,
      }
);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Set Asia/Jerusalem timezone on every new connection so that
// CURRENT_DATE, NOW(), and DEFAULT CURRENT_DATE all use local time
// instead of the PostgreSQL server's UTC default.
pool.on('connect', (client) => {
  client.query("SET timezone = 'Asia/Jerusalem'").catch((err) => {
    console.error('Failed to set timezone on client:', err.message);
  });
});

/**
 * Verifies the pool can still talk to Postgres. Used after a DB restore.
 */
export async function reconnectPool() {
  await pool.query('SELECT 1');
  return true;
}

export default pool;
