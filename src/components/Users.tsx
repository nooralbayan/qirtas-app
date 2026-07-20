import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { User, UserRole } from '../context/AppContext';

export default function Users({ onBack }: { onBack: () => void }) {
  const { users, setUsers } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const ALL_MODULES = [
    { id: 'students', label: 'إدارة بيانات الطلاب' },
    { id: 'classrooms', label: 'إدارة الفصول الدراسية' },
    { id: 'teachers', label: 'إدارة المعلمين' },
    { id: 'withdrawn', label: 'الطلاب المنسحبون' },
    { id: 'attendance', label: 'الغياب والحضور' },
    { id: 'timetable', label: 'الجدول الدراسي' },
    { id: 'expenses', label: 'إدارة المصروفات' },
    { id: 'receipts', label: 'إدارة سندات القبض' },
    { id: 'reports', label: 'التقارير' },
    { id: 'whatsapp', label: 'تواصل أولياء الأمور' },
    { id: 'results', label: 'النتائج المدرسية' },
    { id: 'subjects', label: 'المواد الدراسية' },
    { id: 'users', label: 'إدارة المستخدمين' },
    { id: 'settings', label: 'الإعدادات' },
    { id: 'recyclebin', label: 'سلة المحذوفات' },
  ];

  const DEFAULT_PERMISSIONS: Record<string, string[]> = {
    accountant: ['expenses', 'receipts', 'reports', 'whatsapp'],
    student_affairs: ['students', 'classrooms', 'withdrawn', 'attendance', 'timetable', 'whatsapp', 'results', 'subjects'],
    hr: ['teachers', 'attendance'],
    admin: ALL_MODULES.map(m => m.id)
  };

  const [form, setForm] = useState<Partial<User>>({
    username: '',
    password: '',
    name: '',
    role: 'student_affairs',
    permissions: DEFAULT_PERMISSIONS['student_affairs']
  });

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setForm({
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
      permissions: user.permissions || DEFAULT_PERMISSIONS[user.role as string] || []
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.username || !form.name || !form.password) {
      alert('الرجاء تعبئة جميع الحقول');
      return;
    }
    
    if (editingUserId) {
      setUsers(users.map(u => 
        u.id === editingUserId ? { ...u, username: form.username!, password: form.password!, name: form.name!, role: form.role as UserRole, permissions: form.permissions } : u
      ));
    } else {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: form.username,
        password: form.password,
        name: form.name,
        role: form.role as UserRole,
        permissions: form.permissions
      };
      setUsers([...users, newUser]);
    }
    
    setShowModal(false);
    setEditingUserId(null);
    setForm({ username: '', password: '', name: '', role: 'student_affairs', permissions: DEFAULT_PERMISSIONS['student_affairs'] });
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const roleLabels: Record<string, string> = {
    'admin': 'مدير عام',
    'accountant': 'محاسب',
    'student_affairs': 'شؤون طلبة',
    'hr': 'شؤون موظفين'
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
        <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
      </button>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#0056b3' }}>إدارة المستخدمين والصلاحيات</h2>
          <button onClick={() => {
            setEditingUserId(null);
            setForm({ username: '', password: '', name: '', role: 'student_affairs', permissions: DEFAULT_PERMISSIONS['student_affairs'] });
            setShowModal(true);
          }} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>
            + مستخدم جديد
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: 12 }}>الاسم</th>
              <th style={{ padding: 12 }}>اسم الدخول</th>
              <th style={{ padding: 12 }}>الصلاحية</th>
              <th style={{ padding: 12 }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 12 }}>{u.name}</td>
                <td style={{ padding: 12 }}>{u.username}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 'bold' }}>
                    {roleLabels[u.role] || u.role}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => handleEdit(u)} style={{ backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', marginLeft: 8 }}>
                    تعديل
                  </button>
                  <button onClick={() => handleDelete(u.id)} disabled={u.role === 'admin'} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: u.role === 'admin' ? 'not-allowed' : 'pointer', opacity: u.role === 'admin' ? 0.5 : 1 }}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 14, padding: 32, width: '90%', maxWidth: 500 }}>
            <h3 style={{ margin: '0 0 20px', color: '#0056b3' }}>{editingUserId ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>اسم الموظف</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} placeholder="مثال: أحمد محمد" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>اسم الدخول (Username)</label>
                <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>كلمة المرور</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>الصلاحية (الدور)</label>
                <select value={form.role} onChange={e => {
                  const role = e.target.value as UserRole;
                  setForm({...form, role, permissions: DEFAULT_PERMISSIONS[role] || []});
                }} style={inputStyle}>
                  <option value="student_affairs">شؤون طلبة</option>
                  <option value="accountant">محاسب</option>
                  <option value="hr">شؤون موظفين</option>
                  <option value="admin">مدير عام</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', color: '#0369a1' }}>الشاشات المسموح بالوصول إليها (صلاحيات مخصصة)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)', maxHeight: 220, overflowY: 'auto' }}>
                  {ALL_MODULES.map(mod => (
                    <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: form.role === 'admin' ? 'not-allowed' : 'pointer', opacity: form.role === 'admin' ? 0.6 : 1 }}>
                      <input 
                        type="checkbox" 
                        disabled={form.role === 'admin'}
                        checked={form.role === 'admin' || (form.permissions || []).includes(mod.id)}
                        onChange={(e) => {
                          if (form.role === 'admin') return;
                          const checked = e.target.checked;
                          let current = form.permissions || [];
                          if (checked) {
                            setForm({ ...form, permissions: [...current, mod.id] });
                          } else {
                            setForm({ ...form, permissions: current.filter(p => p !== mod.id) });
                          }
                        }}
                      />
                      <span style={{ fontSize: 13 }}>{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button onClick={handleSave} style={{ flex: 1, backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: 12, cursor: 'pointer', fontWeight: 700 }}>
                  {editingUserId ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                </button>
                <button onClick={() => { setShowModal(false); setEditingUserId(null); }} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, padding: 12, cursor: 'pointer', fontWeight: 700 }}>
                  إلغاء
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const };
