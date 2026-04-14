const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFileName = `backup_before_redesign_${timestamp}.sql`;
  const backupPath = path.join(__dirname, backupFileName);

  console.log('Creating database backup using Node.js...');
  console.log(`Backup file: ${backupFileName}`);

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'dashboard_alat',
    user: 'postgres',
    password: '123111',
  });

  try {
    await pool.connect();
    console.log('✓ Connected to database');

    let backupContent = '';
    backupContent += `-- Database Backup: dashboard_alat\n`;
    backupContent += `-- Created: ${new Date().toISOString()}\n`;
    backupContent += `-- Backup before redesign migration\n`;
    backupContent += `-- \n\n`;

    // Get all tables
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows;

    console.log(`Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`  - ${t.table_name}`));

    // Backup each table
    for (const table of tables) {
      const tableName = table.table_name;

      console.log(`Backing up table: ${tableName}...`);

      // Get CREATE TABLE statement
      const createTableQuery = `
        SELECT 'CREATE TABLE ' || table_name || ' (' ||
          string_agg(
            column_name || ' ' ||
              data_type ||
              CASE WHEN character_maximum_length IS NOT NULL
                THEN '(' || character_maximum_length || ')'
                ELSE '' END ||
              CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
              CASE WHEN column_default IS NOT NULL
                THEN ' DEFAULT ' || column_default
                ELSE '' END,
            ', '
          ) || ');' AS create_statement
        FROM information_schema.columns
        WHERE table_name = $1
        AND table_schema = 'public'
        GROUP BY table_name;
      `;

      try {
        const createResult = await pool.query(createTableQuery, [tableName]);
        if (createResult.rows.length > 0) {
          backupContent += `\n-- Table: ${tableName}\n`;
          backupContent += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
          backupContent += createResult.rows[0].create_statement + '\n\n';

          // Get all data
          const dataQuery = `SELECT * FROM ${tableName};`;
          const dataResult = await pool.query(dataQuery);

          if (dataResult.rows.length > 0) {
            backupContent += `-- Data for ${tableName}: ${dataResult.rows.length} rows\n`;

            for (const row of dataResult.rows) {
              const columns = Object.keys(row);
              const values = columns.map(col => {
                const val = row[col];
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                if (val instanceof Date) return `'${val.toISOString()}'`;
                return val;
              });

              backupContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            }
            backupContent += '\n';
          }

          console.log(`  ✓ Backed up ${dataResult.rows.length} rows`);
        }
      } catch (error) {
        console.log(`  ⚠ Warning: Could not backup table ${tableName}: ${error.message}`);
        backupContent += `\n-- Warning: Could not backup table ${tableName}: ${error.message}\n\n`;
      }
    }

    // Write backup file
    fs.writeFileSync(backupPath, backupContent);

    const stats = fs.statSync(backupPath);
    console.log('\n✓ Backup created successfully!');
    console.log(`  File: ${backupFileName}`);
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log('');

    if (stats.size === 0) {
      console.error('⚠ WARNING: Backup file is 0 bytes!');
      process.exit(1);
    }

    console.log('Backup contains:');
    console.log(`  - ${tables.length} tables`);
    console.log(`  - Schema and data`);

  } catch (error) {
    console.error('Error creating backup:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

backupDatabase();
