import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Student, Receipt } from '../context/AppContext';
import { generateReceiptPDFBase64 } from './pdfGenerator';

export default function FinancialHub({ onBack }: { onBack: () => void }) {
  const { students, setStudents, receipts, setReceipts, gradeFees, schoolName, schoolLogo, recycleBin, setRecycleBin, academicYear } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptForm, setReceiptForm] = useState({ paidAmount: 0, paymentMethod: 'نقدي' as Receipt['paymentMethod'], date: new Date().toISOString().split('T')[0] });
  
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountForm, setDiscountForm] = useState({ amount: 0, reason: '' });

  const selectedStudent = useMemo(() => {
    if (selectedStudentId) {
      return students.find(s => s.id === selectedStudentId) || null;
    }
    return null;
  }, [students, selectedStudentId]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const term = searchQuery.trim().toLowerCase();
    return students.filter(s => 
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.enrollmentNumber && s.enrollmentNumber.includes(term)) ||
      (s.nationalId && s.nationalId.includes(term)) ||
      (s.fatherPhone && s.fatherPhone.includes(term))
    ).slice(0, 10);
  }, [students, searchQuery]);

  // Derived financial data for the selected student
  const studentReceipts = useMemo(() => {
    return selectedStudent ? receipts.filter(r => r.studentId === selectedStudent.id) : [];
  }, [receipts, selectedStudent]);

  const paidAmount = studentReceipts.reduce((sum, r) => sum + r.paidAmount, 0);
  const discountAmount = selectedStudent?.discountAmount || 0;
  const netFees = Math.max(0, (selectedStudent?.totalFees || 0) - discountAmount);
  const remainingAmount = Math.max(0, netFees - paidAmount);
  const paymentStatusColor = remainingAmount <= 0 ? '#059669' : paidAmount > 0 ? '#f59e0b' : '#dc2626';

  const updateStudent = (updates: Partial<Student>) => {
    if (!selectedStudent) return;
    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, ...updates } : s));
  };

  const handleSaveDiscount = () => {
    if (discountForm.amount < 0) return;
    updateStudent({ discountAmount: discountForm.amount, discountReason: discountForm.reason });
    setShowDiscountModal(false);
  };

  const handleDeleteReceipt = (receipt: Receipt) => {
    if (!window.confirm(`هل أنت متأكد من حذف الإيصال رقم ${receipt.id}؟`)) return;
    setReceipts(receipts.filter(r => r.id !== receipt.id));
    setRecycleBin([
      ...recycleBin,
      { id: receipt.id, type: 'receipt', deletedAt: new Date().toISOString(), data: receipt }
    ]);
  };

  const getUniformStatus = () => {
    if (!selectedStudent) return 'default';
    const baseFee = gradeFees[selectedStudent.grade] || 0;
    if (baseFee === 0) return 'default';
    if (selectedStudent.totalFees < baseFee) return 'no_uniform';
    if (selectedStudent.totalFees > baseFee) return 'extra_uniform';
    return 'default';
  };

  const handleUniformChange = (status: string) => {
    if (!selectedStudent) return;
    const baseFee = gradeFees[selectedStudent.grade] || 0;
    if (baseFee === 0) return;
    
    if (status === 'no_uniform') updateStudent({ totalFees: Math.max(0, baseFee - 300) });
    else if (status === 'extra_uniform') updateStudent({ totalFees: baseFee + 400 });
    else updateStudent({ totalFees: baseFee });
  };

  const handleAddReceipt = () => {
    if (!selectedStudent || receiptForm.paidAmount <= 0) return;
    const newRemaining = netFees - paidAmount - receiptForm.paidAmount;
    
    const newReceipt: Receipt = {
      id: `REC-${String(receipts.length + 1).padStart(4, '0')}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      grade: selectedStudent.grade,
      installmentNo: studentReceipts.length + 1,
      totalDue: selectedStudent.totalFees,
      paidAmount: receiptForm.paidAmount,
      remaining: newRemaining < 0 ? 0 : newRemaining,
      paymentMethod: receiptForm.paymentMethod,
      date: receiptForm.date || new Date().toISOString().split('T')[0]
    };
    
    setReceipts([newReceipt, ...receipts]);
    setShowReceiptModal(false);
    setReceiptForm({ paidAmount: 0, paymentMethod: 'نقدي', date: new Date().toISOString().split('T')[0] });

    // Print immediately
    handlePrintReceipt(newReceipt);
  };

  const handleEditReceiptSubmit = () => {
    if (!editingReceipt || editingReceipt.paidAmount <= 0) return;
    const updatedReceipts = receipts.map(r => 
      r.id === editingReceipt.id ? editingReceipt : r
    );
    setReceipts(updatedReceipts);
    setEditingReceipt(null);
  };

  const handlePrintReceipt = (receipt: Receipt) => {
    if (!selectedStudent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const baseFee = gradeFees[selectedStudent.grade] || 0;
    let uniformText = " (الدفعة شاملة الزي المدرسي)";
    if (baseFee > 0) {
      if (selectedStudent.totalFees < baseFee) uniformText = " (غير شامل الزي المدرسي)";
      else if (selectedStudent.totalFees > baseFee) uniformText = " (شامل الزي + زي إضافي)";
    }

    const studentLabel = selectedStudent.gender === 'أنثى' ? 'الطالبة' : 'الطالب';
    const classRoomText = selectedStudent.classRoom ? ` - فصل ${selectedStudent.classRoom}` : '';
    const academicYearText = academicYear ? ` (${academicYear})` : '';
    
    const logoHtml = schoolLogo.startsWith('data:image') 
      ? `<img src="${schoolLogo}" alt="Logo" style="height:130px;" />` 
      : `<div style="font-size:40px;">${schoolLogo}</div>`;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <title>إيصال قبض - ${receipt.studentName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
          body { font-family: 'Cairo', sans-serif; background: #f8fafc; padding: 40px; direction: rtl; display: flex; flex-direction: column; align-items: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
          .no-print { margin-bottom: 20px; display: flex; gap: 15px; }
          .no-print button { padding: 12px 24px; font-size: 18px; font-weight: bold; border-radius: 8px; border: none; cursor: pointer; font-family: 'Cairo', sans-serif; transition: opacity 0.2s; }
          .no-print button:hover { opacity: 0.9; }
          .btn-print { background-color: #0284c7; color: white; box-shadow: 0 4px 6px rgba(2,132,199,0.2); }
          .btn-close { background-color: #ef4444; color: white; box-shadow: 0 4px 6px rgba(239,68,100,0.2); }
          
          .receipt { width: 800px; background: #fff; padding: 40px; border: 1px solid #cbd5e1; border-radius: 12px; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .receipt::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #0284c7, #2563eb, #0d9488); }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03; pointer-events: none; z-index: 0; width: 60%; display: flex; justify-content: center; }
          .watermark img { width: 100%; object-fit: contain; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; position: relative; z-index: 1; }
          .header-title h2 { margin: 0; color: #0f172a; font-size: 28px; font-weight: 900; }
          .header-title p { margin: 5px 0 0; color: #64748b; font-size: 15px; }
          .header-info { text-align: left; }
          .header-info .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 6px 20px; border-radius: 20px; font-weight: bold; font-size: 18px; margin-bottom: 8px; border: 1px solid #bfdbfe; }
          .header-info p { margin: 2px 0; color: #64748b; font-size: 15px; font-family: monospace; }
          .header-info strong { color: #0f172a; }
          .student-banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; }
          .student-text { font-size: 18px; color: #64748b; }
          .student-text strong { color: #0f172a; font-size: 20px; font-weight: 900; }
          .amount-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; position: relative; z-index: 1; }
          .amount-card { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
          .amount-card.rem { background: #fffbeb; border: 1px solid #fde68a; }
          .amount-title { color: #065f46; font-size: 18px; font-weight: bold; }
          .amount-title.rem { color: #92400e; }
          .amount-value { font-size: 26px; font-weight: 900; color: #059669; }
          .amount-value.rem { color: #d97706; }
          .details-text { font-size: 17px; color: #334155; position: relative; z-index: 1; line-height: 1.8; margin-bottom: 20px; }
          .note { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: bold; border: 1px solid #7dd3fc; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding: 0 20px; position: relative; z-index: 1; }
          .footer-sig { text-align: center; color: #64748b; font-size: 16px; font-weight: bold; }
          .footer-sig div { border-bottom: 1px solid #cbd5e1; width: 200px; margin-top: 40px; }
          .stamp { width: 100px; height: 100px; border: 2px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 16px; transform: rotate(-15deg); }
          @media print {
            body { background: #fff; padding: 0; display: block; }
            .no-print { display: none !important; }
            .receipt { border: none; box-shadow: none; width: 100%; padding: 0; margin-top: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">🖨️ طباعة الإيصال</button>
          <button class="btn-close" onclick="window.close()">❌ إغلاق</button>
        </div>
        <div class="receipt">
          <div class="watermark">
            ${logoHtml}
          </div>
          
          <div class="header">
            <div class="header-title">
              <h2>مدرسة نور البيان</h2>
              <p>إيصال وسند قبض مالي</p>
            </div>
            <div style="text-align: center;">
              ${logoHtml}
            </div>
            <div class="header-info">
              <div class="badge">سند قبض</div>
              <p>رقم السند: <strong>${receipt.id.toString().padStart(5, '0')}</strong></p>
              <p>التاريخ: <strong>${receipt.date}</strong></p>
            </div>
          </div>

          <div class="student-banner">
            <div class="student-text">
              استلمنا من السيد ولي أمر ${studentLabel}: <strong>${receipt.studentName}</strong>
              <span style="color: #0284c7; font-size: 16px; margin-right: 10px;">(${receipt.grade}${classRoomText})${academicYearText}</span>
            </div>
          </div>

          <div class="amount-grid">
            <div class="amount-card">
              <span class="amount-title">الدفعة الحالية المستلمة:</span>
              <span class="amount-value">${receipt.paidAmount} د.ل</span>
            </div>
            <div class="amount-card rem">
              <span class="amount-title rem">المتبقي المستحق:</span>
              <span class="amount-value rem">${receipt.remaining} د.ل</span>
            </div>
          </div>

          <div class="details-text">
            <strong>طريقة الدفع:</strong> ${receipt.paymentMethod}<br/>
            <strong>التفاصيل:</strong> مبلغ وقدره ${receipt.paidAmount} دينار ليبي فقط لا غير، وذلك عن القسط رقم (${receipt.installmentNo}).
            ${selectedStudent.discountAmount > 0 ? `<br/><strong>الخصم الممنوح:</strong> ${selectedStudent.discountAmount} د.ل ${selectedStudent.discountReason ? `— السبب: ${selectedStudent.discountReason}` : ''}` : ''}
          </div>

          <div class="note">
            ملاحظة: ${uniformText}
          </div>

          <div class="footer">
            <div class="footer-sig">
              توقيع المحاسب / المستلم
              <div></div>
            </div>
            <div class="stamp">ختم المدرسة</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const sendReceiptWhatsApp = async (receipt: Receipt) => {
    if (!selectedStudent) return;
    const targetPhone = selectedStudent.whatsappPhone || selectedStudent.fatherPhone;
    if (!targetPhone) {
      alert('لا يوجد رقم هاتف مسجل لولي أمر هذا الطالب.');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من إرسال الإيصال كملف PDF عبر الواتساب؟`)) return;

    try {
      const baseFee = gradeFees[selectedStudent.grade] || 0;
      const pdfBase64 = await generateReceiptPDFBase64(receipt, selectedStudent, schoolName, schoolLogo, baseFee);
      let phone = targetPhone.replace(/\s+/g, '').replace(/-/g, '');
      if (phone.startsWith('0')) phone = '218' + phone.slice(1);
      if (!phone.startsWith('+')) phone = '+' + phone;

      const studentLabel = selectedStudent.gender === 'أنثى' ? 'الطالبة' : 'الطالب';
      const caption = `السلام عليكم ورحمة الله\n\n${schoolName}\nنرفق لكم إيصال دفع لـ${studentLabel}: ${selectedStudent.name}\nقيمة الدفعة: ${receipt.paidAmount} د.ل\nالمتبقي من الرسوم: ${receipt.remaining} د.ل\n\nنشكر لكم تعاونكم 🌸`;

      const res = await fetch('http://localhost:3001/api/wa-send-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pdfBase64, filename: `receipt_${receipt.id}.pdf`, caption })
      });

      const data = await res.json();
      if (data.success) alert('تم إرسال الإيصال بنجاح!');
      else alert('فشل إرسال الإيصال. تأكد من اتصال الواتساب.');
    } catch (err) {
      alert('حدث خطأ أثناء الاتصال بخادم الواتساب.');
    }
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', transition: 'all 0.3s ease' }}>
          <span style={{ fontSize: 24 }}>⟵</span> العودة
        </button>
        <h2 style={{ margin: 0, color: '#0056b3', fontSize: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>🏦</span> المركز المالي الموحد
        </h2>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 14, padding: 28, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <input
            type="text"
            placeholder="ابحث عن اسم الطالب لبدء المعاملات المالية (الاسم، رقم القيد، الهاتف)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '16px 20px', fontSize: 18, borderRadius: 12, border: '2px solid #0056b3', outline: 'none', boxShadow: '0 4px 10px rgba(0,86,179,0.1)' }}
          />
          {searchSuggestions.length > 0 && (
            <ul style={{ position: 'absolute', top: '100%', right: 0, left: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 8, listStyle: 'none', padding: 0, margin: '8px 0 0', zIndex: 10, boxShadow: '0 6px 12px rgba(0,0,0,0.15)', maxHeight: 300, overflowY: 'auto' }}>
              {searchSuggestions.map(s => (
                <li 
                  key={s.id} 
                  onClick={() => { setSelectedStudentId(s.id); setSearchQuery(s.name); }}
                  style={{ padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>{s.name}</div>
                  <div style={{ color: '#64748b', fontSize: 14 }}>{s.grade} - {s.classRoom} | القيد: {s.enrollmentNumber}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedStudent && (
          <div style={{ marginTop: 30 }}>
            {/* Dashboard Headers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 20, borderRadius: 12, border: '1px solid #bae6fd', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, color: '#0369a1', fontSize: 24, fontWeight: 900 }}>{selectedStudent.name}</h3>
                <p style={{ margin: '8px 0 0', color: '#0284c7', fontSize: 15 }}>{selectedStudent.grade} - فصل ({selectedStudent.classRoom}) | القيد: {selectedStudent.enrollmentNumber}</p>
              </div>
              <div>
                 <span style={{ backgroundColor: paymentStatusColor, color: '#fff', padding: '8px 20px', borderRadius: 20, fontSize: 16, fontWeight: 800 }}>
                   {remainingAmount <= 0 ? 'مسدد بالكامل' : paidAmount > 0 ? 'دفع جزئي' : 'غير مسدد'}
                 </span>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: discountAmount > 0 ? 12 : 24 }}>
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>إجمالي الرسوم المبدئي</div>
                <div style={{ fontSize: 28, color: '#0056b3', fontWeight: 900 }}>{selectedStudent.totalFees} د.ل</div>
              </div>
              <div style={{ backgroundColor: discountAmount > 0 ? '#fef2f2' : 'var(--bg-primary)', border: `1px solid ${discountAmount > 0 ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#991b1b', marginBottom: 8, fontWeight: 600 }}>الخصم الممنوح</div>
                <div style={{ fontSize: 28, color: discountAmount > 0 ? '#dc2626' : '#94a3b8', fontWeight: 900 }}>
                  {discountAmount > 0 ? `-${discountAmount} د.ل` : 'لا يوجد'}
                </div>
              </div>
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#065f46', marginBottom: 8, fontWeight: 600 }}>إجمالي المدفوع</div>
                <div style={{ fontSize: 28, color: '#059669', fontWeight: 900 }}>{paidAmount} د.ل</div>
              </div>
              <div style={{ backgroundColor: remainingAmount > 0 ? '#fffbeb' : '#ecfdf5', border: remainingAmount > 0 ? '1px solid #fcd34d' : '1px solid #6ee7b7', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: remainingAmount > 0 ? '#92400e' : '#065f46', marginBottom: 8, fontWeight: 600 }}>المتبقي للسداد</div>
                <div style={{ fontSize: 28, color: remainingAmount > 0 ? '#d97706' : '#059669', fontWeight: 900 }}>{remainingAmount} د.ل</div>
              </div>
            </div>

            {/* Discount details banner */}
            {discountAmount > 0 && (
              <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>🏷️</span>
                <div>
                  <span style={{ fontWeight: 800, color: '#92400e', fontSize: 16 }}>خصم مالي ممنوح: {discountAmount} د.ل</span>
                  {selectedStudent.discountReason && (
                    <span style={{ color: '#78350f', fontSize: 14, marginRight: 12 }}>— السبب: {selectedStudent.discountReason}</span>
                  )}
                </div>
              </div>
            )}


            {/* Quick Actions Panel */}
            <h4 style={{ fontSize: 20, color: '#1e293b', marginBottom: 16 }}>⚡ الإجراءات السريعة</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
              <button onClick={() => setShowReceiptModal(true)} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: 10, padding: 16, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 6px rgba(5,150,105,0.2)' }}>
                <span>💵</span> تسجيل دفعة جديدة
              </button>
              
              <button 
                onClick={() => {
                   setDiscountForm({ amount: selectedStudent.discountAmount || 0, reason: selectedStudent.discountReason || '' });
                   setShowDiscountModal(true);
                }} 
                style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: 16, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 6px rgba(59,130,246,0.2)' }}>
                <span>🏷️</span> إدارة الخصومات
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>حالة الزي المدرسي:</label>
                <select 
                  value={getUniformStatus()}
                  onChange={e => handleUniformChange(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
                >
                  <option value="default">الزي الافتراضي (مشمول)</option>
                  <option value="no_uniform">عدم استلام زي (-300 د.ل)</option>
                  <option value="extra_uniform">طلب زي إضافي (+400 د.ل)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>نظام الأقساط:</label>
                <select 
                  value={selectedStudent.installmentsCount || 2}
                  onChange={e => updateStudent({ installmentsCount: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
                >
                  <option value="1">دفعة واحدة</option>
                  <option value="2">قسطين (2)</option>
                  <option value="3">3 أقساط</option>
                  <option value="4">4 أقساط</option>
                  <option value="6">6 أقساط</option>
                  <option value="12">شهري (12)</option>
                </select>
              </div>
            </div>

            {/* Receipts History */}
            <h4 style={{ fontSize: 20, color: '#1e293b', marginBottom: 16 }}>📜 سجل الإيصالات والمدفوعات</h4>
            {studentReceipts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, backgroundColor: 'var(--bg-primary)', borderRadius: 12, color: '#64748b' }}>
                لا توجد مدفوعات مسجلة لهذا الطالب حتى الآن.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: 16, fontWeight: 700 }}>رقم الإيصال</th>
                      <th style={{ padding: 16, fontWeight: 700 }}>التاريخ</th>
                      <th style={{ padding: 16, fontWeight: 700 }}>الدفعة رقم</th>
                      <th style={{ padding: 16, fontWeight: 700 }}>المبلغ المدفوع</th>
                      <th style={{ padding: 16, fontWeight: 700 }}>طريقة الدفع</th>
                      <th style={{ padding: 16, fontWeight: 700 }}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentReceipts.map((r, idx) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ padding: 16, color: '#0284c7', fontWeight: 700 }}>{r.id}</td>
                        <td style={{ padding: 16, color: '#64748b' }}>{r.date}</td>
                        <td style={{ padding: 16 }}>{r.installmentNo}</td>
                        <td style={{ padding: 16, color: '#059669', fontWeight: 900 }}>{r.paidAmount} د.ل</td>
                        <td style={{ padding: 16 }}>{r.paymentMethod}</td>
                        <td style={{ padding: 16, display: 'flex', gap: 8 }}>
                          <button onClick={() => setEditingReceipt(r)} style={{ backgroundColor: '#f59e0b', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }} title="تعديل">✏️ تعديل</button>
                          <button onClick={() => handlePrintReceipt(r)} style={{ backgroundColor: '#0284c7', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }} title="طباعة">🖨️ طباعة</button>
                          <button onClick={() => sendReceiptWhatsApp(r)} style={{ backgroundColor: '#10b981', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }} title="إرسال واتساب">📱 واتساب</button>
                          <button onClick={() => handleDeleteReceipt(r)} style={{ backgroundColor: '#ef4444', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }} title="حذف">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Receipt Modal */}
      {showReceiptModal && selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, color: '#0056b3', fontSize: 24 }}>تسجيل دفعة جديدة</h3>
              <button onClick={() => setShowReceiptModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <div style={{ backgroundColor: '#f0f9ff', padding: 16, borderRadius: 10, border: '1px solid #bae6fd', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#0369a1', marginBottom: 4 }}>الطالب</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0c4a6e' }}>{selectedStudent.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                 <span style={{ fontSize: 14, color: '#0284c7' }}>المتبقي للسداد:</span>
                 <span style={{ fontSize: 18, fontWeight: 900, color: remainingAmount > 0 ? '#dc2626' : '#059669' }}>{remainingAmount} د.ل</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#1e293b' }}>تاريخ السداد</label>
              <input 
                type="date" 
                value={receiptForm.date} 
                onChange={e => setReceiptForm({ ...receiptForm, date: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', fontSize: 16, borderRadius: 8, border: '2px solid #cbd5e1', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#1e293b' }}>المبلغ المدفوع (د.ل)</label>
              <input 
                type="number" 
                value={receiptForm.paidAmount || ''} 
                onChange={e => setReceiptForm({ ...receiptForm, paidAmount: Number(e.target.value) })}
                onWheel={e => (e.target as HTMLInputElement).blur()}
                style={{ width: '100%', padding: '12px 16px', fontSize: 18, borderRadius: 8, border: '2px solid #cbd5e1', outline: 'none' }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#1e293b' }}>طريقة الدفع</label>
              <select 
                value={receiptForm.paymentMethod} 
                onChange={e => setReceiptForm({ ...receiptForm, paymentMethod: e.target.value as Receipt['paymentMethod'] })}
                style={{ width: '100%', padding: '12px 16px', fontSize: 16, borderRadius: 8, border: '2px solid #cbd5e1', outline: 'none' }}
              >
                <option value="نقدي">نقدي</option>
                <option value="بطاقة مصرفية">بطاقة مصرفية</option>
                <option value="حوالة مصرفية">حوالة مصرفية</option>
                <option value="شيك">شيك</option>
              </select>
            </div>

            <button onClick={handleAddReceipt} style={{ width: '100%', backgroundColor: '#059669', color: '#fff', border: 'none', padding: 16, borderRadius: 10, fontSize: 18, fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s' }}>
              حفظ وطباعة الإيصال
            </button>
          </div>
        </div>
      )}

      {/* Edit Receipt Modal */}
      {editingReceipt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, color: '#f59e0b', fontSize: 24 }}>تعديل الإيصال رقم {editingReceipt.id}</h3>
              <button onClick={() => setEditingReceipt(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#1e293b' }}>تاريخ السداد</label>
              <input 
                type="date" 
                value={editingReceipt.date} 
                onChange={e => setEditingReceipt({ ...editingReceipt, date: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', fontSize: 16, borderRadius: 8, border: '2px solid #cbd5e1', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#1e293b' }}>المبلغ المدفوع (د.ل)</label>
              <input 
                type="number" 
                value={editingReceipt.paidAmount || ''} 
                onChange={e => setEditingReceipt({ ...editingReceipt, paidAmount: Number(e.target.value) })}
                onWheel={e => (e.target as HTMLInputElement).blur()}
                style={{ width: '100%', padding: '12px 16px', fontSize: 18, borderRadius: 8, border: '2px solid #cbd5e1', outline: 'none' }}
                autoFocus
              />
            </div>
            
            <div style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#1e293b' }}>طريقة الدفع</label>
              <select 
                value={editingReceipt.paymentMethod} 
                onChange={e => setEditingReceipt({ ...editingReceipt, paymentMethod: e.target.value as Receipt['paymentMethod'] })}
                style={{ width: '100%', padding: '12px 16px', fontSize: 16, borderRadius: 8, border: '2px solid #cbd5e1', outline: 'none' }}
              >
                <option value="نقدي">نقدي</option>
                <option value="بطاقة مصرفية">بطاقة مصرفية</option>
                <option value="حوالة مصرفية">حوالة مصرفية</option>
                <option value="شيك">شيك</option>
              </select>
            </div>

            <button onClick={handleEditReceiptSubmit} style={{ width: '100%', backgroundColor: '#f59e0b', color: '#fff', border: 'none', padding: 16, borderRadius: 10, fontSize: 18, fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s' }}>
              حفظ التعديلات
            </button>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, color: '#1e40af', fontSize: 24 }}>إدارة الخصم المالي</h3>
              <button onClick={() => setShowDiscountModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#1e293b' }}>قيمة الخصم (د.ل)</label>
              <input 
                type="number" 
                value={discountForm.amount || ''} 
                onChange={e => setDiscountForm({ ...discountForm, amount: Number(e.target.value) })}
                onWheel={e => (e.target as HTMLInputElement).blur()}
                style={{ width: '100%', padding: '12px 16px', fontSize: 18, borderRadius: 8, border: '2px solid #cbd5e1', outline: 'none' }}
                autoFocus
                placeholder="0"
              />
            </div>

            <div style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#1e293b' }}>سبب الخصم</label>
              <input 
                type="text" 
                value={discountForm.reason} 
                onChange={e => setDiscountForm({ ...discountForm, reason: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', fontSize: 16, borderRadius: 8, border: '2px solid #cbd5e1', outline: 'none' }}
                placeholder="مثال: خصم أخوة، منحة، الخ..."
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSaveDiscount} style={{ flex: 1, backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: 12, borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>حفظ الخصم</button>
              <button onClick={() => { updateStudent({ discountAmount: 0, discountReason: '' }); setShowDiscountModal(false); }} style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: 12, borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>إلغاء الخصم</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
