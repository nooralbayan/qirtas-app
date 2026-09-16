import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { LessonLog } from '../context/AppContext';

export default function Lessons({ onBack }: { onBack: () => void }) {
  const { lessonLogs, setLessonLogs, gradeFees, classRooms, gradeSubjects, teachers, currentUser } = useAppContext();
  
  const [selectedGrade, setSelectedGrade] = useState<string>('الصف الأول');
  const [selectedClass, setSelectedClass] = useState<string>('أ');
  const [selectedSubject, setSelectedSubject] = useState<string>('الكل');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const availableClassRooms = classRooms[selectedGrade] || ['أ'];
  const availableSubjects = gradeSubjects[selectedGrade] || ['القرآن الكريم', 'التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية'];

  const [form, setForm] = useState<Partial<LessonLog>>({
    grade: selectedGrade,
    classRoom: selectedClass,
    subject: availableSubjects[0] || 'اللغة العربية',
    teacherName: '',
    lessonTitle: '',
    date: new Date().toISOString().split('T')[0],
    homework: '',
    notes: ''
  });

  // Filter lessons by grade, class, and subject
  const safeLogs = Array.isArray(lessonLogs) ? lessonLogs : [];
  const filteredLogs = safeLogs.filter(log => {
    const matchGrade = log.grade === selectedGrade;
    const matchClass = !selectedClass || selectedClass === 'الكل' || log.classRoom === selectedClass;
    const matchSub = selectedSubject === 'الكل' || log.subject === selectedSubject;
    return matchGrade && matchClass && matchSub;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openAdd = () => {
    setEditingId(null);
    setForm({
      grade: selectedGrade,
      classRoom: selectedClass === 'الكل' ? (availableClassRooms[0] || 'أ') : selectedClass,
      subject: selectedSubject === 'الكل' ? (availableSubjects[0] || 'اللغة العربية') : selectedSubject,
      teacherName: teachers.find(t => t.subject === selectedSubject)?.name || '',
      lessonTitle: '',
      date: new Date().toISOString().split('T')[0],
      homework: '',
      notes: ''
    });
    setShowModal(true);
  };

  const openEdit = (log: LessonLog) => {
    setEditingId(log.id);
    setForm({ ...log });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدرس من السجل؟')) {
      setLessonLogs(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleSubmit = () => {
    if (!form.lessonTitle || !form.subject || !form.grade) {
      alert('يرجى كتابة عنوان الدرس واختيار المادة والصف.');
      return;
    }

    if (editingId) {
      setLessonLogs(prev => prev.map(l => l.id === editingId ? { ...l, ...(form as LessonLog) } : l));
    } else {
      const newLog: LessonLog = {
        id: `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        grade: form.grade || selectedGrade,
        classRoom: form.classRoom || selectedClass,
        subject: form.subject || 'اللغة العربية',
        teacherName: form.teacherName || '',
        lessonTitle: form.lessonTitle || '',
        date: form.date || new Date().toISOString().split('T')[0],
        homework: form.homework || '',
        notes: form.notes || ''
      };
      setLessonLogs(prev => [newLog, ...prev]);
    }
    setShowModal(false);
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
        <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
      </button>

      {/* Top Header Card */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid var(--border-color)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--primary-color)', fontSize: 28, fontWeight: 900 }}>📚 سجل المسار الدراسي والدروس المنجزة</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>متابعة وتوثيق الخطة الدراسية، الدروس المنفذة، والواجبات المدرسية لكل صف ومادة.</p>
          </div>
          
          {(currentUser?.role === 'admin' || currentUser?.role === 'student_affairs' || currentUser?.role === 'hr') && (
            <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
              ➕ إدراج درس جديد في المسار
            </button>
          )}
        </div>
      </div>

      {/* Filters Strip */}
      <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>اختر الصف الدراسي:</label>
          <select 
            value={selectedGrade}
            onChange={e => {
              setSelectedGrade(e.target.value);
              setSelectedClass('الكل');
              setSelectedSubject('الكل');
            }}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontWeight: 'bold', minWidth: 160 }}
          >
            {Object.keys(gradeFees).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>الفصل الدراسي:</label>
          <select 
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontWeight: 'bold', minWidth: 120 }}
          >
            <option value="الكل">كل الفصول</option>
            {availableClassRooms.map(c => <option key={c} value={c}>فصل {c}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>المادة الدراسية:</label>
          <select 
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontWeight: 'bold', minWidth: 160 }}
          >
            <option value="الكل">كل المواد</option>
            {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginRight: 'auto', textAlign: 'left' }}>
          <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)', padding: '8px 16px', borderRadius: 20, fontWeight: 800, fontSize: 14 }}>
            عدد الدروس الموثقة: {filteredLogs.length} درس
          </span>
        </div>
      </div>

      {/* Lesson Log Timeline / Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
            <h3 style={{ margin: 0 }}>لا توجد دروس موثقة لهذا الصف أو المادة حتى الآن.</h3>
            <p style={{ fontSize: 14, marginTop: 6 }}>اضغط على "إدراج درس جديد في المسار" لبدء توثيق الخطة المدرسية.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredLogs.map(log => (
              <div 
                key={log.id}
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 14, 
                  padding: 20, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '4px 12px', borderRadius: 8, fontSize: 13, fontWeight: 800 }}>
                        {log.subject}
                      </span>
                      <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                        {log.grade} - فصل {log.classRoom}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        📅 {log.date}
                      </span>
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>
                      {log.lessonTitle}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {log.teacherName && (
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '6px 12px', borderRadius: 8, fontWeight: 700 }}>
                        👨‍🏫 المعلم: {log.teacherName}
                      </span>
                    )}
                    
                    {(currentUser?.role === 'admin' || currentUser?.role === 'student_affairs') && (
                      <>
                        <button onClick={() => openEdit(log)} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                          تعديل
                        </button>
                        <button onClick={() => handleDelete(log.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                          حذف
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {log.homework && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderRight: '4px solid #f59e0b', padding: '10px 14px', borderRadius: 8, fontSize: 14, color: 'var(--text-primary)' }}>
                    📝 <strong>الواجب المنزلي المطلـوب:</strong> {log.homework}
                  </div>
                )}

                {log.notes && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    💡 <strong>ملاحظات الدرس:</strong> {log.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 16, padding: 32, width: '90%', maxWidth: 550, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 24px', color: 'var(--primary-color)', fontSize: 22, fontWeight: 800 }}>
              {editingId ? 'تعديل بيانات الدرس' : 'إدراج درس جديد في المسار الدراسي'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>الصف الدراسي</label>
                  <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} style={inputStyle}>
                    {Object.keys(gradeFees).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>الفصل</label>
                  <select value={form.classRoom} onChange={e => setForm({ ...form, classRoom: e.target.value })} style={inputStyle}>
                    {(classRooms[form.grade || selectedGrade] || ['أ']).map(c => <option key={c} value={c}>فصل {c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>المادة الدراسية</label>
                  <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={inputStyle}>
                    {(gradeSubjects[form.grade || selectedGrade] || availableSubjects).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>تاريخ إنجاز الدرس</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>عنوان الدرس / الموضوع</label>
                <input value={form.lessonTitle} onChange={e => setForm({ ...form, lessonTitle: e.target.value })} style={inputStyle} placeholder="مثال: سورة الفجر (1-15) / الضرب في رقمين..." />
              </div>

              <div>
                <label style={labelStyle}>اسم المعلم المُقدِّم للدرس</label>
                <input value={form.teacherName} onChange={e => setForm({ ...form, teacherName: e.target.value })} style={inputStyle} placeholder="اسم المعلم" />
              </div>

              <div>
                <label style={labelStyle}>الواجب المنزلي (إن وجد)</label>
                <input value={form.homework} onChange={e => setForm({ ...form, homework: e.target.value })} style={inputStyle} placeholder="مثال: حل التمارين ص 45 في كتاب التدريبات" />
              </div>

              <div>
                <label style={labelStyle}>ملاحظات أو نقاط أساسية</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder="أهداف الدرس، نقاط القوة..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button onClick={handleSubmit} style={{ backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', cursor: 'pointer', fontWeight: 800, fontSize: 16 }}>
                💾 حفظ الدرس
              </button>
              <button onClick={() => setShowModal(false)} style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', cursor: 'pointer', fontWeight: 800, fontSize: 16 }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--input-bg)', color: 'var(--text-primary)' };
