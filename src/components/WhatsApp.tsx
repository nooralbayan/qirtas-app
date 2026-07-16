import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

export default function WhatsApp({ onBack }: { onBack: () => void }) {
  const { students, receipts, classRooms } = useAppContext();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [gradeFilter, setGradeFilter] = useState('ط§ظ„ظƒظ„');
  const [classRoomFilter, setClassRoomFilter] = useState('ط§ظ„ظƒظ„');
  const [sentLog, setSentLog] = useState<{ name: string; phone: string; time: string; status: 'ط¬ط§ط±ظٹ ط§ظ„ط¥ط±ط³ط§ظ„' | 'طھظ… ط§ظ„ط¥ط±ط³ط§ظ„' | 'ظپط´ظ„' }[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'defaulters' | 'paid'>('all');
  
  const [waStatus, setWaStatus] = useState<'checking' | 'initializing' | 'qr' | 'ready' | 'error'>('checking');
  const [qrCode, setQrCode] = useState('');
  const [isSending, setIsSending] = useState(false);

  const availableClassRoomsForFilter = gradeFilter === 'ط§ظ„ظƒظ„' ? [] : classRooms[gradeFilter] || [];

  useEffect(() => {
    checkWaStatus();
    const interval = setInterval(checkWaStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkWaStatus = async () => {
    try {
      const res = await fetch('/api/wa-status');
      const data = await res.json();
      setWaStatus(data.status);
      if (data.status === 'qr') setQrCode(data.qr);
    } catch (err) {
      setWaStatus('error');
    }
  };

  const logoutWa = async () => {
    if (!window.confirm('ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬ ظ…ظ† ظˆط§طھط³ط§ط¨طں')) return;
    try {
      await fetch('/api/wa-logout', { method: 'POST' });
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
        if (paidInstallmentsCount === 0) unpaidLabel = 'ط§ظ„ظ‚ط³ط· ط§ظ„ط£ظˆظ„ ظˆط§ظ„ط«ط§ظ†ظٹ';
        else unpaidLabel = 'ط§ظ„ظ‚ط³ط· ط§ظ„ط«ط§ظ†ظٹ';
      } else {
        const nextInstallment = paidInstallmentsCount + 1;
        unpaidLabel = `ط§ظ„ظ‚ط³ط· ط±ظ‚ظ… (${nextInstallment})`;
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
      label: 'طھط±ط­ظٹط¨ ط¨ظˆظ„ظٹ ط§ظ„ط£ظ…ط±',
      icon: 'ًں‘‹',
      getMessage: (id) => {
        const s = students.find(x => x.id === id);
        return `ط§ظ„ط³ظ„ط§ظ… ط¹ظ„ظٹظƒظ… ظˆط±ط­ظ…ط© ط§ظ„ظ„ظ‡ ظˆط¨ط±ظƒط§طھظ‡\n\nظ†ط±ط­ط¨ ط¨ظƒظ… ظپظٹ ظ…ط¯ط±ط³طھظ†ط§ ظˆظ†ط´ظƒط±ظƒظ… ط¹ظ„ظ‰ ط«ظ‚طھظƒظ….\nط§ظ„ط·ط§ظ„ط¨/ط©: ${s?.name}\nط§ظ„طµظپ: ${s?.grade}${s?.classRoom ? ` - ${s?.classRoom}` : ''}\n\nظ†طھظ…ظ†ظ‰ ط¹ط§ظ…ط§ظ‹ ط¯ط±ط§ط³ظٹط§ظ‹ ظ…ظˆظپظ‚ط§ظ‹ âœ¨`;
      }
    },
    {
      id: 'smart_reminder',
      label: 'طھط°ظƒظٹط± ط°ظƒظٹ ط¨ط§ظ„ط£ظ‚ط³ط§ط·',
      icon: 'ًں’،',
      getMessage: (id) => {
        const s = students.find(x => x.id === id);
        if (!s) return '';
        const { remaining, unpaidLabel } = getStudentInstallmentStatus(id);
        if (remaining <= 0) return '';
        return `ط§ظ„ط³ظ„ط§ظ… ط¹ظ„ظٹظƒظ… ظˆط±ط­ظ…ط© ط§ظ„ظ„ظ‡\n\nظ†ظˆط¯ طھط°ظƒظٹط±ظƒظ… ط¨ظ„ط·ظپ ط­ظˆظ„ ط§ط³طھط­ظ‚ط§ظ‚ ط§ظ„ط±ط³ظˆظ… ط§ظ„ط¯ط±ط§ط³ظٹط© ظ„ظ„ط·ط§ظ„ط¨/ط©: ${s.name}\nط§ظ„طµظپ: ${s.grade}\n\nط§ظ„ط±ط¬ط§ط، ط³ط¯ط§ط¯ (${unpaidLabel}) ظˆظ‚ط¯ط±ظ‡: ${remaining} ط¯.ظ„\n\nظ†ط´ظƒط± ظ„ظƒظ… طھط¹ط§ظˆظ†ظƒظ… ط§ظ„ط¯ط§ط¦ظ… ًں™ڈ`;
      }
    },
    {
      id: 'absence',
      label: 'ط¥ط´ط¹ط§ط± ط؛ظٹط§ط¨',
      icon: 'âڑ ï¸ڈ',
      getMessage: (id) => {
        const s = students.find(x => x.id === id);
        return `ط§ظ„ط³ظ„ط§ظ… ط¹ظ„ظٹظƒظ… ظˆط±ط­ظ…ط© ط§ظ„ظ„ظ‡\n\nظ†ط­ظٹط·ظƒظ… ط¹ظ„ظ…ط§ظ‹ ط¨ط£ظ† ط§ظ„ط·ط§ظ„ط¨/ط©: ${s?.name}\nط§ظ„طµظپ: ${s?.grade}\nظƒط§ظ†/طھ ط؛ط§ط¦ط¨/ط© ط§ظ„ظٹظˆظ… ${new Date().toLocaleDateString('ar-LY')}.\n\nط¹ط³ظ‰ ط£ظ† ظٹظƒظˆظ† ط§ظ„ظ…ط§ظ†ط¹ ط®ظٹط±ط§ظ‹ ًں¤²`;
      }
    },
    {
      id: 'custom',
      label: 'ط±ط³ط§ظ„ط© ظ…ط®طµطµط©',
      icon: 'âœڈï¸ڈ',
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
    const matchGrade = gradeFilter === 'ط§ظ„ظƒظ„' || s.grade === gradeFilter;
    const matchClass = classRoomFilter === 'ط§ظ„ظƒظ„' || s.classRoom === classRoomFilter;
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
    const logEntry = { name: student.fatherName, phone: student.fatherPhone, time: new Date().toLocaleTimeString('ar-LY'), status: 'ط¬ط§ط±ظٹ ط§ظ„ط¥ط±ط³ط§ظ„' as const };
    
    setSentLog(prev => [logEntry, ...prev]);

    try {
      const res = await fetch('/api/wa-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      const data = await res.json();
      if (data.success) {
        setSentLog(prev => prev.map(l => l === logEntry ? { ...l, status: 'طھظ… ط§ظ„ط¥ط±ط³ط§ظ„' } : l));
        return true;
      } else {
        setSentLog(prev => prev.map(l => l === logEntry ? { ...l, status: 'ظپط´ظ„' } : l));
        return false;
      }
    } catch (err) {
      setSentLog(prev => prev.map(l => l === logEntry ? { ...l, status: 'ظپط´ظ„' } : l));
      return false;
    }
  };

  const sendToAll = async () => {
    if (waStatus !== 'ready') { alert('ط§ظ„ظˆط§طھط³ط§ط¨ ط؛ظٹط± ظ…طھطµظ„. ظٹط±ط¬ظ‰ ظ…ط³ط­ ط§ظ„ظƒظˆط¯ ط£ظˆظ„ط§ظ‹.'); return; }
    if (selectedStudentIds.size === 0) { alert('ظٹط±ط¬ظ‰ طھط­ط¯ظٹط¯ ط·ط§ظ„ط¨ ظˆط§ط­ط¯ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„'); return; }
    if (!selectedTemplate) { alert('ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ظ†ظˆط¹ ط§ظ„ط±ط³ط§ظ„ط© ط£ظˆظ„ط§ظ‹'); return; }

    setIsSending(true);
    const ids = Array.from(selectedStudentIds);
    for (const id of ids) {
      await sendSingleMessage(id);
      await new Promise(r => setTimeout(r, 3000));
    }
    setIsSending(false);
    alert('طھظ… ط¥ظ†ظ‡ط§ط، ط§ظ„ط¥ط±ط³ط§ظ„!');
  };

  // Auth Screen
  if (waStatus !== 'ready') {
    return (
      <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
        <button onClick={onBack} style={{ background: 'linear-gradient(135deg, var(--primary-color), #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
          <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>âںµ</span> ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…
        </button>
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 40, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: 600, margin: '0 auto', border: '1px solid var(--border-color)' }}>
          <h2 style={{ color: '#25d366', fontSize: 28, marginBottom: 16 }}>ًں“± ط±ط¨ط· ظˆط§طھط³ط§ط¨ ط¨ط§ظ„ظ†ط¸ط§ظ…</h2>
          
          {waStatus === 'error' && (
            <div style={{ color: 'var(--danger-color)', padding: 20, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, marginBottom: 20 }}>
              <strong>âڑ ï¸ڈ ط§ظ„ط®ط§ط¯ظ… ظ„ط§ ظٹط¹ظ…ظ„:</strong> ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط®ط§ط¯ظ… ظˆط§طھط³ط§ط¨ ط§ظ„ظ…ط¯ظ…ط¬. طھط£ظƒط¯ ظ…ظ† طھط´ط؛ظٹظ„ ط£ظ…ط± (npm start) ظ„طھط´ط؛ظٹظ„ ط§ظ„ظˆط§ط¬ظ‡ط© ظˆط§ظ„ط®ط§ط¯ظ… ظ…ط¹ط§ظ‹.
            </div>
          )}

          {waStatus === 'initializing' && (
            <div style={{ padding: 40 }}>
              <div style={{ fontSize: 40, animation: 'spin 1s linear infinite' }}>âڈ³</div>
              <h3 style={{ marginTop: 20, color: 'var(--text-primary)' }}>ط¬ط§ط±ظٹ طھظ‡ظٹط¦ط© ط§ظ„ظˆط§طھط³ط§ط¨ ط§ظ„ظ…ط®ظپظٹ... ظٹط±ط¬ظ‰ ط§ظ„ط§ظ†طھط¸ط§ط±</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>ظ‡ط°ط§ ظ‚ط¯ ظٹط³طھط؛ط±ظ‚ ط¯ظ‚ظٹظ‚ط© ظپظٹ ط£ظˆظ„ ظ…ط±ط© ظ„طھط´ط؛ظٹظ„ ط§ظ„ظ…طھطµظپط­</p>
            </div>
          )}

          {waStatus === 'qr' && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 24 }}>
                1. ط§ظپطھط­ طھط·ط¨ظٹظ‚ ظˆط§طھط³ط§ط¨ ط¹ظ„ظ‰ ظ‡ط§طھظپظƒ<br/>
                2. ط§ط°ظ‡ط¨ ط¥ظ„ظ‰ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط«ظ… "ط§ظ„ط£ط¬ظ‡ط²ط© ط§ظ„ظ…ط±طھط¨ط·ط©" (Linked Devices)<br/>
                3. ط§ط¶ط؛ط· ط¹ظ„ظ‰ "ط±ط¨ط· ط¬ظ‡ط§ط²" ظˆظ‚ظ… ط¨طھظˆط¬ظٹظ‡ ط§ظ„ظƒط§ظ…ظٹط±ط§ ظ„ظ…ط³ط­ ط§ظ„ظƒظˆط¯ ط£ط¯ظ†ط§ظ‡
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
          <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>âںµ</span> ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', background: '#dcfce7', padding: '6px 14px', borderRadius: 20, fontSize: 14, fontWeight: 'bold' }}>
            <span style={{ width: 10, height: 10, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
            ظˆط§طھط³ط§ط¨ ظ…طھطµظ„
          </span>
          <button onClick={logoutWa} style={{ backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>
            طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: '0 0 20px', color: '#25d366', fontSize: 22 }}>ط§ظ„طھط±ط§ط³ظ„ ط§ظ„ط¢ظ„ظٹ ظˆط§ظ„ط°ظƒظٹ</h2>

          <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>ط§ط®طھط± ظ†ظˆط¹ ط§ظ„ط±ط³ط§ظ„ط©:</h4>
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
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>ظ†طµ ط§ظ„ط±ط³ط§ظ„ط© ط§ظ„ظ…ط®طµطµط©:</label>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="ط§ظƒطھط¨ ط±ط³ط§ظ„طھظƒ ظ‡ظ†ط§..."
                rows={5}
                style={{ width: '100%', padding: 14, borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, fontFamily: 'Cairo', resize: 'vertical', boxSizing: 'border-box', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
            </div>
          )}

          {selectedTemplate && selectedTemplate !== 'custom' && selectedStudentIds.size > 0 && (
            <div style={{ background: 'rgba(37, 211, 102, 0.05)', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 8px', color: '#166534', fontSize: 13 }}>ظ…ط«ط§ظ„ ظ„ط±ط³ط§ظ„ط© ط³طھط±ط³ظ„:</h4>
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
            {isSending ? 'âڈ³ ط¬ط§ط±ظٹ ط¥ط±ط³ط§ظ„ ط§ظ„ط±ط³ط§ط¦ظ„ (ظٹط±ط¬ظ‰ ط§ظ„ط§ظ†طھط¸ط§ط±)...' : `ًں“¤ ط¥ط±ط³ط§ظ„ ط¥ظ„ظ‰ ${selectedStudentIds.size} ظˆظ„ظٹ ط£ظ…ط±`}
          </button>

          {/* Sent Log */}
          {sentLog.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>ط³ط¬ظ„ ط§ظ„ط¥ط±ط³ط§ظ„:</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {sentLog.map((log, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                    <span>{log.status === 'طھظ… ط§ظ„ط¥ط±ط³ط§ظ„' ? 'âœ…' : log.status === 'ظپط´ظ„' ? 'â‌Œ' : 'âڈ³'} {log.name} ({log.phone})</span>
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
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>ط§ط®طھظٹط§ط± ط£ظˆظ„ظٹط§ط، ط§ظ„ط£ظ…ظˆط±</h3>
            <button onClick={() => {
              if (selectedStudentIds.size === filtered.length) setSelectedStudentIds(new Set());
              else setSelectedStudentIds(new Set(filtered.map(s => s.id)));
            }} style={{ background: 'none', border: '1px solid var(--border-color)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {selectedStudentIds.size === filtered.length ? 'ط¥ظ„ط؛ط§ط، ط§ظ„ظƒظ„' : 'طھط­ط¯ظٹط¯ ط§ظ„ظƒظ„'}
            </button>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>ًںژ¯ ط§ظ„ظپط¦ط© ط§ظ„ظ…ط³طھظ‡ط¯ظپط© (ط§ظ„طھطµظپظٹط©)</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <select 
                  value={paymentFilter} 
                  onChange={e => setPaymentFilter(e.target.value as any)} 
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', fontSize: 13, fontWeight: paymentFilter !== 'all' ? 'bold' : 'normal', color: paymentFilter === 'defaulters' ? 'var(--danger-color)' : 'var(--text-primary)' }}
                >
                  <option value="all">ط¬ظ…ظٹط¹ ط§ظ„ط­ط§ظ„ط§طھ ط§ظ„ظ…ط§ظ„ظٹط© (ط§ظ„ظƒظ„)</option>
                  <option value="defaulters">ط§ظ„ظ…طھط®ظ„ظپظٹظ† ط¹ظ† ط§ظ„ط¯ظپط¹ (ط¹ظ„ظٹظ‡ظ… ط£ظ‚ط³ط§ط·)</option>
                  <option value="paid">ط§ظ„ظ…ط³ط¯ط¯ظٹظ† ط¨ط§ظ„ظƒط§ظ…ظ„</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <select value={gradeFilter} onChange={e => {setGradeFilter(e.target.value); setClassRoomFilter('ط§ظ„ظƒظ„');}} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 13 }}>
                  <option value="ط§ظ„ظƒظ„">ط¬ظ…ظٹط¹ ط§ظ„طµظپظˆظپ ط§ظ„ط¯ط±ط§ط³ظٹط©</option>
                  {[...new Set(students.map(s => s.grade))].map(g => <option key={g} value={g}>{g}</option>)}
                </select>

                {gradeFilter !== 'ط§ظ„ظƒظ„' && availableClassRoomsForFilter.length > 0 && (
                  <select value={classRoomFilter} onChange={e => setClassRoomFilter(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 13 }}>
                    <option value="ط§ظ„ظƒظ„">ط¬ظ…ظٹط¹ ط§ظ„ظپطµظˆظ„</option>
                    {availableClassRoomsForFilter.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>

              <input
                placeholder="ًں”چ ط£ظˆ ط§ط¨ط­ط« ط¹ظ† ط·ط§ظ„ط¨ ظ…ط¹ظٹظ† / ظˆظ„ظٹ ط£ظ…ط±..."
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
                      {isSelected && 'âœ“'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 14, color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ظˆظ„ظٹ ط§ظ„ط£ظ…ط±: {s.fatherName}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.grade} {s.classRoom ? `(${s.classRoom})` : ''}</div>
                    {remaining > 0 && <div style={{ fontSize: 11, color: 'var(--danger-color)', fontWeight: 'bold' }}>ظ…ط·ظ„ظˆط¨: {unpaidLabel}</div>}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ ظ…ط·ط§ط¨ظ‚ط©</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
