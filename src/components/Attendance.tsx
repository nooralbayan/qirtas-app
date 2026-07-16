import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

type AttendanceStatus = 'ط­ط§ط¶ط±' | 'ط؛ط§ط¦ط¨' | 'ظ…طھط£ط®ط±';
type TabType = 'students' | 'teachers';

interface AttendanceRecord {
  id: number;
  name: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  notes: string;
}

const statusColors: Record<AttendanceStatus, string> = {
  'ط­ط§ط¶ط±': '#27ae60',
  'ط؛ط§ط¦ط¨': '#e74c3c',
  'ظ…طھط£ط®ط±': '#f39c12',
};

export default function Attendance({ onBack }: { onBack: () => void }) {
  const { students, teachers, attendanceRecords, setAttendanceRecords } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherRecords, setTeacherRecords] = useState<AttendanceRecord[]>([]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  
  const [isSendingWa, setIsSendingWa] = useState(false);

  // Initialize records from context for the selected date
  useEffect(() => {
    if (students.length > 0) {
      const todayRecords = students.map(s => {
        const existing = attendanceRecords.find(a => a.studentId === s.id && a.date === selectedDate);
        return {
          id: s.id, 
          name: s.name, 
          status: existing ? existing.status : 'ط­ط§ط¶ط±', 
          checkIn: existing && existing.status === 'ط؛ط§ط¦ط¨' ? '-' : '07:30', 
          checkOut: existing && existing.status === 'ط؛ط§ط¦ط¨' ? '-' : '13:30', 
          notes: existing ? existing.notes : ''
        };
      });
      setStudentRecords(todayRecords);
    }
  }, [students, selectedDate, attendanceRecords]);

  useEffect(() => {
    if (teacherRecords.length === 0 && teachers.length > 0) {
      setTeacherRecords(teachers.map(t => ({
        id: t.id, name: t.name, status: 'ط­ط§ط¶ط±', checkIn: '07:00', checkOut: '14:00', notes: ''
      })));
    }
  }, [teachers]);

  const records = activeTab === 'students' ? studentRecords : teacherRecords;
  const setRecords = activeTab === 'students' ? setStudentRecords : setTeacherRecords;

  const presentCount = records.filter(r => r.status === 'ط­ط§ط¶ط±').length;
  const absentCount = records.filter(r => r.status === 'ط؛ط§ط¦ط¨').length;
  const lateCount = records.filter(r => r.status === 'ظ…طھط£ط®ط±').length;
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
    setRecords(records.map(r =>
      r.id === id ? {
        ...r,
        status,
        checkIn: status === 'ط؛ط§ط¦ط¨' ? '-' : (r.checkIn === '-' ? timeStr : r.checkIn),
        checkOut: status === 'ط؛ط§ط¦ط¨' ? '-' : r.checkOut,
      } : r
    ));
    
    if (activeTab === 'students') {
      const currentNote = studentRecords.find(r => r.id === id)?.notes || '';
      saveGlobalAttendance(id, status, currentNote);
    }
  };

  const markAll = (status: AttendanceStatus) => {
    setRecords(records.map(r => ({ ...r, status })));
    if (activeTab === 'students') {
      records.forEach(r => {
        saveGlobalAttendance(r.id, status, r.notes);
      });
    }
  };

  const saveNote = (id: number) => {
    setRecords(records.map(r => r.id === id ? { ...r, notes: noteText } : r));
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
    const absentees = studentRecords.filter(r => r.status === 'ط؛ط§ط¦ط¨');
    if (absentees.length === 0) {
      alert('ظ„ط§ ظٹظˆط¬ط¯ ط·ظ„ط§ط¨ ط؛ط§ط¦ط¨ظٹظ† ظ„ط¥ط±ط³ط§ظ„ ط¥ط´ط¹ط§ط±ط§طھ ظ„ظ‡ظ….');
      return;
    }
    if (!window.confirm(`ط³ظٹطھظ… ط¥ط±ط³ط§ظ„ ط±ط³ط§ط¦ظ„ ظˆط§طھط³ط§ط¨ ظ„ظ€ ${absentees.length} ط·ط§ظ„ط¨ ط؛ط§ط¦ط¨. ظ‡ظ„ طھط±ط؛ط¨ ظپظٹ ط§ظ„ظ…طھط§ط¨ط¹ط©طں`)) return;

    setIsSendingWa(true);
    let successCount = 0;

    for (const record of absentees) {
      const student = students.find(s => s.id === record.id);
      if (!student || !student.fatherPhone) continue;

      const message = `ط§ظ„ط³ظ„ط§ظ… ط¹ظ„ظٹظƒظ… ظˆط±ط­ظ…ط© ط§ظ„ظ„ظ‡\n\nظ†ط­ظٹط·ظƒظ… ط¹ظ„ظ…ط§ظ‹ ط¨ط£ظ† ط§ظ„ط·ط§ظ„ط¨/ط©: ${student.name}\nط§ظ„طµظپ: ${student.grade}\nظƒط§ظ†/طھ ط؛ط§ط¦ط¨/ط© ط§ظ„ظٹظˆظ… ${new Date(selectedDate).toLocaleDateString('ar-LY')}.\n\nط¹ط³ظ‰ ط£ظ† ظٹظƒظˆظ† ط§ظ„ظ…ط§ظ†ط¹ ط®ظٹط±ط§ظ‹ ًں¤²`;
      
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

      // delay 3 seconds
      await new Promise(r => setTimeout(r, 3000));
    }
    
    setIsSendingWa(false);
    alert(`طھظ… ط§ظ„ط§ظ†طھظ‡ط§ط،! ظ†ط¬ط­ ط¥ط±ط³ط§ظ„ ${successCount} ط±ط³ط§ظ„ط© ظ…ظ† ط£طµظ„ ${absentees.length}.`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>ًں“‹ ط³ط¬ظ„ ط§ظ„ط­ط¶ظˆط± ظˆط§ظ„ط؛ظٹط§ط¨</h1>
        <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
          <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>âںµ</span> ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…
        </button>
      </div>

      <div style={styles.tabsContainer}>
        <button style={styles.tab(activeTab === 'students')} onClick={() => setActiveTab('students')}>
          ًں‘¨â€چًںژ“ ط­ط¶ظˆط± ط§ظ„ط·ظ„ط§ط¨
        </button>
        <button style={styles.tab(activeTab === 'teachers')} onClick={() => setActiveTab('teachers')}>
          ًں‘¨â€چًںڈ« ط­ط¶ظˆط± ط§ظ„ظ…ط¹ظ„ظ…ظٹظ†
        </button>
      </div>

      <div style={styles.controlsBar}>
        <span style={styles.dateLabel}>ًں“… ط§ظ„طھط§ط±ظٹط®:</span>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={styles.dateInput} />
        
        <div style={{ borderRight: '1px solid #ddd', height: '30px' }}></div>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>طھط­ط¯ظٹط¯ ط§ظ„ظƒظ„:</span>
        <button style={styles.bulkBtn('#27ae60')} onClick={() => markAll('ط­ط§ط¶ط±')}>âœ“ ط­ط§ط¶ط±</button>
        <button style={styles.bulkBtn('#e74c3c')} onClick={() => markAll('ط؛ط§ط¦ط¨')}>âœ— ط؛ط§ط¦ط¨</button>
        <button style={styles.bulkBtn('#f39c12')} onClick={() => markAll('ظ…طھط£ط®ط±')}>âڈ° ظ…طھط£ط®ط±</button>

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
              <span style={{ fontSize: 18 }}>ًں’¬</span>
              {isSendingWa ? 'ط¬ط§ط±ظٹ ط¥ط±ط³ط§ظ„ ط¥ط´ط¹ط§ط±ط§طھ ط§ظ„ظˆط§طھط³ط§ط¨...' : 'ط¥ط±ط³ط§ظ„ ط¥ط´ط¹ط§ط±ط§طھ ط§ظ„ط؛ظٹط§ط¨ ط¨ط§ظ„ظˆط§طھط³ط§ط¨'}
            </button>
          </>
        )}
      </div>

      <div style={styles.summaryBar}>
        <div style={styles.summaryCard('#27ae60')}>
          <div style={styles.summaryValue('#27ae60')}>{presentCount}</div>
          <div style={styles.summaryLabel}>ط¹ط¯ط¯ ط§ظ„ط­ط§ط¶ط±ظٹظ†</div>
        </div>
        <div style={styles.summaryCard('#e74c3c')}>
          <div style={styles.summaryValue('#e74c3c')}>{absentCount}</div>
          <div style={styles.summaryLabel}>ط¹ط¯ط¯ ط§ظ„ط؛ط§ط¦ط¨ظٹظ†</div>
        </div>
        <div style={styles.summaryCard('#f39c12')}>
          <div style={styles.summaryValue('#f39c12')}>{lateCount}</div>
          <div style={styles.summaryLabel}>ط¹ط¯ط¯ ط§ظ„ظ…طھط£ط®ط±ظٹظ†</div>
        </div>
        <div style={styles.summaryCard('#0056b3')}>
          <div style={styles.summaryValue('#0056b3')}>{attendanceRate}%</div>
          <div style={styles.summaryLabel}>ظ†ط³ط¨ط© ط§ظ„ط­ط¶ظˆط±</div>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>ط§ظ„ط§ط³ظ…</th>
              <th style={styles.th}>ط§ظ„ط­ط§ظ„ط©</th>
              <th style={styles.th}>طھط؛ظٹظٹط± ط§ظ„ط­ط§ظ„ط©</th>
              <th style={styles.th}>ظˆظ‚طھ ط§ظ„ط­ط¶ظˆط±</th>
              <th style={styles.th}>ظˆظ‚طھ ط§ظ„ط§ظ†طµط±ط§ظپ</th>
              <th style={styles.th}>ظ…ظ„ط§ط­ط¸ط§طھ</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr key={record.id} onMouseEnter={() => setHoveredRow(record.id)} onMouseLeave={() => setHoveredRow(null)}>
                <td style={styles.td(hoveredRow === record.id)}>{idx + 1}</td>
                <td style={{ ...styles.td(hoveredRow === record.id), fontWeight: '600', textAlign: 'right' }}>{record.name}</td>
                <td style={styles.td(hoveredRow === record.id)}>
                  <span style={styles.statusBadge(record.status)}>{record.status}</span>
                </td>
                <td style={styles.td(hoveredRow === record.id)}>
                  <button style={styles.statusBtn('ط­ط§ط¶ط±', record.status === 'ط­ط§ط¶ط±')} onClick={() => updateStatus(record.id, 'ط­ط§ط¶ط±')}>ط­ط§ط¶ط±</button>
                  <button style={styles.statusBtn('ط؛ط§ط¦ط¨', record.status === 'ط؛ط§ط¦ط¨')} onClick={() => updateStatus(record.id, 'ط؛ط§ط¦ط¨')}>ط؛ط§ط¦ط¨</button>
                  <button style={styles.statusBtn('ظ…طھط£ط®ط±', record.status === 'ظ…طھط£ط®ط±')} onClick={() => updateStatus(record.id, 'ظ…طھط£ط®ط±')}>ظ…طھط£ط®ط±</button>
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
                      <input style={styles.noteInput} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="ط£ط¶ظپ ظ…ظ„ط§ط­ط¸ط©..." autoFocus />
                      <button style={styles.noteSaveBtn} onClick={() => saveNote(record.id)}>ط­ظپط¸</button>
                    </div>
                  ) : (
                    <div style={styles.noteCell}>
                      <span style={{ fontSize: '13px', color: record.notes ? '#333' : '#ccc' }}>
                        {record.notes || 'ظ„ط§ طھظˆط¬ط¯'}
                      </span>
                      <button style={styles.noteEditBtn} onClick={() => startEditNote(record)}>âœڈï¸ڈ</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ…ط³ط¬ظ„ط©</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
