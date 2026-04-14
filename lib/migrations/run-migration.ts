import fs from 'fs';
import path from 'path';
import pool from '../db';

async function runMigration() {
  const migrationPath = path.join(__dirname, '001_create_users.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration completed successfully!');

    // Verify data
    const result = await pool.query('SELECT username, role, created_at FROM users');
    console.log('\nUsers in database:');
    result.rows.forEach(row => {
      console.log(`- ${row.username} (${row.role})`);
    });
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
