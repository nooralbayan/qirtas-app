import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

export default function WhatsApp({ onBack }: { onBack: () => void }) {
  const { students, receipts, classRooms } = useAppContext();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [gradeFilter, setGradeFilter] = useState('الكل');
  const [classRoomFilter, setClassRoomFilter] = useState('الكل');
  const [sentLog, setSentLog] = useState<{ name: string; phone: string; time: string; status: 'جاري الإرسال' | 'تم الإرسال' | 'فشل' }[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'defaulters' | 'paid'>('all');
  
  const [waStatus, setWaStatus] = useState<'checking' | 'initializing' | 'qr' | 'ready' | 'error'>('checking');
  const [qrCode, setQrCode] = useState('');
  const [isSending, setIsSending] = useState(false);

  const availableClassRoomsForFilter = gradeFilter === 'الكل' ? [] : classRooms[gradeFilter] || [];

  useEffect(() => {
    checkWaStatus();
    const interval = setInterval(checkWaStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkWaStatus = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/wa-status');
      const data = await res.json();
      setWaStatus(data.status);
      if (data.status === 'qr') setQrCode(data.qr);
    } catch (err) {
      setWaStatus('error');
    }
  };

  const logoutWa = async () => {
    if (!window.confirm('هل أنت متأكد من تسجيل الخروج من واتساب؟')) return;
    try {
      await fetch('http://localhost:3001/api/wa-logout', { method: 'POST' });
      setWaStatus('initializing');
    } catch (err) {
      console.error(err);
    }
  };

  const getStudentInstallmentStatus = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { paidCount: 0, requiredCount: 2, totalPaid: 0, remaining: 0, unpaidLabel: '' };
    
    const requiredCount = student.installmentsCount || 2;
    const studentReceipts = receipts.filter(r => r.studentId === studentId);
    const totalPaid = studentReceipts.reduce((a, r) => a + r.paidAmount, 0);
    const remaining = Math.max(0, student.totalFees - totalPaid);
    
    const installmentSize = student.totalFees / requiredCount;
    const paidInstallmentsCount = Math.floor(totalPaid / installmentSize);
    
    let unpaidLabel = '';
    if (remaining > 0) {
      if (requiredCount === 2) {
        if (paidInstallmentsCount === 0) unpaidLabel = 'القسط الأول والثاني';
        else unpaidLabel = 'القسط الثاني';
      } else {
        const nextInstallment = paidInstallmentsCount + 1;
        unpaidLabel = `القسط رقم (${nextInstallment})`;
      }
    }
    
    return { paidCount: paidInstallmentsCount, requiredCount, totalPaid, remaining, unpaidLabel };
  };

  type MessageTemplate = {
    id: string;
    label: string;
    icon: string;
    getMessage: (studentId: number) => string;
  };

  const TEMPLATES: MessageTemplate[] = [
    {
      id: 'welcome',
      label: 'ترحيب بولي الأمر',
      icon: '👋',
      getMessage: (id) => {
        const s = students.find(x => x.id === id);
        return `السلام عليكم ورحمة الله وبركاته\n\nنرحب بكم في مدرستنا ونشكركم على ثقتكم.\nالطالب/ة: ${s?.name}\nالصف: ${s?.grade}${s?.classRoom ? ` - ${s?.classRoom}` : ''}\n\nنتمنى عاماً دراسياً موفقاً ✨`;
      }
    },
    {
      id: 'smart_reminder',
      label: 'تذكير ذكي بالأقساط',
      icon: '💡',
      getMessage: (id) => {
        const s = students.find(x => x.id === id);
        if (!s) return '';
        const { remaining, unpaidLabel } = getStudentInstallmentStatus(id);
        if (remaining <= 0) return '';
        return `السلام عليكم ورحمة الله\n\nنود تذكيركم بلطف حول استحقاق الرسوم الدراسية للطالب/ة: ${s.name}\nالصف: ${s.grade}\n\nالرجاء سداد (${unpaidLabel}) وقدره: ${remaining} د.ل\n\nنشكر لكم تعاونكم الدائم 🙏`;
      }
    },
    {
      id: 'absence',
      label: 'إشعار غياب',
      icon: '⚠️',
      getMessage: (id) => {
        const s = students.find(x => x.id === id);
        return `السلام عليكم ورحمة الله\n\nنحيطكم علماً بأن الطالب/ة: ${s?.name}\nالصف: ${s?.grade}\nكان/ت غائب/ة اليوم ${new Date().toLocaleDateString('ar-LY')}.\n\nعسى أن يكون المانع خيراً 🤲`;
      }
    },
    {
      id: 'custom',
      label: 'رسالة مخصصة',
      icon: '✏️',
      getMessage: () => customMessage,
    },
  ];

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(id);
    if (id === 'smart_reminder') {
      const debtors = new Set(students.filter(s => getStudentInstallmentStatus(s.id).remaining > 0).map(s => s.id));
      setSelectedStudentIds(debtors);
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const filtered = students.filter(s => {
    const matchName = s.name.includes(searchTerm) || s.fatherName.includes(searchTerm);
    const matchGrade = gradeFilter === 'الكل' || s.grade === gradeFilter;
    const matchClass = classRoomFilter === 'الكل' || s.classRoom === classRoomFilter;
    const { remaining } = getStudentInstallmentStatus(s.id);
    const matchPayment = paymentFilter === 'all' 
      ? true 
      : paymentFilter === 'defaulters' 
        ? remaining > 0 
        : remaining === 0;
    
    return matchName && matchGrade && matchClass && matchPayment;
  });

  const toggleStudent = (id: number) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatPhoneForWA = (phone: string): string => {
    let cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.startsWith('0')) cleaned = '218' + cleaned.slice(1);
    if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
    return cleaned;
  };

  const sendSingleMessage = async (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student || !student.fatherPhone) return false;

    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return false;

    let message = template.getMessage(student.id);
    if (!message) return false;

    const phone = formatPhoneForWA(student.fatherPhone);
    const logEntry = { name: student.fatherName, phone: student.fatherPhone, time: new Date().toLocaleTimeString('ar-LY'), status: 'جاري الإرسال' as const };
    
    setSentLog(prev => [logEntry, ...prev]);

    try {
      const res = await fetch('http://localhost:3001/api/wa-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      const data = await res.json();
      if (data.success) {
        setSentLog(prev => prev.map(l => l === logEntry ? { ...l, status: 'تم الإرسال' } : l));
        return true;
      } else {
        setSentLog(prev => prev.map(l => l === logEntry ? { ...l, status: 'فشل' } : l));
        return false;
      }
    } catch (err) {
      setSentLog(prev => prev.map(l => l === logEntry ? { ...l, status: 'فشل' } : l));
      return false;
    }
  };

  const sendToAll = async () => {
    if (waStatus !== 'ready') { alert('الواتساب غير متصل. يرجى مسح الكود أولاً.'); return; }
    if (selectedStudentIds.size === 0) { alert('يرجى تحديد طالب واحد على الأقل'); return; }
    if (!selectedTemplate) { alert('يرجى اختيار نوع الرسالة أولاً'); return; }

    setIsSending(true);
    const ids = Array.from(selectedStudentIds);
    for (const id of ids) {
      await sendSingleMessage(id);
      await new Promise(r => setTimeout(r, 3000));
    }
    setIsSending(false);
    alert('تم إنهاء الإرسال!');
  };

  // Auth Screen
  if (waStatus !== 'ready') {
    return (
      <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
        <button onClick={onBack} style={{ background: 'linear-gradient(135deg, var(--primary-color), #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
          <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
        </button>
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 40, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: 600, margin: '0 auto', border: '1px solid var(--border-color)' }}>
          <h2 style={{ color: '#25d366', fontSize: 28, marginBottom: 16 }}>📱 ربط واتساب بالنظام</h2>
          
          {waStatus === 'error' && (
            <div style={{ color: 'var(--danger-color)', padding: 20, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, marginBottom: 20 }}>
              <strong>⚠️ الخادم لا يعمل:</strong> لم يتم العثور على خادم واتساب المدمج. تأكد من تشغيل أمر (npm start) لتشغيل الواجهة والخادم معاً.
            </div>
          )}

          {waStatus === 'initializing' && (
            <div style={{ padding: 40 }}>
              <div style={{ fontSize: 40, animation: 'spin 1s linear infinite' }}>⏳</div>
              <h3 style={{ marginTop: 20, color: 'var(--text-primary)' }}>جاري تهيئة الواتساب المخفي... يرجى الانتظار</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>هذا قد يستغرق دقيقة في أول مرة لتشغيل المتصفح</p>
            </div>
          )}

          {waStatus === 'qr' && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 24 }}>
                1. افتح تطبيق واتساب على هاتفك<br/>
                2. اذهب إلى الإعدادات ثم "الأجهزة المرتبطة" (Linked Devices)<br/>
                3. اضغط على "ربط جهاز" وقم بتوجيه الكاميرا لمسح الكود أدناه
              </p>
              <div style={{ display: 'inline-block', padding: 16, border: '1px solid var(--border-color)', borderRadius: 16, background: 'var(--bg-card)' }}>
                <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 250, height: 250 }} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main UI (Ready)
  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'linear-gradient(135deg, var(--primary-color), #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content', marginTop: 16 }}>
          <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', background: '#dcfce7', padding: '6px 14px', borderRadius: 20, fontSize: 14, fontWeight: 'bold' }}>
            <span style={{ width: 10, height: 10, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
            واتساب متصل
          </span>
          <button onClick={logoutWa} style={{ backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: '0 0 20px', color: '#25d366', fontSize: 22 }}>التراسل الآلي والذكي</h2>

          <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>اختر نوع الرسالة:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {TEMPLATES.map(t => (
              <div
                key={t.id}
                onClick={() => handleTemplateSelect(t.id)}
                style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                  border: selectedTemplate === t.id ? '2px solid #25d366' : '1px solid var(--border-color)',
                  background: selectedTemplate === t.id ? 'rgba(37, 211, 102, 0.1)' : 'var(--bg-secondary)',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--text-primary)' }}>{t.label}</div>
              </div>
            ))}
          </div>

          {selectedTemplate === 'custom' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>نص الرسالة المخصصة:</label>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                rows={5}
                style={{ width: '100%', padding: 14, borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, fontFamily: 'Cairo', resize: 'vertical', boxSizing: 'border-box', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
            </div>
          )}

          {selectedTemplate && selectedTemplate !== 'custom' && selectedStudentIds.size > 0 && (
            <div style={{ background: 'rgba(37, 211, 102, 0.05)', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 8px', color: '#166534', fontSize: 13 }}>مثال لرسالة سترسل:</h4>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {TEMPLATES.find(t => t.id === selectedTemplate)?.getMessage(Array.from(selectedStudentIds)[0])}
              </pre>
            </div>
          )}

          <button
            onClick={sendToAll}
            disabled={!selectedTemplate || selectedStudentIds.size === 0 || isSending}
            style={{
              width: '100%', padding: 14, borderRadius: 10, border: 'none', fontWeight: 'bold', fontSize: 16,
              cursor: selectedTemplate && selectedStudentIds.size > 0 && !isSending ? 'pointer' : 'not-allowed',
              background: selectedTemplate && selectedStudentIds.size > 0 && !isSending ? 'linear-gradient(135deg, #25d366, #128c7e)' : 'var(--border-color)',
              color: '#fff', fontFamily: 'Cairo', opacity: isSending ? 0.7 : 1
            }}
          >
            {isSending ? '⏳ جاري إرسال الرسائل (يرجى الانتظار)...' : `📤 إرسال إلى ${selectedStudentIds.size} ولي أمر`}
          </button>

          {/* Sent Log */}
          {sentLog.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>سجل الإرسال:</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {sentLog.map((log, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                    <span>{log.status === 'تم الإرسال' ? '✅' : log.status === 'فشل' ? '❌' : '⏳'} {log.name} ({log.phone})</span>
                    <span style={{ color: 'var(--text-muted)' }}>{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Student Selection */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>اختيار أولياء الأمور</h3>
            <button onClick={() => {
              if (selectedStudentIds.size === filtered.length) setSelectedStudentIds(new Set());
              else setSelectedStudentIds(new Set(filtered.map(s => s.id)));
            }} style={{ background: 'none', border: '1px solid var(--border-color)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {selectedStudentIds.size === filtered.length ? 'إلغاء الكل' : 'تحديد الكل'}
            </button>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>🎯 الفئة المستهدفة (التصفية)</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <select 
                  value={paymentFilter} 
                  onChange={e => setPaymentFilter(e.target.value as any)} 
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', fontSize: 13, fontWeight: paymentFilter !== 'all' ? 'bold' : 'normal', color: paymentFilter === 'defaulters' ? 'var(--danger-color)' : 'var(--text-primary)' }}
                >
                  <option value="all">جميع الحالات المالية (الكل)</option>
                  <option value="defaulters">المتخلفين عن الدفع (عليهم أقساط)</option>
                  <option value="paid">المسددين بالكامل</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <select value={gradeFilter} onChange={e => {setGradeFilter(e.target.value); setClassRoomFilter('الكل');}} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 13 }}>
                  <option value="الكل">جميع الصفوف الدراسية</option>
                  {[...new Set(students.map(s => s.grade))].map(g => <option key={g} value={g}>{g}</option>)}
                </select>

                {gradeFilter !== 'الكل' && availableClassRoomsForFilter.length > 0 && (
                  <select value={classRoomFilter} onChange={e => setClassRoomFilter(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 13 }}>
                    <option value="الكل">جميع الفصول</option>
                    {availableClassRoomsForFilter.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>

              <input
                placeholder="🔍 أو ابحث عن طالب معين / ولي أمر..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {filtered.map(s => {
              const isSelected = selectedStudentIds.has(s.id);
              const { remaining, unpaidLabel } = getStudentInstallmentStatus(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px',
                    borderRadius: 8, marginBottom: 6, cursor: 'pointer', transition: 'all 0.15s',
                    border: isSelected ? '2px solid #25d366' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(37, 211, 102, 0.05)' : 'var(--bg-secondary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 4, border: isSelected ? '2px solid #25d366' : '2px solid var(--border-color)',
                      background: isSelected ? '#25d366' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14,
                    }}>
                      {isSelected && '✓'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 14, color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ولي الأمر: {s.fatherName}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.grade} {s.classRoom ? `(${s.classRoom})` : ''}</div>
                    {remaining > 0 && <div style={{ fontSize: 11, color: 'var(--danger-color)', fontWeight: 'bold' }}>مطلوب: {unpaidLabel}</div>}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>لا توجد نتائج مطابقة</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
