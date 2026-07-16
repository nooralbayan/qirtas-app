import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Receipt } from '../context/AppContext';
import { generateReceiptPDFBase64 } from './pdfGenerator';

export default function Receipts({ onBack }: { onBack: () => void }) {
  const { receipts, setReceipts, students, recycleBin, setRecycleBin, schoolName, schoolLogo } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentName: '', studentId: 0, grade: '', paidAmount: 0, paymentMethod: 'ظ†ظ‚ط¯ظٹ' as Receipt['paymentMethod'] });
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

    // Calculate previous payments for this student
    const prevPayments = receipts.filter(r => r.studentId === student.id).reduce((acc, r) => acc + r.paidAmount, 0);
    const newRemaining = student.totalFees - prevPayments - form.paidAmount;

    const newReceipt: Receipt = {
      id: `REC-${String(receipts.length + 1).padStart(4, '0')}`,
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      installmentNo: receipts.filter(r => r.studentId === student.id).length + 1,
      totalDue: student.totalFees,
      paidAmount: form.paidAmount,
      remaining: newRemaining < 0 ? 0 : newRemaining,
      paymentMethod: form.paymentMethod,
      date: new Date().toISOString().split('T')[0]
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
    if (window.confirm('ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ط³ظ†ط¯طں ط³ظٹطھظ… ظ†ظ‚ظ„ظ‡ ط¥ظ„ظ‰ ط³ظ„ط© ط§ظ„ظ…ط­ط°ظˆظپط§طھ.')) {
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
      alert('ظ„ط§ ظٹظˆط¬ط¯ ط±ظ‚ظ… ظ‡ط§طھظپ ظ…ط³ط¬ظ„ ظ„ظˆظ„ظٹ ط£ظ…ط± ظ‡ط°ط§ ط§ظ„ط·ط§ظ„ط¨.');
      return;
    }

    if (!window.confirm(`ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط¥ط±ط³ط§ظ„ ط§ظ„ط¥ظٹطµط§ظ„ ظƒظ…ظ„ظپ PDF ط¹ط¨ط± ط§ظ„ظˆط§طھط³ط§ط¨طں`)) return;

    setIsSendingWaId(receipt.id);

    try {
      const pdfBase64 = await generateReceiptPDFBase64(receipt, student, schoolName, schoolLogo);
      
      let phone = student.fatherPhone.replace(/\s+/g, '').replace(/-/g, '');
      if (phone.startsWith('0')) phone = '218' + phone.slice(1);
      if (!phone.startsWith('+')) phone = '+' + phone;

      const studentLabel = student.gender === 'ط£ظ†ط«ظ‰' ? 'ط§ظ„ط·ط§ظ„ط¨ط©' : 'ط§ظ„ط·ط§ظ„ط¨';
      const caption = `ط§ظ„ط³ظ„ط§ظ… ط¹ظ„ظٹظƒظ… ظˆط±ط­ظ…ط© ط§ظ„ظ„ظ‡\n\n${schoolName}\nظ†ط±ظپظ‚ ظ„ظƒظ… ط¥ظٹطµط§ظ„ ط¯ظپط¹ ظ„ظ€${studentLabel}: ${student.name}\nظ‚ظٹظ…ط© ط§ظ„ط¯ظپط¹ط©: ${receipt.paidAmount} ط¯.ظ„\nط§ظ„ظ…طھط¨ظ‚ظٹ ظ…ظ† ط§ظ„ط±ط³ظˆظ…: ${receipt.remaining} ط¯.ظ„\n\nظ†ط´ظƒط± ظ„ظƒظ… طھط¹ط§ظˆظ†ظƒظ… ًںŒ¸`;

      const res = await fetch('/api/wa-send-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pdfBase64, fileName: `ط§ظٹطµط§ظ„_${receipt.id}.pdf`, caption })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('طھظ… ط§ظ„ط¥ط±ط³ط§ظ„ ط¨ظ†ط¬ط§ط­!');
      } else {
        alert(data.error || 'ظپط´ظ„ ظپظٹ ط¥ط±ط³ط§ظ„ ط§ظ„ط¥ظٹطµط§ظ„.');
      }
    } catch (e) {
      console.error(e);
      alert('ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط¥ظ†ط´ط§ط، ط£ظˆ ط¥ط±ط³ط§ظ„ ط§ظ„ط¥ظٹطµط§ظ„.');
    } finally {
      setIsSendingWaId(null);
    }
  };

  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* â”€â”€â”€ PRINTABLE RECEIPT LAYOUT â”€â”€â”€ */}
      {receiptToPrint && (
        <div className="print-only" style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'var(--bg-card)', zIndex: 9999, padding: '40px', boxSizing: 'border-box', direction: 'rtl'
        }}>
          <div style={{ border: '2px solid #000', padding: 30, borderRadius: 12, maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <h1 style={{ margin: '0 0 10px', fontSize: 28 }}>{schoolName}</h1>
                <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>ط³ظ†ط¯ ظ‚ط¨ط¶ ظ…ط§ظ„ظٹ (Receipt)</h3>
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
              <div><strong>ط±ظ‚ظ… ط§ظ„ط³ظ†ط¯:</strong> {receiptToPrint.id}</div>
              <div><strong>ط§ظ„طھط§ط±ظٹط®:</strong> {receiptToPrint.date}</div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>ط§ط³طھظ„ظ…طھ ظ…ظ† ط§ظ„ط³ظٹط¯:</strong> {(() => { const st = students.find(s => s.id === receiptToPrint.studentId); return st ? st.fatherName : '---'; })()}
                {' '}<strong>ظˆظ„ظٹ ط£ظ…ط± ط§ظ„ط·ط§ظ„ط¨/ط©:</strong> {receiptToPrint.studentName}
              </div>
              <div><strong>ط§ظ„طµظپ ط§ظ„ط¯ط±ط§ط³ظٹ:</strong> {receiptToPrint.grade}</div>
              <div><strong>ط§ظ„ط¯ظپط¹ط© ط±ظ‚ظ…:</strong> {receiptToPrint.installmentNo}</div>
              <div style={{ gridColumn: '1 / -1', fontSize: 22, marginTop: 10 }}>
                <strong>ظ…ط¨ظ„ط؛ط§ظ‹ ظˆظ‚ط¯ط±ظ‡:</strong> {receiptToPrint.paidAmount} ط¯.ظ„
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>ط·ط±ظٹظ‚ط© ط§ظ„ط¯ظپط¹:</strong>{' '}
                <span style={{ border: '1px solid #000', padding: '4px 16px', borderRadius: 6, fontWeight: 'bold' }}>{receiptToPrint.paymentMethod}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}><strong>ط§ظ„ظ…طھط¨ظ‚ظٹ ظ…ظ† ط§ظ„ط±ط³ظˆظ…:</strong> {receiptToPrint.remaining} ط¯.ظ„</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 60, paddingTop: 20, borderTop: '1px solid #ccc' }}>
              <div style={{ textAlign: 'center' }}>
                <strong>طھظˆظ‚ظٹط¹ ط§ظ„ظ…ط­ط§ط³ط¨</strong>
                <div style={{ marginTop: 40, borderBottom: '1px dotted #000', width: 200 }}></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong>ط§ظ„ط®طھظ… ط§ظ„ظ…ط¹طھظ…ط¯</strong>
                <div style={{ marginTop: 40, width: 200, height: 80, border: '1px dashed #ccc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>ظ…ظƒط§ظ† ط§ظ„ط®طھظ…</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ NORMAL SCREEN CONTENT â”€â”€â”€ */}
      <div className="no-print">
        <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
          <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>âںµ</span> ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…
        </button>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, borderLeft: '4px solid #10b981', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط­طµظ„</h3>
            <h2 style={{ margin: 0, fontSize: 28 }}>{totalCollected} <span style={{ fontSize: 16 }}>ط¯.ظ„</span></h2>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, borderLeft: '4px solid #ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…طھط¨ظ‚ظٹ (ط§ظ„ط¯ظٹظˆظ†)</h3>
            <h2 style={{ margin: 0, fontSize: 28 }}>{totalRemaining} <span style={{ fontSize: 16 }}>ط¯.ظ„</span></h2>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, borderLeft: '4px solid #3b82f6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>ط¹ط¯ط¯ ط§ظ„ط³ظ†ط¯ط§طھ</h3>
            <h2 style={{ margin: 0, fontSize: 28 }}>{receipts.length}</h2>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#0056b3' }}>ط³ظ†ط¯ط§طھ ط§ظ„ظ‚ط¨ط¶</h2>
            <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#0056b3', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
              + طھط³ط¬ظٹظ„ ط³ط¯ط§ط¯ ظ‚ط³ط·
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: 'var(--text-primary)', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: 12, fontWeight: 'bold' }}>ط±ظ‚ظ… ط§ظ„ط³ظ†ط¯</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>ط§ط³ظ… ط§ظ„ط·ط§ظ„ط¨</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>ط§ظ„طµظپ</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط¯ظپظˆط¹</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>ط·ط±ظٹظ‚ط© ط§ظ„ط¯ظپط¹</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>ط§ظ„ظ…طھط¨ظ‚ظٹ ط¹ظ„ظٹظ‡</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>ط§ظ„طھط§ط±ظٹط®</th>
                <th style={{ padding: 12, fontWeight: 'bold' }}>ط¥ط¬ط±ط§ط،ط§طھ</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.studentName}</td>
                  <td style={{ padding: 12 }}>{r.grade}</td>
                  <td style={{ padding: 12, color: '#10b981', fontWeight: 'bold' }}>{r.paidAmount} ط¯.ظ„</td>
                  <td style={{ padding: 12 }}>
                     <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>{r.paymentMethod}</span>
                  </td>
                  <td style={{ padding: 12, color: r.remaining > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{r.remaining} ط¯.ظ„</td>
                  <td style={{ padding: 12 }}>{r.date}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => sendReceiptWhatsApp(r)} disabled={isSendingWaId === r.id} style={{ backgroundColor: '#ecfdf5', border: '1px solid #10b981', color: '#047857', padding: '6px 12px', borderRadius: 6, cursor: isSendingWaId === r.id ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                        {isSendingWaId === r.id ? 'âڈ³ ط¬ط§ط±ظٹ...' : 'ًں“± ظˆط§طھط³ط§ط¨'}
                      </button>
                      <button onClick={() => handlePrint(r)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>ًں–¨ï¸ڈ ط·ط¨ط§ط¹ط©</button>
                      <button onClick={() => handleDelete(r)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>ًں—‘ï¸ڈ ط­ط°ظپ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* â”€â”€â”€ MODAL â”€â”€â”€ */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: 32, borderRadius: 12, width: 500, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ marginTop: 0, color: '#0056b3', marginBottom: 24 }}>طھط³ط¬ظٹظ„ ط³ط¯ط§ط¯ ظ‚ط³ط· ظ…ط§ظ„ظٹ</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Autocomplete Input */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>ط§ط¨ط­ط« ط¹ظ† ط§ط³ظ… ط§ظ„ط·ط§ظ„ط¨</label>
                  <input 
                    placeholder="ط§ظƒطھط¨ ط¬ط²ط، ظ…ظ† ط§ط³ظ… ط§ظ„ط·ط§ظ„ط¨..." 
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
                        <div style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ ظ…ط·ط§ط¨ظ‚ط©</div>
                      )}
                    </div>
                  )}
                </div>

                {form.studentName && (
                  <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', color: '#0f172a' }}>
                    âœ… طھظ… ط§ط®طھظٹط§ط±: <strong>{form.studentName}</strong> ({form.grade})<br/>
                    {(() => {
                      const st = students.find(s => s.id === form.studentId);
                      if (!st) return null;
                      const installmentSize = st.totalFees / (st.installmentsCount || 2);
                      return <span style={{ color: '#0056b3', fontSize: 14 }}>ًں’، ظ‚ظٹظ…ط© ط§ظ„ظ‚ط³ط· ط§ظ„ظˆط§ط­ط¯: {installmentSize.toFixed(2)} ط¯.ظ„ (ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ط§ظ„طھظ‚ط³ظٹظ… ط¥ظ„ظ‰ {st.installmentsCount || 2} ط£ظ‚ط³ط§ط·)</span>;
                    })()}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط¯ظپظˆط¹ (ط¯.ظ„)</label>
                  <input type="number" placeholder="ط£ط¯ط®ظ„ ط§ظ„ظ…ط¨ظ„ط؛" value={form.paidAmount || ''} onChange={e => setForm({...form, paidAmount: Number(e.target.value)})} style={inputStyle} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>ط·ط±ظٹظ‚ط© ط§ظ„ط¯ظپط¹</label>
                  <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value as Receipt['paymentMethod']})} style={inputStyle}>
                    <option value="ظ†ظ‚ط¯ظٹ">ظ†ظ‚ط¯ظٹ (Cash)</option>
                    <option value="ط¨ط·ط§ظ‚ط© ظ…طµط±ظپظٹط©">ط¨ط·ط§ظ‚ط© ظ…طµط±ظپظٹط© (Card)</option>
                    <option value="ط­ظˆط§ظ„ط© ظ…طµط±ظپظٹط©">ط­ظˆط§ظ„ط© ظ…طµط±ظپظٹط© (Bank Transfer)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button onClick={handleSubmit} disabled={!form.studentName || form.paidAmount <= 0} style={{ backgroundColor: (!form.studentName || form.paidAmount <= 0) ? '#94a3b8' : '#0056b3', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: (!form.studentName || form.paidAmount <= 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 16 }}>
                  ط­ظپط¸ ظˆط·ط¨ط§ط¹ط© ط§ظ„ط³ظ†ط¯
                </button>
                <button onClick={() => setShowModal(false)} style={{ backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>
                  ط¥ظ„ط؛ط§ط،
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
