import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { RecycleBinItem } from '../context/AppContext';

export default function RecycleBin({ onBack }: { onBack: () => void }) {
  const { recycleBin, setRecycleBin, students, setStudents, receipts, setReceipts, expenses, setExpenses } = useAppContext();
  
  const [filterType, setFilterType] = useState<'all' | 'student' | 'receipt' | 'expense'>('all');

  const now = new Date();
  
  // Filter out items older than 30 days and clean up automatically
  const validItems = recycleBin.filter(item => {
    const deletedDate = new Date(item.deletedAt);
    const diffTime = Math.abs(now.getTime() - deletedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 30;
  });

  const displayItems = filterType === 'all' ? validItems : validItems.filter(i => i.type === filterType);

  const handleRestore = (item: RecycleBinItem) => {
    if (item.type === 'student') {
      setStudents([...students, item.data]);
    } else if (item.type === 'receipt') {
      setReceipts([...receipts, item.data]);
    } else if (item.type === 'expense') {
      setExpenses([...expenses, item.data]);
    }
    setRecycleBin(recycleBin.filter(r => r.id !== item.id));
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setRecycleBin(recycleBin.filter(r => r.id !== id));
    }
  };

  const getTypeLabel = (type: string) => {
    if (type === 'student') return 'طالب';
    if (type === 'receipt') return 'سند قبض';
    if (type === 'expense') return 'سند صرف';
    return type;
  };

  const getItemPreview = (item: RecycleBinItem) => {
    if (item.type === 'student') return `اسم الطالب: ${item.data.name} | الصف: ${item.data.grade}`;
    if (item.type === 'receipt') return `السند: ${item.data.id} | الطالب: ${item.data.studentName} | المبلغ: ${item.data.paidAmount} د.ل`;
    if (item.type === 'expense') return `السند: ${item.data.id} | البيان: ${item.data.description} | المبلغ: ${item.data.amount} د.ل`;
    return '';
  };

  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
        <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
      </button>

      <div style={{ backgroundColor: 'var(--bg-card)', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#ef4444' }}>سلة المحذوفات (تحتفظ بالبيانات لمدة 30 يوم)</h2>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16 }}>
            <option value="all">الكل</option>
            <option value="student">الطلاب</option>
            <option value="receipt">سندات القبض</option>
            <option value="expense">سندات الصرف</option>
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', color: 'var(--text-primary)', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: 12, fontWeight: 'bold' }}>النوع</th>
              <th style={{ padding: 12, fontWeight: 'bold' }}>التفاصيل</th>
              <th style={{ padding: 12, fontWeight: 'bold' }}>تاريخ الحذف</th>
              <th style={{ padding: 12, fontWeight: 'bold' }}>الأيام المتبقية</th>
              <th style={{ padding: 12, fontWeight: 'bold' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map(item => {
              const deletedDate = new Date(item.deletedAt);
              const diffTime = Math.abs(now.getTime() - deletedDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              const daysLeft = 30 - diffDays;

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{getTypeLabel(item.type)}</td>
                  <td style={{ padding: 12 }}>{getItemPreview(item)}</td>
                  <td style={{ padding: 12 }}>{new Date(item.deletedAt).toLocaleDateString('ar-LY')}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ color: daysLeft <= 5 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{daysLeft} يوم</span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleRestore(item)} style={{ backgroundColor: '#ecfdf5', color: '#10b981', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>🔄 استرجاع</button>
                      <button onClick={() => handlePermanentDelete(item.id)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>❌ حذف نهائي</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {displayItems.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>السلة فارغة</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
