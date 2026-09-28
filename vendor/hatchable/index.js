import pg from 'pg';

// Minimal stub to satisfy `import { db } from 'hatchable'` used by the app.
// It uses `pg` and DATABASE_URL from env to provide a `db.query` API.

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const db = {
  query: async (text, params) => {
    const client = await pool.connect();
    try {
      const res = await client.query(text, params);
      return res;
    } finally {
      client.release();
    }
  }
};

export default { db };
