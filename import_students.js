import dns from 'dns';
// حل مشكلة حل أسماء النطاقات (DNS) الخاصة بـ MongoDB Atlas على نظام ويندوز
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import XLSX from 'xlsx';
import path from 'path';

dotenv.config();

// تعريف النماذج (Models) كما هي معرفة في النظام
const studentSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  enrollmentNumber: { type: String, required: true, unique: true },
  nationalId: { type: String, required: true },
  name: { type: String, required: true },
  photo: { type: String, default: null },
  birthDate: { type: String },
  grade: { type: String, required: true },
  classRoom: { type: String, required: true },
  address: { type: String },
  fatherName: { type: String },
  fatherPhone: { type: String },
  motherName: { type: String },
  motherPhone: { type: String },
  gender: { type: String, enum: ['ذكر', 'أنثى', 'غير محدد'], default: 'غير محدد' },
  specialNeeds: { type: String },
  medicalCondition: { type: String },
  medication: { type: String },
  missingItems: { type: String },
  notes: { type: String },
  totalFees: { type: Number, required: true, default: 0 },
  installmentsCount: { type: Number, default: 1 },
  paymentStatus: { type: String, enum: ['مسدد', 'جزئي', 'غير مسدد'], default: 'غير مسدد' },
  wasWithdrawn: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

const filePath = 'E:\\مدرسة نور البيان 2026-2027\\كشف بأسماء الطلبة المقيدين بالمدرسة 2026-2027.xlsx';

const defaultGradeFees = {
  'KG1': 1000,
  'KG2': 1000,
  'الصف الأول': 1200,
  'الصف الثاني': 1200,
  'الصف الثالث': 1200,
  'الصف الرابع': 1300,
  'الصف الخامس': 1300,
  'الصف السادس': 1300,
  'الصف السابع': 1500,
  'الصف الثامن': 1500,
  'الصف التاسع': 1500,
};

// تطبيع النصوص العربية للمقارنة الذكية وتفادي الفروقات الطفيفة في الإملاء
function normalizeArabic(str) {
  if (!str) return '';
  return str
    .trim()
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/\s+/g, ' ');
}

function normalizeKey(str) {
  return normalizeArabic(str).replace(/\s+/g, '');
}

// تحويل تواريخ الإكسل التسلسلية إلى نصوص مقروءة YYYY-MM-DD
function formatExcelDate(value) {
  if (!value) return '';
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return String(value).trim();
}

