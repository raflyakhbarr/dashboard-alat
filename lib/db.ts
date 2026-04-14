import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'dashboard_alat',
  user: 'postgres',
  password: '123111',
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

export default pool;
