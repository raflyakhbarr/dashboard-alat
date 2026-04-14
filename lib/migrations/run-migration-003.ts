import fs from 'fs';
import path from 'path';
import pool from '../db';

async function runMigration() {
  const migrationPath = path.join(__dirname, '003_create_rtg_tables.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    console.log('Running migration 003 - Create RTG tables...');
    await pool.query(sql);
    console.log('✓ Migration completed successfully!');

    // Verify RTG Groups
    const groups = await pool.query('SELECT * FROM rtg_groups ORDER BY nama_group');
    console.log('\n📋 RTG Groups:');
    groups.rows.forEach((row: any) => {
      console.log(`  - ${row.nama_group} (${row.lokasi})`);
    });

    // Verify RTG Units
    const units = await pool.query(`
      SELECT u.kode_rtg, u.nama_rtg, g.nama_group, u.status_kondisi
      FROM rtg_units u
      LEFT JOIN rtg_groups g ON u.group_rtg_id = g.id
      ORDER BY u.kode_rtg
    `);
    console.log('\n🔧 RTG Units:');
    units.rows.forEach((row: any) => {
      console.log(`  - ${row.kode_rtg} | ${row.nama_rtg} | ${row.nama_group || 'No Group'} | Status: ${row.status_kondisi}`);
    });

    // Status summary
    const summary = await pool.query(`
      SELECT status_kondisi, COUNT(*) as total
      FROM rtg_units
      GROUP BY status_kondisi
      ORDER BY total DESC
    `);
    console.log('\n📊 Status Summary:');
    summary.rows.forEach((row: any) => {
      const status = row.status_kondisi.replace(/_/g, ' ');
      console.log(`  - ${status}: ${row.total} unit`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
