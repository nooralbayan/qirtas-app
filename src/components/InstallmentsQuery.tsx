import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Student, Receipt } from '../context/AppContext';
import * as XLSX from 'xlsx';

export default function InstallmentsQuery({ onBack }: { onBack: () => void }) {
  const { students, setStudents, receipts, gradeFees, classRooms, schoolName, schoolLogo, academicYear } = useAppContext();

  // Mode: 'single' (استعلام فردي) or 'all' (تقرير جميع الطلاب)
  const [mode, setMode] = useState<'single' | 'all'>('single');

  // Single Student Mode State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // All Students Report Filters State
  const [gradeFilter, setGradeFilter] = useState<string>('الكل');
  const [classRoomFilter, setClassRoomFilter] = useState<string>('الكل');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');

  // Calculate student financial summary
  const getStudentFinancials = (student: Student) => {
    const studentReceipts = receipts.filter(r => r.studentId === student.id);
    const paidAmount = studentReceipts.reduce((sum, r) => sum + r.paidAmount, 0);
    const discountAmount = student.discountAmount || 0;
    const discountReason = student.discountReason || '';
    const netFees = Math.max(0, student.totalFees - discountAmount);
    const remainingAmount = Math.max(0, netFees - paidAmount);
    
    let status: 'مسدد' | 'جزئي' | 'غير مسدد' = 'غير مسدد';
    if (remainingAmount <= 0) {
      status = 'مسدد';
    } else if (paidAmount > 0) {
      status = 'جزئي';
    }

    return {
      totalFees: student.totalFees,
      discountAmount,
      discountReason,
      netFees,
      paidAmount,
      remainingAmount,
      status,
      receiptsCount: studentReceipts.length,
      receipts: studentReceipts
    };
  };

  // Selected Student for Single Mode
  const selectedStudent = useMemo(() => {
    if (selectedStudentId) {
      return students.find(s => s.id === selectedStudentId) || null;
    }
    return null;
  }, [students, selectedStudentId]);

  // Autocomplete Suggestions for Single Mode
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const term = searchQuery.trim().toLowerCase();
    return students.filter(s => 
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.enrollmentNumber && s.enrollmentNumber.includes(term)) ||
      (s.nationalId && s.nationalId.includes(term)) ||
      (s.fatherPhone && s.fatherPhone.includes(term))
    ).slice(0, 10);
  }, [students, searchQuery]);

  // All Students Report Data
  const allStudentsFinancialData = useMemo(() => {
    return students.map(s => {
      const financials = getStudentFinancials(s);
      return {
        student: s,
        ...financials
      };
    });
  }, [students, receipts]);

  // Filtered Data for All Students Report
  const filteredAllStudentsData = useMemo(() => {
    return allStudentsFinancialData.filter(item => {
      const { student, status } = item;

      // Grade Filter
      if (gradeFilter !== 'الكل' && student.grade !== gradeFilter) return false;

      // Class Filter
      if (classRoomFilter !== 'الكل' && student.classRoom !== classRoomFilter) return false;

      // Status Filter
      if (statusFilter !== 'الكل' && status !== statusFilter) return false;

      // Search Term
      if (tableSearchTerm.trim()) {
        const term = tableSearchTerm.trim().toLowerCase();
        const matchesName = student.name && student.name.toLowerCase().includes(term);
        const matchesEnr = student.enrollmentNumber && student.enrollmentNumber.includes(term);
        const matchesNat = student.nationalId && student.nationalId.includes(term);
        if (!matchesName && !matchesEnr && !matchesNat) return false;
      }

      return true;
    });
  }, [allStudentsFinancialData, gradeFilter, classRoomFilter, statusFilter, tableSearchTerm]);

  // Summary Totals for All Students
  const overallSummary = useMemo(() => {
    let totalDue = 0;
    let totalDiscounts = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let fullyPaidCount = 0;
    let partialPaidCount = 0;
    let unpaidCount = 0;

    filteredAllStudentsData.forEach(item => {
      totalDue += item.totalFees;
      totalDiscounts += item.discountAmount;
      totalPaid += item.paidAmount;
      totalRemaining += item.remainingAmount;

      if (item.status === 'مسدد') fullyPaidCount++;
      else if (item.status === 'جزئي') partialPaidCount++;
      else unpaidCount++;
    });

    return {
      totalDue,
      totalDiscounts,
      totalPaid,
      totalRemaining,
      fullyPaidCount,
      partialPaidCount,
      unpaidCount,
      count: filteredAllStudentsData.length
    };
  }, [filteredAllStudentsData]);

  // Class Rooms for dropdown
  const availableClassRooms = useMemo(() => {
    if (gradeFilter !== 'الكل') {
      return classRooms[gradeFilter] || [];
    }
    return [];
  }, [gradeFilter, classRooms]);

  // Handle Printing Single Student Statement
  const handlePrintSingleStatement = () => {
    if (!selectedStudent) return;
    const fin = getStudentFinancials(selectedStudent);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoHtml = schoolLogo?.startsWith('data:image')
      ? `<img src="${schoolLogo}" alt="Logo" style="height:70px;" />`
      : `<div style="font-size:36px;">${schoolLogo || '🏫'}</div>`;

    const today = new Date().toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });

    const receiptsRows = fin.receipts.map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#fafbfc' : '#fff'};">
        <td style="border:1px solid #bbb;padding:8px;text-align:center;">${r.id}</td>
        <td style="border:1px solid #bbb;padding:8px;text-align:center;">${r.date}</td>
        <td style="border:1px solid #bbb;padding:8px;text-align:center;">الدفعة ${r.installmentNo}</td>
        <td style="border:1px solid #bbb;padding:8px;text-align:center;font-weight:bold;color:#059669;">${r.paidAmount} د.ل</td>
        <td style="border:1px solid #bbb;padding:8px;text-align:center;">${r.remaining} د.ل</td>
        <td style="border:1px solid #bbb;padding:8px;text-align:center;">${r.paymentMethod || 'نقدي'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>كشف حساب مالي - ${selectedStudent.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 30px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 15px; margin-bottom: 20px; }
          .card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
          .card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 15px; text-align: center; }
          .card .val { font-size: 22px; font-weight: bold; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #1e3a5f; color: #fff; padding: 10px; font-size: 13px; border: 1px solid #1e3a5f; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="font-size:24px;margin:0 0 5px;">${schoolName}</h1>
            <h3 style="color:#0284c7;margin:0;">كشف حساب مالى وتفقد الأقساط (العام الدراسي ${academicYear})</h3>
            <p style="font-size:13px;color:#64748b;margin-top:5px;">تاريخ التقرير: ${today}</p>
          </div>
          <div>${logoHtml}</div>
        </div>

        <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:15px 20px;border-radius:10px;margin-bottom:20px;display:flex;justify-space-between;flex-wrap:wrap;gap:15px;">
          <div><strong>اسم الطالب:</strong> ${selectedStudent.name}</div>
          <div><strong>رقم القيد:</strong> ${selectedStudent.enrollmentNumber || '-'}</div>
          <div><strong>الصف والفصل:</strong> ${selectedStudent.grade} - فصل (${selectedStudent.classRoom || 'أ'})</div>
          <div><strong>ولي الأمر:</strong> ${selectedStudent.fatherName || '-'} (${selectedStudent.fatherPhone || '-'})</div>
        </div>

        <div class="card-grid">
          <div class="card">
            <div>إجمالي الرسوم المطلوبة</div>
            <div class="val" style="color:#1e3a5f;">${fin.totalFees} د.ل</div>
          </div>
          <div class="card">
            <div>إجمالي المبالغ المدفوعة</div>
            <div class="val" style="color:#059669;">${fin.paidAmount} د.ل</div>
          </div>
          <div class="card">
            <div>المبلغ المتبقي</div>
            <div class="val" style="color:${fin.remainingAmount > 0 ? '#dc2626' : '#059669'};">${fin.remainingAmount} د.ل</div>
          </div>
        </div>

        <h3 style="color:#1e3a5f;margin-bottom:10px;">سجل الدفعات والسندات المالية:</h3>
        ${fin.receipts.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>رقم السند</th>
                <th>التاريخ</th>
                <th>رقم الدفعة</th>
                <th>المبلغ المدفوع</th>
                <th>المتبقي بعد الدفعة</th>
                <th>طريقة الدفع</th>
              </tr>
            </thead>
            <tbody>
              ${receiptsRows}
            </tbody>
          </table>
        ` : '<p style="text-align:center;padding:20px;background:#f8fafc;border-radius:8px;color:#64748b;">لا توجد دفعات مالية مسجلة لهذا الطالب حتى الآن.</p>'}

        <div class="footer">
          <div>الشؤون المالية: ....................</div>
          <div>توقيع ولي الأمر: ....................</div>
          <div>ختم المدرسة: ....................</div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // Handle Printing All Students Report
  const handlePrintAllReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoHtml = schoolLogo?.startsWith('data:image')
      ? `<img src="${schoolLogo}" alt="Logo" style="height:60px;" />`
      : `<div style="font-size:30px;">${schoolLogo || '🏫'}</div>`;

    const today = new Date().toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = filteredAllStudentsData.map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#fafbfc' : '#fff'};">
        <td style="border:1px solid #bbb;padding:6px;text-align:center;font-size:12px;">${i + 1}</td>
        <td style="border:1px solid #bbb;padding:6px;text-align:center;font-size:12px;">${item.student.enrollmentNumber || '-'}</td>
        <td style="border:1px solid #bbb;padding:6px;font-size:12px;font-weight:bold;">${item.student.name}</td>
        <td style="border:1px solid #bbb;padding:6px;text-align:center;font-size:12px;">${item.student.grade} (${item.student.classRoom || 'أ'})</td>
        <td style="border:1px solid #bbb;padding:6px;text-align:center;font-size:12px;">${item.totalFees} د.ل</td>
        <td style="border:1px solid #bbb;padding:6px;text-align:center;font-size:12px;font-weight:bold;color:#059669;">${item.paidAmount} د.ل</td>
        <td style="border:1px solid #bbb;padding:6px;text-align:center;font-size:12px;font-weight:bold;color:${item.remainingAmount > 0 ? '#dc2626' : '#059669'};">${item.remainingAmount} د.ل</td>
        <td style="border:1px solid #bbb;padding:6px;text-align:center;font-size:12px;">
          <span style="padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold;background:${item.status === 'مسدد' ? '#d1fae5;color:#065f46' : item.status === 'جزئي' ? '#fef3c7;color:#92400e' : '#fee2e2;color:#991b1b'};">
            ${item.status}
          </span>
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>تقرير أقساط ومدفوعات الطلاب - ${schoolName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 25px; color: #111; }
          @page { size: A4 portrait; margin: 10mm; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 15px; }
          .stats { display: flex; gap: 15px; margin-bottom: 15px; font-size: 12px; }
          .stats-card { background: #f1f5f9; padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #1e3a5f; color: #fff; padding: 8px; font-size: 12px; border: 1px solid #1e3a5f; }
          .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 12px; color: #555; border-top: 1px solid #ccc; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="font-size:20px;margin:0 0 4px;">${schoolName}</h2>
            <h4 style="color:#0284c7;margin:0;">تقرير تفصيلي بوضع أقساط الطلاب (${gradeFilter !== 'الكل' ? gradeFilter : 'جميع الصفوف'})</h4>
            <p style="font-size:11px;color:#64748b;margin-top:4px;">تاريخ الطباعة: ${today} | إجمالي الطلاب: ${overallSummary.count}</p>
          </div>
          <div>${logoHtml}</div>
        </div>

        <div class="stats">
          <div class="stats-card">إجمالي المطلوبة: <strong>${overallSummary.totalDue} د.ل</strong></div>
          <div class="stats-card">المبالغ المحصلة: <strong style="color:#059669;">${overallSummary.totalPaid} د.ل</strong></div>
          <div class="stats-card">المتبقي المطلوب: <strong style="color:#dc2626;">${overallSummary.totalRemaining} د.ل</strong></div>
          <div class="stats-card">المسددون: <strong>${overallSummary.fullyPaidCount}</strong> | جزئي: <strong>${overallSummary.partialPaidCount}</strong> | غير مسدد: <strong>${overallSummary.unpaidCount}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:4%;">م</th>
              <th style="width:12%;">رقم القيد</th>
              <th style="width:28%;">اسم الطالب</th>
              <th style="width:16%;">الصف والفصل</th>
              <th style="width:12%;">المطلوب</th>
              <th style="width:12%;">المدفوع</th>
              <th style="width:12%;">المتبقي</th>
              <th style="width:10%;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          <div>مسؤول الخزينة: ....................</div>
          <div>المدير العام: ....................</div>
          <div>الختم الرسمي: ....................</div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // Export All Students Report to Excel
  const handleExportExcel = () => {
    if (filteredAllStudentsData.length === 0) {
      alert('لا توجد بيانات للتصدير.');
      return;
    }

    const dataToExport = filteredAllStudentsData.map((item, i) => ({
      'م': i + 1,
      'رقم القيد': item.student.enrollmentNumber || '-',
      'اسم الطالب': item.student.name,
      'الصف الدراسي': item.student.grade,
      'الفصل': item.student.classRoom || 'أ',
      'إجمالي الرسوم المطلوبة (د.ل)': item.totalFees,
      'إجمالي المدفوع (د.ل)': item.paidAmount,
      'المتبقي (د.ل)': item.remainingAmount,
      'حالة السداد': item.status,
      'هاتف ولي الأمر': item.student.fatherPhone || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'أقساط الطلاب');
    
    const fileName = `تقرير_الأقساط_${gradeFilter.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      
      {/* Top Header & Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <button 
          onClick={onBack} 
          style={{ 
            background: 'linear-gradient(135deg, #2563eb, #1e40af)', 
            border: 'none', 
            color: '#ffffff', 
            cursor: 'pointer', 
            fontSize: 16, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '10px 24px', 
            borderRadius: 30, 
            fontWeight: 'bold', 
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)' 
          }}
        >
          <span>⟵</span> العودة للوحة التحكم
        </button>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: 4, borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setMode('single')}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              fontFamily: 'Cairo, sans-serif',
              backgroundColor: mode === 'single' ? '#0056b3' : 'transparent',
              color: mode === 'single' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            🔍 استعلام عن طالب مفرد
          </button>
          <button
            onClick={() => setMode('all')}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              fontFamily: 'Cairo, sans-serif',
              backgroundColor: mode === 'all' ? '#0056b3' : 'transparent',
              color: mode === 'all' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            📋 كشف وتفقد جميع الطلاب والأقساط
          </button>
        </div>
      </div>

      {/* MODE 1: SINGLE STUDENT INQUIRY */}
      {mode === 'single' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 14, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin: '0 0 8px', color: '#0056b3', fontSize: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            💳 الاستعلام عن أقساط طالب محدد
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 24px' }}>
            ابحث عن الطالب برقم القيد، أو الاسم، أو الرقم الوطني لعرض كشف حسابه المالي ودفعاته المسجلة.
          </p>

          {/* Search Box */}
          <div style={{ position: 'relative', maxWidth: 600, marginBottom: 28 }}>
            <input
              type="text"
              placeholder="🔍 اكتب اسم الطالب أو رقم القيد أو الرقم الوطني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: 10,
                border: '2px solid #0056b3',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)'
              }}
            />

            {/* Suggestions Dropdown */}
            {searchSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                marginTop: 6,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                zIndex: 100,
                maxHeight: 280,
                overflowY: 'auto'
              }}>
                {searchSuggestions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setSearchQuery(s.name);
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: 15 }}>{s.name}</strong>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.grade} - فصل ({s.classRoom || 'أ'})</div>
                    </div>
                    <div style={{ fontSize: 13, color: '#0284c7', fontWeight: 600 }}>
                      قيد: {s.enrollmentNumber || '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Student Financial View */}
          {selectedStudent ? (() => {
            const fin = getStudentFinancials(selectedStudent);
            const paidPercentage = Math.min(100, Math.round((fin.paidAmount / (fin.totalFees || 1)) * 100));

            return (
              <div>
                {/* Student Info Card */}
                <div style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid var(--border-color)',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {selectedStudent.photo ? (
                      <img src={selectedStudent.photo} alt={selectedStudent.name} style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 70, height: 70, borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🎓</div>
                    )}
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 22, color: 'var(--text-primary)' }}>{selectedStudent.name}</h3>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span>🏫 {selectedStudent.grade} - فصل ({selectedStudent.classRoom || 'أ'})</span>
                        <span>🆔 رقم القيد: <strong>{selectedStudent.enrollmentNumber || '-'}</strong></span>
                        <span>📄 الرقم الوطني: {selectedStudent.nationalId || '-'}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                        👨‍👩‍👦 ولي الأمر: {selectedStudent.fatherName || '-'} {selectedStudent.fatherPhone ? `(${selectedStudent.fatherPhone})` : ''}
                      </div>

                      {/* Uniform & Discount Badges */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        {(selectedStudent.discountReason?.includes('زي') || selectedStudent.discountAmount === 300) ? (
                          <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                            🚫 تم خصم الزي المدرسي (-300 د.ل)
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                            👕 شامل الزي المدرسي
                          </span>
                        )}

                        {selectedStudent.discountAmount && selectedStudent.discountAmount > 0 && !(selectedStudent.discountReason?.includes('زي') || selectedStudent.discountAmount === 300) && (
                          <span style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                            🏷️ خصم مالي: {selectedStudent.discountAmount} د.ل {selectedStudent.discountReason ? `(${selectedStudent.discountReason})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handlePrintSingleStatement}
                      style={{
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      🖨️ طباعة كشف حساب مالي
                    </button>
                    {selectedStudent.fatherPhone && (
                      <a
                        href={`https://wa.me/${selectedStudent.fatherPhone.replace(/[^\d+]/g, '')}?text=${encodeURIComponent(
                          `السلام عليكم ورحمة الله\n${schoolName}\nتفقد الأقساط والرسوم الخاصة بالتلميذ/ة: ${selectedStudent.name}\n` +
                          `المطلوب: ${fin.totalFees} د.ل\nالمدفوع: ${fin.paidAmount} د.ل\nالمتبقي: ${fin.remainingAmount} د.ل`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: '#25d366',
                          color: '#ffffff',
                          borderRadius: 8,
                          padding: '10px 18px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        📲 إرسال إشعار واتساب
                      </a>
                    )}
                  </div>
                </div>

                {/* Financial KPI Cards & Quick Uniform Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>💰 إجمالي الرسوم المطلوبة</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#0056b3' }}>{fin.totalFees} د.ل</div>
                    
                    {/* Quick Uniform Fee Adjustments */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                      <button
                        onClick={() => {
                          setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, totalFees: Math.max(0, s.totalFees - 300) } : s));
                        }}
                        style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flex: 1 }}
                        title="خصم 300 دينار (قيمة الزي)"
                      >
                        👕 خصم زي (-300)
                      </button>
                      <button
                        onClick={() => {
                          setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, totalFees: s.totalFees + 400 } : s));
                        }}
                        style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flex: 1 }}
                        title="إضافة 400 دينار (قيمة الزي)"
                      >
                        👕 إضافة زي (+400)
                      </button>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>✅ إجمالي المبلغ المدفوع</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#059669' }}>{fin.paidAmount} د.ل</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>⏳ المبلغ المتبقي المستحق</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: fin.remainingAmount > 0 ? '#dc2626' : '#059669' }}>
                      {fin.remainingAmount} د.ل
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>🏷️ حالة السداد</div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{
                        padding: '6px 16px',
                        borderRadius: 20,
                        fontSize: 14,
                        fontWeight: 800,
                        display: 'inline-block',
                        backgroundColor: fin.status === 'مسدد' ? '#d1fae5' : fin.status === 'جزئي' ? '#fef3c7' : '#fee2e2',
                        color: fin.status === 'مسدد' ? '#065f46' : fin.status === 'جزئي' ? '#92400e' : '#991b1b'
                      }}>
                        {fin.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Discount Editor Section */}
                <div style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '2px solid #fde68a',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 20 }}>🏷️</span>
                    <h4 style={{ margin: 0, color: '#92400e', fontSize: 16, fontWeight: 800 }}>الخصم المالي المخصص</h4>
                    {fin.discountAmount > 0 && (
                      <span style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                        خصم مطبق: {fin.discountAmount} د.ل {fin.discountReason ? `(${fin.discountReason})` : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 12, alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        قيمة الخصم (د.ل)
                      </label>
                      <input
                        type="number"
                        min={0}
                        defaultValue={selectedStudent.discountAmount || 0}
                        id={`discount-amount-${selectedStudent.id}`}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1.5px solid #fde68a',
                          backgroundColor: 'var(--input-bg)',
                          color: 'var(--text-primary)',
                          fontFamily: 'Cairo, sans-serif',
                          fontSize: 15,
                          fontWeight: 700,
                          boxSizing: 'border-box'
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        سبب الخصم
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedStudent.discountReason || ''}
                        id={`discount-reason-${selectedStudent.id}`}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1.5px solid #fde68a',
                          backgroundColor: 'var(--input-bg)',
                          color: 'var(--text-primary)',
                          fontFamily: 'Cairo, sans-serif',
                          fontSize: 14,
                          boxSizing: 'border-box'
                        }}
                        placeholder="مثال: خصم إخوة، أبناء عاملين، تفوق..."
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <button
                        onClick={() => {
                          const amountInput = document.getElementById(`discount-amount-${selectedStudent.id}`) as HTMLInputElement;
                          const reasonInput = document.getElementById(`discount-reason-${selectedStudent.id}`) as HTMLInputElement;
                          const discountAmount = Number(amountInput?.value) || 0;
                          const discountReason = reasonInput?.value?.trim() || '';
                          setStudents(prev => prev.map(s =>
                            s.id === selectedStudent.id
                              ? { ...s, discountAmount, discountReason }
                              : s
                          ));
                        }}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '10px 18px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontFamily: 'Cairo, sans-serif',
                          fontSize: 14,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        💾 حفظ الخصم
                      </button>

                      {fin.discountAmount > 0 && (
                        <button
                          onClick={() => {
                            if (!window.confirm('هل أنت متأكد من حذف الخصم المالي لهذا الطالب؟')) return;
                            const amountInput = document.getElementById(`discount-amount-${selectedStudent.id}`) as HTMLInputElement;
                            const reasonInput = document.getElementById(`discount-reason-${selectedStudent.id}`) as HTMLInputElement;
                            if (amountInput) amountInput.value = '0';
                            if (reasonInput) reasonInput.value = '';
                            setStudents(prev => prev.map(s =>
                              s.id === selectedStudent.id
                                ? { ...s, discountAmount: 0, discountReason: '' }
                                : s
                            ));
                          }}
                          style={{
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '10px 16px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontFamily: 'Cairo, sans-serif',
                            fontSize: 14,
                            whiteSpace: 'nowrap'
                          }}
                          title="إلغاء الخصم وإزالته بالكامل"
                        >
                          🗑️ حذف الخصم
                        </button>
                      )}
                    </div>
                  </div>

                  {fin.discountAmount > 0 && (
                    <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: '1px solid #fde68a', fontSize: 13 }}>
                      <span>📋 إجمالي الرسوم الأصلي: <strong>{fin.totalFees} د.ل</strong></span>
                      <span>🏷️ إجمالي الخصم: <strong style={{ color: '#dc2626' }}>-{fin.discountAmount} د.ل</strong></span>
                      <span>💎 الصافي المطلوب: <strong style={{ color: '#0284c7' }}>{fin.netFees} د.ل</strong></span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 20, borderRadius: 12, marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                    <span>نسبة سداد الرسوم ({paidPercentage}%)</span>
                    <span>{fin.paidAmount} / {fin.totalFees} د.ل</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: 'var(--border-color)', height: 14, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                      width: `${paidPercentage}%`,
                      backgroundColor: paidPercentage === 100 ? '#059669' : paidPercentage > 0 ? '#f59e0b' : '#dc2626',
                      height: '100%',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>

                {/* Receipts Log Table */}
                <h3 style={{ margin: '0 0 14px', color: '#0056b3', fontSize: 18 }}>📜 سجل السندات والدفعات المسجلة للطالب:</h3>
                {fin.receipts.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)' }}>
                          <th style={{ padding: 12, textAlign: 'right' }}>رقم السند</th>
                          <th style={{ padding: 12, textAlign: 'right' }}>التاريخ</th>
                          <th style={{ padding: 12, textAlign: 'right' }}>رقم الدفعة</th>
                          <th style={{ padding: 12, textAlign: 'right' }}>المبلغ المدفوع</th>
                          <th style={{ padding: 12, textAlign: 'right' }}>المتبقي بعد السداد</th>
                          <th style={{ padding: 12, textAlign: 'right' }}>طريقة الدفع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fin.receipts.map((r, idx) => (
                          <tr key={r.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: 12, fontWeight: 700, color: '#0284c7' }}>{r.id}</td>
                            <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{r.date}</td>
                            <td style={{ padding: 12 }}>الدفعة {r.installmentNo}</td>
                            <td style={{ padding: 12, fontWeight: 900, color: '#059669' }}>{r.paidAmount} د.ل</td>
                            <td style={{ padding: 12, color: r.remaining > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>{r.remaining} د.ل</td>
                            <td style={{ padding: 12 }}>{r.paymentMethod || 'نقدي'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 30, backgroundColor: 'var(--bg-secondary)', borderRadius: 10, color: 'var(--text-secondary)' }}>
                    لم يتم تسجيل أي سندات أو دفعات مالية لهذا الطالب حتى الآن.
                  </div>
                )}
              </div>
            );
          })() : (
            <div style={{ textAlign: 'center', padding: 50, backgroundColor: 'var(--bg-secondary)', borderRadius: 12, color: 'var(--text-secondary)' }}>
              👈 يرجى كتابة اسم الطالب أو رقم قيده في مربع البحث أعلاه للاستعلام عن الأقساط.
            </div>
          )}
        </div>
      )}

      {/* MODE 2: ALL STUDENTS INSTALLMENTS REPORT */}
      {mode === 'all' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 14, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <h2 style={{ margin: 0, color: '#0056b3', fontSize: 24 }}>
              📋 تقرير وكشف أقساط جميع الطلاب
            </h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handlePrintAllReport}
                style={{ backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
              >
                🖨️ طباعة التقرير الشامل
              </button>
              <button
                onClick={handleExportExcel}
                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
              >
                📊 تصدير Excel
              </button>
            </div>
          </div>

          {/* Overall Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f172a)', color: '#fff', padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>إجمالي الرسوم المطلوبة</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{overallSummary.totalDue} د.ل</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>لعدد {overallSummary.count} طالب</div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>إجمالي المبالغ المحصلة</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{overallSummary.totalPaid} د.ل</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>المسددون بالكامل: {overallSummary.fullyPaidCount}</div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>إجمالي المبالغ المتبقية</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{overallSummary.totalRemaining} د.ل</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>سداد جزئي: {overallSummary.partialPaidCount} | غير مسدد: {overallSummary.unpaidCount}</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 بحث بالاسم أو رقم القيد..."
              value={tableSearchTerm}
              onChange={(e) => setTableSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
            />

            <select
              value={gradeFilter}
              onChange={(e) => { setGradeFilter(e.target.value); setClassRoomFilter('الكل'); }}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', minWidth: 140 }}
            >
              <option value="الكل">كل الصفوف</option>
              {Object.keys(gradeFees).map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            {gradeFilter !== 'الكل' && availableClassRooms.length > 0 && (
              <select
                value={classRoomFilter}
                onChange={(e) => setClassRoomFilter(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', minWidth: 120 }}
              >
                <option value="الكل">كل الفصول</option>
                {availableClassRooms.map(c => <option key={c} value={c}>فصل {c}</option>)}
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', minWidth: 140 }}
            >
              <option value="الكل">كل حالات السداد</option>
              <option value="مسدد">مسدد بالكامل</option>
              <option value="جزئي">سداد جزئي</option>
              <option value="غير مسدد">غير مسدد</option>
            </select>
          </div>

          {/* All Students Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: 12, fontWeight: 700 }}>م</th>
                  <th style={{ padding: 12, fontWeight: 700 }}>رقم القيد</th>
                  <th style={{ padding: 12, fontWeight: 700 }}>اسم الطالب</th>
                  <th style={{ padding: 12, fontWeight: 700 }}>الصف والفصل</th>
                  <th style={{ padding: 12, fontWeight: 700 }}>الرسوم المستحقة</th>
                  <th style={{ padding: 12, fontWeight: 700 }}>المبلغ المدفوع</th>
                  <th style={{ padding: 12, fontWeight: 700 }}>المتبقي</th>
                  <th style={{ padding: 12, fontWeight: 700 }}>حالة السداد</th>
                  <th style={{ padding: 12, fontWeight: 700 }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllStudentsData.map((item, idx) => (
                  <tr key={item.student.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{idx + 1}</td>
                    <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{item.student.enrollmentNumber || '-'}</td>
                    <td style={{ padding: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{item.student.name}</td>
                    <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{item.student.grade} ({item.student.classRoom || 'أ'})</td>
                    <td style={{ padding: 12, fontWeight: 600 }}>{item.totalFees} د.ل</td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#059669' }}>{item.paidAmount} د.ل</td>
                    <td style={{ padding: 12, fontWeight: 900, color: item.remainingAmount > 0 ? '#dc2626' : '#059669' }}>{item.remainingAmount} د.ل</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 14,
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: item.status === 'مسدد' ? '#d1fae5' : item.status === 'جزئي' ? '#fef3c7' : '#fee2e2',
                        color: item.status === 'مسدد' ? '#065f46' : item.status === 'جزئي' ? '#92400e' : '#991b1b'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <button
                        onClick={() => {
                          setSelectedStudentId(item.student.id);
                          setSearchQuery(item.student.name);
                          setMode('single');
                        }}
                        style={{
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: 13
                        }}
                      >
                        🔍 كشف مفصل
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAllStudentsData.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      لا يوجد طلاب يطابقون خيارات التصفية الحالية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
