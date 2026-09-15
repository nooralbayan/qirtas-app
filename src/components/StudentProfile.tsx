import React from 'react';
import type { Student, Receipt } from '../context/AppContext';

interface StudentProfileProps {
  student: Student;
  receipts: Receipt[];
  schoolName: string;
  schoolLogo: string;
  academicYear: string;
  onClose: () => void;
  onEdit: () => void;
}

export default function StudentProfile({
  student,
  receipts,
  schoolName,
  schoolLogo,
  academicYear,
  onClose,
  onEdit,
}: StudentProfileProps) {
  const studentReceipts = receipts.filter(r => r.studentId === student.id);
  const paidAmount = studentReceipts.reduce((sum, r) => sum + r.paidAmount, 0);
  const discountAmount = student.discountAmount || 0;
  const discountReason = student.discountReason || '';
  const netFees = Math.max(0, student.totalFees - discountAmount);
  const remainingAmount = Math.max(0, netFees - paidAmount);
  const paidPercent = netFees > 0 ? Math.min(100, Math.round((paidAmount / netFees) * 100)) : 100;

  const paymentStatusColor =
    remainingAmount <= 0 ? '#059669' : paidAmount > 0 ? '#f59e0b' : '#dc2626';
  const paymentStatusLabel =
    remainingAmount <= 0 ? 'مسدد بالكامل' : paidAmount > 0 ? 'دفع جزئي' : 'غير مسدد';

  const handlePrint = () => {
    const pw = window.open('', '_blank');
    if (!pw) return;
    const logoHtml = schoolLogo?.startsWith('data:image')
      ? `<img src="${schoolLogo}" style="height:60px;border-radius:8px;" />`
      : `<div style="font-size:36px;">${schoolLogo || '🏫'}</div>`;

    pw.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
      <title>بطاقة الطالب - ${student.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Cairo',sans-serif;direction:rtl;padding:20px;background:#f8fafc;color:#1e293b;}
        @page{size:A4;margin:10mm;}
        .card{background:#fff;border-radius:12px;padding:20px;border:1px solid #e2e8f0;margin-bottom:14px;}
        h3{color:#0056b3;border-bottom:2px solid #e0f2fe;padding-bottom:8px;margin-bottom:14px;font-size:15px;}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .field label{font-size:11px;color:#64748b;font-weight:700;margin-bottom:3px;display:block;}
        .field span{font-size:14px;color:#1e293b;font-weight:600;}
        .header{display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#0056b3,#0284c7);color:#fff;padding:20px;border-radius:12px;margin-bottom:14px;}
        .fin-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center;}
        .fin-box{background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;}
        .fin-box .val{font-size:18px;font-weight:900;}
        .fin-box .lbl{font-size:10px;color:#64748b;margin-bottom:4px;}
        .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;}
        table{width:100%;border-collapse:collapse;font-size:12px;}
        th{background:#0056b3;color:#fff;padding:8px;text-align:right;}
        td{padding:8px;border-bottom:1px solid #e2e8f0;}
        tr:nth-child(even) td{background:#f8fafc;}
      </style>
    </head><body>
      <div class="header">
        <div>
          <div style="font-size:11px;opacity:0.8;">بطاقة بيانات الطالب - ${academicYear}</div>
          <div style="font-size:22px;font-weight:900;margin:4px 0;">${student.name}</div>
          <div style="font-size:13px;opacity:0.9;">${student.grade} - فصل (${student.classRoom}) | رقم القيد: ${student.enrollmentNumber || '-'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;">
          ${student.photo ? `<img src="${student.photo}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.4);" />` : '<div style="width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:28px;">🎓</div>'}
          ${logoHtml}
        </div>
      </div>

      <div class="card">
        <h3>📋 البيانات الشخصية والإدارية</h3>
        <div class="grid-2">
          <div class="field"><label>الاسم الكامل</label><span>${student.name}</span></div>
          <div class="field"><label>رقم القيد</label><span>${student.enrollmentNumber || '-'}</span></div>
          <div class="field"><label>الرقم الوطني</label><span>${student.nationalId || '-'}</span></div>
          <div class="field"><label>تاريخ الميلاد</label><span>${student.birthDate || '-'}</span></div>
          <div class="field"><label>الجنس</label><span>${student.gender || '-'}</span></div>
          <div class="field"><label>العنوان</label><span>${student.address || '-'}</span></div>
          <div class="field"><label>الصف الدراسي</label><span>${student.grade}</span></div>
          <div class="field"><label>الفصل</label><span>${student.classRoom}</span></div>
        </div>
      </div>

      <div class="card">
        <h3>👨‍👩‍👦 بيانات ولي الأمر</h3>
        <div class="grid-2">
          <div class="field"><label>اسم الأب</label><span>${student.fatherName || '-'}</span></div>
          <div class="field"><label>هاتف الأب</label><span>${student.fatherPhone || '-'}</span></div>
          <div class="field"><label>اسم الأم</label><span>${student.motherName || '-'}</span></div>
          <div class="field"><label>هاتف الأم</label><span>${student.motherPhone || '-'}</span></div>
          ${student.additionalPhone ? `<div class="field"><label>هاتف إضافي</label><span>${student.additionalPhone}</span></div>` : ''}
        </div>
      </div>

      <div class="card">
        <h3>💰 الوضع المالي</h3>
        <div class="fin-grid">
          <div class="fin-box"><div class="lbl">إجمالي الرسوم</div><div class="val" style="color:#0056b3;">${student.totalFees} د.ل</div></div>
          <div class="fin-box"><div class="lbl">خصم${discountReason ? ` (${discountReason})` : ''}</div><div class="val" style="color:#dc2626;">${discountAmount > 0 ? '-' : ''}${discountAmount} د.ل</div></div>
          <div class="fin-box"><div class="lbl">المدفوع</div><div class="val" style="color:#059669;">${paidAmount} د.ل</div></div>
          <div class="fin-box"><div class="lbl">المتبقي</div><div class="val" style="color:${remainingAmount > 0 ? '#dc2626' : '#059669'};">${remainingAmount} د.ل</div></div>
        </div>
        <div style="margin-top:12px;background:#f1f5f9;border-radius:8px;overflow:hidden;height:12px;">
          <div style="width:${paidPercent}%;background:${paidPercent===100?'#059669':paidPercent>0?'#f59e0b':'#dc2626'};height:100%;"></div>
        </div>
        <div style="text-align:center;margin-top:8px;font-size:12px;color:#64748b;">نسبة السداد: ${paidPercent}%</div>
      </div>

      ${studentReceipts.length > 0 ? `
      <div class="card">
        <h3>📜 سجل الإيصالات</h3>
        <table>
          <thead><tr><th>رقم السند</th><th>التاريخ</th><th>الدفعة</th><th>المبلغ</th><th>طريقة الدفع</th></tr></thead>
          <tbody>
            ${studentReceipts.map((r, i) => `<tr><td>${r.id}</td><td>${r.date}</td><td>${r.installmentNo}</td><td style="font-weight:700;color:#059669;">${r.paidAmount} د.ل</td><td>${r.paymentMethod || 'نقدي'}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}

      ${(student.medicalCondition || student.medication || student.specialNeeds || student.notes) ? `
      <div class="card">
        <h3>🏥 ملاحظات خاصة</h3>
        <div class="grid-2">
          ${student.medicalCondition ? `<div class="field"><label>الحالة الصحية</label><span>${student.medicalCondition}</span></div>` : ''}
          ${student.medication ? `<div class="field"><label>الدواء</label><span>${student.medication}</span></div>` : ''}
          ${student.specialNeeds ? `<div class="field"><label>احتياجات خاصة</label><span>${student.specialNeeds}</span></div>` : ''}
          ${student.notes ? `<div class="field" style="grid-column:span 2;"><label>ملاحظات إضافية</label><span>${student.notes}</span></div>` : ''}
        </div>
      </div>` : ''}

      <div style="text-align:center;font-size:11px;color:#94a3b8;margin-top:10px;">${schoolName} - تم إنشاء هذه الوثيقة تلقائياً من نظام قرطاس</div>
    </body></html>`);
    pw.document.close();
    setTimeout(() => pw.print(), 600);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
      justifyContent: 'center', alignItems: 'flex-start', zIndex: 2000,
      overflow: 'auto', padding: '20px 0'
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)', borderRadius: 20, width: '90%', maxWidth: 880,
        fontFamily: 'Cairo, sans-serif', direction: 'rtl', overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.35)'
      }}>

        {/* ─── Header Banner ─── */}
        <div style={{
          background: 'linear-gradient(135deg, #0056b3, #0284c7)',
          padding: '28px 32px', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {student.photo ? (
              <img src={student.photo} alt={student.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, border: '3px solid rgba(255,255,255,0.3)' }}>🎓</div>
            )}
            <div>
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>بطاقة بيانات الطالب • {academicYear}</div>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>{student.name}</h2>
              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>🏫 {student.grade} - فصل ({student.classRoom})</span>
                {student.enrollmentNumber && <span>🆔 القيد: {student.enrollmentNumber}</span>}
                {student.gender && <span>{student.gender === 'ذكر' ? '👦' : student.gender === 'أنثى' ? '👧' : '👤'} {student.gender}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handlePrint} style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.6)', color: '#fff', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo', fontSize: 13 }}>
              🖨️ طباعة
            </button>
            <button onClick={onEdit} style={{ background: '#f59e0b', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo', fontSize: 13 }}>
              ✏️ تعديل
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ─── Financial Summary ─── */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0056b3' }}>💰 الوضع المالي</h3>
              <span style={{ background: paymentStatusColor, color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 800 }}>
                {paymentStatusLabel}
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
                {[
                  { label: 'إجمالي الرسوم', value: `${student.totalFees} د.ل`, color: '#0056b3' },
                  { label: `خصم${discountReason ? ` (${discountReason})` : ''}`, value: discountAmount > 0 ? `-${discountAmount} د.ل` : 'لا يوجد', color: discountAmount > 0 ? '#dc2626' : '#94a3b8' },
                  { label: 'المدفوع', value: `${paidAmount} د.ل`, color: '#059669' },
                  { label: 'المتبقي', value: `${remainingAmount} د.ل`, color: remainingAmount > 0 ? '#dc2626' : '#059669' },
                ].map((item, i) => (
                  <div key={i} style={{ textAlign: 'center', background: 'var(--bg-secondary)', padding: '14px 10px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {/* Progress Bar */}
              <div style={{ background: 'var(--border-color)', borderRadius: 10, height: 12, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${paidPercent}%`, background: paidPercent === 100 ? '#059669' : paidPercent > 0 ? '#f59e0b' : '#dc2626', height: '100%', transition: 'width 0.4s ease', borderRadius: 10 }} />
              </div>
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>نسبة السداد: <strong>{paidPercent}%</strong></div>
            </div>
          </div>

          {/* ─── 2-column grid ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Personal & Admin */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#0056b3' }}>📋 البيانات الشخصية</h3>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'الرقم الوطني', value: student.nationalId },
                  { label: 'تاريخ الميلاد', value: student.birthDate },
                  { label: 'العنوان', value: student.address },
                  { label: 'عدد الأقساط', value: `${student.installmentsCount} قسط` },
                ].filter(f => f.value).map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 110, flexShrink: 0 }}>{f.label}:</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guardian Info */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#0056b3' }}>👨‍👩‍👦 بيانات ولي الأمر</h3>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'اسم الأب', value: student.fatherName },
                  { label: 'هاتف الأب', value: student.fatherPhone },
                  { label: 'اسم الأم', value: student.motherName },
                  { label: 'هاتف الأم', value: student.motherPhone },
                  { label: 'هاتف إضافي', value: student.additionalPhone },
                ].filter(f => f.value).map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 110, flexShrink: 0 }}>{f.label}:</span>
                    {f.label.includes('هاتف') && f.value ? (
                      <a href={`tel:${f.value}`} style={{ fontSize: 14, fontWeight: 600, color: '#0284c7', textDecoration: 'none', direction: 'ltr' }}>{f.value}</a>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{f.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Receipts */}
          {studentReceipts.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#0056b3' }}>📜 سجل الإيصالات ({studentReceipts.length} إيصال)</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      {['رقم السند', 'التاريخ', 'الدفعة رقم', 'المبلغ', 'طريقة الدفع'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {studentReceipts.map((r, idx) => (
                      <tr key={r.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0284c7' }}>{r.id}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{r.date}</td>
                        <td style={{ padding: '10px 14px' }}>الدفعة {r.installmentNo}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 900, color: '#059669' }}>{r.paidAmount} د.ل</td>
                        <td style={{ padding: '10px 14px' }}>{r.paymentMethod || 'نقدي'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Medical & Notes */}
          {(student.medicalCondition || student.medication || student.specialNeeds || student.notes) && (
            <div style={{ background: '#fff7ed', borderRadius: 14, border: '1px solid #fed7aa', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #fed7aa' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#c2410c' }}>🏥 ملاحظات خاصة</h3>
              </div>
              <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {student.medicalCondition && (
                  <div><span style={{ fontSize: 12, color: '#92400e', display: 'block', marginBottom: 3 }}>الحالة الصحية:</span><span style={{ fontSize: 14, fontWeight: 600, color: '#c2410c' }}>{student.medicalCondition}</span></div>
                )}
                {student.medication && (
                  <div><span style={{ fontSize: 12, color: '#92400e', display: 'block', marginBottom: 3 }}>الدواء:</span><span style={{ fontSize: 14, fontWeight: 600, color: '#c2410c' }}>{student.medication}</span></div>
                )}
                {student.specialNeeds && (
                  <div><span style={{ fontSize: 12, color: '#92400e', display: 'block', marginBottom: 3 }}>احتياجات خاصة:</span><span style={{ fontSize: 14, fontWeight: 600, color: '#c2410c' }}>{student.specialNeeds}</span></div>
                )}
                {student.notes && (
                  <div style={{ gridColumn: 'span 2' }}><span style={{ fontSize: 12, color: '#92400e', display: 'block', marginBottom: 3 }}>ملاحظات:</span><span style={{ fontSize: 14, color: '#7c2d12' }}>{student.notes}</span></div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
