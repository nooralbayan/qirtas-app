import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Expense } from '../context/AppContext';

export default function Expenses({ onBack }: { onBack: () => void }) {
  const { expenses, setExpenses, recycleBin, setRecycleBin, schoolName, schoolLogo } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Expense>>({ description: '', category: 'أخرى', amount: 0, notes: '' });
  const [expenseToPrint, setExpenseToPrint] = useState<Expense | null>(null);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const handleSubmit = () => {
    if (!form.description || !form.amount || form.amount <= 0) return;
    const newExpense: Expense = {
      id: `EXP-${String(expenses.length + 1).padStart(4, '0')}`,
      description: form.description,
      category: form.category as Expense['category'],
      amount: form.amount,
      date: new Date().toISOString().split('T')[0],
      notes: form.notes || ''
    };
    setExpenses([newExpense, ...expenses]);
    setShowModal(false);
    handlePrint(newExpense);
  };

  const handlePrint = (expense: Expense) => {
    setExpenseToPrint(expense);
    setTimeout(() => {
      window.print();
      setExpenseToPrint(null);
    }, 500);
  };

  const handleDelete = (expense: Expense) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السند؟ سيتم نقله إلى سلة المحذوفات.')) {
      setExpenses(expenses.filter(e => e.id !== expense.id));
      setRecycleBin([
        ...recycleBin,
        { id: expense.id, type: 'expense', deletedAt: new Date().toISOString(), data: expense }
      ]);
    }
  };

  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* ─── PRINTABLE VOUCHER LAYOUT ─── */}
      {expenseToPrint && (
        <div className="print-only" style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'var(--bg-card)', zIndex: 9999, padding: '40px', boxSizing: 'border-box', direction: 'rtl'
        }}>
          <div style={{ border: '2px solid #000', padding: 30, borderRadius: 12, maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <h1 style={{ margin: '0 0 10px', fontSize: 28 }}>{schoolName}</h1>
                <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>سند صرف مالي (Payment Voucher)</h3>
              </div>
              <div>
                {schoolLogo.startsWith('data:image') ? (
                  <img src={schoolLogo} alt="Logo" style={{ height: 80 }} />
                ) : (
                  <div style={{ fontSize: 40 }}>{schoolLogo}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 18, marginBottom: 30 }}>
              <div><strong>رقم السند:</strong> {expenseToPrint.id}</div>
              <div><strong>التاريخ:</strong> {expenseToPrint.date}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>يُصرف للسيد/ة (أو الجهة):</strong> ........................................</div>
              <div style={{ gridColumn: '1 / -1', fontSize: 22, marginTop: 10 }}>
                <strong>مبلغاً وقدره:</strong> {expenseToPrint.amount} د.ل 
              </div>
              <div style={{ gridColumn: '1 / -1' }}><strong>وذلك لقاء:</strong> {expenseToPrint.description} (فئة: {expenseToPrint.category})</div>
              {expenseToPrint.notes && <div style={{ gridColumn: '1 / -1' }}><strong>ملاحظات:</strong> {expenseToPrint.notes}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 60, paddingTop: 20, borderTop: '1px solid #ccc' }}>
              <div style={{ textAlign: 'center' }}>
                <strong>توقيع المستلم</strong>
                <div style={{ marginTop: 40, borderBottom: '1px dotted #000', width: 200 }}></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong>توقيع المدير / المحاسب</strong>
                <div style={{ marginTop: 40, borderBottom: '1px dotted #000', width: 200 }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── NORMAL SCREEN CONTENT ─── */}
      <div className="no-print">
        <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
          <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
        </button>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, borderLeft: '4px solid #ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>إجمالي المصروفات (خارج من الخزينة)</h3>
              <h2 style={{ margin: 0, fontSize: 32, color: '#ef4444' }}>{totalExpenses} <span style={{ fontSize: 16 }}>د.ل</span></h2>
            </div>
            <div style={{ fontSize: 40, opacity: 0.5 }}>📉</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#0056b3' }}>سجل المصروفات</h2>
            <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
              - إضافة مصروف جديد (سند صرف)
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: 'var(--text-primary)', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: 12, fontWeight: 'bold' }}>رقم السند</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>البيان / الوصف</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>الفئة</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>المبلغ</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>التاريخ</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{e.id}</td>
                  <td style={{ padding: 12 }}>{e.description}</td>
                  <td style={{ padding: 12 }}>
                     <span style={{ backgroundColor: 'var(--bg-primary)', color: '#475569', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>{e.category}</span>
                  </td>
                  <td style={{ padding: 12, color: '#ef4444', fontWeight: 'bold' }}>{e.amount} د.ل</td>
                  <td style={{ padding: 12 }}>{e.date}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handlePrint(e)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>🖨️ طباعة</button>
                      <button onClick={() => handleDelete(e)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>🗑️ حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد مصروفات مسجلة</td></tr>}
            </tbody>
          </table>
        </div>

        {/* ─── MODAL ─── */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: 32, borderRadius: 12, width: 500, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ marginTop: 0, color: '#ef4444', marginBottom: 24 }}>إصدار سند صرف جديد</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>البيان / الوصف</label>
                  <input placeholder="مثال: شراء طابعات جديدة..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={inputStyle} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>الفئة</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value as Expense['category']})} style={inputStyle}>
                    <option value="إيجار">إيجار</option>
                    <option value="صيانة">صيانة</option>
                    <option value="رواتب">رواتب / سلف</option>
                    <option value="فواتير">فواتير (كهرباء، إنترنت..)</option>
                    <option value="أخرى">أخرى / نثريات</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>المبلغ (د.ل)</label>
                  <input type="number" placeholder="أدخل المبلغ" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} style={inputStyle} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>ملاحظات (اختياري)</label>
                  <input placeholder="أي ملاحظات إضافية..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button onClick={handleSubmit} disabled={!form.description || (form.amount || 0) <= 0} style={{ backgroundColor: (!form.description || (form.amount || 0) <= 0) ? '#94a3b8' : '#ef4444', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: (!form.description || (form.amount || 0) <= 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 16 }}>
                  إصدار وطباعة السند
                </button>
                <button onClick={() => setShowModal(false)} style={{ backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: 15, fontFamily: 'Cairo, sans-serif' };
