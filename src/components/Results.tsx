import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateStudentPDFBase64 } from './pdfGenerator';

const getArabicOrdinal = (rank: number, gender: 'ذكر' | 'أنثى' | 'غير محدد' = 'ذكر'): string => {
  const ordinalsM = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
  const ordinalsF = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'];
  if (rank >= 1 && rank <= 10) return gender === 'أنثى' ? ordinalsF[rank - 1] : ordinalsM[rank - 1];
  return rank.toString();
};

export default function Results({ onBack }: { onBack: () => void }) {
  const { students, gradeSubjects, setGradeSubjects, timetables, classRooms, gradeFees, studentResults, setStudentResults, schoolName, schoolLogo, academicYear } = useAppContext();
  const grades = Object.keys(gradeFees);
  const [gradeFilter, setGradeFilter] = useState(grades[0] || 'الصف الأول');
  const [classRoomFilter, setClassRoomFilter] = useState('الكل');
  const [examType, setExamType] = useState('نصف الفصل الأول');
  
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
    setSubjectsInput(subjects.join('، '));
    setEditingSubjects(true);
  };

  const saveSubjects = () => {
    const newSubjects = subjectsInput.split('،').map(s => s.trim()).filter(s => s !== '');
    setGradeSubjects({
      ...gradeSubjects,
      [gradeFilter]: newSubjects
    });
    setEditingSubjects(false);
  };

  const filteredStudents = students.filter(s => {
    const matchGrade = s.grade === gradeFilter;
    const matchClass = classRoomFilter === 'الكل' || s.classRoom === classRoomFilter;
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
      alert('لا يوجد طلاب في هذا الصف');
      return;
    }
    
    if (!window.confirm(`سيتم إرسال نتائج ${examType} كشهادات (PDF) لـ ${filteredStudents.length} طالب إلى أولياء أمورهم. قد تستغرق العملية بضع دقائق. هل أنت متأكد؟`)) return;

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

        const studentTitle = student.gender === 'أنثى' ? 'الطالبة' : 'الطالب';
        const caption = `السلام عليكم ورحمة الله\n\nنرفق لكم شهادة درجات ${studentTitle}: ${student.name}\nالفترة: ${examType}\nالمدرسة: ${schoolName}\n\nمع تمنياتنا بالتوفيق والنجاح 🌟`;

        const res = await fetch('http://localhost:3001/api/wa-send-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, pdfBase64, fileName: `شهادة_${student.name.replace(/\s+/g, '_')}.pdf`, caption })
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          console.error('Server error:', data.error);
          alert(`خطأ في إرسال شهادة ${student.name}: ${data.error}`);
        }
      } catch (e: any) {
        console.error('Failed to send PDF to', student.name, e);
        alert(`تعذر الاتصال بالخادم أثناء إرسال شهادة ${student.name}. التفاصيل: ${e.message}`);
      }
    }
    
    setIsSendingWa(false);
    if (successCount === 0) {
      alert('اكتملت العملية، ولكن لم يتم إرسال أي شهادة. (ربما بسبب خطأ في الخادم أو عدم توفر درجات/أرقام). راجع رسائل الخطأ إن ظهرت.');
    } else {
      alert(`تم الانتهاء! نجح إرسال الشهادات لـ ${successCount} ولي أمر.`);
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
      alert('لم يتم رصد درجات بعد.');
      return;
    }

    const countStr = window.prompt("كم عدد الأوائل الذين تريد إرسال التهنئة لهم؟ (مثال: 3، 5، 10)", "3");
    if (!countStr) return;
    const count = parseInt(countStr) || 3;
    const topStudents = studentsWithTotals.slice(0, count);
    const msg = `أوائل الفصل (${classRoomFilter}):\n` + topStudents.map((s, i) => `${i + 1}. ${s.name} - ${s.total} درجة`).join('\n');
    
    if (!window.confirm(`هل تريد إرسال رسائل تهنئة لأولياء أمور هؤلاء الطلاب؟\n\n${msg}`)) return;

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

        const studentTitle = student.gender === 'أنثى' ? 'الطالبة المتميزة' : 'الطالب المتميز';
        const getRankStr = student.gender === 'أنثى' ? 'لحصولها' : 'لحصوله';
        const rankOrdinal = getArabicOrdinal(rank, student.gender);
        const caption = `🎊 تهنئة خاصة! 🎊\n\nتتقدم إدارة ${schoolName} بأحر التهاني لـ ${studentTitle}: *${student.name}*\n${getRankStr} على الترتيب *${rankOrdinal}* على مستوى الفصل.\n\nنتمنى لكم دوام التفوق والنجاح! 🌟🎓`;

        const res = await fetch('http://localhost:3001/api/wa-send-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, pdfBase64, fileName: `شهادة_تفوق_${student.name.replace(/\s+/g, '_')}.pdf`, caption })
        });
        const data = await res.json();
        if (data.success) successCount++;
      } catch (e) {
        console.error('Failed to send congratulation to', student.name, e);
      }
    }
    
    setIsSendingWa(false);
    alert(`تم الانتهاء! نجح إرسال ${successCount} رسالة تهنئة.`);
  };

  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 8px', color: 'var(--primary-color)' }}>📝 إدارة النتائج المدرسية</h1>
          <button onClick={onBack} style={btnBack}>
            <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
          </button>
        </div>
      </div>

      <div className="card" style={{ borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <label style={labelStyle}>الصف الدراسي:</label>
            <select value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setClassRoomFilter('الكل'); setEditingSubjects(false); }} style={selectStyle}>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          
          {currentGradeClasses.length > 0 && (
            <div>
              <label style={labelStyle}>الفصل:</label>
              <select value={classRoomFilter} onChange={e => setClassRoomFilter(e.target.value)} style={selectStyle}>
                <option value="الكل">كل الفصول</option>
                {currentGradeClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>الفترة / الامتحان:</label>
            <select value={examType} onChange={e => setExamType(e.target.value)} style={selectStyle}>
              <option value="نصف الفصل الأول">نصف الفصل الأول</option>
              <option value="نهاية الفصل الأول">نهاية الفصل الأول</option>
              <option value="نصف الفصل الثاني">نصف الفصل الثاني</option>
              <option value="نهاية الفصل الثاني">نهاية الفصل الثاني</option>
            </select>
          </div>
          
          <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8, border: '1px dashed var(--border-color)' }}>
             <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-primary)' }}>
               مواد هذا الصف:
               {!editingSubjects && <button onClick={handleEditSubjectsClick} style={{ float: 'left', fontSize: 12, background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}>✏️ تعديل المواد</button>}
             </label>
             {editingSubjects ? (
               <div style={{ display: 'flex', gap: 8 }}>
                 <input 
                   value={subjectsInput}
                   onChange={e => setSubjectsInput(e.target.value)}
                   style={{ ...inputBaseStyle, flex: 1 }}
                   placeholder="القرآن، التربية الإسلامية، العلوم..."
                 />
                 <button onClick={saveSubjects} style={{ backgroundColor: 'var(--success-color)', color: '#fff', border: 'none', borderRadius: 6, padding: '0 12px', cursor: 'pointer', fontWeight: 'bold' }}>حفظ</button>
                 <button onClick={() => setEditingSubjects(false)} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', borderRadius: 6, padding: '0 12px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
               </div>
             ) : (
               <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                 {subjects.length > 0 ? subjects.map(s => <span key={s} style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--primary-color)', padding: '4px 10px', borderRadius: 12, fontSize: 13, fontWeight: 'bold' }}>{s}</span>) : <span style={{ color: 'var(--text-muted)' }}>لا توجد مواد مسجلة</span>}
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
              <span style={{ fontSize: 20 }}>🏆</span>
              تهنئة الأوائل
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
              <span style={{ fontSize: 20 }}>📤</span>
              {isSendingWa ? 'جاري الإرسال...' : 'إرسال الشهادات عبر الواتساب'}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '14px', color: 'var(--text-primary)' }}>اسم الطالب</th>
                <th style={{ padding: '14px', color: 'var(--text-primary)', textAlign: 'center' }}>الفصل</th>
                {subjects.map(subj => <th key={subj} style={{ padding: '14px', color: 'var(--text-primary)', textAlign: 'center' }}>{subj}</th>)}
                <th style={{ padding: '14px', color: 'var(--text-primary)', textAlign: 'center' }}>إجراءات</th>
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
                          alert('الرجاء رصد الدرجات أولاً لتوليد الشهادة');
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
                          alert('حدث خطأ أثناء عرض الشهادة.');
                          console.error(err);
                        }
                      }}
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      👁️ عرض الشهادة
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={subjects.length + 2} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    لا يوجد طلاب مسجلين في هذا الصف
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
