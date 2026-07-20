import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function Announcements({ onBack }: { onBack: () => void }) {
  const { announcements, setAnnouncements, currentUser } = useAppContext();
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'عادي' as 'عاجل' | 'عادي' | 'إعلامي',
    target: 'الكل' as 'الكل' | 'المعلمين' | 'أولياء الأمور'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      alert('الرجاء إدخال عنوان ومحتوى التعميم');
      return;
    }
    const newAnnouncement = {
      id: Math.random().toString(36).substring(2, 9),
      title: form.title,
      content: form.content,
      date: new Date().toISOString(),
      priority: form.priority,
      target: form.target,
      author: currentUser?.name || 'الإدارة'
    };
    setAnnouncements([newAnnouncement, ...announcements]);
    setForm({ title: '', content: '', priority: 'عادي', target: 'الكل' });
    alert('تم نشر التعميم بنجاح!');
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التعميم؟')) {
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'عاجل': return '#ef4444'; // Red
      case 'إعلامي': return '#3b82f6'; // Blue
      default: return '#10b981'; // Green
    }
  };

  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 8px', color: 'var(--primary-color)' }}>📢 لوحة التعاميم والإعلانات</h1>
          <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)' }}>
            <span style={{ fontSize: 20 }}>⟵</span> العودة للوحة التحكم
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 24 }}>
        {/* Form Section */}
        <div className="card" style={{ padding: 24, borderRadius: 16, background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)' }}>📝 كتابة تعميم جديد</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>العنوان</label>
              <input 
                type="text" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'Cairo' }}
                placeholder="مثال: موعد اختبارات الفترة الأولى..."
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>المستهدفون</label>
              <select 
                value={form.target} 
                onChange={e => setForm({...form, target: e.target.value as any})} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'Cairo' }}
              >
                <option value="الكل">الجميع (معلمون وأولياء أمور)</option>
                <option value="المعلمين">المعلمين فقط</option>
                <option value="أولياء الأمور">أولياء الأمور فقط</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>الأهمية</label>
              <select 
                value={form.priority} 
                onChange={e => setForm({...form, priority: e.target.value as any})} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'Cairo' }}
              >
                <option value="عادي">عادي</option>
                <option value="إعلامي">إعلامي</option>
                <option value="عاجل">عاجل 🚨</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>نص التعميم</label>
              <textarea 
                value={form.content} 
                onChange={e => setForm({...form, content: e.target.value})} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'Cairo', minHeight: 120, resize: 'vertical' }}
                placeholder="اكتب التفاصيل هنا..."
              />
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>
              نشر التعميم 🚀
            </button>
          </form>
        </div>

        {/* List Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>📋 التعاميم السابقة</h3>
          {announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-card)', borderRadius: 16, border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
              لا توجد تعاميم منشورة حالياً.
            </div>
          ) : (
            announcements.map(ann => (
              <div key={ann.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, border: '1px solid var(--border-color)', borderRight: `4px solid ${getPriorityColor(ann.priority)}`, boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
                <button onClick={() => handleDelete(ann.id)} style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }} title="حذف">🗑️</button>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ background: `${getPriorityColor(ann.priority)}20`, color: getPriorityColor(ann.priority), padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>{ann.priority}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>تستهدف: <strong>{ann.target}</strong></span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(ann.date).toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontSize: 18 }}>{ann.title}</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>نُشر بواسطة: {ann.author}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
