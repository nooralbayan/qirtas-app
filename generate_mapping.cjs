const xlsx = require('xlsx');
const fs = require('fs');

const filePath = 'C:\\Users\\نورالدين\\OneDrive\\سطح المكتب\\مدرسة نور البيان 2026-2027\\كشف بأسماء الطلبة المقيدين بالمدرسة 2026-2027.xlsx';
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(sheet);

const mapping = [];

rows.forEach(r => {
  const name = (r['__EMPTY'] || '').toString().trim();
  const nationalId = (r['__EMPTY_1'] || '').toString().trim();
  let enrollment = (r['__EMPTY_5'] || '').toString().trim();
  
  if (!enrollment || enrollment.startsWith('2026') || enrollment === '0' || enrollment === '-') {
    enrollment = '';
  }

  if (name || nationalId) {
    mapping.push({ name, nationalId, enrollment });
  }
});

fs.writeFileSync('enrollment_mapping.json', JSON.stringify(mapping, null, 2));
console.log('Saved mapping to enrollment_mapping.json');
