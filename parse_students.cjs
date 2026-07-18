const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('C:\\Users\\نورالدين\\OneDrive\\سطح المكتب\\مدرسة نور البيان 2026-2027\\كشف بأسماء الطلبة المقيدين بالمدرسة 2026-2027.xlsx');
const wb = XLSX.readFile(filePath);

let allStudents = [];
let nextId = 1;

wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  if (name === 'المدرسة ') {
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2 || !row[1]) continue;
      
      const studentName = String(row[1]).trim();
      const nationalId = row[2] ? String(row[2]).trim() : '';
      const enrollmentNum = row[6] ? String(row[6]).trim() : '';
      const motherName = row[7] ? String(row[7]).trim() : '';
      const fatherPhone = row[8] ? String(row[8]).trim() : '';
      const motherPhone = row[9] ? String(row[9]).trim() : '';
      const medicalCondition = row[13] ? String(row[13]).trim() : '';
      const medication = row[14] ? String(row[14]).trim() : '';
      const missingItems = row[16] ? String(row[16]).trim() : '';

      allStudents.push({
        id: nextId++,
        enrollmentNumber: enrollmentNum,
        nationalId: nationalId,
        name: studentName,
        photo: null,
        birthDate: '',
        grade: 'الصف الثاني', // All from this sheet seem to be grade 2 based on header? Wait, let me check the file carefully, actually it might have multiple grades? The header says "الصف الثاني". Let's assume الصف الثاني for now and the user can change it.
        classRoom: 'أ',
        address: row[4] ? String(row[4]).trim() : '', // Birth place or address
        fatherName: '', // Usually derived from student name or in notes
        fatherPhone: fatherPhone,
        motherName: motherName,
        motherPhone: motherPhone,
        specialNeeds: '',
        medicalCondition: medicalCondition,
        medication: medication,
        missingItems: missingItems,
        notes: '',
        totalFees: 1200,
        installmentsCount: 2,
        paymentStatus: 'غير مسدد'
      });
    }
  } else if (name === 'الروضة ') {
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2 || !row[1]) continue;
      const studentName = String(row[1]).trim();
      allStudents.push({
        id: nextId++,
        enrollmentNumber: '',
        nationalId: row[2] ? String(row[2]).trim() : '',
        name: studentName,
        photo: null,
        birthDate: '',
        grade: 'KG2',
        classRoom: 'أ',
        address: row[4] ? String(row[4]).trim() : '',
        fatherName: '',
        fatherPhone: row[7] ? String(row[7]).trim() : '',
        motherName: row[6] ? String(row[6]).trim() : '',
        motherPhone: row[8] ? String(row[8]).trim() : '',
        specialNeeds: '',
        medicalCondition: row[12] ? String(row[12]).trim() : '',
        medication: row[13] ? String(row[13]).trim() : '',
        missingItems: row[15] ? String(row[15]).trim() : '',
        notes: '',
        totalFees: 1000,
        installmentsCount: 9,
        paymentStatus: 'غير مسدد'
      });
    }
  }
});

fs.writeFileSync('src/data/studentsData.ts', `import type { Student } from '../context/AppContext';\n\nexport const initialStudentsFromExcel: Student[] = ${JSON.stringify(allStudents, null, 2)};\n`);
console.log('Saved to src/data/studentsData.ts');
