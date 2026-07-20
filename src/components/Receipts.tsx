import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Receipt } from '../context/AppContext';
import { generateReceiptPDFBase64 } from './pdfGenerator';

export default function Receipts({ onBack }: { onBack: () => void }) {
  const { receipts, setReceipts, students, withdrawnStudents, recycleBin, setRecycleBin, schoolName, schoolLogo, gradeFees } = useAppContext();
  const withdrawnStudentIds = new Set((withdrawnStudents || []).map(w => w.studentId));
  const [showModal, setShowModal] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ studentName: '', studentId: 0, grade: '', paidAmount: 0, paymentMethod: 'نقدي' as Receipt['paymentMethod'], date: today });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSendingWaId, setIsSendingWaId] = useState<string | null>(null);
  
  // For printing
  const [receiptToPrint, setReceiptToPrint] = useState<Receipt | null>(null);

  const totalCollected = receipts.reduce((acc, r) => acc + r.paidAmount, 0);
  const totalRemaining = receipts.reduce((acc, r) => acc + r.remaining, 0);

  // Autocomplete logic
  const filteredStudents = students.filter(s => s.name.includes(searchQuery));

  const selectStudent = (s: typeof students[0]) => {
    setSearchQuery(s.name);
    setForm({ ...form, studentName: s.name, studentId: s.id, grade: s.grade });
    setShowSuggestions(false);
  };

  const handleSubmit = () => {
    if (!form.studentName || form.paidAmount <= 0) return;
    
    // Find student to get total due
    const student = students.find(s => s.id === form.studentId);
    if (!student) return;

    // Always use the current grade fees (dynamic), fallback to stored totalFees
    const currentTotalFees = gradeFees[student.grade] || student.totalFees || 0;

    // Calculate previous payments for this student
    const prevPayments = receipts.filter(r => r.studentId === student.id).reduce((acc, r) => acc + r.paidAmount, 0);
    const newRemaining = currentTotalFees - prevPayments - form.paidAmount;

    const newReceipt: Receipt = {
      id: `REC-${String(receipts.length + 1).padStart(4, '0')}`,
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      installmentNo: receipts.filter(r => r.studentId === student.id).length + 1,
      totalDue: currentTotalFees,
      paidAmount: form.paidAmount,
      remaining: newRemaining < 0 ? 0 : newRemaining,
      paymentMethod: form.paymentMethod,
      date: form.date || new Date().toISOString().split('T')[0]
    };
    
    setReceipts([newReceipt, ...receipts]);
    setShowModal(false);
    
    // Trigger print
    handlePrint(newReceipt);
  };

  const handlePrint = (receipt: Receipt) => {
    setReceiptToPrint(receipt);
    setTimeout(() => {
      window.print();
      setReceiptToPrint(null); // Clear after print dialog closes
    }, 500);
  };

  const handleDelete = (receipt: Receipt) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السند؟ سيتم نقله إلى سلة المحذوفات.')) {
      setReceipts(receipts.filter(r => r.id !== receipt.id));
      setRecycleBin([
        ...recycleBin,
        { id: receipt.id, type: 'receipt', deletedAt: new Date().toISOString(), data: receipt }
      ]);
    }
  };

  const sendReceiptWhatsApp = async (receipt: Receipt) => {
    const student = students.find(s => s.id === receipt.studentId);
    if (!student || !student.fatherPhone) {
      alert('لا يوجد رقم هاتف مسجل لولي أمر هذا الطالب.');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من إرسال الإيصال كملف PDF عبر الواتساب؟`)) return;

    setIsSendingWaId(receipt.id);

    try {
      const pdfBase64 = await generateReceiptPDFBase64(receipt, student, schoolName, schoolLogo);
      
      let phone = student.fatherPhone.replace(/\s+/g, '').replace(/-/g, '');
      if (phone.startsWith('0')) phone = '218' + phone.slice(1);
      if (!phone.startsWith('+')) phone = '+' + phone;

      const studentLabel = student.gender === 'أنثى' ? 'الطالبة' : 'الطالب';
      const caption = `السلام عليكم ورحمة الله\n\n${schoolName}\nنرفق لكم إيصال دفع لـ${studentLabel}: ${student.name}\nقيمة الدفعة: ${receipt.paidAmount} د.ل\nالمتبقي من الرسوم: ${receipt.remaining} د.ل\n\nنشكر لكم تعاونكم 🌸`;

      const res = await fetch('/api/wa-send-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pdfBase64, fileName: `ايصال_${receipt.id}.pdf`, caption })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('تم الإرسال بنجاح!');
      } else {
        alert(data.error || 'فشل في إرسال الإيصال.');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إنشاء أو إرسال الإيصال.');
    } finally {
      setIsSendingWaId(null);
    }
  };

  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* ─── PRINTABLE RECEIPT LAYOUT ─── */}
      {receiptToPrint && (
        <div className="print-only" style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'var(--bg-card)', zIndex: 9999, padding: '40px', boxSizing: 'border-box', direction: 'rtl'
        }}>
          <div style={{ border: '2px solid #000', padding: 30, borderRadius: 12, maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <h1 style={{ margin: '0 0 10px', fontSize: 28 }}>{schoolName}</h1>
                <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>سند قبض مالي (Receipt)</h3>
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
              <div><strong>رقم السند:</strong> {receiptToPrint.id}</div>
              <div><strong>التاريخ:</strong> {receiptToPrint.date}</div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>استلمت من السيد:</strong> {(() => { const st = students.find(s => s.id === receiptToPrint.studentId); return st ? st.fatherName : '---'; })()}
                {' '}<strong>ولي أمر الطالب/ة:</strong> {receiptToPrint.studentName}
              </div>
              <div><strong>الصف الدراسي:</strong> {receiptToPrint.grade}</div>
              <div><strong>الدفعة رقم:</strong> {receiptToPrint.installmentNo}</div>
              <div style={{ gridColumn: '1 / -1', fontSize: 22, marginTop: 10 }}>
                <strong>مبلغاً وقدره:</strong> {receiptToPrint.paidAmount} د.ل
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>طريقة الدفع:</strong>{' '}
                <span style={{ border: '1px solid #000', padding: '4px 16px', borderRadius: 6, fontWeight: 'bold' }}>{receiptToPrint.paymentMethod}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}><strong>المتبقي من الرسوم:</strong> {receiptToPrint.remaining} د.ل</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 60, paddingTop: 20, borderTop: '1px solid #ccc' }}>
              <div style={{ textAlign: 'center' }}>
                <strong>توقيع المحاسب</strong>
                <div style={{ marginTop: 40, borderBottom: '1px dotted #000', width: 200 }}></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong>الختم المعتمد</strong>
                <div style={{ marginTop: 40, width: 200, height: 80, border: '1px dashed #ccc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>مكان الختم</div>
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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, borderLeft: '4px solid #10b981', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>إجمالي المحصل</h3>
            <h2 style={{ margin: 0, fontSize: 28 }}>{totalCollected} <span style={{ fontSize: 16 }}>د.ل</span></h2>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, borderLeft: '4px solid #ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>إجمالي المتبقي (الديون)</h3>
            <h2 style={{ margin: 0, fontSize: 28 }}>{totalRemaining} <span style={{ fontSize: 16 }}>د.ل</span></h2>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, borderLeft: '4px solid #3b82f6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>عدد السندات</h3>
            <h2 style={{ margin: 0, fontSize: 28 }}>{receipts.length}</h2>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#0056b3' }}>سندات القبض</h2>
            <button onClick={() => {
              setForm({ studentName: '', studentId: 0, grade: '', paidAmount: 0, paymentMethod: 'نقدي', date: new Date().toISOString().split('T')[0] });
              setSearchQuery('');
              setShowModal(true);
            }} style={{ backgroundColor: '#0056b3', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
              + تسجيل سداد قسط
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: 'var(--text-primary)', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: 12, fontWeight: 'bold' }}>رقم السند</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>اسم الطالب</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>الصف</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>المبلغ المدفوع</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>طريقة الدفع</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>المتبقي عليه</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>التاريخ</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee', backgroundColor: withdrawnStudentIds.has(r.studentId) ? '#fffbeb' : 'transparent' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>
                    {r.studentName}
                    {withdrawnStudentIds.has(r.studentId) && (
                      <span style={{ marginRight: 8, backgroundColor: '#f59e0b', color: '#fff', fontSize: 11, padding: '2px 7px', borderRadius: 10, fontWeight: 'bold', verticalAlign: 'middle' }}>⚠️ منسحب</span>
                    )}
                  </td>
                  <td style={{ padding: 12 }}>{r.grade}</td>
                  <td style={{ padding: 12, color: '#10b981', fontWeight: 'bold' }}>{r.paidAmount} د.ل</td>
                  <td style={{ padding: 12 }}>
                     <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>{r.paymentMethod}</span>
                  </td>
                  <td style={{ padding: 12, color: r.remaining > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{r.remaining} د.ل</td>
                  <td style={{ padding: 12 }}>{r.date}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => sendReceiptWhatsApp(r)} disabled={isSendingWaId === r.id} style={{ backgroundColor: '#ecfdf5', border: '1px solid #10b981', color: '#047857', padding: '6px 12px', borderRadius: 6, cursor: isSendingWaId === r.id ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                        {isSendingWaId === r.id ? '⏳ جاري...' : '📱 واتساب'}
                      </button>
                      <button onClick={() => handlePrint(r)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>🖨️ طباعة</button>
                      <button onClick={() => handleDelete(r)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>🗑️ حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── MODAL ─── */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: 32, borderRadius: 12, width: 500, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ marginTop: 0, color: '#0056b3', marginBottom: 24 }}>تسجيل سداد قسط مالي</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Autocomplete Input */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>ابحث عن اسم الطالب</label>
                  <input 
                    placeholder="اكتب جزء من اسم الطالب..." 
                    value={searchQuery} 
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                      if (form.studentName !== e.target.value) setForm({...form, studentName: '', studentId: 0});
                    }} 
                    onFocus={() => setShowSuggestions(true)}
                    style={inputStyle} 
                  />
                  
                  {showSuggestions && searchQuery && !form.studentName && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--bg-card)', border: '1px solid #ddd', borderRadius: 8, marginTop: 4, maxHeight: 200, overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map(s => (
                          <div 
                            key={s.id} 
                            onClick={() => selectStudent(s)}
                            style={{ padding: '10px 14px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                          >
                            <span style={{ fontWeight: 'bold' }}>{s.name}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.grade}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>لا توجد نتائج مطابقة</div>
                      )}
                    </div>
                  )}
                </div>

                {form.studentName && (
                  <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', color: '#0f172a' }}>
                    ✅ تم اختيار: <strong>{form.studentName}</strong> ({form.grade})<br/>
                    {(() => {
                      const st = students.find(s => s.id === form.studentId);
                      if (!st) return null;
                      const currentFees = gradeFees[st.grade] || st.totalFees || 0;
                      const installmentSize = currentFees / (st.installmentsCount || 2);
                      return <span style={{ color: '#0056b3', fontSize: 14 }}>💡 قيمة القسط الواحد: {installmentSize.toFixed(2)} د.ل (بناءً على التقسيم إلى {st.installmentsCount || 2} أقساط)</span>;
                    })()}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>المبلغ المدفوع (د.ل)</label>
                  <input type="number" placeholder="أدخل المبلغ" value={form.paidAmount || ''} onChange={e => setForm({...form, paidAmount: Number(e.target.value)})} style={inputStyle} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>طريقة الدفع</label>
                  <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value as Receipt['paymentMethod']})} style={inputStyle}>
                    <option value="نقدي">نقدي (Cash)</option>
                    <option value="بطاقة مصرفية">بطاقة مصرفية (Card)</option>
                    <option value="حوالة مصرفية">حوالة مصرفية (Bank Transfer)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>تاريخ السداد</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button onClick={handleSubmit} disabled={!form.studentName || form.paidAmount <= 0} style={{ backgroundColor: (!form.studentName || form.paidAmount <= 0) ? '#94a3b8' : '#0056b3', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: (!form.studentName || form.paidAmount <= 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 16 }}>
                  حفظ وطباعة السند
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
