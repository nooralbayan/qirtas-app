import React from 'react';

interface ReceiptTemplateProps {
  receipt: any;
  student?: any;
  schoolName: string;
  schoolLogo: string;
  baseFee?: number;
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ receipt, student, schoolName, schoolLogo, baseFee = 0 }, ref) => {
    
    const studentLabel = student?.gender === 'أنثى' ? 'الطالبة' : 'الطالب';
    const amount = receipt.paidAmount || receipt.amount || 0;
    
    // Financial Smart Breakdown
    const totalFees = student?.totalFees || receipt.totalDue || 0;
    const discountAmount = student?.discountAmount || 0;
    const discountReason = student?.discountReason || '';
    
    // Determine uniform status based on baseFee vs totalFees
    let uniformStatus: 'deducted' | 'included' | 'extra' = 'included';
    if (baseFee > 0) {
      if (totalFees < baseFee) uniformStatus = 'deducted';
      else if (totalFees > baseFee) uniformStatus = 'extra';
    }

    const netFees = Math.max(0, totalFees - discountAmount);
    const remaining = receipt.remaining !== undefined ? receipt.remaining : Math.max(0, netFees - amount);

    return (
      <div 
        ref={ref} 
        style={{
          width: '800px',
          minHeight: '480px',
          padding: '35px 40px',
          backgroundColor: '#ffffff',
          color: '#1e293b',
          fontFamily: "'Cairo', sans-serif",
          direction: 'rtl',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
      >
        {/* Background Watermark */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.03,
          pointerEvents: 'none',
          zIndex: 0,
          width: '60%',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {schoolLogo?.startsWith('data:image') ? (
            <img src={schoolLogo} style={{ width: '100%', objectFit: 'contain' }} alt="watermark" />
          ) : (
            <span style={{ fontSize: '300px' }}>{schoolLogo || '🎓'}</span>
          )}
        </div>

        {/* Top Gradient Ribbon */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(90deg, #0284c7, #2563eb, #0d9488)' }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '26px', fontWeight: 'bold' }}>{schoolName}</h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>إيصال وسند قبض مالي</p>
            </div>
            
            <div style={{ textAlign: 'center', flex: 1 }}>
              {schoolLogo?.startsWith('data:image') ? (
                <img src={schoolLogo} alt="Logo" style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', border: '1px solid #cbd5e1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                  {schoolLogo || '🎓'}
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', padding: '5px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '18px', marginBottom: '6px' }}>
                سند قبض
              </div>
              <p style={{ margin: '0', fontSize: '14px', color: '#64748b', fontFamily: 'monospace' }}>رقم السند: <strong style={{ color: '#0f172a' }}>{receipt.id.toString().padStart(5, '0')}</strong></p>
              <p style={{ margin: '2px 0 0', fontSize: '14px', color: '#64748b' }}>التاريخ: <strong style={{ color: '#0f172a' }}>{receipt.date}</strong></p>
            </div>
          </div>

          {/* Student Info & Uniform Status Banner */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px 20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '16px' }}>
                <span style={{ color: '#64748b' }}>استلمنا من ولي أمر {studentLabel}: </span>
                <strong style={{ color: '#0f172a', fontSize: '18px' }}>{receipt.studentName}</strong>
                <span style={{ fontSize: '14px', color: '#0284c7', marginRight: '10px' }}>({student?.grade || receipt.grade} - {student?.classRoom ? `فصل ${student.classRoom}` : ''})</span>
              </div>

              {/* Uniform & Discount Badge */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {uniformStatus === 'deducted' && (
                  <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    🚫 غير شامل الزي المدرسي (مخصوم)
                  </span>
                )}
                {uniformStatus === 'included' && (
                  <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    👕 الدفعة شاملة الزي المدرسي
                  </span>
                )}
                {uniformStatus === 'extra' && (
                  <span style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    👕 شامل الزي المدرسي (+ زي إضافي)
                  </span>
                )}
                {discountAmount > 0 && (
                  <span style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    🏷️ خصم مالي: {discountAmount} د.ل {discountReason ? `(${discountReason})` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Smart Financial Breakdown Grid */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '2px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', textAlign: 'center', marginBottom: '15px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>إجمالي الرسوم الأصلي</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a5f' }}>{totalFees} د.ل</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>إجمالي الخصومات والإعفاءات</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: discountAmount > 0 ? '#dc2626' : '#64748b' }}>
                  {discountAmount > 0 ? `-${discountAmount} د.ل` : 'لا يوجد'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '12px', color: '#0369a1' }}>الصافي المطلوب</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0284c7' }}>{netFees} د.ل</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 20px', borderRadius: '8px' }}>
              <div>
                <span style={{ color: '#065f46', fontWeight: 'bold', fontSize: '16px' }}>الدفعة الحالية المستلمة: </span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#059669', marginRight: '8px' }}>{amount} د.ل</span>
                <span style={{ fontSize: '13px', color: '#047857', marginRight: '10px' }}>(الدفعة رقم {receipt.installmentNo || 1} - طريقة الدفع: {receipt.paymentMethod || 'نقدي'})</span>
              </div>
              <div>
                <span style={{ color: '#065f46', fontWeight: 'bold', fontSize: '15px' }}>المتبقي المستحق: </span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: remaining > 0 ? '#dc2626' : '#059669' }}>{remaining} د.ل</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '25px', padding: '0 10px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '35px' }}>توقيع المستلم / المحاسب</p>
              <div style={{ borderBottom: '1px solid #cbd5e1', width: '170px', margin: '0 auto' }}></div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', border: '2px dashed #cbd5e1', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', transform: 'rotate(-12deg)' }}>
                ختم المدرسة
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';
