/**
 * سكريبت استيراد المعلمات من ملف Excel إلى قاعدة بيانات قرطاس
 * الملف: E:\مدرسة نور البيان 2026-2027\كشف بأسماء المعلمات.xlsx
 */

const XLSX = require('xlsx');
const path = require('path');

const filePath = 'E:\\مدرسة نور البيان 2026-2027\\كشف بأسماء المعلمات.xlsx';

try {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Map: columns
  // 0: رقم متسلسل
  // 1: الاسم
  // 2: الوظيفة/المادة
  // 3: المؤهل وتاريخه
  // 4: التخصص
  // 5: تاريخ التعيين
  // 7: المواد المسندة
  // 8: الفصول التي يدرسها

  // تحديد وظيفة/دور المعلم بذكاء من خلال تصنيف النص
  function classifyRole(jobTitle, subject) {
    const t = (jobTitle || '').trim();
    const s = (subject || '').trim();
    if (!t && !s) return { subject: '', role: 'معلم' };

    if (t.includes('مدير') || t.includes('ناظر')) return { subject: t, role: 'مدير' };
    if (t.includes('نائب')) return { subject: t, role: 'نائب مدير' };
    if (t.includes('إشراف') || t.includes('اشراف')) return { subject: t, role: 'مشرف' };
    if (t.includes('شؤون') || t.includes('إداري') || t.includes('ادارية')) return { subject: t, role: 'إداري' };

    // استخدام التخصص كمادة إذا كانت الوظيفة معلم فصل أو فارغة
    const finalSubject = s || t || 'غير محدد';
    return { subject: finalSubject, role: 'معلم' };
  }

  // استخراج سنة فقط من نص المؤهل
  function extractYear(qualificationText) {
    if (!qualificationText) return null;
    const match = String(qualificationText).match(/\d{4}/);
    return match ? match[0] : null;
  }

  const teachers = [];
  let idCounter = Date.now();

  // تخطي الصف الأول (header) والصفوف الفارغة
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const seqNum = row[0];
    const name = (row[1] || '').toString().trim();

    // تخطي الصفوف الفارغة أو غير البيانات (التوقيع، اسم المدير...)
    if (!name || !seqNum || isNaN(Number(seqNum))) continue;

    const jobTitle = (row[2] || '').toString().trim();
    const qualification = (row[3] || '').toString().trim();
    const specialization = (row[4] || '').toString().trim();
    const assignedSubjects = (row[7] || '').toString().trim();
    const classes = (row[8] || '').toString().trim();

    const { subject, role } = classifyRole(jobTitle, specialization || assignedSubjects);
    const year = extractYear(qualification);
    const hireDate = year ? `${year}-09-01` : '';

    const teacher = {
      id: idCounter++,
      name,
      subject,
      role,
      qualification,
      specialization: specialization || 'غير محدد',
      assignedClasses: classes || 'غير محدد',
      phone: '',
      salary: 0,
      hireDate,
      isAbsent: false,
      notes: `${jobTitle}${assignedSubjects && assignedSubjects !== jobTitle ? ' - ' + assignedSubjects : ''}`.trim()
    };

    teachers.push(teacher);
    console.log(`✅ [${seqNum}] ${name} | ${subject} | ${role}`);
  }

  console.log(`\n=== إجمالي المعلمات المستوردة: ${teachers.length} ===\n`);
  console.log('JSON للاستيراد:');
  console.log(JSON.stringify(teachers, null, 2));

  // حفظ الناتج في ملف JSON
  const outputPath = path.join(__dirname, 'teachers_import.json');
  require('fs').writeFileSync(outputPath, JSON.stringify(teachers, null, 2), 'utf-8');
  console.log(`\n✅ تم حفظ البيانات في الملف: ${outputPath}`);

} catch (err) {
  console.error('❌ خطأ:', err.message);
}
