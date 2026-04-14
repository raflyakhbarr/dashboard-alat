import fs from 'fs';
import path from 'path';
import pool from '../db';

async function runMigration() {
  const migrationPath = path.join(__dirname, '002_update_users_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    console.log('Running migration 002...');
    await pool.query(sql);
    console.log('Migration completed successfully!');

    // Verify data
    const result = await pool.query('SELECT email, nama, role, created_at FROM users ORDER BY role');
    console.log('\nUsers in database:');
    result.rows.forEach(row => {
      console.log(`- ${row.email} (${row.nama} - ${row.role})`);
    });
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
