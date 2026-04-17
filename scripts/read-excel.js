const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'FORM KESIAPAN ALAT RTG(1-24).xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  console.log('\n📊 SHEET NAMES:');
  console.log(workbook.SheetNames.join(', '));
  console.log('\n');

  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`SHEET ${index + 1}: ${sheetName}`);
    console.log('='.repeat(80));

    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (jsonData.length > 0) {
      // Show headers
      const headers = jsonData[0];
      console.log('\n📋 COLUMNS:');
      console.log(headers.map((h, i) => `${i + 1}. ${h || '(empty)'}`).join('\n'));
      console.log('\n');

      // Show first 5 rows of data
      console.log('📄 FIRST 5 ROWS OF DATA:');
      console.log('-'.repeat(80));

      jsonData.slice(0, 6).forEach((row, rowIndex) => {
        if (rowIndex === 0) {
          console.log('\n🔑 HEADER:');
          console.log(row.map((cell, i) => `[${i + 1}] ${cell || '(empty)'}`).join(' | '));
        } else {
          console.log(`\n📌 ROW ${rowIndex}:`);
          console.log(row.map((cell, i) => `[${i + 1}] ${cell || '(empty)'}`).join(' | '));
        }
      });

      // Show data types
      console.log('\n\n📊 DATA TYPES (Based on first data row):');
      if (jsonData.length > 1) {
        const firstDataRow = jsonData[1];
        headers.forEach((header, i) => {
          const value = firstDataRow[i];
          let type = 'unknown';
          if (value === undefined || value === null || value === '') {
            type = 'empty/null';
          } else if (typeof value === 'number') {
            type = 'number';
          } else if (typeof value === 'boolean') {
            type = 'boolean';
          } else if (!isNaN(Date.parse(value))) {
            type = 'date';
          } else {
            type = 'string/text';
          }
          console.log(`  [${i + 1}] ${header || '(empty)'} → ${type}`);
        });
      }

      console.log(`\n✅ Total rows: ${jsonData.length}`);
    } else {
      console.log('❌ No data found in this sheet');
    }
  });

} catch (error) {
  console.error('❌ Error reading Excel file:', error.message);
  process.exit(1);
}
