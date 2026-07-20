import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

interface PayrollEntry {
  teacherId: number;
  teacherName: string;
  baseSalary: number;
  absentDays: number;
  dailyRate: number;
  totalDeduction: number;
  bonuses: number;
  netSalary: number;
  isPaid: boolean;
}

export default function Payroll({ onBack }: { onBack: () => void }) {
  const { teachers, setTeachers, attendanceRecords, schoolName, schoolLogo } = useAppContext();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [paidMap, setPaidMap] = useState<Record<number, boolean>>({});
  const [bonusMap, setBonusMap] = useState<Record<number, number>>({});

  // Calculate payroll for each teacher
  const payrollEntries: PayrollEntry[] = teachers.map(teacher => {
    const baseSalary = teacher.salary || 0;
    const workDaysInMonth = 22; // Approximate
    const dailyRate = baseSalary > 0 ? Math.round(baseSalary / workDaysInMonth) : 0;

    // Count absent days for this teacher in the selected month
    const teacherAbsences = attendanceRecords.filter(record => {
      if (record.teacherId !== teacher.id) return false;
      const recDate = new Date(record.date);
      return recDate.getMonth() === selectedMonth && recDate.getFullYear() === selectedYear && record.status === 'غائب';
    });
    const absentDays = teacherAbsences.length;

    const totalDeduction = absentDays * dailyRate;
    const bonuses = bonusMap[teacher.id] || 0;
    const netSalary = baseSalary - totalDeduction + bonuses;

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      baseSalary,
      absentDays,
      dailyRate,
      totalDeduction,
      bonuses,
      netSalary: Math.max(0, netSalary),
      isPaid: paidMap[teacher.id] || false,
    };
  });

  const totalSalaries = payrollEntries.reduce((s, e) => s + e.netSalary, 0);
  const totalPaid = payrollEntries.filter(e => e.isPaid).reduce((s, e) => s + e.netSalary, 0);
  const totalRemaining = totalSalaries - totalPaid;

  const togglePaid = (teacherId: number) => {
    setPaidMap(prev => ({ ...prev, [teacherId]: !prev[teacherId] }));
  };

  const printReceipt = (entry: PayrollEntry) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const logoHtml = schoolLogo?.startsWith('data:image') ? `<img src="${schoolLogo}" style="max-width:80px;max-height:80px;" />` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>إيصال راتب - ${entry.teacherName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 30px; color: #111; }
          @page { size: A5; margin: 10mm; }
          .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #1e3a8a; padding: 24px; border-radius: 12px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #1e3a8a; padding-bottom: 16px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { padding: 10px 12px; border: 1px solid #cbd5e1; text-align: right; }
          th { background: #1e3a8a; color: #fff; font-weight: 700; }
          .net { background: #fef3c7; font-weight: 700; font-size: 18px; }
          .footer { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 16px; border-top: 1px solid #ccc; }
          .footer div { text-align: center; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div>
              <h2 style="color:#1e3a8a;">${schoolName}</h2>
              <p style="color:#555;">إيصال استلام راتب</p>
            </div>
            <div>${logoHtml}</div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;font-size:15px;">
            <p><strong>اسم المعلم:</strong> ${entry.teacherName}</p>
            <p><strong>الشهر:</strong> ${MONTHS_AR[selectedMonth]} ${selectedYear}</p>
          </div>

          <table>
            <tr><th>البند</th><th>المبلغ (د.ل)</th></tr>
            <tr><td>الراتب الأساسي</td><td>${entry.baseSalary.toLocaleString()}</td></tr>
            <tr><td>أيام الغياب</td><td style="color:#dc2626;">${entry.absentDays} يوم</td></tr>
            <tr><td>قيمة اليومية</td><td>${entry.dailyRate.toLocaleString()}</td></tr>
            <tr><td style="color:#dc2626;">إجمالي الخصومات</td><td style="color:#dc2626;">-${entry.totalDeduction.toLocaleString()}</td></tr>
            ${entry.bonuses > 0 ? `<tr><td style="color:#16a34a;">حوافز/بدلات</td><td style="color:#16a34a;">+${entry.bonuses.toLocaleString()}</td></tr>` : ''}
            <tr class="net"><td>صافي الراتب المستحق</td><td>${entry.netSalary.toLocaleString()} د.ل</td></tr>
          </table>

          <div class="footer">
            <div>
              <p style="font-weight:700;">توقيع المعلم</p>
              <p style="margin-top:30px;">.................................</p>
            </div>
            <div>
              <p style="font-weight:700;">توقيع المحاسب</p>
              <p style="margin-top:30px;">.................................</p>
            </div>
            <div>
              <p style="font-weight:700;">اعتماد المدير</p>
              <p style="margin-top:30px;">.................................</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 8px', color: 'var(--primary-color)' }}>💰 إدارة الرواتب والمستحقات</h1>
          <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)' }}>
            <span style={{ fontSize: 20 }}>⟵</span> العودة للوحة التحكم
          </button>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 'bold' }}>
            {MONTHS_AR.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 'bold' }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: 'linear-gradient(135deg, #0056b3, #003d82)', color: '#fff', padding: 24, borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>إجمالي الرواتب المستحقة</h4>
          <h1 style={{ margin: '8px 0 0', fontSize: 26 }}>{totalSalaries.toLocaleString()} <span style={{ fontSize: 14 }}>د.ل</span></h1>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: 24, borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>تم الصرف</h4>
          <h1 style={{ margin: '8px 0 0', fontSize: 26 }}>{totalPaid.toLocaleString()} <span style={{ fontSize: 14 }}>د.ل</span></h1>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', padding: 24, borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>المتبقي</h4>
          <h1 style={{ margin: '8px 0 0', fontSize: 26 }}>{totalRemaining.toLocaleString()} <span style={{ fontSize: 14 }}>د.ل</span></h1>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="card" style={{ borderRadius: 12, padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--primary-color)' }}>كشف رواتب {MONTHS_AR[selectedMonth]} {selectedYear}</h3>
        
        {teachers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            لا يوجد معلمون مسجلون. يرجى إضافة المعلمين أولاً من شاشة "إدارة المعلمين" مع تحديد الراتب الأساسي لكل معلم.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: 14 }}>اسم المعلم</th>
                  <th style={{ padding: 14, textAlign: 'center' }}>الراتب الأساسي</th>
                  <th style={{ padding: 14, textAlign: 'center' }}>أيام الغياب</th>
                  <th style={{ padding: 14, textAlign: 'center' }}>قيمة اليومية</th>
                  <th style={{ padding: 14, textAlign: 'center' }}>الخصومات</th>
                  <th style={{ padding: 14, textAlign: 'center' }}>حوافز</th>
                  <th style={{ padding: 14, textAlign: 'center' }}>صافي الراتب</th>
                  <th style={{ padding: 14, textAlign: 'center' }}>الحالة</th>
                  <th style={{ padding: 14, textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {payrollEntries.map((entry, idx) => (
                  <tr key={entry.teacherId} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 14, fontWeight: 'bold' }}>{entry.teacherName}</td>
                    <td style={{ padding: 14, textAlign: 'center' }}>{entry.baseSalary.toLocaleString()}</td>
                    <td style={{ padding: 14, textAlign: 'center', color: entry.absentDays > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{entry.absentDays}</td>
                    <td style={{ padding: 14, textAlign: 'center' }}>{entry.dailyRate.toLocaleString()}</td>
                    <td style={{ padding: 14, textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>{entry.totalDeduction > 0 ? `-${entry.totalDeduction.toLocaleString()}` : '0'}</td>
                    <td style={{ padding: 14, textAlign: 'center' }}>
                      <input 
                        type="number" min="0"
                        value={bonusMap[entry.teacherId] || ''}
                        onChange={e => setBonusMap(prev => ({ ...prev, [entry.teacherId]: parseInt(e.target.value) || 0 }))}
                        style={{ width: 80, padding: 6, border: '1px solid var(--border-color)', borderRadius: 6, textAlign: 'center', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'Cairo' }}
                        placeholder="0"
                      />
                    </td>
                    <td style={{ padding: 14, textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: '#1e3a8a' }}>{entry.netSalary.toLocaleString()} د.ل</td>
                    <td style={{ padding: 14, textAlign: 'center' }}>
                      <span style={{ backgroundColor: entry.isPaid ? '#10b981' : '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 'bold' }}>
                        {entry.isPaid ? 'تم الصرف ✓' : 'لم يُصرف'}
                      </span>
                    </td>
                    <td style={{ padding: 14, textAlign: 'center', display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => togglePaid(entry.teacherId)} style={{ backgroundColor: entry.isPaid ? '#94a3b8' : '#10b981', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 'bold', fontSize: 13 }}>
                        {entry.isPaid ? 'تراجع' : 'صرف'}
                      </button>
                      <button onClick={() => printReceipt(entry)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 'bold', fontSize: 13 }}>
                        🖨️ إيصال
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
