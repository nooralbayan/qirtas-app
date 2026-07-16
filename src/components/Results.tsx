import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateStudentPDFBase64 } from './pdfGenerator';

const getArabicOrdinal = (rank: number, gender: 'ط°ظƒط±' | 'ط£ظ†ط«ظ‰' | 'ط؛ظٹط± ظ…ط­ط¯ط¯' = 'ط°ظƒط±'): string => {
  const ordinalsM = ['ط§ظ„ط£ظˆظ„', 'ط§ظ„ط«ط§ظ†ظٹ', 'ط§ظ„ط«ط§ظ„ط«', 'ط§ظ„ط±ط§ط¨ط¹', 'ط§ظ„ط®ط§ظ…ط³', 'ط§ظ„ط³ط§ط¯ط³', 'ط§ظ„ط³ط§ط¨ط¹', 'ط§ظ„ط«ط§ظ…ظ†', 'ط§ظ„طھط§ط³ط¹', 'ط§ظ„ط¹ط§ط´ط±'];
  const ordinalsF = ['ط§ظ„ط£ظˆظ„ظ‰', 'ط§ظ„ط«ط§ظ†ظٹط©', 'ط§ظ„ط«ط§ظ„ط«ط©', 'ط§ظ„ط±ط§ط¨ط¹ط©', 'ط§ظ„ط®ط§ظ…ط³ط©', 'ط§ظ„ط³ط§ط¯ط³ط©', 'ط§ظ„ط³ط§ط¨ط¹ط©', 'ط§ظ„ط«ط§ظ…ظ†ط©', 'ط§ظ„طھط§ط³ط¹ط©', 'ط§ظ„ط¹ط§ط´ط±ط©'];
  if (rank >= 1 && rank <= 10) return gender === 'ط£ظ†ط«ظ‰' ? ordinalsF[rank - 1] : ordinalsM[rank - 1];
  return rank.toString();
};

