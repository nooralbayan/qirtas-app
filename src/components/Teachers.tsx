import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Teacher } from '../context/AppContext';

export default function Teachers({ onBack }: { onBack: () => void }) {
  const { teachers, setTeachers } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Teacher>>({ name: '', subject: '', phone: '', nationalId: '', salary: 0, hireDate: '' });

  const filtered = teachers.filter((t) => t.name.includes(searchTerm) || t.subject.includes(searchTerm));

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', subject: '', phone: '', nationalId: '', salary: 0, hireDate: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEdit = (t: Teacher) => {
    setEditingId(t.id);
    setForm({ ...t });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المعلم/الموظف؟')) {
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.subject) return;

    if (editingId !== null) {
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === editingId ? { ...t, ...(form as Teacher) } : t
        )
      );
    } else {
      const newId = teachers.length > 0 ? Math.max(...teachers.map((t) => t.id)) + 1 : 1;
      const newTeacher: Teacher = {
        id: newId,
        ...(form as Required<typeof form>),
      };
      setTeachers((prev) => [...prev, newTeacher]);
    }
    setShowModal(false);
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
        <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, borderLeft: '4px solid #3b82f6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>إجمالي المعلمين والموظفين</h3>
            <h2 style={{ margin: 0, fontSize: 32, color: '#3b82f6' }}>{teachers.length}</h2>
          </div>
          <div style={{ fontSize: 40, opacity: 0.5 }}>👨‍🏫</div>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#0056b3', fontSize: 26 }}>إدارة الموارد البشرية</h2>
          <button onClick={openAdd} style={{ backgroundColor: '#0056b3', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>
            + إضافة معلم / موظف
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="🔍 بحث باسم المعلم أو التخصص..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: 400, padding: '12px 16px', borderRadius: 8, border: '1px solid #ddd', outline: 'none' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: 'var(--text-primary)', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px', fontWeight: 700 }}>الرقم</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>الاسم</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>الرقم الوطني</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>التخصص / الوظيفة</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>رقم الهاتف</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>الراتب الأساسي</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>تاريخ التعيين</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>الحالة (الغياب)</th>
                <th style={{ padding: '12px', fontWeight: 700 }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => (
                <tr key={t.id} style={{ backgroundColor: idx % 2 === 0 ? '#fafbfc' : '#fff' }}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{t.id}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: 600 }}>{t.name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{t.nationalId || '-'}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>{t.subject}</span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee', direction: 'ltr', textAlign: 'right' }}>{t.phone}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{t.salary} د.ل</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{t.hireDate}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <button 
                      onClick={() => setTeachers(prev => prev.map(teacher => teacher.id === t.id ? { ...teacher, isAbsent: !teacher.isAbsent } : teacher))}
                      style={{ padding: '4px 8px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 'bold', backgroundColor: t.isAbsent ? '#fee2e2' : '#dcfce7', color: t.isAbsent ? '#ef4444' : '#22c55e' }}
                    >
                      {t.isAbsent ? 'غائب' : 'حاضر'}
                    </button>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <button onClick={() => openEdit(t)} style={{ backgroundColor: '#ffc107', color: 'var(--text-primary)', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', marginLeft: 6, fontWeight: 600 }}>تعديل</button>
                    <button onClick={() => handleDelete(t.id)} style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>حذف</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>لا توجد بيانات مطابقة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 14, padding: 32, width: '90%', maxWidth: 500, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 24px', color: '#0056b3', fontSize: 22 }}>
              {editingId !== null ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>اسم الموظف / المعلم</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>الرقم الوطني</label>
                <input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} style={inputStyle} placeholder="الرقم الوطني لتسجيل الدخول..." />
              </div>
              <div>
                <label style={labelStyle}>التخصص / الوظيفة</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={inputStyle} placeholder="مثال: لغة إنجليزية، حارس، إداري..." />
              </div>
              <div>
                <label style={labelStyle}>رقم الهاتف</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>الراتب الأساسي (د.ل)</label>
                <input type="number" value={form.salary || ''} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>تاريخ التعيين</label>
                <input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button onClick={handleSubmit} style={{ backgroundColor: '#0056b3', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>
                حفظ
              </button>
              <button onClick={() => setShowModal(false)} style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
