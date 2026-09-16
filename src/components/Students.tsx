import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Student } from '../context/AppContext';
import * as XLSX from 'xlsx';

import StudentProfile from './StudentProfile';

const emptyForm = {
  nationalId: '',
  name: '',
  photo: null as string | null,
  birthDate: '',
  grade: 'الصف الأول',
  classRoom: 'أ',
  fatherName: '',
  fatherPhone: '+218',
  whatsappPhone: '',
  motherName: '',
  motherPhone: '+218',
  address: '',
  gender: 'غير محدد' as 'ذكر' | 'أنثى' | 'غير محدد',
  specialNeeds: '',
  medicalCondition: '',
  medication: '',
  missingItems: '',
  notes: '',
  totalFees: 0,
  discountAmount: 0,
  discountReason: '',
  installmentsCount: 2,
  paymentStatus: 'غير مسدد' as 'مسدد' | 'جزئي' | 'غير مسدد',
  enrollmentNumber: '',
};

export default function Students({ onBack }: { onBack: () => void }) {
  const { students, setStudents, receipts, academicYear, gradeFees, classRooms, setClassRooms, schoolName, schoolLogo, recycleBin, setRecycleBin } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('الكل');
  const [classRoomFilter, setClassRoomFilter] = useState<string>('الكل');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newClassRoomName, setNewClassRoomName] = useState('');
  const [showNewClassRoom, setShowNewClassRoom] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // ───── Auto-fix bad enrollment numbers (starts with 2026 or AUTO-) ─────
  const isInvalidEnrollment = (num?: string) => {
    if (!num || num.trim() === '') return false;
    // أنماط الأرقام الوهمية المولّدة تلقائياً
    return (
      num.startsWith('AUTO-') ||
      num.startsWith('ENR-') ||
      /^2026\d+/.test(num) ||
      num === '2026'
    );
  };

  const studentsWithoutEnrollment = students.filter(s => !s.enrollmentNumber || s.enrollmentNumber.trim() === '' || isInvalidEnrollment(s.enrollmentNumber));
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [cleanupDone, setCleanupDone] = useState(false);

  // ── مسح الأرقام الوهمية تلقائياً بعد أن يتم تحميل بيانات الطلاب من السيرفر ──
  useEffect(() => {
    if (students.length === 0 || cleanupDone) return;
    const hasBad = students.some(s => isInvalidEnrollment(s.enrollmentNumber));
    if (hasBad) {
      setStudents(prev => prev.map(s =>
        isInvalidEnrollment(s.enrollmentNumber)
          ? { ...s, enrollmentNumber: '' }
          : s
      ));
    }
    setCleanupDone(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students.length]);

  const handleCleanBadEnrollments = () => {
    if (!window.confirm(`سيتم مسح أرقام القيد غير الصحيحة لـ ${studentsWithoutEnrollment.length} طالب وتركها فارغة. هل تريد الاستمرار؟`)) return;
    setStudents(prev => prev.map(s =>
      isInvalidEnrollment(s.enrollmentNumber)
        ? { ...s, enrollmentNumber: '' }
        : s
    ));
  };


  /* ───── filtering & sorting ───── */
  const rawFiltered = students.filter((s) => {
    const matchesName = s.name.includes(searchTerm) || s.enrollmentNumber?.includes(searchTerm) || s.nationalId?.includes(searchTerm);
    const matchesGrade = gradeFilter === 'الكل' || s.grade === gradeFilter;
    const matchesClass = classRoomFilter === 'الكل' || s.classRoom === classRoomFilter;
    return matchesName && matchesGrade && matchesClass;
  });

  const gradeOrder = Object.keys(gradeFees);
  const filtered = rawFiltered.sort((a, b) => {
    // 1. Sort by Grade
    const gradeIndexA = gradeOrder.indexOf(a.grade);
    const gradeIndexB = gradeOrder.indexOf(b.grade);
    if (gradeIndexA !== gradeIndexB) return gradeIndexA - gradeIndexB;

    // 2. Sort by Classroom
    const classRoomCompare = (a.classRoom || '').localeCompare(b.classRoom || '', 'ar');
    if (classRoomCompare !== 0) return classRoomCompare;

    // 3. Sort Purely Alphabetically by Name (regardless of gender)
    return (a.name || '').localeCompare(b.name || '', 'ar');
  });

  /* ───── helpers ───── */
  const openAdd = () => {
    const firstGrade = Object.keys(gradeFees)[0];
    setEditingId(null);
    setForm({ ...emptyForm, grade: firstGrade, totalFees: gradeFees[firstGrade], classRoom: classRooms[firstGrade]?.[0] || 'أ' });
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditingId(s.id);
    setForm({ ...s });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟ سيتم نقله إلى سلة المحذوفات.')) {
      const studentToDelete = students.find((s) => s.id === id);
      if (studentToDelete) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        setRecycleBin([
          ...recycleBin,
          { id: String(studentToDelete.id), type: 'student', deletedAt: new Date().toISOString(), data: studentToDelete }
        ]);
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGradeChange = (newGrade: string) => {
    let newInstallments = form.installmentsCount;
    if (newInstallments === 9 && newGrade !== 'KG1' && newGrade !== 'KG2') {
      newInstallments = 2;
    }
    const rooms = classRooms[newGrade] || ['أ'];
    setForm({
      ...form,
      grade: newGrade,
      totalFees: gradeFees[newGrade] || 0,
      installmentsCount: newInstallments,
      classRoom: rooms[0] || 'أ'
    });
  };

  const handleAddClassRoom = () => {
    if (!newClassRoomName.trim()) return;
    const grade = form.grade;
    setClassRooms(prev => {
      const existing = prev[grade] || ['أ'];
      if (existing.includes(newClassRoomName.trim())) return prev;
      return { ...prev, [grade]: [...existing, newClassRoomName.trim()] };
    });
    setForm({ ...form, classRoom: newClassRoomName.trim() });
    setNewClassRoomName('');
    setShowNewClassRoom(false);
  };

  const handleSubmit = () => {
    if (!form.name || !form.grade || !form.fatherName) {
      alert('عذراً، يجب إدخال اسم الطالب، واسم الأب، والصف الدراسي كحد أدنى.');
      return;
    }

    // Check for duplicates
    const isDuplicate = students.some(s => {
      if (s.id === editingId) return false;
      const sameEnrollment = form.enrollmentNumber && s.enrollmentNumber === form.enrollmentNumber;
      const sameNationalId = form.nationalId && s.nationalId === form.nationalId;
      return sameEnrollment || sameNationalId;
    });

    if (isDuplicate) {
      alert('خطأ: رقم القيد أو الرقم الوطني مستخدم لطالب آخر. يرجى مراجعة البيانات.');
      return;
    }

    if (editingId !== null) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingId ? { ...s, ...form } : s
        )
      );
    } else {
      const newId = students.length > 0 ? Math.max(...students.map((s) => s.id)) + 1 : 1;
      const newStudent: Student = {
        id: newId,
        ...form,
        paymentStatus: 'غير مسدد',
      };
      setStudents((prev) => [...prev, newStudent]);
    }
    setShowModal(false);
  };

  /* ───── print class list ───── */
  const handlePrintClassList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const listStudents = filtered;
    const title = gradeFilter !== 'الكل'
      ? `قائمة طلبة ${gradeFilter}${classRoomFilter !== 'الكل' ? ' - ' + classRoomFilter : ''}`
      : 'قائمة طلبة المدرسة';

    const logoHtml = schoolLogo.startsWith('data:image')
      ? `<img src="${schoolLogo}" alt="Logo" style="height:60px;" />`
      : `<div style="font-size:30px;">${schoolLogo}</div>`;

    const today = new Date().toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = listStudents.map((s, i) => `
      <tr style="background:${i % 2 === 0 ? '#fafbfc' : '#fff'};">
        <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">${i + 1}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;">${s.enrollmentNumber || '-'}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;font-weight:600;">${s.name}${s.wasWithdrawn ? ' <span style="color:#e74c3c;font-size:10px;">⚠ أعيد تسجيله</span>' : ''}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">${s.grade}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">${s.classRoom || '-'}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;">${s.nationalId || '-'}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;">${s.notes || '-'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px 30px; color: #111; }
          @page { size: A4; margin: 12mm 10mm; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1e3a5f; color: #fff; padding: 6px 8px; font-size: 11px; border: 1px solid #1e3a5f; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 12px; }
          .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #555; padding-top: 12px; border-top: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="font-size:20px;margin-bottom:4px;">${schoolName}</h2>
            <h4 style="color:#555;font-weight:500;">${title}</h4>
            <p style="font-size:12px;color:#888;margin-top:4px;">تاريخ الطباعة: ${today} | عدد الطلاب: ${listStudents.length}</p>
          </div>
          <div>${logoHtml}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:5%;">م</th>
              <th style="width:10%;">رقم القيد</th>
              <th style="width:28%;">اسم الطالب</th>
              <th style="width:14%;">الصف</th>
              <th style="width:10%;">الفصل</th>
              <th style="width:18%;">الرقم الوطني</th>
              <th style="width:15%;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          <div>الموقع: ..................</div>
          <div>المدير: ..................</div>
          <div>الختم: ..................</div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 600);
  };

  /* ───── print parent credentials ───── */
  const handlePrintParentCredentials = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const listStudents = filtered;
    const title = 'كشف بيانات دخول أولياء الأمور - ' + (gradeFilter !== 'الكل' ? gradeFilter : 'جميع المراحل');
    const today = new Date().toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = listStudents.map((s, i) => `
      <tr style="background:${i % 2 === 0 ? '#fafbfc' : '#fff'};">
        <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-size:12px;">${i + 1}</td>
        <td style="border:1px solid #bbb;padding:6px 8px;font-size:12px;font-weight:bold;">${s.name}</td>
        <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-size:12px;">${s.grade} (${s.classRoom || 'أ'})</td>
        <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-size:13px;font-weight:bold;color:#1e40af;direction:ltr;">${s.enrollmentNumber || String(s.id)}</td>
        <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-size:12px;direction:ltr;">${s.fatherPhone || s.motherPhone || s.whatsappPhone || 'رقم الهاتف المسجل'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px 30px; color: #111; }
          @page { size: A4; margin: 12mm 10mm; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #1e40af; color: #fff; padding: 8px; font-size: 12px; border: 1px solid #1e40af; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e40af; padding-bottom: 12px; margin-bottom: 12px; }
          .instructions { background: #eff6ff; border: 1.5px solid #3b82f6; padding: 12px 16px; border-radius: 8px; margin-bottom: 15px; font-size: 12px; color: #1e3a8a; line-height: 1.6; }
          .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 12px; color: #555; padding-top: 12px; border-top: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="font-size:20px;margin-bottom:4px;">${schoolName}</h2>
            <h3 style="color:#1e40af;font-weight:700;">كشف بيانات دخول أولياء الأمور لجميع الطلاب</h3>
            <p style="font-size:12px;color:#666;margin-top:4px;">تاريخ الطباعة: ${today} | إجمالي الطلاب: ${listStudents.length}</p>
          </div>
        </div>

        <div class="instructions">
          <strong>📌 طريقة دخول ولي الأمر لبوابة الطلاب:</strong><br/>
          1. الدخول على الرابط الإلكتروني للمدرسة واختيار تبويب <strong>"👨‍👩‍👦 أولياء الأمور"</strong>.<br/>
          2. في الخانة الأولى (رقم القيد): إدخال <strong>رقم القيد</strong> أو <strong>اسم الطالب</strong>.<br/>
          3. في الخانة الثانية (كلمة المرور): إدخال <strong>رقم الهاتف المسجل للمدرسة</strong> أو أي رقم آخر.
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:5%;">#</th>
              <th style="width:35%;">اسم الطالب</th>
              <th style="width:20%;">المرحلة والفصل</th>
              <th style="width:20%;">اسم المستخدم (رقم القيد)</th>
              <th style="width:20%;">كلمة المرور (رقم الهاتف)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          <div>إدارة المدرسة: ..................</div>
          <div>توقيع المسؤول: ..................</div>
          <div>الختم الرسمي: ..................</div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 600);
  };

  const handleExportExcel = () => {
    const listStudents = (gradeFilter === 'الكل' && classRoomFilter === 'الكل') ? students : filtered;
    
    if (listStudents.length === 0) {
      alert('لا توجد بيانات للتصدير.');
      return;
    }

    const dataToExport = listStudents.map((s, i) => ({
      'م': i + 1,
      'رقم القيد': s.enrollmentNumber || '-',
      'اسم الطالب': s.name,
      'حالة التسجيل': s.wasWithdrawn ? 'أعيد تسجيله' : 'طبيعي',
      'الصف': s.grade,
      'الفصل': s.classRoom || '-',
      'الرقم الوطني': s.nationalId || '-',
      'هاتف ولي الأمر': s.fatherPhone || '-',
      'حالة الدفع': s.paymentStatus || '-',
      'ملاحظات': s.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');
    
    const title = gradeFilter === 'الكل' ? 'جميع الطلاب' : `${gradeFilter} - ${classRoomFilter}`;
    const fileName = `قائمة_الطلاب_${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<any>(ws);

      let newStudentsList = [...students];
      let duplicateCount = 0;
      let addedCount = 0;
      let newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;

      data.forEach(row => {
        const rowName = row['اسم الطالب'] || row['الاسم'] || row['name'] || '';
        if (!rowName) return;

        const enrollment = String(row['رقم القيد'] || row['enrollmentNumber'] || '');
        const natId = String(row['الرقم الوطني'] || row['nationalId'] || '');

        const isDup = newStudentsList.some(s => 
          (enrollment && s.enrollmentNumber === enrollment) || 
          (natId && s.nationalId === natId)
        );

        if (isDup) {
          duplicateCount++;
          return;
        }

        const nameParts = rowName.trim().split(/\s+/);
        const fatherNameExtracted = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        const grade = row['الصف'] || row['grade'] || 'الصف الأول';
        
        newStudentsList.push({
          id: newId++,
          name: rowName,
          enrollmentNumber: enrollment,
          nationalId: natId,
          grade: grade,
          classRoom: row['الفصل'] || row['classRoom'] || 'أ',
          fatherName: row['اسم الأب'] || row['fatherName'] || fatherNameExtracted,
          fatherPhone: row['هاتف الأب'] || row['fatherPhone'] || '+218',
          motherName: row['اسم الأم'] || '',
          motherPhone: row['هاتف الأم'] || '+218',
          address: row['العنوان'] || '',
          birthDate: row['تاريخ الميلاد'] || '',
          totalFees: gradeFees[grade] || 0,
          installmentsCount: 2,
          paymentStatus: 'غير مسدد',
          photo: null
        });
        addedCount++;
      });

      setStudents(newStudentsList);
      alert(`تم استيراد ${addedCount} طالب بنجاح.${duplicateCount > 0 ? ` تم تجاهل ${duplicateCount} لكونهم مكررين.` : ''}`);
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  const handleUpdateEnrollmentsFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<any>(ws);

      let updatedCount = 0;
      const newStudentsList = students.map(student => {
        const dbName = (student.name || '').trim();
        const dbNationalId = String(student.nationalId || '').trim();

        const match = data.find(r => {
          const excelName = (r['اسم الطالب '] || r['اسم الطالب'] || r['الاسم'] || r['name'] || '').toString().trim();
          const excelNationalId = String(r['الرقم الوطني '] || r['الرقم الوطني'] || r['nationalId'] || '').trim();
          return (excelName && excelName === dbName) || (excelNationalId && excelNationalId === dbNationalId);
        });

        if (match) {
          let enrollment = String(match['رقم القيد '] || match['رقم القيد'] || match['enrollmentNumber'] || '').trim();
          if (!enrollment || enrollment.startsWith('2026') || enrollment === '0' || enrollment === '-') {
            enrollment = '';
          }
          if (student.enrollmentNumber !== enrollment) {
            updatedCount++;
            return { ...student, enrollmentNumber: enrollment };
          }
        }
        return student;
      });

      setStudents(newStudentsList);
      alert(`تم تحديث أرقام القيد لـ ${updatedCount} طالب بنجاح.`);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  /* ───── badge style ───── */
  const getDynamicPaymentStatus = (s: Student): 'مسدد' | 'جزئي' | 'غير مسدد' => {
    const studentReceipts = (receipts || []).filter(r => String(r.studentId) === String(s.id));
    const paidAmount = studentReceipts.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    const netFees = Math.max(0, (s.totalFees || 0) - (s.discountAmount || 0));
    const remainingAmount = Math.max(0, netFees - paidAmount);
    
    if (netFees <= 0 || remainingAmount <= 0) return 'مسدد';
    if (paidAmount > 0) return 'جزئي';
    return 'غير مسدد';
  };

  const badgeStyle = (status: Student['paymentStatus']): React.CSSProperties => {
    const base: React.CSSProperties = { padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, display: 'inline-block', minWidth: 70, textAlign: 'center' };
    if (status === 'مسدد') return { ...base, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' };
    if (status === 'جزئي') return { ...base, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' };
    return { ...base, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff' };
  };

  const availableClassRoomsForFilter = gradeFilter !== 'الكل' ? (classRooms[gradeFilter] || ['أ']) : [];

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
        <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
      </button>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#0056b3', fontSize: 26 }}>إدارة بيانات الطلاب</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={openAdd} style={{ backgroundColor: '#0056b3', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>
              + إضافة طالب جديد
            </button>
            <label style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
              📥 استيراد Excel
              <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} style={{ display: 'none' }} />
            </label>
            <label style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
              🔄 تحديث أرقام القيد من Excel
              <input type="file" accept=".xlsx, .xls" onChange={handleUpdateEnrollmentsFromExcel} style={{ display: 'none' }} />
            </label>
            <button onClick={handleExportExcel} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>
              📊 تصدير Excel
            </button>
            <button onClick={handlePrintClassList} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>
              🖨️ طباعة القائمة
            </button>
          </div>
        </div>

        {/* ── Warning: students without enrollment number ── */}
        {!dismissedWarning && studentsWithoutEnrollment.length > 0 && (
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 26 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 800, color: '#92400e', fontSize: 16 }}>
                  {studentsWithoutEnrollment.length} طالب لا يملك رقم قيد صحيحاً
                </div>
                <div style={{ color: '#78350f', fontSize: 14, marginTop: 2 }}>
                  بعض الطلاب لديهم أرقام قيد غير صحيحة (مولّدة تلقائياً). يمكنك مسحها وتركها فارغة ثم إضافتها يدوياً.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCleanBadEnrollments}
                style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
              >
                🗑️ مسح الأرقام الخاطئة
              </button>
              <button
                onClick={() => setDismissedWarning(true)}
                style={{ backgroundColor: 'transparent', color: '#92400e', border: '1px solid #f59e0b', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
              >
                تجاهل
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <input
            type="text"
            placeholder="🔍 بحث بالاسم أو رقم القيد أو الرقم الوطني..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 220, padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', outline: 'none' }}
          />
          <select
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setClassRoomFilter('الكل'); }}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', backgroundColor: 'var(--bg-card)', cursor: 'pointer', minWidth: 150 }}
          >
            <option value="الكل">كل الصفوف</option>
            {Object.keys(gradeFees).map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          {gradeFilter !== 'الكل' && availableClassRoomsForFilter.length > 0 && (
            <select
              value={classRoomFilter}
              onChange={(e) => setClassRoomFilter(e.target.value)}
              style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', backgroundColor: 'var(--bg-card)', cursor: 'pointer', minWidth: 130 }}
            >
              <option value="الكل">كل الفصول</option>
              {availableClassRoomsForFilter.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        <div style={{ marginBottom: 12, color: '#64748b', fontSize: 14 }}>
          عدد الطلاب: <strong>{filtered.length}</strong>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px', fontWeight: 700 }}>الصورة</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>رقم القيد</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>اسم الطالب</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>الصف</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>الفصل</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>الرسوم</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>حالة السداد</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr key={s.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)')}
                >
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                    )}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    {!s.enrollmentNumber || s.enrollmentNumber.trim() === '' ? (
                      <span style={{ display: 'inline-block', border: '2px solid #ef4444', borderRadius: 6, padding: '2px 10px', color: '#ef4444', fontWeight: 700, fontSize: 13, backgroundColor: '#fef2f2' }}>
                        لا يوجد
                      </span>
                    ) : isInvalidEnrollment(s.enrollmentNumber) ? (
                      <span style={{ display: 'inline-block', border: '2px solid #ef4444', borderRadius: 6, padding: '2px 10px', color: '#b91c1c', fontWeight: 700, fontSize: 13, backgroundColor: '#fef2f2' }} title="رقم قيد وهمي - يرجى تصحيحه">
                        ⚠️ {s.enrollmentNumber}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>{s.enrollmentNumber}</span>
                    )}
                  </td>
                  <td 
                    onClick={() => setViewingStudent(s)}
                    style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                    title="انقر لعرض الملف التعريفي الشامل للطالب"
                  >
                    <span style={{ color: '#0284c7', textDecoration: 'underline' }}>{s.name}</span>
                    {s.wasWithdrawn && <span style={{ marginRight: 6, color: '#ef4444', fontSize: 12, fontWeight: 700 }}>⚠ أعيد تسجيله</span>}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{s.grade}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{s.classRoom || '-'}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--text-primary)' }}>{s.totalFees} د.ل</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={badgeStyle(getDynamicPaymentStatus(s))}>{getDynamicPaymentStatus(s)}</span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <button onClick={() => openEdit(s)} style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', marginLeft: 6, fontWeight: 600 }}>تعديل</button>
                    <button onClick={() => handleDelete(s.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>حذف</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>لا يوجد طلاب يطابقون بحثك</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 14, padding: 32, width: '90%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 24px', color: '#0056b3', fontSize: 22 }}>
              {editingId !== null ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
            </h3>

              <div>
              <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 16px', color: '#334155', borderBottom: '2px solid #cbd5e1', paddingBottom: 8 }}>👨‍🎓 بيانات الطالب الأساسية</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 16, backgroundColor: 'var(--bg-card)', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                     {form.photo ? (
                        <img src={form.photo} alt="Preview" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📷</div>
                      )}
                     <div>
                       <label style={labelStyle}>الصورة الشخصية (اختياري)</label>
                       <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ marginTop: 8 }} />
                     </div>
                  </div>

                  <div>
                    <label style={labelStyle}>رقم القيد</label>
                    <input value={form.enrollmentNumber} onChange={(e) => setForm({ ...form, enrollmentNumber: e.target.value })} style={inputStyle} placeholder="مثال: 2024001" />
                  </div>
                  <div>
                    <label style={labelStyle}>الرقم الوطني</label>
                    <input 
                      value={form.nationalId} 
                      onChange={(e) => {
                        const val = e.target.value;
                        let newGender = form.gender;
                        if (val.startsWith('1')) newGender = 'ذكر';
                        else if (val.startsWith('2')) newGender = 'أنثى';
                        
                        setForm({ ...form, nationalId: val, gender: newGender });
                      }} 
                      style={inputStyle} 
                      placeholder="مثال: 1198..." 
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>اسم الطالب (رباعي)</label>
                    <input 
                      value={form.name} 
                      onChange={(e) => {
                        const newName = e.target.value;
                        setForm(prev => {
                          let newFatherName = prev.fatherName;
                          const oldParts = prev.name.trim().split(/\s+/);
                          const oldExpectedFather = oldParts.length > 1 ? oldParts.slice(1).join(' ') : '';
                          
                          const newParts = newName.trim().split(/\s+/);
                          const newExpectedFather = newParts.length > 1 ? newParts.slice(1).join(' ') : '';
                          
                          if (!prev.fatherName || prev.fatherName.trim() === oldExpectedFather) {
                            newFatherName = newExpectedFather;
                          }
                          return { ...prev, name: newName, fatherName: newFatherName };
                        });
                      }} 
                      style={inputStyle} 
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>تاريخ الميلاد</label>
                    <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>الجنس</label>
                    <select value={form.gender || 'غير محدد'} onChange={(e) => setForm({ ...form, gender: e.target.value as any })} style={inputStyle}>
                      <option value="غير محدد">غير محدد</option>
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>الصف الدراسي</label>
                    <select value={form.grade} onChange={(e) => handleGradeChange(e.target.value)} style={inputStyle}>
                      {Object.keys(gradeFees).map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>الفصل</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={form.classRoom} onChange={(e) => setForm({ ...form, classRoom: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                        {(classRooms[form.grade] || ['أ']).map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button onClick={() => setShowNewClassRoom(!showNewClassRoom)} style={{ backgroundColor: '#0056b3', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>+</button>
                    </div>
                    {showNewClassRoom && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <input value={newClassRoomName} onChange={(e) => setNewClassRoomName(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="اكتب اسم الفصل (مثال: مسائي، ب، الثاني...)" />
                        <button onClick={handleAddClassRoom} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 700 }}>إضافة</button>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>العنوان (عنوان السكن)</label>
                    <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} placeholder="مثال: طرابلس، حي الأندلس" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>الحالات الخاصة (إن وجدت)</label>
                    <input value={form.specialNeeds} onChange={(e) => setForm({ ...form, specialNeeds: e.target.value })} style={inputStyle} placeholder="مثل: يحتاج نظارة، صعوبة نطق... اتركها فارغة إن لم يوجد" />
                  </div>
                  <div>
                    <label style={labelStyle}>الحالة المرضية (إن وجدت)</label>
                    <input value={form.medicalCondition} onChange={(e) => setForm({ ...form, medicalCondition: e.target.value })} style={inputStyle} placeholder="مثل: ربو، سكري، حساسية..." />
                  </div>
                  <div>
                    <label style={labelStyle}>الدواء المخصص (إن وجد)</label>
                    <input value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} style={inputStyle} placeholder="اسم الدواء أو طريقة الاستخدام..." />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>📋 النواقص (الأوراق والمستندات الناقصة)</label>
                    <textarea value={form.missingItems || ''} onChange={(e) => setForm({ ...form, missingItems: e.target.value })} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="مثل: صورة شهادة ميلاد، صورة من جواز السفر، شهادة نقل..." />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>ملاحظات عامة</label>
                    <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="أي ملاحظات إضافية عن الطالب..." />
                  </div>
                </div>
              </div>

              {/* Parents & Financial Data Section */}
              <div style={{ gridColumn: '1 / -1', backgroundColor: '#f0f9ff', padding: 20, borderRadius: 12, border: '1px solid #bae6fd', marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 16px', color: '#0369a1', borderBottom: '2px solid #7dd3fc', paddingBottom: 8 }}>👨‍👩‍👧‍👦 بيانات ولي الأمر والمالية</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>اسم الأب</label>
                    <input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>هاتف الأب</label>
                    <input 
                      value={form.fatherPhone} 
                      onChange={(e) => {
                        const newPhone = e.target.value;
                        setForm(prev => {
                          const newWhatsapp = (!prev.whatsappPhone || prev.whatsappPhone === prev.fatherPhone) ? newPhone : prev.whatsappPhone;
                          return { ...prev, fatherPhone: newPhone, whatsappPhone: newWhatsapp };
                        });
                      }} 
                      style={inputStyle} 
                      placeholder="مثال: +218912345678" 
                      dir="ltr" 
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>📱 رقم الواتساب (للتواصل)</label>
                    <input 
                      value={form.whatsappPhone || ''} 
                      onChange={(e) => setForm({ ...form, whatsappPhone: e.target.value })} 
                      style={{ ...inputStyle, borderColor: '#22c55e', backgroundColor: '#f0fdf4' }} 
                      placeholder="مثال: +218912345678" 
                      dir="ltr" 
                      title="يتم اعتباره تلقائياً هاتف الأب ما لم تقم بتغييره"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>اسم الأم</label>
                    <input value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>هاتف الأم</label>
                    <input value={form.motherPhone} onChange={(e) => setForm({ ...form, motherPhone: e.target.value })} style={inputStyle} placeholder="مثال: +218912345678" dir="ltr" />
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-card)', padding: 12, borderRadius: 8, border: '1px solid #e0f2fe' }}>
                    <label style={labelStyle}>إجمالي الرسوم للسنة (د.ل)</label>
                    <input 
                      type="number" 
                      value={form.totalFees} 
                      onChange={(e) => setForm({ ...form, totalFees: Number(e.target.value) || 0 })} 
                      style={{ ...inputStyle, fontWeight: 'bold', color: '#0056b3' }} 
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button 
                        type="button" 
                        onClick={() => setForm(prev => ({ ...prev, totalFees: Math.max(0, prev.totalFees - 300) }))} 
                        style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        title="طرح 300 دينار (عند عدم استلام الزي المدرسي)"
                      >
                        👕 عدم استلام زي (-300)
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setForm(prev => ({ ...prev, totalFees: prev.totalFees + 400 }))} 
                        style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        title="إضافة 400 دينار (عند طلب زي إضافي أو زي منفصل)"
                      >
                        👕 طلب زي إضافي (+400)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>🏷️ قيمة الخصم المالي (إن وجد)</label>
                    <input 
                      type="number" 
                      value={form.discountAmount || 0} 
                      onChange={(e) => setForm({ ...form, discountAmount: Number(e.target.value) || 0 })} 
                      style={{ ...inputStyle, fontWeight: 'bold', color: '#dc2626' }} 
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>📝 سبب الخصم (إن وجد)</label>
                    <input 
                      type="text" 
                      value={form.discountReason || ''} 
                      onChange={(e) => setForm({ ...form, discountReason: e.target.value })} 
                      style={inputStyle} 
                      placeholder="مثال: خصم إخوة، أبناء عاملين، تفوق..."
                    />
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-card)', padding: 12, borderRadius: 8, border: '1px solid #e0f2fe' }}>
                    <label style={labelStyle}>نظام الدفع (عدد الأقساط)</label>
                    <select value={form.installmentsCount} onChange={(e) => setForm({ ...form, installmentsCount: parseInt(e.target.value) || 2 })} style={inputStyle}>
                      <option value={1}>دفعة واحدة (كامل المبلغ)</option>
                      <option value={2}>نظام فصلي (قسطين)</option>
                      <option value={3}>نظام ثلاثي (3 أقساط)</option>
                      <option value={4}>نظام ربعي (4 أقساط)</option>
                      <option value={5}>نظام خماسي (5 أقساط)</option>
                      <option value={6}>نظام سداسي (6 أقساط)</option>
                      {(form.grade === 'KG1' || form.grade === 'KG2') && (
                        <option value={9}>نظام شهري (9 أقساط - لرياض الأطفال)</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button onClick={handleSubmit} style={{ backgroundColor: '#0056b3', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>
                حفظ بيانات الطالب
              </button>
              <button onClick={() => setShowModal(false)} style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingStudent && (
        <StudentProfile 
          student={viewingStudent} 
          receipts={receipts}
          schoolName={schoolName}
          schoolLogo={schoolLogo}
          academicYear={academicYear}
          onClose={() => setViewingStudent(null)}
          onEdit={() => {
            setViewingStudent(null);
            openEdit(viewingStudent);
          }}
        />
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
