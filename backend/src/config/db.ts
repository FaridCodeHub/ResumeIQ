import 'dotenv/config';
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD || undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error: Error) => {
  console.error('PostgreSQL pool error:', error.message);
});

export async function testDatabaseConnection(): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT current_database() AS database_name, current_user AS username, NOW() AS current_time'
    );

    console.log('PostgreSQL connected successfully.');
    console.log('Database:', result.rows[0].database_name);
    console.log('User:', result.rows[0].username);
    console.log('Time:', result.rows[0].current_time);
  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
    throw error;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
  console.log('PostgreSQL connection closed.');
}