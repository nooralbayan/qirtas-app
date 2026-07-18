import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import * as XLSX from 'xlsx';

export default function Reports({ onBack }: { onBack: () => void }) {
  const { students, receipts, schoolName, schoolLogo, gradeFees, teachers, timetables, classRooms } = useAppContext();
  const [activeReport, setActiveReport] = useState<'all' | 'class' | 'delayed' | 'parents' | 'specialNeeds' | 'medical' | 'teacherWorkload' | null>(null);
  
  // Create a combined list of all classes for the filter
  const allClassKeys = ['الكل'];
  Object.keys(gradeFees).forEach(grade => {
    const classes = classRooms[grade] || [];
    if (classes.length > 0) {
      classes.forEach(c => allClassKeys.push(`${grade} - ${c}`));
    } else {
      allClassKeys.push(grade);
    }
  });

  const [classFilter, setClassFilter] = useState('الكل');

  // Map financial data dynamically
  const reportData = students.map(s => {
    const paid = receipts.filter(r => r.studentId === s.id).reduce((acc, r) => acc + r.paidAmount, 0);
    const remaining = s.totalFees - paid;
    const studentClassKey = s.classRoom ? `${s.grade} - ${s.classRoom}` : s.grade;
    return {
      id: s.id,
      name: s.name,
      grade: studentClassKey,
      due: s.totalFees,
      paid: paid,
      remaining: remaining < 0 ? 0 : remaining,
      status: remaining <= 0 ? 'مسدد' : (paid > 0 ? 'جزئي' : 'متأخر')
    };
  });

  let financialFilteredData = reportData;
  if (activeReport === 'class') {
    financialFilteredData = reportData.filter(s => s.grade === classFilter && classFilter !== 'الكل');
  } else if (activeReport === 'delayed') {
    financialFilteredData = reportData.filter(s => s.status === 'متأخر' || s.status === 'جزئي');
  }

  const totalDue = financialFilteredData.reduce((a, s) => a + s.due, 0);
  const totalPaid = financialFilteredData.reduce((a, s) => a + s.paid, 0);
  const totalRemaining = financialFilteredData.reduce((a, s) => a + s.remaining, 0);

  // Filter students for data reports
  let dataFilteredStudents = students;
  if (classFilter !== 'الكل') {
    dataFilteredStudents = students.filter(s => (s.classRoom ? `${s.grade} - ${s.classRoom}` : s.grade) === classFilter);
  }

  if (activeReport === 'specialNeeds') {
    dataFilteredStudents = dataFilteredStudents.filter(s => s.specialNeeds && s.specialNeeds.trim() !== '' && s.specialNeeds !== 'لا يوجد');
  } else if (activeReport === 'medical') {
    dataFilteredStudents = dataFilteredStudents.filter(s => s.medicalCondition && s.medicalCondition.trim() !== '' && s.medicalCondition !== 'لا يوجد' && s.medicalCondition !== 'سليمة');
  }

  // Teacher Workload Data
  const teacherWorkloadData = teachers.map(t => {
    let totalPeriods = 0;
    const classesTaught = new Set<string>();
    const subjectsTaught = new Set<string>();

    Object.entries(timetables).forEach(([classKey, entries]) => {
      entries.forEach(entry => {
        if (entry.teacher === t.name) {
          totalPeriods++;
          classesTaught.add(classKey);
          subjectsTaught.add(entry.subject);
        }
      });
    });

    return {
      id: t.id,
      name: t.name,
      subject: t.subject,
      totalPeriods,
      classesTaught: Array.from(classesTaught).join('، '),
      subjectsTaught: Array.from(subjectsTaught).join('، ')
    };
  }).filter(t => t.totalPeriods > 0);

  const isFinancialReport = activeReport === 'all' || activeReport === 'class' || activeReport === 'delayed';
  const isDataReport = activeReport === 'parents' || activeReport === 'specialNeeds' || activeReport === 'medical';
  const isTeacherReport = activeReport === 'teacherWorkload';

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let reportTitle = '';
    if (activeReport === 'all') reportTitle = 'التقرير المالي الشامل للطلاب';
    else if (activeReport === 'class') reportTitle = `التقرير المالي - ${classFilter}`;
    else if (activeReport === 'delayed') reportTitle = 'تقرير كشف ديون الطلاب المتأخرين';
    else if (activeReport === 'parents') reportTitle = `تقرير أولياء الأمور والعناوين - ${classFilter}`;
    else if (activeReport === 'specialNeeds') reportTitle = `تقرير الحالات الخاصة - ${classFilter}`;
    else if (activeReport === 'medical') reportTitle = `تقرير الحالات المرضية - ${classFilter}`;
    else if (activeReport === 'teacherWorkload') reportTitle = `تقرير أنصبة المعلمين وجداولهم`;

    const logoHtml = schoolLogo.startsWith('data:image')
      ? `<img src="${schoolLogo}" alt="Logo" style="height:60px;" />`
      : `<div style="font-size:30px;">${schoolLogo}</div>`;

    let tableHead = '';
    let tableBody = '';
    let tableFoot = '';

    if (isFinancialReport) {
      tableHead = `
        <tr>
          <th style="width:5%;">م</th>
          <th style="width:28%;">اسم الطالب</th>
          <th style="width:14%;">الصف</th>
          <th style="width:13%;">الرسوم (د.ل)</th>
          <th style="width:13%;">المدفوع (د.ل)</th>
          <th style="width:13%;">المتبقي (د.ل)</th>
          <th style="width:14%;">الحالة</th>
        </tr>
      `;
      tableBody = financialFilteredData.map((s, i) => `
        <tr style="background:${i % 2 === 0 ? '#fafbfc' : '#fff'};">
          <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">${i + 1}</td>
          <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;font-weight:600;">${s.name}</td>
          <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">${s.grade}</td>
          <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">${s.due}</td>
          <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;color:#059669;font-weight:bold;">${s.paid}</td>
          <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;color:${s.remaining > 0 ? '#dc2626' : '#059669'};font-weight:bold;">${s.remaining}</td>
          <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">
            <span style="background:${s.status === 'مسدد' ? '#dcfce7' : s.status === 'جزئي' ? '#fef9c3' : '#fee2e2'};color:${s.status === 'مسدد' ? '#166534' : s.status === 'جزئي' ? '#854d0e' : '#991b1b'};padding:2px 8px;border-radius:8px;font-size:10px;font-weight:bold;">${s.status}</span>
          </td>
        </tr>
      `).join('');
      tableFoot = `
        <tr class="summary-row">
          <td colspan="3" style="text-align:center;">الإجمالي (${financialFilteredData.length} طالب)</td>
          <td style="text-align:center;">${totalDue}</td>
          <td style="text-align:center;color:#059669;">${totalPaid}</td>
          <td style="text-align:center;color:#dc2626;">${totalRemaining}</td>
          <td></td>
        </tr>
      `;
    } else if (isTeacherReport) {
      tableHead = `
        <tr>
          <th style="width:5%;">م</th>
          <th style="width:20%;">اسم المعلم</th>
          <th style="width:15%;">التخصص الأساسي</th>
          <th style="width:10%;">إجمالي الحصص (أسبوعياً)</th>
          <th style="width:25%;">المواد الفعلية المُدرّسة</th>
          <th style="width:25%;">الفصول المُسندة</th>
        </tr>
      `;
      tableBody = teacherWorkloadData.map((t, i) => `
        <tr style="background:${i % 2 === 0 ? '#fafbfc' : '#fff'};">
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-size:12px;">${i + 1}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;font-size:12px;font-weight:600;">${t.name}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-size:12px;">${t.subject}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-size:14px;font-weight:bold;color:#2563eb;">${t.totalPeriods}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;font-size:11px;">${t.subjectsTaught}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;font-size:11px;">${t.classesTaught}</td>
        </tr>
      `).join('');
    } else {
      tableHead = `
        <tr>
          <th style="width:5%;">م</th>
          <th style="width:20%;">اسم الطالب</th>
          <th style="width:10%;">الصف</th>
          <th style="width:20%;">ولي الأمر (الأب / الأم)</th>
          <th style="width:20%;">أرقام الهواتف</th>
          <th style="width:25%;">ملاحظات / حالة صحية</th>
        </tr>
      `;
      tableBody = dataFilteredStudents.map((s, i) => `
        <tr style="background:${i % 2 === 0 ? '#fafbfc' : '#fff'};">
          <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">${i + 1}</td>
          <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;font-weight:600;">${s.name}</td>
          <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">${s.classRoom ? `${s.grade} - ${s.classRoom}` : s.grade}</td>
          <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;">${s.fatherName || ''} <br/> ${s.motherName || ''}</td>
          <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;direction:ltr;text-align:right;">${s.fatherPhone} <br/> ${s.motherPhone}</td>
          <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;">
            ${s.specialNeeds && s.specialNeeds !== 'لا يوجد' ? `<b>حالة خاصة:</b> ${s.specialNeeds}<br/>` : ''}
            ${s.medicalCondition && s.medicalCondition !== 'لا يوجد' && s.medicalCondition !== 'سليمة' ? `<b>حالة مرضية:</b> ${s.medicalCondition}<br/>` : ''}
            ${s.medication ? `<b>دواء:</b> ${s.medication}<br/>` : ''}
            ${s.notes || ''}
          </td>
        </tr>
      `).join('');
      tableFoot = `
        <tr class="summary-row">
          <td colspan="6" style="text-align:center;">إجمالي الطلاب في هذا التقرير: ${dataFilteredStudents.length}</td>
        </tr>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px; color: #1a1a2e; }
          @page { size: A4; margin: 15mm; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
          .header h2 { font-size: 22px; color: #1e40af; margin-bottom: 5px; }
          .header h3 { font-size: 16px; color: #4a5568; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f1f5f9; color: #1e40af; padding: 10px 8px; border: 1px solid #bbb; font-size: 13px; font-weight: 700; }
          .summary-row { background-color: #1e40af; color: #fff; font-weight: bold; font-size: 13px; }
          .summary-row td { border: 1px solid #1e40af; padding: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2>${schoolName}</h2>
            <h3>${reportTitle}</h3>
            <p style="font-size:12px; margin-top:5px; color:#718096;">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-LY')}</p>
          </div>
          <div>${logoHtml}</div>
        </div>
        <table>
          <thead>${tableHead}</thead>
          <tbody>${tableBody}</tbody>
          <tfoot>${tableFoot}</tfoot>
        </table>
        <div style="margin-top:40px; display:flex; justify-content:space-between; font-weight:bold;">
          <div>توقيع المختص: ........................</div>
          <div>توقيع المدير: ........................</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleExportExcel = () => {
    let dataToExport: any[] = [];
    let title = '';

    if (isFinancialReport) {
      dataToExport = financialFilteredData.map((s: any, i) => ({
        'م': i + 1,
        'اسم الطالب': s.name,
        'الفصل': s.classRoom ? `${s.grade} - ${s.classRoom}` : s.grade,
        'إجمالي الرسوم': s.totalFees || s.due,
        'المدفوع': s.paid,
        'المتبقي': s.remaining,
        'الحالة': s.remaining === 0 ? 'مسدد بالكامل' : (s.paid > 0 ? 'مسدد جزئي' : 'غير مسدد')
      }));
      title = activeReport === 'all' ? 'التقرير المالي الشامل' : (activeReport === 'delayed' ? 'تقرير المتأخرين' : 'التقرير المالي للفصل');
    } else if (isTeacherReport) {
      dataToExport = teacherWorkloadData.map((t, i) => ({
        'م': i + 1,
        'اسم المعلم': t.name,
        'التخصص الأساسي': t.subject,
        'إجمالي الحصص': t.totalPeriods,
        'المواد الفعلية المُدرّسة': t.subjectsTaught,
        'الفصول المُسندة': t.classesTaught
      }));
      title = 'تقرير أنصبة المعلمين';
    } else {
      dataToExport = dataFilteredStudents.map((s, i) => ({
        'م': i + 1,
        'اسم الطالب': s.name,
        'الفصل': s.classRoom ? `${s.grade} - ${s.classRoom}` : s.grade,
        'الأب': s.fatherName,
        'الأم': s.motherName,
        'هاتف الأب': s.fatherPhone,
        'هاتف الأم': s.motherPhone,
        'الحالة الخاصة': s.specialNeeds,
        'الحالة المرضية': s.medicalCondition,
        'الأدوية': s.medication,
        'ملاحظات': s.notes
      }));
      title = activeReport === 'parents' ? 'بيانات أولياء الأمور' : (activeReport === 'specialNeeds' ? 'تقرير الحالات الخاصة' : 'تقرير الحالات المرضية');
    }

    if (dataToExport.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');
    
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const renderContent = () => {
    if (!activeReport) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {/* Financial Reports */}
          <div className="card" style={{ padding: 24, borderRadius: 12 }}>
            <h3 style={{ marginBottom: 16, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>💰</span> التقارير المالية
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => setActiveReport('all')} style={btnOutline}>التقرير المالي الشامل</button>
              <button onClick={() => setActiveReport('class')} style={btnOutline}>التقرير المالي حسب الفصل</button>
              <button onClick={() => setActiveReport('delayed')} style={btnOutline}>تقرير المتأخرين عن السداد</button>
            </div>
          </div>

          {/* Student Data Reports */}
          <div className="card" style={{ padding: 24, borderRadius: 12 }}>
            <h3 style={{ marginBottom: 16, color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>👨‍👩‍👧‍👦</span> تقارير بيانات الطلاب
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => setActiveReport('parents')} style={{ ...btnOutline, borderColor: 'var(--success-color)', color: 'var(--success-color)' }}>بيانات أولياء الأمور والعناوين</button>
              <button onClick={() => setActiveReport('specialNeeds')} style={{ ...btnOutline, borderColor: 'var(--warning-color)', color: 'var(--warning-color)' }}>تقرير الحالات الخاصة</button>
              <button onClick={() => setActiveReport('medical')} style={{ ...btnOutline, borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>تقرير الحالات المرضية والأدوية</button>
            </div>
          </div>

          {/* Teacher Reports */}
          <div className="card" style={{ padding: 24, borderRadius: 12 }}>
            <h3 style={{ marginBottom: 16, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>👨‍🏫</span> تقارير المعلمين
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => setActiveReport('teacherWorkload')} style={{ ...btnOutline, borderColor: '#8b5cf6', color: '#8b5cf6' }}>نصاب المعلمين (الحصص والفصول)</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card" style={{ borderRadius: 12, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>
            {activeReport === 'all' && 'التقرير المالي الشامل'}
            {activeReport === 'class' && 'التقرير المالي حسب الفصل'}
            {activeReport === 'delayed' && 'تقرير المتأخرين'}
            {activeReport === 'parents' && 'بيانات أولياء الأمور'}
            {activeReport === 'specialNeeds' && 'تقرير الحالات الخاصة'}
            {activeReport === 'medical' && 'تقرير الحالات المرضية'}
            {activeReport === 'teacherWorkload' && 'تقرير أنصبة المعلمين'}
          </h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {(activeReport === 'class' || activeReport === 'parents' || activeReport === 'specialNeeds' || activeReport === 'medical') && (
              <select 
                value={classFilter} 
                onChange={e => setClassFilter(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--input-bg)' }}
              >
                {allClassKeys.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <button onClick={handleExportExcel} style={{...btnPrimary, backgroundColor: '#10b981'}}>📊 تصدير Excel</button>
            <button onClick={handlePrintReport} style={btnPrimary}>🖨️ طباعة التقرير (PDF)</button>
            <button onClick={() => setActiveReport(null)} style={btnSecondary}>العودة للتقارير</button>
          </div>
        </div>

        {/* Data Preview */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: 14 }}>
            <thead>
              {isFinancialReport ? (
                <tr>
                  <th style={thStyle}>اسم الطالب</th>
                  <th style={thStyle}>الفصل</th>
                  <th style={thStyle}>إجمالي الرسوم (د.ل)</th>
                  <th style={thStyle}>المدفوع (د.ل)</th>
                  <th style={thStyle}>المتبقي (د.ل)</th>
                  <th style={thStyle}>الحالة</th>
                </tr>
              ) : isTeacherReport ? (
                <tr>
                  <th style={thStyle}>اسم المعلم</th>
                  <th style={thStyle}>التخصص الأساسي</th>
                  <th style={thStyle}>إجمالي الحصص</th>
                  <th style={thStyle}>المواد الفعلية المُدرّسة</th>
                  <th style={thStyle}>الفصول المُسندة</th>
                </tr>
              ) : (
                <tr>
                  <th style={thStyle}>اسم الطالب</th>
                  <th style={thStyle}>الفصل</th>
                  <th style={thStyle}>ولي الأمر</th>
                  <th style={thStyle}>أرقام الهواتف</th>
                  <th style={thStyle}>ملاحظات / حالة</th>
                </tr>
              )}
            </thead>
            <tbody>
              {isFinancialReport && financialFilteredData.length > 0 ? (
                financialFilteredData.map((s, idx) => (
                  <tr key={s.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)' }}>
                    <td style={tdStyle}>{s.name}</td>
                    <td style={tdStyle}>{s.grade}</td>
                    <td style={tdStyle}>{s.due}</td>
                    <td style={{ ...tdStyle, color: 'var(--success-color)', fontWeight: 'bold' }}>{s.paid}</td>
                    <td style={{ ...tdStyle, color: s.remaining > 0 ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 'bold' }}>{s.remaining}</td>
                    <td style={tdStyle}>
                      <span style={{ 
                        background: s.status === 'مسدد' ? 'var(--success-color)' : s.status === 'جزئي' ? 'var(--warning-color)' : 'var(--danger-color)', 
                        color: s.status === 'جزئي' ? '#000' : '#fff', 
                        padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' 
                      }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : isTeacherReport && teacherWorkloadData.length > 0 ? (
                teacherWorkloadData.map((t, idx) => (
                  <tr key={t.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)' }}>
                    <td style={tdStyle}>{t.name}</td>
                    <td style={tdStyle}>{t.subject}</td>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--primary-color)', fontSize: 16 }}>{t.totalPeriods}</td>
                    <td style={tdStyle}>{t.subjectsTaught}</td>
                    <td style={tdStyle}>{t.classesTaught}</td>
                  </tr>
                ))
              ) : !isFinancialReport && !isTeacherReport && dataFilteredStudents.length > 0 ? (
                dataFilteredStudents.map((s, idx) => (
                  <tr key={s.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)' }}>
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{s.name}</td>
                    <td style={tdStyle}>{s.classRoom ? `${s.grade} - ${s.classRoom}` : s.grade}</td>
                    <td style={tdStyle}>{s.fatherName} <br/> {s.motherName}</td>
                    <td style={{ ...tdStyle, direction: 'ltr', textAlign: 'right' }}>{s.fatherPhone} <br/> {s.motherPhone}</td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>
                      {s.specialNeeds && s.specialNeeds !== 'لا يوجد' && <div style={{ color: 'var(--warning-color)' }}><b>حالة خاصة:</b> {s.specialNeeds}</div>}
                      {s.medicalCondition && s.medicalCondition !== 'لا يوجد' && s.medicalCondition !== 'سليمة' && <div style={{ color: 'var(--danger-color)' }}><b>حالة مرضية:</b> {s.medicalCondition}</div>}
                      {s.medication && <div><b>دواء:</b> {s.medication}</div>}
                      {s.notes && <div>{s.notes}</div>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    لا توجد بيانات متاحة لهذا التقرير
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ direction: 'rtl', padding: 24, minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      <button onClick={onBack} style={{ background: 'linear-gradient(135deg, var(--primary-color), #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
        <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
      </button>

      {renderContent()}
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '14px', borderBottom: '2px solid var(--border-color)', fontWeight: 700 };
const tdStyle: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid var(--border-color)' };
const btnOutline: React.CSSProperties = { padding: '12px 16px', background: 'transparent', border: '2px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15, transition: 'all 0.2s', textAlign: 'center' };
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15 };
const btnSecondary: React.CSSProperties = { padding: '10px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15 };