async function run() {
  try {
    console.log('🔄 جاري الاتصال بقاعدة البيانات...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح.');

    // قراءة إعدادات الرسوم الدراسية الحالية من قاعدة البيانات لتفادي تغيير قيم الأقساط
    console.log('🔍 جاري استرجاع قيم الأقساط السنوية من النظام...');
    const gradeFeesDoc = await Setting.findOne({ key: 'gradeFees' });
    const activeGradeFees = gradeFeesDoc ? gradeFeesDoc.value : defaultGradeFees;
    console.log('💰 قيم الأقساط المعتمدة حالياً في النظام:');
    console.log(activeGradeFees);

    console.log('📂 جاري فتح وقراءة ملف Excel...');
    const wb = XLSX.readFile(filePath);

    // 1. خريطة تسكين الفصول من ورقة1 (تضم الصفوف الثاني والثالث والرابع)
    const classroomMap = new Map();
    if (wb.SheetNames.includes('ورقة1')) {
      console.log('📊 جاري قراءة خريطة الفصول من "ورقة1"...');
      const ws = wb.Sheets['ورقة1'];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      let currentGrade = '';
      let currentClassRoom = 'أ';
      
      data.forEach((row, i) => {
        if (!row || row.length === 0) return;
        
        // التحقق من عنوان الصف والفصل (مثال: الصف الثاني - أ)
        if (row.length === 1 && typeof row[0] === 'string') {
          const sec = row[0].trim();
          if (sec.includes('الصف')) {
            const parts = sec.split('-');
            currentGrade = parts[0].trim();
            currentClassRoom = parts[1] ? parts[1].trim() : 'أ';
          }
          return;
        }

        // قراءة هيدر الجدول لتحديد مؤشر الأعمدة ديناميكياً
        if (row[0] === 'ر.م' || row[1] === 'اسم الطالب') {
          return; // تخطي الهيدر
        }

        const name = row[1] ? String(row[1]).trim() : '';
        const nationalId = row[2] ? String(row[2]).trim() : '';

        if (name && name !== 'اسم الطالب') {
          const nameKey = normalizeKey(name);
          classroomMap.set(nameKey, currentClassRoom);
          if (nationalId) {
            classroomMap.set(nationalId, currentClassRoom);
          }
        }
      });
      console.log(`✅ تم بناء خريطة الفصول لعدد ${classroomMap.size / 2} طالب من "ورقة1".`);
    }

    // مصفوفة لتخزين جميع الطلاب المستخلصين تمهيداً للإدراج
    const allStudentsToInsert = [];
    const importedStudentKeys = new Set();
    let nextId = 1;

    // دالة لاستخراج الطلاب من أي ورقة
    const processSheet = (sheetName, isEvening = false) => {
      if (!wb.SheetNames.includes(sheetName)) {
        console.log(`⚠️ الورقة "${sheetName}" غير موجودة في ملف الإكسل.`);
        return;
      }

      console.log(`📥 جاري معالجة الورقة: "${sheetName}"...`);
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      let currentGrade = '';
      if (sheetName === 'المدرسة ') currentGrade = 'الصف الأول';
      if (sheetName === 'مدرسة مسائي ') currentGrade = 'الصف الأول';
      if (sheetName === 'تمهيدي صباحي') currentGrade = 'KG2';
      if (sheetName === 'روضة مسائي ') currentGrade = 'KG1'; // افتراضي للورقة

      let nameIdx = 1;
      let nationalIdIdx = 2;
      let birthDateIdx = 3;
      let birthPlaceIdx = 4;
      let motherNameIdx = 7;
      let fatherPhoneIdx = 8;
      let motherPhoneIdx = 9;
      let whatsappIdx = 10;
      let notesIdx = 13;
      let medicalConditionIdx = 14;
      let medicationIdx = 15;
      let addressIdx = 16;
      let missingItemsIdx = 17;

      data.forEach((row, i) => {
        if (!row || row.length === 0) return;

        // التحقق من ترويسة المجموعة (مثال: الصف الأول، الروضة، التمهيدي)
        if (row.length === 1 && typeof row[0] === 'string') {
          const sectionTitle = row[0].trim();
          if (sectionTitle.includes('الصف')) {
            currentGrade = sectionTitle;
          } else if (sectionTitle.includes('الروضة')) {
            currentGrade = 'KG1';
          } else if (sectionTitle.includes('التمهيدي')) {
            currentGrade = 'KG2';
          }
          return;
        }

        // قراءة الهيدر لتحديث فهارس الأعمدة ديناميكياً
        if (row[0] && typeof row[0] === 'string' && row[0].trim() === 'ر.م') {
          const headers = row.map(h => h ? String(h).trim() : '');
          nameIdx = headers.indexOf('اسم الطالب');
          nationalIdIdx = headers.indexOf('الرقم الوطني');
          birthDateIdx = headers.indexOf('تاريخ الميلاد');
          birthPlaceIdx = headers.indexOf('مكان الميلاد');
          motherNameIdx = headers.indexOf('اسم الام');
          fatherPhoneIdx = headers.indexOf('هاتف الاب');
          motherPhoneIdx = headers.indexOf('هاتف الام');
          whatsappIdx = headers.indexOf('رقم التواصل الواتساب');
          notesIdx = headers.indexOf('ملاحظات');
          medicalConditionIdx = headers.indexOf('امراض ان وجدت');
          medicationIdx = headers.indexOf('علاجها');
          addressIdx = headers.indexOf('عنوان السكن');
          missingItemsIdx = headers.indexOf('نواقص');
          return;
        }

        const studentName = row[nameIdx] ? String(row[nameIdx]).trim() : '';
        if (!studentName || studentName === 'اسم الطالب') return;

        const nationalId = row[nationalIdIdx] ? String(row[nationalIdIdx]).trim() : '';
        const nameKey = normalizeKey(studentName);
        const uniqueKey = nationalId ? nationalId : nameKey;

        // تفادي تكرار إدخال الطالب نفسه عبر الأوراق المختلفة
        if (importedStudentKeys.has(uniqueKey)) {
          return;
        }

        // تحديد الفصل
        let classRoom = 'أ';
        if (isEvening) {
          classRoom = 'مسائي';
        } else {
          // محاولة مطابقة الطالب مع خريطة الفصول من ورقة1 للحصول على فصله الدقيق (أ، ب، ج)
          const matchedClass = classroomMap.get(nameKey) || (nationalId ? classroomMap.get(nationalId) : null);
          if (matchedClass) {
            classRoom = matchedClass;
          }
        }

        // تنظيف وتجهيز الهواتف
        const fatherPhone = row[fatherPhoneIdx] ? String(row[fatherPhoneIdx]).trim() : '';
        const motherPhone = row[motherPhoneIdx] ? String(row[motherPhoneIdx]).trim() : '';
        const whatsapp = row[whatsappIdx] ? String(row[whatsappIdx]).trim() : '';

        // استخلاص اسم الأب من اسم الطالب الكامل كإضافة ذكية
        const nameParts = studentName.split(/\s+/);
        const fatherName = nameParts.slice(1).join(' ');

        // الرسوم الدراسية المعتمدة لهذه المرحلة
        const normalizedGrade = currentGrade.trim();
        const totalFees = activeGradeFees[normalizedGrade] || 1200;

        // تفاصيل الأمراض والنواقص والعناوين
        const medicalCondition = row[medicalConditionIdx] ? String(row[medicalConditionIdx]).trim() : '';
        const medication = row[medicationIdx] ? String(row[medicationIdx]).trim() : '';
        const missingItems = row[missingItemsIdx] ? String(row[missingItemsIdx]).trim() : '';
        const address = row[addressIdx] ? String(row[addressIdx]).trim() : '';
        const birthPlace = row[birthPlaceIdx] ? String(row[birthPlaceIdx]).trim() : '';

        const birthDate = formatExcelDate(row[birthDateIdx]);

        // بناء ملاحظات ذكية تشمل مكان الميلاد وأرقام التواصل الإضافية
        let notes = row[notesIdx] ? String(row[notesIdx]).trim() : '';
        if (birthPlace) {
          notes = `مكان الميلاد: ${birthPlace}. ${notes}`;
        }
        if (whatsapp && whatsapp !== fatherPhone && whatsapp !== motherPhone) {
          notes = `${notes} (رقم واتساب إضافي: ${whatsapp})`;
        }

        // توليد رقم قيد فريد في حال عدم وجوده لتجنب مشاكل الفهرسة في قاعدة البيانات
        const rawEnrollment = row[6] ? String(row[6]).trim() : '';
        const enrollmentNumber = rawEnrollment && rawEnrollment !== 'null' ? rawEnrollment : `AUTO-${nextId}`;

        // تحديد الجنس تلقائياً بناءً على الرقم الوطني كإجراء ذكي
        // الرقم الوطني في ليبيا يبدأ بـ 1 للذكور و 2 للإناث
        let gender = 'غير محدد';
        if (nationalId && nationalId.length > 0) {
          if (nationalId.startsWith('1')) {
            gender = 'ذكر';
          } else if (nationalId.startsWith('2')) {
            gender = 'أنثى';
          }
        }

        allStudentsToInsert.push({
          id: nextId++,
          enrollmentNumber,
          nationalId: nationalId || `NAT-${nextId}`,
          name: studentName,
          photo: null,
          birthDate,
          grade: normalizedGrade,
          classRoom,
          address: address || birthPlace || '',
          fatherName,
          fatherPhone,
          motherName: row[motherNameIdx] ? String(row[motherNameIdx]).trim() : '',
          motherPhone,
          gender,
          medicalCondition,
          medication,
          missingItems,
          notes,
          totalFees,
          installmentsCount: 1, // افتراضي قسط سنوي واحد أو مقسم حسب الإعدادات
          paymentStatus: 'غير مسدد',
          wasWithdrawn: false
        });

        importedStudentKeys.add(uniqueKey);
      });
    };

    // معالجة الأوراق بالترتيب المناسب
    processSheet('المدرسة ', false);
    processSheet('مدرسة مسائي ', true);
    processSheet('تمهيدي صباحي', false);
    processSheet('روضة مسائي ', true);

    console.log(`📥 إجمالي الطلاب المستخلصين الجاهزين للإدخال: ${allStudentsToInsert.length}`);

    if (allStudentsToInsert.length > 0) {
      console.log('🗑️ جاري تفريغ كشف الطلاب الحالي من قاعدة البيانات...');
      const deleteResult = await Student.deleteMany({});
      console.log(`🗑️ تم حذف ${deleteResult.deletedCount} سجل قديم.`);

      console.log('💾 جاري إدراج الطلاب المستخلصين في قاعدة البيانات...');
      const insertResult = await Student.insertMany(allStudentsToInsert);
      console.log(`✅ تم استيراد وحفظ ${insertResult.length} طالب بنجاح!`);
    } else {
      console.log('⚠️ لم يتم العثور على أي طلاب للاستيراد.');
    }

  } catch (error) {
    console.error('❌ حدث خطأ أثناء الاستيراد:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم فصل الاتصال بقاعدة البيانات.');
  }
}

run();
