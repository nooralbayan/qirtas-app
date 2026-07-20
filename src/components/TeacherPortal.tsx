import React, { useState } from 'react';
import { useAppContext, LessonLog, StudentEvaluation } from '../context/AppContext';
import { LogOut, BookOpen, Star } from 'lucide-react';

export default function TeacherPortal({ onLogout }: { onLogout: () => void }) {
  const { currentUser, schoolName, schoolLogo, classRooms, students, lessonLogs, setLessonLogs, studentEvaluations, setStudentEvaluations } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'lessons' | 'evaluations'>('lessons');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const teacherId = currentUser?.id.replace('teacher_', '') || '0';
  const teacherName = currentUser?.name || '';
  
  // States for new Lesson Log
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonHomework, setLessonHomework] = useState('');
  const [lessonType, setLessonType] = useState<'درس' | 'واجب' | 'امتحان'>('درس');
  
  // Filtered Students for the selected class
  const classStudents = students.filter(s => s.grade === selectedGrade && s.classRoom === selectedClass && !s.wasWithdrawn);
  
  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade || !selectedClass || !selectedSubject || !lessonTopic) return;
    
    const newLog: LessonLog = {
      id: `lesson_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      teacherId: Number(teacherId),
      grade: selectedGrade,
      classRoom: selectedClass,
      subject: selectedSubject,
      topic: lessonTopic,
      homework: lessonHomework,
      type: lessonType,
    };
    
    setLessonLogs([newLog, ...lessonLogs]);
    setLessonTopic('');
    setLessonHomework('');
    alert('تم حفظ الدرس بنجاح!');
  };

  const handleAddEvaluation = (studentId: number, rating: StudentEvaluation['rating'], notes: string) => {
    if (!selectedSubject) {
      alert('يرجى اختيار المادة أولاً');
      return;
    }
    const newEval: StudentEvaluation = {
      id: `eval_${Date.now()}_${studentId}`,
      date: new Date().toISOString().split('T')[0],
      studentId,
      teacherId: Number(teacherId),
      subject: selectedSubject,
      rating,
      notes
    };
    setStudentEvaluations([newEval, ...studentEvaluations]);
    alert('تم حفظ التقييم بنجاح!');
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {schoolLogo && schoolLogo !== '<>' ? (
            <img src={schoolLogo} alt="School Logo" style={{ height: '50px', borderRadius: '8px' }} />
          ) : (
            <div style={{ width: '50px', height: '50px', background: '#27ae60', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>ش</div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-primary)' }}>بوابة المعلم</h1>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{schoolName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{teacherName}</div>
            <div style={{ fontSize: '12px', color: '#27ae60' }}>معلم</div>
          </div>
          <button onClick={onLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '30px 40px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Class Selector */}
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: '0 0 16px', color: 'var(--primary-color)', fontSize: '20px' }}>اختيار الفصل والمادة</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الصف الدراسي</label>
              <select value={selectedGrade} onChange={e => {setSelectedGrade(e.target.value); setSelectedClass('');}} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'Cairo' }}>
                <option value="">-- اختر الصف --</option>
                {Object.keys(classRooms).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            {selectedGrade && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الفصل</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'Cairo' }}>
                  <option value="">-- اختر الفصل --</option>
                  {classRooms[selectedGrade]?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>المادة التي تدرسها</label>
              <input type="text" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} placeholder="مثال: رياضيات" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'Cairo' }} />
            </div>
          </div>
        </div>

        {selectedGrade && selectedClass && selectedSubject ? (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <button onClick={() => setActiveTab('lessons')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: activeTab === 'lessons' ? '#27ae60' : 'var(--bg-card)', color: activeTab === 'lessons' ? '#fff' : 'var(--text-primary)', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.3s', borderBottom: activeTab === 'lessons' ? 'none' : '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <BookOpen size={20} /> تحضير وسجل الدروس
              </button>
              <button onClick={() => setActiveTab('evaluations')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: activeTab === 'evaluations' ? '#27ae60' : 'var(--bg-card)', color: activeTab === 'evaluations' ? '#fff' : 'var(--text-primary)', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.3s', borderBottom: activeTab === 'evaluations' ? 'none' : '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Star size={20} /> قائمة الطلاب والتقييم
              </button>
            </div>

            {/* Content */}
            {activeTab === 'lessons' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                {/* Form */}
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>إضافة درس جديد لليوم</h3>
                  <form onSubmit={handleAddLesson} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>النوع</label>
                      <select value={lessonType} onChange={e => setLessonType(e.target.value as any)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                        <option value="درس">شرح درس</option>
                        <option value="واجب">إعطاء واجب</option>
                        <option value="امتحان">إجراء امتحان/اختبار</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>موضوع الدرس / عنوان الاختبار</label>
                      <input type="text" value={lessonTopic} onChange={e => setLessonTopic(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>تفاصيل الواجب (إن وجد)</label>
                      <textarea value={lessonHomework} onChange={e => setLessonHomework(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <button type="submit" style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>حفظ</button>
                  </form>
                </div>
                
                {/* History */}
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', maxHeight: '600px', overflowY: 'auto' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>سجل الدروس المضافة ({selectedGrade} - {selectedClass})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {lessonLogs.filter(l => l.grade === selectedGrade && l.classRoom === selectedClass && l.subject === selectedSubject).map(log => (
                      <div key={log.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--input-bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{log.type}: {log.topic}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.date}</span>
                        </div>
                        {log.homework && <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>الواجب: {log.homework}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>قائمة طلاب الفصل وتقييمهم</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ background: 'rgba(39, 174, 96, 0.1)', color: '#27ae60' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #27ae60' }}>اسم الطالب</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #27ae60' }}>التقييم السريع</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #27ae60' }}>ملاحظات لولي الأمر</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #27ae60' }}>إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map(student => {
                        return (
                          <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{student.name}</td>
                            <td style={{ padding: '12px' }}>
                              <select id={`rating_${student.id}`} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                                <option value="ممتاز">ممتاز ⭐⭐⭐</option>
                                <option value="جيد جداً">جيد جداً ⭐⭐</option>
                                <option value="جيد">جيد ⭐</option>
                                <option value="مقبول">مقبول 😐</option>
                                <option value="ضعيف">ضعيف 🔻</option>
                              </select>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <input id={`note_${student.id}`} type="text" placeholder="اكتب ملاحظة..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }} />
                            </td>
                            <td style={{ padding: '12px' }}>
                              <button onClick={() => {
                                const rating = (document.getElementById(`rating_${student.id}`) as HTMLSelectElement).value as any;
                                const note = (document.getElementById(`note_${student.id}`) as HTMLInputElement).value;
                                handleAddEvaluation(student.id, rating, note);
                                (document.getElementById(`note_${student.id}`) as HTMLInputElement).value = '';
                              }} style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>حفظ التقييم</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <h3>يرجى اختيار الصف والفصل والمادة للبدء في التحضير</h3>
          </div>
        )}
      </main>
    </div>
  );
}
