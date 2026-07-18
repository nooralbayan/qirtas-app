import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { TimetableEntry } from '../context/AppContext';

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [
  { id: 1, label: 'الأولى', time: '08:00 - 08:45' },
  { id: 2, label: 'الثانية', time: '08:50 - 09:35' },
  { id: 3, label: 'الثالثة', time: '09:40 - 10:25' },
  { id: 0, label: 'استراحة', time: '10:25 - 10:45', isBreak: true },
  { id: 4, label: 'الرابعة', time: '10:45 - 11:30' },
  { id: 5, label: 'الخامسة', time: '11:35 - 12:20' },
  { id: 6, label: 'السادسة', time: '12:25 - 13:10' },
];

const SUBJECTS = [
  'رياضيات', 'لغة عربية', 'لغة إنجليزية', 'علوم', 'تربية إسلامية',
  'تاريخ', 'جغرافيا', 'تربية فنية', 'تربية رياضية', 'حاسوب', 'فيزياء', 'كيمياء',
];

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'رياضيات':       { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  'لغة عربية':     { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
  'لغة إنجليزية':  { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  'علوم':          { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  'تربية إسلامية': { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  'تاريخ':         { bg: '#ffe4e6', text: '#9f1239', border: '#fda4af' },
  'جغرافيا':       { bg: '#ccfbf1', text: '#115e59', border: '#5eead4' },
  'تربية فنية':    { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  'تربية رياضية':  { bg: '#ddd6fe', text: '#5b21b6', border: '#a78bfa' },
  'حاسوب':         { bg: '#cffafe', text: '#155e75', border: '#67e8f9' },
  'فيزياء':        { bg: '#fbcfe8', text: '#831843', border: '#f9a8d4' },
  'كيمياء':        { bg: '#a7f3d0', text: '#064e3b', border: '#34d399' },
};

export default function Timetable({ onBack }: { onBack: () => void }) {
  const { gradeFees, classRooms, teachers, schoolName, schoolLogo, timetables, setTimetables } = useAppContext();
  const grades = Object.keys(gradeFees);
  const [selectedGrade, setSelectedGrade] = useState(grades[0]);
  
  const currentGradeClasses = classRooms[selectedGrade] || [];
  const [selectedClass, setSelectedClass] = useState(currentGradeClasses.length > 0 ? currentGradeClasses[0] : '');

  // Handle auto selection when grade changes
  useMemo(() => {
    const classes = classRooms[selectedGrade] || [];
    if (!classes.includes(selectedClass)) {
      setSelectedClass(classes.length > 0 ? classes[0] : '');
    }
  }, [selectedGrade, classRooms]);

  const activeKey = `${selectedGrade}${selectedClass ? ` - ${selectedClass}` : ''}`;
  
  const [editingCell, setEditingCell] = useState<{ day: string; periodId: number } | null>(null);
  const [cellForm, setCellForm] = useState({ subject: '', teacher: '' });
  const [copyFromKey, setCopyFromKey] = useState('');
  const [showCopyModal, setShowCopyModal] = useState(false);

  const currentEntries = timetables[activeKey] || [];

  const getEntry = (day: string, periodId: number): TimetableEntry | undefined =>
    currentEntries.find(e => e.day === day && e.periodId === periodId);

  // Clash detection: is this teacher already assigned at this period on this day in another class?
  const getClash = (teacher: string, day: string, periodId: number): string | null => {
    if (!teacher) return null;
    for (const [key, entries] of Object.entries(timetables)) {
      if (key === activeKey) continue;
      const conflict = entries.find(e => e.day === day && e.periodId === periodId && e.teacher === teacher);
      if (conflict) return key;
    }
    return null;
  };

  const handleCellClick = (day: string, periodId: number) => {
    if (!selectedClass && currentGradeClasses.length > 0) {
      alert("الرجاء تحديد الفصل أولاً");
      return;
    }
    const existing = getEntry(day, periodId);
    setCellForm({ subject: existing?.subject || '', teacher: existing?.teacher || '' });
    setEditingCell({ day, periodId });
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    const { day, periodId } = editingCell;

    // Clash check
    if (cellForm.teacher) {
      const clash = getClash(cellForm.teacher, day, periodId);
      if (clash) {
        if (!window.confirm(`⚠️ تنبيه: المعلم "${cellForm.teacher}" مسجل بالفعل في نفس الحصة في "${clash}". هل تريد المتابعة؟`)) return;
      }
    }

    setTimetables(prev => {
      const classEntries = [...(prev[activeKey] || [])];
      const idx = classEntries.findIndex(e => e.day === day && e.periodId === periodId);

      if (!cellForm.subject) {
        if (idx !== -1) classEntries.splice(idx, 1);
      } else {
        const newEntry: TimetableEntry = { day, periodId, subject: cellForm.subject, teacher: cellForm.teacher };
        if (idx !== -1) classEntries[idx] = newEntry;
        else classEntries.push(newEntry);
      }
      return { ...prev, [activeKey]: classEntries };
    });
    setEditingCell(null);
  };

  const handleDeleteCell = () => {
    if (!editingCell) return;
    const { day, periodId } = editingCell;
    setTimetables(prev => {
      const classEntries = [...(prev[activeKey] || [])];
      const idx = classEntries.findIndex(e => e.day === day && e.periodId === periodId);
      if (idx !== -1) classEntries.splice(idx, 1);
      return { ...prev, [activeKey]: classEntries };
    });
    setEditingCell(null);
  };

  const handleCopyTimetable = () => {
    if (!copyFromKey || copyFromKey === activeKey) return;
    const source = timetables[copyFromKey];
    if (!source || source.length === 0) { alert('الجدول المحدد فارغ!'); return; }
    if (!window.confirm(`هل تريد نسخ جدول "${copyFromKey}" إلى "${activeKey}"؟ سيتم استبدال الجدول الحالي.`)) return;
    setTimetables(prev => ({ ...prev, [activeKey]: [...source] }));
    setShowCopyModal(false);
  };

  const handleClearTimetable = () => {
    if (!window.confirm(`هل أنت متأكد من حذف جدول "${activeKey}" بالكامل؟`)) return;
    setTimetables(prev => ({ ...prev, [activeKey]: [] }));
  };

  // Stats
  const filledCount = currentEntries.length;
  const totalSlots = PERIODS.filter(p => !p.isBreak).length * DAYS.length;
  const fillPercent = totalSlots > 0 ? Math.round((filledCount / totalSlots) * 100) : 0;

  const handlePrintTimetable = () => {
    const pw = window.open('', '_blank');
    if (!pw) return;
    const logoHtml = schoolLogo.startsWith('data:image') ? `<img src="${schoolLogo}" style="height:50px;" />` : `<div style="font-size:30px;">${schoolLogo}</div>`;

    const headerCells = DAYS.map(d => `<th style="background:#1e3a5f;color:#fff;padding:8px 4px;border:1px solid #0f2a4a;font-size:12px;">${d}</th>`).join('');
    const rows = PERIODS.map(p => {
      if (p.isBreak) return `<tr><td colspan="${DAYS.length + 2}" style="background:#f59e0b;color:#fff;text-align:center;padding:5px;font-weight:bold;font-size:11px;">☕ استراحة (${p.time})</td></tr>`;
      const cells = DAYS.map(d => {
        const entry = getEntry(d, p.id);
        if (!entry) return `<td style="border:1px solid #d1d5db;padding:4px;text-align:center;color:#ccc;font-size:10px;">-</td>`;
        const c = SUBJECT_COLORS[entry.subject] || { bg: '#f1f5f9', text: '#333', border: '#ccc' };
        return `<td style="border:1px solid ${c.border};padding:3px;text-align:center;background:${c.bg};"><div style="font-weight:bold;font-size:10px;color:${c.text};">${entry.subject}</div>${entry.teacher ? `<div style="font-size:8px;color:#555;">${entry.teacher}</div>` : ''}</td>`;
      }).join('');
      return `<tr><td style="border:1px solid #d1d5db;padding:3px;text-align:center;font-size:10px;font-weight:bold;background:#f8fafc;">${p.label}</td><td style="border:1px solid #d1d5db;padding:3px;text-align:center;font-size:9px;color:#666;background:#f8fafc;">${p.time}</td>${cells}</tr>`;
    }).join('');

    pw.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>الجدول الدراسي - ${activeKey}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Cairo',sans-serif;direction:rtl;padding:15px;}@page{size:A4 landscape;margin:8mm;}table{width:100%;border-collapse:collapse;}</style></head><body><div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1e3a5f;padding-bottom:8px;margin-bottom:10px;"><div><h2 style="font-size:16px;">${schoolName}</h2><h3 style="color:#555;font-size:13px;">الجدول الدراسي الأسبوعي - ${activeKey}</h3></div><div>${logoHtml}</div></div><table><thead><tr><th style="background:#1e3a5f;color:#fff;padding:8px 4px;border:1px solid #0f2a4a;font-size:12px;width:8%;">الحصة</th><th style="background:#1e3a5f;color:#fff;padding:8px 4px;border:1px solid #0f2a4a;font-size:12px;width:9%;">الوقت</th>${headerCells}</tr></thead><tbody>${rows}</tbody></table></body></html>`);
    pw.document.close(); pw.focus();
    setTimeout(() => pw.print(), 500);
  };

  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      <button onClick={onBack} style={{ background: 'linear-gradient(135deg, var(--primary-color), #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
        <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
      </button>

      <div className="card" style={{ borderRadius: 12, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: 'var(--primary-color)', fontSize: 24 }}>📅 الجدول الدراسي الأسبوعي</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={{ padding: '10px 20px', borderRadius: 8, border: '2px solid var(--primary-color)', fontSize: 15, fontWeight: 'bold', fontFamily: 'Cairo', color: 'var(--primary-color)', background: 'var(--input-bg)' }}>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {currentGradeClasses.length > 0 && (
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ padding: '10px 20px', borderRadius: 8, border: '2px solid var(--primary-color)', fontSize: 15, fontWeight: 'bold', fontFamily: 'Cairo', color: 'var(--primary-color)', background: 'var(--input-bg)' }}>
                {currentGradeClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <button onClick={() => setShowCopyModal(true)} style={btnSecondary}>📋 نسخ من صف آخر</button>
            <button onClick={handleClearTimetable} style={{ ...btnSecondary, borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>🗑️ مسح الجدول</button>
            <button onClick={handlePrintTimetable} style={btnPrimary}>🖨️ طباعة</button>
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px 20px', borderRadius: 8, fontSize: 14 }}>
            <strong>الحصص المعبأة:</strong> {filledCount} / {totalSlots}
          </div>
          <div style={{ background: fillPercent === 100 ? 'var(--success-color)' : 'var(--warning-color)', color: fillPercent === 100 ? '#fff' : '#000', padding: '10px 20px', borderRadius: 8, fontSize: 14 }}>
            <strong>نسبة الاكتمال:</strong> {fillPercent}%
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px 20px', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            💡 اضغط على أي خانة لإضافة أو تعديل حصة
          </div>
        </div>

        {/* Timetable Grid */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={thStyle}>الحصة</th>
                <th style={{ ...thStyle, fontSize: 11 }}>الوقت</th>
                {DAYS.map(d => <th key={d} style={thStyle}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(p => {
                if (p.isBreak) {
                  return (
                    <tr key="break">
                      <td colSpan={DAYS.length + 2} style={{ background: 'linear-gradient(135deg, var(--warning-color), #d97706)', color: '#fff', textAlign: 'center', padding: 8, fontWeight: 'bold', fontSize: 14 }}>
                        ☕ استراحة ({p.time})
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={p.id}>
                    <td style={rowLabelStyle}>{p.label}</td>
                    <td style={timeStyle}>{p.time}</td>
                    {DAYS.map(d => {
                      const entry = getEntry(d, p.id);
                      const isHovered = editingCell?.day === d && editingCell?.periodId === p.id;
                      const c = entry ? (SUBJECT_COLORS[entry.subject] || { bg: 'var(--bg-secondary)', text: 'var(--text-primary)', border: 'var(--border-color)' }) : null;

                      return (
                        <td
                          key={d}
                          onClick={() => handleCellClick(d, p.id)}
                          style={{
                            border: '1px solid var(--border-color)',
                            padding: 8,
                            height: 70,
                            cursor: 'pointer',
                            background: isHovered ? 'var(--bg-secondary)' : (c ? c.bg : 'var(--bg-card)'),
                            borderWidth: entry ? 2 : 1,
                            borderColor: c ? c.border : 'var(--border-color)',
                            transition: 'all 0.2s',
                          }}
                        >
                          {entry ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ fontWeight: 'bold', color: c?.text, fontSize: 14 }}>{entry.subject}</div>
                              {entry.teacher && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.teacher}</div>}
                            </div>
                          ) : (
                            <div style={{ color: 'var(--border-color)', fontSize: 20 }}>+</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCell && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ borderRadius: 16, padding: 32, width: '90%', maxWidth: 450 }}>
            <h3 style={{ margin: '0 0 20px', color: 'var(--primary-color)', fontSize: 20 }}>
              تعديل حصة ({editingCell.day} - الحصة {PERIODS.find(p => p.id === editingCell.periodId)?.label})
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>المادة الدراسية</label>
              <select value={cellForm.subject} onChange={e => setCellForm({ ...cellForm, subject: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 15, background: 'var(--input-bg)' }}>
                <option value="">-- تفريغ الحصة --</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {cellForm.subject && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>المعلم (اختياري)</label>
                <select value={cellForm.teacher} onChange={e => setCellForm({ ...cellForm, teacher: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 15, background: 'var(--input-bg)' }}>
                  <option value="">-- بدون تعيين --</option>
                  {teachers.map(t => <option key={t.id} value={t.name}>{t.name} ({t.subject})</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSaveCell} style={{ ...btnPrimary, flex: 1, padding: 12, justifyContent: 'center' }}>
                حفظ التغييرات
              </button>
              {getEntry(editingCell.day, editingCell.periodId) && (
                <button onClick={handleDeleteCell} style={{ ...btnPrimary, backgroundColor: 'var(--danger-color)', flex: 1, padding: 12, justifyContent: 'center' }}>
                  حذف الحصة
                </button>
              )}
              <button onClick={() => setEditingCell(null)} style={{ ...btnSecondary, flex: 1, padding: 12, justifyContent: 'center' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Modal */}
      {showCopyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ borderRadius: 16, padding: 32, width: '90%', maxWidth: 400 }}>
            <h3 style={{ margin: '0 0 20px', color: 'var(--primary-color)', fontSize: 20 }}>نسخ جدول من صف آخر</h3>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>اختر الجدول المراد نسخه:</label>
              <select value={copyFromKey} onChange={e => setCopyFromKey(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 15, background: 'var(--input-bg)' }}>
                <option value="">-- اختر الجدول --</option>
                {Object.keys(timetables).filter(k => k !== activeKey && timetables[k].length > 0).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleCopyTimetable} style={{ ...btnPrimary, flex: 1, padding: 12, justifyContent: 'center' }}>نسخ</button>
              <button onClick={() => setShowCopyModal(false)} style={{ ...btnSecondary, flex: 1, padding: 12, justifyContent: 'center' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const thStyle: React.CSSProperties = {
  background: 'var(--header-bg)',
  color: 'var(--header-text)',
  padding: '12px',
  border: '1px solid rgba(255,255,255,0.2)',
  fontSize: 14,
  width: '14%'
};

const rowLabelStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  padding: '12px',
  border: '1px solid var(--border-color)',
  fontWeight: 'bold',
  color: 'var(--text-primary)',
  fontSize: 14
};

const timeStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  padding: '12px',
  border: '1px solid var(--border-color)',
  color: 'var(--text-muted)',
  fontSize: 12
};

const btnPrimary: React.CSSProperties = {
  backgroundColor: 'var(--primary-color)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'Cairo'
};

const btnSecondary: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  border: '2px solid var(--border-color)',
  borderRadius: 8,
  padding: '8px 16px',
  cursor: 'pointer',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'Cairo'
};