export default function Results({ onBack }: { onBack: () => void }) {
  const { students, gradeSubjects, setGradeSubjects, timetables, classRooms, gradeFees, studentResults, setStudentResults, schoolName, schoolLogo, academicYear } = useAppContext();
  const grades = Object.keys(gradeFees);
  const [gradeFilter, setGradeFilter] = useState(grades[0] || 'ط§ظ„طµظپ ط§ظ„ط£ظˆظ„');
  const [classRoomFilter, setClassRoomFilter] = useState('ط§ظ„ظƒظ„');
  const [examType, setExamType] = useState('ظ†طµظپ ط§ظ„ظپطµظ„ ط§ظ„ط£ظˆظ„');
  
  const results = studentResults[examType] || {};
  
  const [isSendingWa, setIsSendingWa] = useState(false);
  
  const [editingSubjects, setEditingSubjects] = useState(false);
  const [subjectsInput, setSubjectsInput] = useState('');

  const currentGradeClasses = classRooms[gradeFilter] || [];

  // Merge manually defined subjects with automatically detected subjects from timetable
  const timetableSubjects = Array.from(new Set(
    Object.entries(timetables)
      .filter(([key]) => key.startsWith(gradeFilter))
      .flatMap(([, entries]) => entries.map(e => e.subject))
  ));
  const manualSubjects = gradeSubjects[gradeFilter] || [];
  const subjects = Array.from(new Set([...manualSubjects, ...timetableSubjects]));

  const handleEditSubjectsClick = () => {
    setSubjectsInput(subjects.join('طŒ '));
    setEditingSubjects(true);
  };

  const saveSubjects = () => {
    const newSubjects = subjectsInput.split('طŒ').map(s => s.trim()).filter(s => s !== '');
    setGradeSubjects({
      ...gradeSubjects,
      [gradeFilter]: newSubjects
    });
    setEditingSubjects(false);
  };

  const filteredStudents = students.filter(s => {
    const matchGrade = s.grade === gradeFilter;
    const matchClass = classRoomFilter === 'ط§ظ„ظƒظ„' || s.classRoom === classRoomFilter;
    return matchGrade && matchClass;
  });

  const handleScoreChange = (studentId: number, subject: string, score: string) => {
    setStudentResults(prev => {
      const examResults = prev[examType] || {};
      return {
        ...prev,
        [examType]: {
          ...examResults,
          [studentId]: {
            ...(examResults[studentId] || {}),
            [subject]: score
          }
        }
      };
    });
  };

  const sendResultsWhatsApp = async () => {
    if (filteredStudents.length === 0) {
      alert('ظ„ط§ ظٹظˆط¬ط¯ ط·ظ„ط§ط¨ ظپظٹ ظ‡ط°ط§ ط§ظ„طµظپ');
      return;
    }
    
    if (!window.confirm(`ط³ظٹطھظ… ط¥ط±ط³ط§ظ„ ظ†طھط§ط¦ط¬ ${examType} ظƒط´ظ‡ط§ط¯ط§طھ (PDF) ظ„ظ€ ${filteredStudents.length} ط·ط§ظ„ط¨ ط¥ظ„ظ‰ ط£ظˆظ„ظٹط§ط، ط£ظ…ظˆط±ظ‡ظ…. ظ‚ط¯ طھط³طھط؛ط±ظ‚ ط§ظ„ط¹ظ…ظ„ظٹط© ط¨ط¶ط¹ ط¯ظ‚ط§ط¦ظ‚. ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯طں`)) return;

    setIsSendingWa(true);
    let successCount = 0;

    for (const student of filteredStudents) {
      if (!student.fatherPhone) continue;
      
      const studentResults = results[student.id] || {};
      const hasAnyScore = Object.values(studentResults).some(s => s !== '');
      if (!hasAnyScore) continue;

      try {
        // Calculate total score for PDF
        let totalScore = 0;
        subjects.forEach(subj => {
          const s = parseFloat(studentResults[subj]);
          if (!isNaN(s)) totalScore += s;
        });

        // Generate PDF
        const pdfBase64 = await generateStudentPDFBase64(student, studentResults, subjects, examType, totalScore, undefined, schoolName, schoolLogo, academicYear);
        
        let phone = student.fatherPhone.replace(/\s+/g, '').replace(/-/g, '');
        if (phone.startsWith('0')) phone = '218' + phone.slice(1);
        if (!phone.startsWith('+')) phone = '+' + phone;

        const studentTitle = student.gender === 'ط£ظ†ط«ظ‰' ? 'ط§ظ„ط·ط§ظ„ط¨ط©' : 'ط§ظ„ط·ط§ظ„ط¨';
        const caption = `ط§ظ„ط³ظ„ط§ظ… ط¹ظ„ظٹظƒظ… ظˆط±ط­ظ…ط© ط§ظ„ظ„ظ‡\n\nظ†ط±ظپظ‚ ظ„ظƒظ… ط´ظ‡ط§ط¯ط© ط¯ط±ط¬ط§طھ ${studentTitle}: ${student.name}\nط§ظ„ظپطھط±ط©: ${examType}\nط§ظ„ظ…ط¯ط±ط³ط©: ${schoolName}\n\nظ…ط¹ طھظ…ظ†ظٹط§طھظ†ط§ ط¨ط§ظ„طھظˆظپظٹظ‚ ظˆط§ظ„ظ†ط¬ط§ط­ ًںŒں`;

        const res = await fetch('/api/wa-send-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, pdfBase64, fileName: `ط´ظ‡ط§ط¯ط©_${student.name.replace(/\s+/g, '_')}.pdf`, caption })
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          console.error('Server error:', data.error);
          alert(`ط®ط·ط£ ظپظٹ ط¥ط±ط³ط§ظ„ ط´ظ‡ط§ط¯ط© ${student.name}: ${data.error}`);
        }
      } catch (e: any) {
        console.error('Failed to send PDF to', student.name, e);
        alert(`طھط¹ط°ط± ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط®ط§ط¯ظ… ط£ط«ظ†ط§ط، ط¥ط±ط³ط§ظ„ ط´ظ‡ط§ط¯ط© ${student.name}. ط§ظ„طھظپط§طµظٹظ„: ${e.message}`);
      }
    }
    
    setIsSendingWa(false);
    if (successCount === 0) {
      alert('ط§ظƒطھظ…ظ„طھ ط§ظ„ط¹ظ…ظ„ظٹط©طŒ ظˆظ„ظƒظ† ظ„ظ… ظٹطھظ… ط¥ط±ط³ط§ظ„ ط£ظٹ ط´ظ‡ط§ط¯ط©. (ط±ط¨ظ…ط§ ط¨ط³ط¨ط¨ ط®ط·ط£ ظپظٹ ط§ظ„ط®ط§ط¯ظ… ط£ظˆ ط¹ط¯ظ… طھظˆظپط± ط¯ط±ط¬ط§طھ/ط£ط±ظ‚ط§ظ…). ط±ط§ط¬ط¹ ط±ط³ط§ط¦ظ„ ط§ظ„ط®ط·ط£ ط¥ظ† ط¸ظ‡ط±طھ.');
    } else {
      alert(`طھظ… ط§ظ„ط§ظ†طھظ‡ط§ط،! ظ†ط¬ط­ ط¥ط±ط³ط§ظ„ ط§ظ„ط´ظ‡ط§ط¯ط§طھ ظ„ظ€ ${successCount} ظˆظ„ظٹ ط£ظ…ط±.`);
    }
  };

  const congratulateTopStudents = async () => {
    if (filteredStudents.length === 0) return;
    
    // Calculate totals and rank
    const studentsWithTotals = filteredStudents.map(student => {
      const studentResults = results[student.id] || {};
      let total = 0;
      subjects.forEach(subj => {
        const s = parseFloat(studentResults[subj]);
        if (!isNaN(s)) total += s;
      });
      return { ...student, total };
    }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);

    if (studentsWithTotals.length === 0) {
      alert('ظ„ظ… ظٹطھظ… ط±طµط¯ ط¯ط±ط¬ط§طھ ط¨ط¹ط¯.');
      return;
    }

    const countStr = window.prompt("ظƒظ… ط¹ط¯ط¯ ط§ظ„ط£ظˆط§ط¦ظ„ ط§ظ„ط°ظٹظ† طھط±ظٹط¯ ط¥ط±ط³ط§ظ„ ط§ظ„طھظ‡ظ†ط¦ط© ظ„ظ‡ظ…طں (ظ…ط«ط§ظ„: 3طŒ 5طŒ 10)", "3");
    if (!countStr) return;
    const count = parseInt(countStr) || 3;
    const topStudents = studentsWithTotals.slice(0, count);
    const msg = `ط£ظˆط§ط¦ظ„ ط§ظ„ظپطµظ„ (${classRoomFilter}):\n` + topStudents.map((s, i) => `${i + 1}. ${s.name} - ${s.total} ط¯ط±ط¬ط©`).join('\n');
    
    if (!window.confirm(`ظ‡ظ„ طھط±ظٹط¯ ط¥ط±ط³ط§ظ„ ط±ط³ط§ط¦ظ„ طھظ‡ظ†ط¦ط© ظ„ط£ظˆظ„ظٹط§ط، ط£ظ…ظˆط± ظ‡ط¤ظ„ط§ط، ط§ظ„ط·ظ„ط§ط¨طں\n\n${msg}`)) return;

    setIsSendingWa(true);
    let successCount = 0;

    for (let i = 0; i < topStudents.length; i++) {
      const student = topStudents[i];
      if (!student.fatherPhone) continue;

      const rank = i + 1;
      const studentResults = results[student.id] || {};

      try {
        const pdfBase64 = await generateStudentPDFBase64(student, studentResults, subjects, examType, student.total, rank, schoolName, schoolLogo, academicYear);
        
        let phone = student.fatherPhone.replace(/\s+/g, '').replace(/-/g, '');
        if (phone.startsWith('0')) phone = '218' + phone.slice(1);
        if (!phone.startsWith('+')) phone = '+' + phone;

        const studentTitle = student.gender === 'ط£ظ†ط«ظ‰' ? 'ط§ظ„ط·ط§ظ„ط¨ط© ط§ظ„ظ…طھظ…ظٹط²ط©' : 'ط§ظ„ط·ط§ظ„ط¨ ط§ظ„ظ…طھظ…ظٹط²';
        const getRankStr = student.gender === 'ط£ظ†ط«ظ‰' ? 'ظ„ط­طµظˆظ„ظ‡ط§' : 'ظ„ط­طµظˆظ„ظ‡';
        const rankOrdinal = getArabicOrdinal(rank, student.gender);
        const caption = `ًںژٹ طھظ‡ظ†ط¦ط© ط®ط§طµط©! ًںژٹ\n\nطھطھظ‚ط¯ظ… ط¥ط¯ط§ط±ط© ${schoolName} ط¨ط£ط­ط± ط§ظ„طھظ‡ط§ظ†ظٹ ظ„ظ€ ${studentTitle}: *${student.name}*\n${getRankStr} ط¹ظ„ظ‰ ط§ظ„طھط±طھظٹط¨ *${rankOrdinal}* ط¹ظ„ظ‰ ظ…ط³طھظˆظ‰ ط§ظ„ظپطµظ„.\n\nظ†طھظ…ظ†ظ‰ ظ„ظƒظ… ط¯ظˆط§ظ… ط§ظ„طھظپظˆظ‚ ظˆط§ظ„ظ†ط¬ط§ط­! ًںŒںًںژ“`;

        const res = await fetch('/api/wa-send-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, pdfBase64, fileName: `ط´ظ‡ط§ط¯ط©_طھظپظˆظ‚_${student.name.replace(/\s+/g, '_')}.pdf`, caption })
        });
        const data = await res.json();
        if (data.success) successCount++;
      } catch (e) {
        console.error('Failed to send congratulation to', student.name, e);
      }
    }
    
    setIsSendingWa(false);
    alert(`طھظ… ط§ظ„ط§ظ†طھظ‡ط§ط،! ظ†ط¬ط­ ط¥ط±ط³ط§ظ„ ${successCount} ط±ط³ط§ظ„ط© طھظ‡ظ†ط¦ط©.`);
  };

  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 8px', color: 'var(--primary-color)' }}>ًں“‌ ط¥ط¯ط§ط±ط© ط§ظ„ظ†طھط§ط¦ط¬ ط§ظ„ظ…ط¯ط±ط³ظٹط©</h1>
          <button onClick={onBack} style={btnBack}>
            <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>âںµ</span> ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…
          </button>
        </div>
      </div>

      <div className="card" style={{ borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <label style={labelStyle}>ط§ظ„طµظپ ط§ظ„ط¯ط±ط§ط³ظٹ:</label>
            <select value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setClassRoomFilter('ط§ظ„ظƒظ„'); setEditingSubjects(false); }} style={selectStyle}>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          
          {currentGradeClasses.length > 0 && (
            <div>
              <label style={labelStyle}>ط§ظ„ظپطµظ„:</label>
              <select value={classRoomFilter} onChange={e => setClassRoomFilter(e.target.value)} style={selectStyle}>
                <option value="ط§ظ„ظƒظ„">ظƒظ„ ط§ظ„ظپطµظˆظ„</option>
                {currentGradeClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>ط§ظ„ظپطھط±ط© / ط§ظ„ط§ظ…طھط­ط§ظ†:</label>
            <select value={examType} onChange={e => setExamType(e.target.value)} style={selectStyle}>
              <option value="ظ†طµظپ ط§ظ„ظپطµظ„ ط§ظ„ط£ظˆظ„">ظ†طµظپ ط§ظ„ظپطµظ„ ط§ظ„ط£ظˆظ„</option>
              <option value="ظ†ظ‡ط§ظٹط© ط§ظ„ظپطµظ„ ط§ظ„ط£ظˆظ„">ظ†ظ‡ط§ظٹط© ط§ظ„ظپطµظ„ ط§ظ„ط£ظˆظ„</option>
              <option value="ظ†طµظپ ط§ظ„ظپطµظ„ ط§ظ„ط«ط§ظ†ظٹ">ظ†طµظپ ط§ظ„ظپطµظ„ ط§ظ„ط«ط§ظ†ظٹ</option>
              <option value="ظ†ظ‡ط§ظٹط© ط§ظ„ظپطµظ„ ط§ظ„ط«ط§ظ†ظٹ">ظ†ظ‡ط§ظٹط© ط§ظ„ظپطµظ„ ط§ظ„ط«ط§ظ†ظٹ</option>
            </select>
          </div>
          
          <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8, border: '1px dashed var(--border-color)' }}>
             <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-primary)' }}>
               ظ…ظˆط§ط¯ ظ‡ط°ط§ ط§ظ„طµظپ:
               {!editingSubjects && <button onClick={handleEditSubjectsClick} style={{ float: 'left', fontSize: 12, background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}>âœڈï¸ڈ طھط¹ط¯ظٹظ„ ط§ظ„ظ…ظˆط§ط¯</button>}
             </label>
             {editingSubjects ? (
               <div style={{ display: 'flex', gap: 8 }}>
                 <input 
                   value={subjectsInput}
                   onChange={e => setSubjectsInput(e.target.value)}
                   style={{ ...inputBaseStyle, flex: 1 }}
                   placeholder="ط§ظ„ظ‚ط±ط¢ظ†طŒ ط§ظ„طھط±ط¨ظٹط© ط§ظ„ط¥ط³ظ„ط§ظ…ظٹط©طŒ ط§ظ„ط¹ظ„ظˆظ…..."
                 />
                 <button onClick={saveSubjects} style={{ backgroundColor: 'var(--success-color)', color: '#fff', border: 'none', borderRadius: 6, padding: '0 12px', cursor: 'pointer', fontWeight: 'bold' }}>ط­ظپط¸</button>
                 <button onClick={() => setEditingSubjects(false)} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', borderRadius: 6, padding: '0 12px', cursor: 'pointer', fontWeight: 'bold' }}>ط¥ظ„ط؛ط§ط،</button>
               </div>
             ) : (
               <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                 {subjects.length > 0 ? subjects.map(s => <span key={s} style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--primary-color)', padding: '4px 10px', borderRadius: 12, fontSize: 13, fontWeight: 'bold' }}>{s}</span>) : <span style={{ color: 'var(--text-muted)' }}>ظ„ط§ طھظˆط¬ط¯ ظ…ظˆط§ط¯ ظ…ط³ط¬ظ„ط©</span>}
               </div>
             )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', minWidth: '100%', marginTop: 8, gap: 12 }}>
             <button 
              onClick={congratulateTopStudents}
              disabled={isSendingWa}
              style={{
                padding: '12px 24px', backgroundColor: '#fbbf24', color: '#854d0e', border: 'none', borderRadius: '8px',
                cursor: isSendingWa ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: 8, opacity: isSendingWa ? 0.7 : 1, fontFamily: 'Cairo'
              }}
            >
              <span style={{ fontSize: 20 }}>ًںڈ†</span>
              طھظ‡ظ†ط¦ط© ط§ظ„ط£ظˆط§ط¦ظ„
            </button>
             <button 
              onClick={sendResultsWhatsApp}
              disabled={isSendingWa}
              style={{
                padding: '12px 24px', backgroundColor: '#25d366', color: '#fff', border: 'none', borderRadius: '8px',
                cursor: isSendingWa ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: 8, opacity: isSendingWa ? 0.7 : 1, fontFamily: 'Cairo'
              }}
            >
              <span style={{ fontSize: 20 }}>ًں“¤</span>
              {isSendingWa ? 'ط¬ط§ط±ظٹ ط§ظ„ط¥ط±ط³ط§ظ„...' : 'ط¥ط±ط³ط§ظ„ ط§ظ„ط´ظ‡ط§ط¯ط§طھ ط¹ط¨ط± ط§ظ„ظˆط§طھط³ط§ط¨'}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '14px', color: 'var(--text-primary)' }}>ط§ط³ظ… ط§ظ„ط·ط§ظ„ط¨</th>
                <th style={{ padding: '14px', color: 'var(--text-primary)', textAlign: 'center' }}>ط§ظ„ظپطµظ„</th>
                {subjects.map(subj => <th key={subj} style={{ padding: '14px', color: 'var(--text-primary)', textAlign: 'center' }}>{subj}</th>)}
                <th style={{ padding: '14px', color: 'var(--text-primary)', textAlign: 'center' }}>ط¥ط¬ط±ط§ط،ط§طھ</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, idx) => (
                <tr key={student.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{student.name}</td>
                  <td style={{ padding: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>{student.classRoom || '-'}</td>
                  {subjects.map(subj => (
                    <td key={subj} style={{ padding: '10px', textAlign: 'center' }}>
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={results[student.id]?.[subj] || ''} 
                        onChange={e => handleScoreChange(student.id, subj, e.target.value)}
                        style={{ width: 60, padding: 8, border: '1px solid var(--border-color)', borderRadius: 6, textAlign: 'center', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'Cairo' }}
                        placeholder="-"
                      />
                    </td>
                  ))}
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      onClick={async () => {
                        const studentResults = results[student.id] || {};
                        const hasAnyScore = Object.values(studentResults).some(s => s !== '');
                        if (!hasAnyScore) {
                          alert('ط§ظ„ط±ط¬ط§ط، ط±طµط¯ ط§ظ„ط¯ط±ط¬ط§طھ ط£ظˆظ„ط§ظ‹ ظ„طھظˆظ„ظٹط¯ ط§ظ„ط´ظ‡ط§ط¯ط©');
                          return;
                        }
                        let totalScore = 0;
                        subjects.forEach(subj => {
                          const s = parseFloat(studentResults[subj]);
                          if (!isNaN(s)) totalScore += s;
                        });
                        const pdfBase64 = await generateStudentPDFBase64(student, studentResults, subjects, examType, totalScore, undefined, schoolName, schoolLogo, academicYear);
                        
                        try {
                          const byteString = atob(pdfBase64.split(',')[1]);
                          const ab = new ArrayBuffer(byteString.length);
                          const ia = new Uint8Array(ab);
                          for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                          }
                          const blob = new Blob([ab], { type: 'application/pdf' });
                          const blobUrl = URL.createObjectURL(blob);
                          window.open(blobUrl, '_blank');
                        } catch (err) {
                          alert('ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط¹ط±ط¶ ط§ظ„ط´ظ‡ط§ط¯ط©.');
                          console.error(err);
                        }
                      }}
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      ًں‘پï¸ڈ ط¹ط±ط¶ ط§ظ„ط´ظ‡ط§ط¯ط©
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={subjects.length + 2} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    ظ„ط§ ظٹظˆط¬ط¯ ط·ظ„ط§ط¨ ظ…ط³ط¬ظ„ظٹظ† ظپظٹ ظ‡ط°ط§ ط§ظ„طµظپ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const btnBack: React.CSSProperties = { background: 'linear-gradient(135deg, var(--primary-color), #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content', marginTop: 10 };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-primary)' };
const selectStyle: React.CSSProperties = { padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-color)', minWidth: 180, background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'Cairo' };
const inputBaseStyle: React.CSSProperties = { padding: 8, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' };
