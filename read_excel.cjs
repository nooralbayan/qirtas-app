const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve('C:\\Users\\نورالدين\\OneDrive\\سطح المكتب\\مدرسة نور البيان 2026-2027\\كشف بأسماء الطلبة المقيدين بالمدرسة 2026-2027.xlsx');
const wb = XLSX.readFile(filePath);

wb.SheetNames.forEach(name => {
  console.log(`\n=== Sheet: ${name} ===`);
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  data.forEach((row, i) => {
    if (i < 30) console.log(JSON.stringify(row));
  });
  console.log(`Total rows: ${data.length}`);
});
