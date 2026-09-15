import mongoose from 'mongoose';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
dotenv.config();

const StudentSchema = new mongoose.Schema({}, { strict: false });
const Student = mongoose.model('Student', StudentSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const filePath = 'C:\\Users\\نورالدين\\OneDrive\\سطح المكتب\\مدرسة نور البيان 2026-2027\\كشف بأسماء الطلبة المقيدين بالمدرسة 2026-2027.xlsx';
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Read ${rows.length} rows from Excel file`);

  const students = await Student.find();
  console.log(`Found ${students.length} students in the database`);

  let updatedCount = 0;
  let clearedCount = 0;

  for (const student of students) {
    const dbName = (student.get('name') || '').trim();
    const dbNationalId = String(student.get('nationalId') || '').trim();

    // Find match in Excel
    let match = rows.find((r) => {
      const excelName = (r['__EMPTY'] || '').toString().trim();
      const excelNationalId = (r['__EMPTY_1'] || '').toString().trim();
      return (excelName && excelName === dbName) || (excelNationalId && excelNationalId === dbNationalId);
    });

    if (match) {
      let enrollment = (match['__EMPTY_5'] || '').toString().trim();
      
      // If it looks like a fake number (e.g., 2026...) or empty, set to empty
      if (!enrollment || enrollment.startsWith('2026') || enrollment === '0' || enrollment === '-') {
        enrollment = '';
      }

      const currentEnrollment = student.get('enrollmentNumber') || '';
      
      if (enrollment !== currentEnrollment) {
        student.set('enrollmentNumber', enrollment);
        await student.save();
        if (enrollment) {
          updatedCount++;
          console.log(`✅ Updated ${dbName} -> ${enrollment}`);
        } else {
          clearedCount++;
          console.log(`🗑️ Cleared ${dbName} (no valid enrollment in Excel)`);
        }
      }
    } else {
      // Not found in Excel
      const currentEnrollment = student.get('enrollmentNumber') || '';
      if (currentEnrollment) {
        student.set('enrollmentNumber', '');
        await student.save();
        clearedCount++;
        console.log(`🗑️ Cleared ${dbName} (not found in Excel)`);
      }
    }
  }

  console.log(`Done! Updated ${updatedCount} numbers, cleared ${clearedCount} invalid numbers.`);
  process.exit(0);
}

main().catch(console.error);
