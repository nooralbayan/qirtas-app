import React from 'react';

interface ReceiptTemplateProps {
  receipt: any;
  student?: any;
  schoolName: string;
  schoolLogo: string;
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ receipt, student, schoolName, schoolLogo }, ref) => {
    
    const studentLabel = student?.gender === 'أنثى' ? 'الطالبة' : 'الطالب';
    const amount = receipt.paidAmount || receipt.amount || 0;
    
    return (
      <div 
        ref={ref} 
        style={{
          width: '800px',
          minHeight: '400px',
          padding: '40px',
          backgroundColor: '#ffffff',
          color: '#1e293b',
          fontFamily: "'Cairo', sans-serif",
          direction: 'rtl',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
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

        {/* Decorative Top Border */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(90deg, #38bdf8, #818cf8, #38bdf8)' }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '28px', fontWeight: 'bold' }}>{schoolName}</h2>
              <p style={{ margin: '5px 0 0', fontSize: '16px', color: '#64748b' }}>قسم المالية والحسابات</p>
            </div>
            
            <div style={{ textAlign: 'center', flex: 1 }}>
              {schoolLogo?.startsWith('data:image') ? (
                <img src={schoolLogo} alt="Logo" style={{ maxWidth: '90px', maxHeight: '90px', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', border: '1px solid #cbd5e1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                  {schoolLogo || '🎓'}
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '20px', marginBottom: '8px' }}>
                سند قبض
              </div>
              <p style={{ margin: '0', fontSize: '15px', color: '#64748b', fontFamily: 'monospace' }}>رقم السند: <strong style={{ color: '#0f172a' }}>{receipt.id.toString().padStart(5, '0')}</strong></p>
              <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#64748b' }}>التاريخ: <strong style={{ color: '#0f172a' }}>{receipt.date}</strong></p>
            </div>
          </div>

          {/* Content */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '30px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', fontSize: '18px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '140px', color: '#64748b', fontWeight: 'bold' }}>استلمنا من السيد/ة:</span>
                <span style={{ flex: 1, borderBottom: '1px dashed #cbd5e1', padding: '0 10px', color: '#0f172a', fontWeight: 'bold' }}>
                  {student?.fatherName || '---'} (ولي أمر {studentLabel}: {receipt.studentName})
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '140px', color: '#64748b', fontWeight: 'bold' }}>مبلغاً وقدره:</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ padding: '6px 20px', backgroundColor: '#fff', border: '2px solid #38bdf8', borderRadius: '8px', fontWeight: 'bold', fontSize: '22px', color: '#0369a1', boxShadow: '0 2px 4px rgba(56, 189, 248, 0.1)' }}>
                    {amount} د.ل
                  </span>
                  <span style={{ color: '#64748b', fontSize: '16px' }}>(طريقة الدفع: <strong style={{ color: '#0f172a' }}>{receipt.paymentMethod || 'نقدي'}</strong>)</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '140px', color: '#64748b', fontWeight: 'bold' }}>وذلك عن:</span>
                <span style={{ flex: 1, borderBottom: '1px dashed #cbd5e1', padding: '0 10px', color: '#0f172a' }}>
                  {receipt.description || `الدفعة رقم ${receipt.installmentNo || 1} من الرسوم الدراسية`}
                </span>
              </div>
              
              {receipt.remaining !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <span style={{ width: '140px', color: '#64748b', fontWeight: 'bold' }}>المتبقي من الرسوم:</span>
                  <span style={{ flex: 1, borderBottom: '1px dashed #cbd5e1', padding: '0 10px', color: '#dc2626', fontWeight: 'bold' }}>
                    {receipt.remaining} د.ل
                  </span>
                </div>
              )}
              
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px', padding: '0 20px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '40px' }}>توقيع المستلم / المحاسب</p>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '180px', margin: '0 auto' }}></div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '90px', height: '90px', border: '2px dashed #cbd5e1', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px', transform: 'rotate(-15deg)' }}>
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
