import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر';
type TabType = 'students' | 'teachers' | 'report';

interface AttendanceRecord {
  id: number;
  name: string;
  grade?: string;
  classRoom?: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  notes: string;
}

const statusColors: Record<AttendanceStatus, string> = {
  'حاضر': '#27ae60',
  'غائب': '#e74c3c',
  'متأخر': '#f39c12',
};

export default function Attendance({ onBack }: { onBack: () => void }) {
  const { students, teachers, attendanceRecords, setAttendanceRecords, gradeFees, classRooms } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const grades = Object.keys(gradeFees || {});
  const [gradeFilter, setGradeFilter] = useState(grades[0] || 'الصف الأول');
  const [classRoomFilter, setClassRoomFilter] = useState('الكل');
  
  const currentGradeClasses = classRooms?.[gradeFilter] || [];
  
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherRecords, setTeacherRecords] = useState<AttendanceRecord[]>([]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  
  const [isSendingWa, setIsSendingWa] = useState(false);

  // Report tab state
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [reportDateFrom, setReportDateFrom] = useState(firstDayOfMonth);
  const [reportDateTo, setReportDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportPersonFilter, setReportPersonFilter] = useState<'all' | 'bygrade' | 'student' | 'teacher' | 'all_teachers'>('all');
  const [reportGradeFilter, setReportGradeFilter] = useState('الكل');
  const [reportClassFilter, setReportClassFilter] = useState('الكل');
  const [reportPersonId, setReportPersonId] = useState<number | null>(null);

  // Initialize records from context for the selected date
  useEffect(() => {
    if (students.length > 0) {
      const todayRecords = students.map(s => {
        const existing = attendanceRecords.find(a => a.studentId === s.id && a.date === selectedDate);
        return {
          id: s.id, 
          name: s.name, 
          grade: s.grade,
          classRoom: s.classRoom,
          status: existing ? existing.status : 'حاضر', 
          checkIn: existing && existing.status === 'غائب' ? '-' : '07:30', 
          checkOut: existing && existing.status === 'غائب' ? '-' : '13:30', 
          notes: existing ? existing.notes : ''
        };
      });
      setStudentRecords(todayRecords);
    }
  }, [students, selectedDate, attendanceRecords]);

  useEffect(() => {
    if (teacherRecords.length === 0 && teachers.length > 0) {
      setTeacherRecords(teachers.map(t => ({
        id: t.id, name: t.name, status: 'حاضر', checkIn: '07:00', checkOut: '14:00', notes: ''
      })));
    }
  }, [teachers]);

  const allRecords = activeTab === 'students' ? studentRecords : teacherRecords;
  const setRecords = activeTab === 'students' ? setStudentRecords : setTeacherRecords as any;

  const records = activeTab === 'students' 
    ? allRecords.filter(r => {
        const matchGrade = r.grade === gradeFilter;
        const matchClass = classRoomFilter === 'الكل' || r.classRoom === classRoomFilter;
        return matchGrade && matchClass;
      })
    : allRecords;

  const presentCount = records.filter(r => r.status === 'حاضر').length;
  const absentCount = records.filter(r => r.status === 'غائب').length;
  const lateCount = records.filter(r => r.status === 'متأخر').length;
  const attendanceRate = records.length > 0 ? (((presentCount + lateCount) / records.length) * 100).toFixed(1) : '0';

  const styles = {
    container: { direction: 'rtl' as const, fontFamily: 'Cairo, sans-serif', padding: '30px', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap' as const, gap: '12px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#0056b3', margin: 0 },
    backBtn: { padding: '10px 24px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontFamily: 'Cairo, sans-serif', fontWeight: '600' },
    tabsContainer: { display: 'flex', gap: '0', marginBottom: '24px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 'fit-content' },
    tab: (isActive: boolean) => ({
      padding: '14px 36px', border: 'none', cursor: 'pointer', fontSize: '16px', fontFamily: 'Cairo, sans-serif', fontWeight: '700',
      backgroundColor: isActive ? '#0056b3' : '#fff', color: isActive ? '#fff' : '#666',
      transition: 'all 0.3s ease',
    }),
    controlsBar: { display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' as const },
    dateInput: { padding: '10px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', fontFamily: 'Cairo, sans-serif', fontWeight: '600' },
    dateLabel: { fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' },
    bulkBtn: (bg: string) => ({
      padding: '8px 18px', backgroundColor: bg, color: '#fff', border: 'none', borderRadius: '8px',
      cursor: 'pointer', fontSize: '13px', fontFamily: 'Cairo, sans-serif', fontWeight: '600',
    }),
    summaryBar: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' as const },
    summaryCard: (color: string) => ({
      flex: '1', minWidth: '160px', backgroundColor: 'var(--bg-card)', borderRadius: '10px', padding: '18px',
      textAlign: 'center' as const, borderTop: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }),
    summaryValue: (color: string) => ({ fontSize: '30px', fontWeight: '700', color, marginBottom: '4px' }),
    summaryLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
    tableWrap: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { backgroundColor: '#0056b3', color: '#fff', padding: '14px 16px', fontSize: '14px', fontWeight: '600', textAlign: 'center' as const, fontFamily: 'Cairo, sans-serif' },
    td: (isHovered: boolean) => ({
      padding: '12px 16px', fontSize: '14px', textAlign: 'center' as const, borderBottom: '1px solid #eee',
      backgroundColor: isHovered ? '#f0f7ff' : 'transparent', transition: 'background 0.2s',
    }),
    statusBtn: (status: AttendanceStatus, isActive: boolean) => ({
      padding: '6px 14px', border: `2px solid ${statusColors[status]}`,
      backgroundColor: isActive ? statusColors[status] : 'transparent',
      color: isActive ? '#fff' : statusColors[status],
      borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Cairo, sans-serif',
      fontWeight: '700', margin: '0 3px', transition: 'all 0.2s ease',
    }),
    statusBadge: (status: AttendanceStatus) => ({
      display: 'inline-block', padding: '5px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
      backgroundColor: statusColors[status], color: '#fff',
    }),
    noteCell: { display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' },
    noteInput: { padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: 'Cairo, sans-serif', width: '160px' },
    noteSaveBtn: { padding: '4px 10px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Cairo, sans-serif' },
    noteEditBtn: { padding: '3px 8px', backgroundColor: '#e9ecef', color: 'var(--text-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Cairo, sans-serif' },
  };

  const saveGlobalAttendance = (id: number, status: AttendanceStatus, notes: string) => {
    setAttendanceRecords(prev => {
      const filtered = prev.filter(a => !(a.studentId === id && a.date === selectedDate));
      return [...filtered, {
        id: `student_${id}_${selectedDate}`,
        studentId: id,
        date: selectedDate,
        status,
        notes
      }];
    });
  };

  const updateStatus = (id: number, status: AttendanceStatus) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setRecords(allRecords.map(r =>
      r.id === id ? {
        ...r,
        status,
        checkIn: status === 'غائب' ? '-' : (r.checkIn === '-' ? timeStr : r.checkIn),
        checkOut: status === 'غائب' ? '-' : r.checkOut,
      } : r
    ));
    
    if (activeTab === 'students') {
      const currentNote = studentRecords.find(r => r.id === id)?.notes || '';
      saveGlobalAttendance(id, status, currentNote);
    }
  };

  const markAll = (status: AttendanceStatus) => {
    const filteredIds = new Set(records.map(r => r.id));
    
    setRecords(allRecords.map(r => filteredIds.has(r.id) ? { ...r, status } : r));
    
    if (activeTab === 'students') {
      records.forEach(r => {
        saveGlobalAttendance(r.id, status, r.notes);
      });
    }
  };

  const saveNote = (id: number) => {
    setRecords(allRecords.map(r => r.id === id ? { ...r, notes: noteText } : r));
    if (activeTab === 'students') {
      const record = studentRecords.find(r => r.id === id);
      if (record) {
        saveGlobalAttendance(id, record.status, noteText);
      }
    }
    setEditingNote(null);
    setNoteText('');
  };

  const startEditNote = (record: AttendanceRecord) => {
    setEditingNote(record.id);
    setNoteText(record.notes);
  };

  const sendAbsenceAlerts = async () => {
    const absentees = studentRecords.filter(r => r.status === 'غائب');
    if (absentees.length === 0) {
      alert('لا يوجد طلاب غائبين لإرسال إشعارات لهم.');
      return;
    }
    if (!window.confirm(`سيتم إرسال رسائل واتساب لـ ${absentees.length} طالب غائب. هل ترغب في المتابعة؟`)) return;

    setIsSendingWa(true);
    let successCount = 0;

    for (const record of absentees) {
      const student = students.find(s => s.id === record.id);
      if (!student || !student.fatherPhone) continue;

      const message = `السلام عليكم ورحمة الله\n\nنحيطكم علماً بأن الطالب/ة: ${student.name}\nالصف: ${student.grade}\nكان/ت غائب/ة اليوم ${new Date(selectedDate).toLocaleDateString('ar-LY')}.\n\nعسى أن يكون المانع خيراً 🤲`;
      
      let phone = student.fatherPhone.replace(/\s+/g, '').replace(/-/g, '');
      if (phone.startsWith('0')) phone = '218' + phone.slice(1);
      if (!phone.startsWith('+')) phone = '+' + phone;

      try {
        const res = await fetch('/api/wa-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, message })
        });
        const data = await res.json();
        if (data.success) successCount++;
      } catch (e) {}

      await new Promise(r => setTimeout(r, 3000));
    }
    
    setIsSendingWa(false);
    alert(`تم الانتهاء! نجح إرسال ${successCount} رسالة من أصل ${absentees.length}.`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📋 سجل الحضور والغياب</h1>
        <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
          <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
        </button>
      </div>

      <div style={styles.tabsContainer}>
        <button style={styles.tab(activeTab === 'students')} onClick={() => setActiveTab('students')}>
          👨‍🎓 حضور الطلاب
        </button>
        <button style={styles.tab(activeTab === 'teachers')} onClick={() => setActiveTab('teachers')}>
          👨‍🏫 حضور المعلمين
        </button>
        <button style={styles.tab(activeTab === 'report')} onClick={() => setActiveTab('report')}>
          📊 تقرير الغياب
        </button>
      </div>

      <div style={styles.controlsBar}>
        <span style={styles.dateLabel}>📅 التاريخ:</span>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={styles.dateInput} />
        
        {activeTab === 'students' && (
          <>
            <div style={{ borderRight: '1px solid #ddd', height: '30px', margin: '0 8px' }}></div>
            <span style={styles.dateLabel}>الصف:</span>
            <select value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setClassRoomFilter('الكل'); }} style={{ ...styles.dateInput, minWidth: 150 }}>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            
            {currentGradeClasses.length > 0 && (
              <>
                <span style={styles.dateLabel}>الفصل:</span>
                <select value={classRoomFilter} onChange={e => setClassRoomFilter(e.target.value)} style={{ ...styles.dateInput, minWidth: 100 }}>
                  <option value="الكل">الكل</option>
                  {currentGradeClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}
          </>
        )}
        
        <div style={{ borderRight: '1px solid #ddd', height: '30px', margin: '0 8px' }}></div>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>تحديد الكل:</span>
        <button style={styles.bulkBtn('#27ae60')} onClick={() => markAll('حاضر')}>✓ حاضر</button>
        <button style={styles.bulkBtn('#e74c3c')} onClick={() => markAll('غائب')}>✗ غائب</button>
        <button style={styles.bulkBtn('#f39c12')} onClick={() => markAll('متأخر')}>⏰ متأخر</button>

        {activeTab === 'students' && (
          <>
            <div style={{ borderRight: '1px solid #ddd', height: '30px', marginLeft: 16 }}></div>
            <button 
              onClick={sendAbsenceAlerts}
              disabled={isSendingWa}
              style={{
                padding: '10px 20px', backgroundColor: '#25d366', color: '#fff', border: 'none', borderRadius: '8px',
                cursor: isSendingWa ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: 'Cairo, sans-serif', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 6px rgba(37,211,102,0.3)', opacity: isSendingWa ? 0.7 : 1
              }}
            >
              <span style={{ fontSize: 18 }}>💬</span>
              {isSendingWa ? 'جاري إرسال إشعارات الواتساب...' : 'إرسال إشعارات الغياب بالواتساب'}
            </button>
          </>
        )}
      </div>

      <div style={styles.summaryBar}>
        <div style={styles.summaryCard('#27ae60')}>
          <div style={styles.summaryValue('#27ae60')}>{presentCount}</div>
          <div style={styles.summaryLabel}>عدد الحاضرين</div>
        </div>
        <div style={styles.summaryCard('#e74c3c')}>
          <div style={styles.summaryValue('#e74c3c')}>{absentCount}</div>
          <div style={styles.summaryLabel}>عدد الغائبين</div>
        </div>
        <div style={styles.summaryCard('#f39c12')}>
          <div style={styles.summaryValue('#f39c12')}>{lateCount}</div>
          <div style={styles.summaryLabel}>عدد المتأخرين</div>
        </div>
        <div style={styles.summaryCard('#0056b3')}>
          <div style={styles.summaryValue('#0056b3')}>{attendanceRate}%</div>
          <div style={styles.summaryLabel}>نسبة الحضور</div>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>الاسم</th>
              {activeTab === 'students' && <th style={styles.th}>الفصل</th>}
              <th style={styles.th}>الحالة</th>
              <th style={styles.th}>تغيير الحالة</th>
              <th style={styles.th}>وقت الحضور</th>
              <th style={styles.th}>وقت الانصراف</th>
              <th style={styles.th}>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr key={record.id} onMouseEnter={() => setHoveredRow(record.id as number)} onMouseLeave={() => setHoveredRow(null)}>
                <td style={styles.td(hoveredRow === record.id)}>{idx + 1}</td>
                <td style={{ ...styles.td(hoveredRow === record.id), fontWeight: '600', textAlign: 'right' }}>{record.name}</td>
                {activeTab === 'students' && <td style={styles.td(hoveredRow === record.id)}>{record.classRoom || '-'}</td>}
                <td style={styles.td(hoveredRow === record.id)}>
                  <span style={styles.statusBadge(record.status)}>{record.status}</span>
                </td>
                <td style={styles.td(hoveredRow === record.id)}>
                  <button style={styles.statusBtn('حاضر', record.status === 'حاضر')} onClick={() => updateStatus(record.id as number, 'حاضر')}>حاضر</button>
                  <button style={styles.statusBtn('غائب', record.status === 'غائب')} onClick={() => updateStatus(record.id as number, 'غائب')}>غائب</button>
                  <button style={styles.statusBtn('متأخر', record.status === 'متأخر')} onClick={() => updateStatus(record.id as number, 'متأخر')}>متأخر</button>
                </td>
                <td style={{ ...styles.td(hoveredRow === record.id), fontWeight: record.checkIn !== '-' ? '600' : '400', color: record.checkIn !== '-' ? '#27ae60' : '#999' }}>
                  {record.checkIn}
                </td>
                <td style={{ ...styles.td(hoveredRow === record.id), fontWeight: record.checkOut !== '-' ? '600' : '400', color: record.checkOut !== '-' ? '#3498db' : '#999' }}>
                  {record.checkOut}
                </td>
                <td style={styles.td(hoveredRow === record.id)}>
                  {editingNote === record.id ? (
                    <div style={styles.noteCell}>
                      <input style={styles.noteInput} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="أضف ملاحظة..." autoFocus />
                      <button style={styles.noteSaveBtn} onClick={() => saveNote(record.id as number)}>حفظ</button>
                    </div>
                  ) : (
                    <div style={styles.noteCell}>
                      <span style={{ fontSize: '13px', color: record.notes ? '#333' : '#ccc' }}>
                        {record.notes || 'لا توجد'}
                      </span>
                      <button style={styles.noteEditBtn} onClick={() => startEditNote(record)}>✏️</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>لا توجد بيانات مسجلة</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── REPORT TAB ─── */}
      {activeTab === 'report' && (() => {
        const inRange = (date: string) => date >= reportDateFrom && date <= reportDateTo;

        let studentRows: { id: number; name: string; grade?: string; classRoom?: string; absent: number; late: number }[] = [];
        if (reportPersonFilter === 'all' || reportPersonFilter === 'bygrade') {
          const fs = students.filter(s => {
            if (reportPersonFilter === 'bygrade' && reportGradeFilter !== 'الكل' && s.grade !== reportGradeFilter) return false;
            if (reportPersonFilter === 'bygrade' && reportClassFilter !== 'الكل' && s.classRoom !== reportClassFilter) return false;
            return true;
          });
          studentRows = fs.map(s => {
            const recs = attendanceRecords.filter(a => a.studentId === s.id && inRange(a.date));
            return { id: s.id, name: s.name, grade: s.grade, classRoom: s.classRoom, absent: recs.filter(a => a.status === 'غائب').length, late: recs.filter(a => a.status === 'متأخر').length };
          });
        } else if (reportPersonFilter === 'student' && reportPersonId) {
          const s = students.find(st => st.id === reportPersonId);
          if (s) {
            const recs = attendanceRecords.filter(a => a.studentId === s.id && inRange(a.date));
            studentRows = [{ id: s.id, name: s.name, grade: s.grade, classRoom: s.classRoom, absent: recs.filter(a => a.status === 'غائب').length, late: recs.filter(a => a.status === 'متأخر').length }];
          }
        }

        const workingDays = (() => {
          let count = 0;
          const from = new Date(reportDateFrom);
          const to = new Date(reportDateTo);
          for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
            const day = d.getDay();
            if (day !== 5 && day !== 6) count++;
          }
          return count;
        })();

        const filteredTeachers = reportPersonFilter === 'teacher' && reportPersonId ? teachers.filter(t => t.id === reportPersonId) : (reportPersonFilter === 'all' || reportPersonFilter === 'all_teachers' || reportPersonFilter === 'teacher') ? teachers : [];
        const teacherRows = filteredTeachers.map(t => ({
          id: t.id, name: t.name, salary: t.salary, absent: 0,
          salaryDue: t.salary
        }));

        return (
          <div>
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 20px', color: '#0056b3' }}>🔍 خيارات التقرير</h3>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>من تاريخ</label>
                  <input type="date" value={reportDateFrom} onChange={e => setReportDateFrom(e.target.value)} style={styles.dateInput} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>إلى تاريخ</label>
                  <input type="date" value={reportDateTo} onChange={e => setReportDateTo(e.target.value)} style={styles.dateInput} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>نوع الجرد</label>
                  <select value={reportPersonFilter} onChange={e => { setReportPersonFilter(e.target.value as any); setReportPersonId(null); setReportGradeFilter('الكل'); setReportClassFilter('الكل'); }} style={{ ...styles.dateInput, minWidth: 160 }}>
                    <option value="all">كل الطلاب والمعلمين</option>
                    <option value="student">طالب بعينه</option>
                    <option value="bygrade">صف / فصل كامل</option>
                    <option value="all_teachers">كل المعلمين فقط</option>
                    <option value="teacher">معلم بعينه</option>
                  </select>
                </div>
                {reportPersonFilter === 'student' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>اختر الطالب</label>
                    <select value={reportPersonId ?? ''} onChange={e => setReportPersonId(Number(e.target.value))} style={{ ...styles.dateInput, minWidth: 220 }}>
                      <option value="">اختر...</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.grade}</option>)}
                    </select>
                  </div>
                )}
                {reportPersonFilter === 'bygrade' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>الصف</label>
                      <select value={reportGradeFilter} onChange={e => { setReportGradeFilter(e.target.value); setReportClassFilter('الكل'); }} style={{ ...styles.dateInput, minWidth: 150 }}>
                        <option value="الكل">كل الصفوف</option>
                        {grades.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    {reportGradeFilter !== 'الكل' && (classRooms[reportGradeFilter] || []).length > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>الفصل</label>
                        <select value={reportClassFilter} onChange={e => setReportClassFilter(e.target.value)} style={{ ...styles.dateInput, minWidth: 100 }}>
                          <option value="الكل">كل الفصول</option>
                          {(classRooms[reportGradeFilter] || []).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                )}
                {reportPersonFilter === 'teacher' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>اختر المعلم</label>
                    <select value={reportPersonId ?? ''} onChange={e => setReportPersonId(Number(e.target.value))} style={{ ...styles.dateInput, minWidth: 220 }}>
                      <option value="">اختر...</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              {studentRows.length > 0 && (
                <>
                  <h3 style={{ margin: '0 0 16px', color: '#0056b3' }}>👨‍🎓 غياب الطلاب من {reportDateFrom} إلى {reportDateTo}</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
                    <thead>
                      <tr style={{ background: '#0056b3', color: '#fff' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>الاسم</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>الصف</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>الفصل</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>أيام الغياب</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>أيام التأخير</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentRows.map((row, i) => (
                        <tr key={row.id} style={{ background: i % 2 === 0 ? 'var(--input-bg)' : 'transparent', borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 'bold' }}>{row.name}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>{row.grade}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>{row.classRoom || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: row.absent > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold', fontSize: 20 }}>{row.absent}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: row.late > 0 ? '#f59e0b' : '#10b981', fontWeight: 'bold', fontSize: 20 }}>{row.late}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 'bold', fontSize: 20 }}>{row.absent + row.late}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {teacherRows.length > 0 && (
                <>
                  <h3 style={{ margin: '0 0 8px', color: '#0056b3' }}>👨‍🏫 المعلمون وحساب الراتب</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>أيام العمل في الفترة: <strong>{workingDays}</strong> يوم (باستثناء الجمعة والسبت)</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#0056b3', color: '#fff' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>اسم المعلم</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>الراتب الشهري</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>أيام الغياب</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>المستحق (تقريبي)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherRows.map((row, i) => (
                        <tr key={row.id} style={{ background: i % 2 === 0 ? 'var(--input-bg)' : 'transparent', borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 'bold' }}>{row.name}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>{row.salary.toLocaleString()} د.ل</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#10b981', fontWeight: 'bold', fontSize: 20 }}>0</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#10b981', fontWeight: 'bold', fontSize: 20 }}>{row.salary.toLocaleString()} د.ل</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>⚠️ ملاحظة: لحساب الخصم التلقائي من راتب المعلمين بسبب الغياب، يجب تسجيل غياب المعلمين يومياً من تبويب "حضور المعلمين".</p>
                </>
              )}

              {studentRows.length === 0 && teacherRows.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 18 }}>
                  📄 لا توجد بيانات غياب مسجلة في هذه الفترة
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
