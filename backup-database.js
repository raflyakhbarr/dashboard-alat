const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Create timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFileName = `backup_before_redesign_${timestamp}.sql`;
  const backupPath = path.join(__dirname, backupFileName);

  console.log('Creating database backup...');
  console.log(`Backup file: ${backupFileName}`);

  // Try to find pg_dump in common locations
  const pgPaths = [
    'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe',
    'C:\\PostgreSQL\\15\\bin\\pg_dump.exe',
    'C:\\PostgreSQL\\14\\bin\\pg_dump.exe',
    'C:\\PostgreSQL\\13\\bin\\pg_dump.exe',
  ];

  let pgDumpPath = null;
  for (const p of pgPaths) {
    if (fs.existsSync(p)) {
      pgDumpPath = p;
      console.log(`Found pg_dump at: ${p}`);
      break;
    }
  }

  if (!pgDumpPath) {
    console.log('pg_dump not found in common locations.');
    console.log('Please install PostgreSQL or add it to your PATH.');
    console.log('');
    console.log('Alternative: Create backup manually using pgAdmin:');
    console.log('1. Open pgAdmin');
    console.log('2. Right-click on dashboard_alat database');
    console.log('3. Select Backup');
    console.log('4. Save as backup_before_redesign_manual.sql');
    process.exit(1);
  }

  // Create backup command
  const cmd = `"${pgDumpPath}" -h localhost -U postgres -d dashboard_alat > "${backupPath}"`;

  console.log('Running backup command...');
  console.log('You may be prompted for password (123111)');

  // Set password as environment variable
  const env = { ...process.env, PGPASSWORD: '123111' };

  execSync(cmd, {
    stdio: 'inherit',
    env,
    shell: true
  });

  // Verify backup was created
  const stats = fs.statSync(backupPath);
  console.log('');
  console.log('✓ Backup created successfully!');
  console.log(`  File: ${backupFileName}`);
  console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log('');

  if (stats.size === 0) {
    console.error('⚠ WARNING: Backup file is 0 bytes!');
    process.exit(1);
  }

} catch (error) {
  console.error('Error creating backup:', error.message);
  process.exit(1);
}