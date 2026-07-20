import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { WithdrawnStudent, Student } from '../context/AppContext';

const fmt = (n: number) => n.toLocaleString('en-US');

export default function WithdrawnStudents({ onBack }: { onBack: () => void }) {
  const { students, setStudents, gradeFees, classRooms, withdrawnStudents, setWithdrawnStudents, schoolName, schoolLogo } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [form, setForm] = useState({ studentId: 0, name: '', grade: Object.keys(gradeFees)[0], classRoom: '', withdrawalDate: '', reason: '', refundAmount: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmReenroll, setConfirmReenroll] = useState<number | null>(null);
  const [selectFromList, setSelectFromList] = useState(false);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  const styles = {
    container: { direction: 'rtl' as const, fontFamily: 'Cairo, sans-serif', padding: '30px', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap' as const, gap: '12px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#0056b3', margin: 0 },
    headerActions: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' as const },
    addBtn: { padding: '10px 24px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontFamily: 'Cairo, sans-serif', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' },
    searchInput: { padding: '10px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', fontFamily: 'Cairo, sans-serif', width: '250px' },
    tableWrap: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { backgroundColor: '#0056b3', color: '#fff', padding: '14px 16px', fontSize: '14px', fontWeight: '600', textAlign: 'center' as const, fontFamily: 'Cairo, sans-serif' },
    td: (isHovered: boolean) => ({ padding: '12px 16px', fontSize: '14px', textAlign: 'center' as const, borderBottom: '1px solid #eee', backgroundColor: isHovered ? '#f0f7ff' : 'transparent', transition: 'background 0.2s' }),
    actionBtn: (bg: string) => ({ padding: '6px 14px', backgroundColor: bg, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Cairo, sans-serif', fontWeight: '600', margin: '0 3px' }),
    overlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '32px', width: '550px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
    modalTitle: { fontSize: '22px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px', textAlign: 'center' as const },
    formGroup: { marginBottom: '18px' },
    formLabel: { display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' },
    formInput: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' as const },
    formSelect: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' as const, backgroundColor: 'var(--bg-card)' },
    formTextarea: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' as const, minHeight: '80px', resize: 'vertical' as const },
    formActions: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' },
    submitBtn: { padding: '10px 32px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontFamily: 'Cairo, sans-serif', fontWeight: '600' },
    cancelBtn: { padding: '10px 32px', backgroundColor: '#e9ecef', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontFamily: 'Cairo, sans-serif', fontWeight: '600' },
    statsBar: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' as const },
    statCard: (color: string) => ({ flex: '1', minWidth: '180px', backgroundColor: 'var(--bg-card)', borderRadius: '10px', padding: '20px', textAlign: 'center' as const, borderTop: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }),
    statValue: (color: string) => ({ fontSize: '28px', fontWeight: '700', color, marginBottom: '4px' }),
    statLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
    confirmBox: { textAlign: 'center' as const, padding: '20px' },
    confirmText: { fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px', lineHeight: '1.8' },
    empty: { textAlign: 'center' as const, padding: '60px 20px', color: 'var(--text-muted)', fontSize: '16px' },
  };

  const filteredStudents = withdrawnStudents.filter(s =>
    s.name.includes(searchTerm) || s.grade.includes(searchTerm) || s.reason.includes(searchTerm)
  );

  const totalRefunds = withdrawnStudents.reduce((s, st) => s + st.refundAmount, 0);

  const handleSelectStudent = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setForm({
        ...form,
        studentId: student.id,
        name: student.name,
        grade: student.grade,
        classRoom: student.classRoom || '',
      });
      setSelectFromList(false);
      setSearchStudentQuery('');
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.grade || !form.withdrawalDate || !form.reason) return;

    const student = students.find(s => s.id === form.studentId);
    const originalStudent: Student = student || {
      id: form.studentId,
      enrollmentNumber: '',
      nationalId: '',
      name: form.name,
      photo: null,
      birthDate: '',
      grade: form.grade,
      classRoom: form.classRoom,
      address: '',
      fatherName: '',
      fatherPhone: '',
      motherName: '',
      motherPhone: '',
      specialNeeds: '',
      medicalCondition: '',
      medication: '',
      notes: '',
      totalFees: gradeFees[form.grade] || 0,
      installmentsCount: 2,
      paymentStatus: 'غير مسدد',
    };

    const newWithdrawn: WithdrawnStudent = {
      id: Math.max(0, ...withdrawnStudents.map(s => s.id), 0) + 1,
      studentId: form.studentId,
      name: form.name,
      grade: form.grade,
      classRoom: form.classRoom,
      withdrawalDate: form.withdrawalDate,
      reason: form.reason,
      refundAmount: parseFloat(form.refundAmount as any) || 0,
      originalStudent,
    };
    setWithdrawnStudents(prev => [...prev, newWithdrawn]);

    // Remove from active students
    if (form.studentId > 0) {
      setStudents(prev => prev.filter(s => s.id !== form.studentId));
    }

    setForm({ studentId: 0, name: '', grade: Object.keys(gradeFees)[0], classRoom: '', withdrawalDate: '', reason: '', refundAmount: '' });
    setShowForm(false);
  };

  const handleReenroll = (id: number) => {
    const withdrawn = withdrawnStudents.find(s => s.id === id);
    if (!withdrawn) return;

    // Re-add student to active list with wasWithdrawn flag
    const restoredStudent: Student = {
      ...withdrawn.originalStudent,
      id: Math.max(0, ...students.map(s => s.id)) + 1,
      wasWithdrawn: true,
      notes: (withdrawn.originalStudent.notes ? withdrawn.originalStudent.notes + ' | ' : '') + `أعيد تسجيله بتاريخ ${new Date().toLocaleDateString('ar-LY')} - سبب الانسحاب السابق: ${withdrawn.reason}`,
    };

    setStudents(prev => [...prev, restoredStudent]);
    setWithdrawnStudents(prev => prev.filter(s => s.id !== id));
    setConfirmReenroll(null);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      setWithdrawnStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📤 الطلاب المنسحبون</h1>
        <div style={styles.headerActions}>
          <input
            type="text" placeholder="🔍 بحث عن طالب منسحب..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <button style={styles.addBtn} onClick={() => setShowForm(true)}>+ تسجيل انسحاب طالب</button>
          <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content', marginTop: 10 }}>
            <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsBar}>
        <div style={styles.statCard('#e74c3c')}>
          <div style={styles.statValue('#e74c3c')}>{withdrawnStudents.length}</div>
          <div style={styles.statLabel}>إجمالي المنسحبين</div>
        </div>
        <div style={styles.statCard('#f39c12')}>
          <div style={styles.statValue('#f39c12')}>{fmt(totalRefunds)}</div>
          <div style={styles.statLabel}>إجمالي المبالغ المستردة (د.ل)</div>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>م</th>
              <th style={styles.th}>اسم الطالب</th>
              <th style={styles.th}>الصف</th>
              <th style={styles.th}>الفصل</th>
              <th style={styles.th}>تاريخ الانسحاب</th>
              <th style={styles.th}>السبب</th>
              <th style={styles.th}>المبلغ المسترد</th>
              <th style={styles.th}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr><td colSpan={8} style={styles.empty}>لا يوجد طلاب منسحبون حالياً</td></tr>
            ) : (
              filteredStudents.map((s, i) => (
                <tr key={s.id} onMouseEnter={() => setHoveredRow(s.id)} onMouseLeave={() => setHoveredRow(null)}>
                  <td style={styles.td(hoveredRow === s.id)}>{i + 1}</td>
                  <td style={{ ...styles.td(hoveredRow === s.id), fontWeight: '600', textAlign: 'right' }}>{s.name}</td>
                  <td style={styles.td(hoveredRow === s.id)}>{s.grade}</td>
                  <td style={styles.td(hoveredRow === s.id)}>{s.classRoom || '-'}</td>
                  <td style={styles.td(hoveredRow === s.id)}>{s.withdrawalDate}</td>
                  <td style={{ ...styles.td(hoveredRow === s.id), fontSize: '13px', maxWidth: '200px', textAlign: 'right' }}>{s.reason}</td>
                  <td style={{ ...styles.td(hoveredRow === s.id), fontWeight: '600', color: '#e74c3c' }}>{fmt(s.refundAmount)} د.ل</td>
                  <td style={styles.td(hoveredRow === s.id)}>
                    <button style={styles.actionBtn('#27ae60')} onClick={() => setConfirmReenroll(s.id)}>🔄 إعادة تسجيل</button>
                    <button style={styles.actionBtn('#e74c3c')} onClick={() => handleDelete(s.id)}>🗑️ حذف</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Withdrawal Form Modal */}
      {showForm && (
        <div style={styles.overlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>📤 تسجيل انسحاب طالب</h2>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>اختيار الطالب من القائمة</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder={form.name ? `✅ ${form.name}` : '🔍 ابحث عن اسم الطالب هنا...'}
                  value={searchStudentQuery}
                  onChange={e => {
                    setSearchStudentQuery(e.target.value);
                    setSelectFromList(true);
                  }}
                  onFocus={() => setSelectFromList(true)}
                  style={{ ...styles.formInput, borderColor: '#0056b3' }}
                />
                {selectFromList && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 8, marginTop: 4, backgroundColor: 'var(--bg-card)', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {students.filter(s => s.name.includes(searchStudentQuery)).length > 0 ? (
                      students.filter(s => s.name.includes(searchStudentQuery)).map(s => (
                        <div key={s.id} onClick={() => handleSelectStudent(s.id)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: 14 }}>
                          {s.name} - <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.grade} {s.classRoom ? `(${s.classRoom})` : ''}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>لا توجد نتائج مطابقة</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!form.studentId && (
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>أو اكتب اسم الطالب يدوياً *</label>
                <input style={styles.formInput} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="أدخل اسم الطالب الرباعي" />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>الصف *</label>
                <select style={styles.formSelect} value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
                  {Object.keys(gradeFees).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>الفصل</label>
                <select style={styles.formSelect} value={form.classRoom} onChange={e => setForm({ ...form, classRoom: e.target.value })}>
                  <option value="">-</option>
                  {(classRooms[form.grade] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>تاريخ الانسحاب *</label>
                <input type="date" style={styles.formInput} value={form.withdrawalDate} onChange={e => setForm({ ...form, withdrawalDate: e.target.value })} />
              </div>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>المبلغ المسترد (د.ل)</label>
                <input type="number" style={styles.formInput} value={form.refundAmount} onChange={e => setForm({ ...form, refundAmount: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>سبب الانسحاب *</label>
              <textarea style={styles.formTextarea} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="اذكر سبب انسحاب الطالب" />
            </div>
            <div style={styles.formActions}>
              <button style={styles.submitBtn} onClick={handleSubmit}>✓ تسجيل الانسحاب</button>
              <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Re-enroll Confirmation Modal */}
      {confirmReenroll !== null && (
        <div style={styles.overlay} onClick={() => setConfirmReenroll(null)}>
          <div style={{ ...styles.modal, width: '420px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.confirmBox}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', marginBottom: '12px' }}>تأكيد إعادة التسجيل</h3>
              <p style={styles.confirmText}>
                هل تريد إعادة تسجيل الطالب <strong>{withdrawnStudents.find(s => s.id === confirmReenroll)?.name}</strong>؟
                <br />سيتم نقله إلى قائمة الطلاب النشطين في فصله السابق <strong>({withdrawnStudents.find(s => s.id === confirmReenroll)?.grade} - {withdrawnStudents.find(s => s.id === confirmReenroll)?.classRoom || 'غير محدد'})</strong>
                <br /><span style={{ color: '#e74c3c', fontSize: 14 }}>⚠ سيظهر علم بجانب اسمه يوضح أنه أعيد تسجيله</span>
              </p>
              <div style={styles.formActions}>
                <button style={{ ...styles.submitBtn, backgroundColor: '#27ae60' }} onClick={() => handleReenroll(confirmReenroll)}>✓ نعم، إعادة التسجيل</button>
                <button style={styles.cancelBtn} onClick={() => setConfirmReenroll(null)}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
