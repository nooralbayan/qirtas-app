import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function Subjects({ onBack }: { onBack: () => void }) {
  const { gradeSubjects, setGradeSubjects, gradeFees } = useAppContext();
  const [selectedGrade, setSelectedGrade] = useState<string>(Object.keys(gradeFees)[0] || '');
  const [newSubject, setNewSubject] = useState('');

  const subjects = gradeSubjects[selectedGrade] || [];

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    setGradeSubjects({
      ...gradeSubjects,
      [selectedGrade]: [...subjects, newSubject.trim()]
    });
    setNewSubject('');
  };

  const handleDeleteSubject = (subjectToDelete: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المادة؟')) {
      setGradeSubjects({
        ...gradeSubjects,
        [selectedGrade]: subjects.filter(sub => sub !== subjectToDelete)
      });
    }
  };

  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
        <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        {/* Grades Sidebar */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: 12 }}>الصفوف الدراسية</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.keys(gradeFees).map(grade => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                style={{
                  padding: '12px',
                  textAlign: 'right',
                  backgroundColor: selectedGrade === grade ? '#e0f2fe' : 'transparent',
                  color: selectedGrade === grade ? '#0284c7' : '#475569',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: selectedGrade === grade ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects Content */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0, color: '#0284c7', marginBottom: 24 }}>المواد الدراسية لـ: {selectedGrade}</h2>

          <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
            <input
              placeholder="اسم المادة الجديدة..."
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
              style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, fontFamily: 'Cairo, sans-serif' }}
            />
            <button onClick={handleAddSubject} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>
              + إضافة مادة
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {subjects.map(sub => (
              <div key={sub} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#334155' }}>{sub}</span>
                <button onClick={() => handleDeleteSubject(sub)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, padding: 4 }}>
                  🗑️
                </button>
              </div>
            ))}
            {subjects.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 18 }}>
                لا توجد مواد مسجلة لهذا الصف
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
