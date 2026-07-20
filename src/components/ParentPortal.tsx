import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface ParentPortalProps {
  onLogout: () => void;
}

export default function ParentPortal({ onLogout }: ParentPortalProps) {
  const { currentUser, students, timetables, studentResults, attendanceRecords, receipts, gradeFees, refreshFromServer, lessonLogs, studentEvaluations } = useAppContext();
  const [activeTab, setActiveTab] = useState<'info' | 'timetable' | 'results' | 'attendance' | 'educationPath'>('info');
  const [selectedPathSubject, setSelectedPathSubject] = useState('');
  const [pathViewMode, setPathViewMode] = useState<'subject' | 'date'>('subject');
  const [pathDate, setPathDate] = useState(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      refreshFromServer();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshFromServer]);

  // The parent user object has a custom `studentId` attached to it
  const studentId = (currentUser as any)?.studentId;
  const student = students.find(s => s.id === studentId);

  if (!student) {
    return (
      <div style={{ textAlign: 'center', padding: 50, color: 'var(--text-primary)' }}>
        <h2>حدث خطأ: تعذر العثور على بيانات الطالب.</h2>
        <button onClick={onLogout} style={{ padding: '10px 20px', background: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 20 }}>تسجيل الخروج</button>
      </div>
    );
  }

  // Get Timetable for the student's grade and classroom
  const activeKey = `${student.grade}${student.classRoom ? ` - ${student.classRoom}` : ''}`;
  const gradeTimetable = timetables[activeKey] || timetables[student.grade] || [];
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const periods = [1, 2, 3, 4, 5, 6];

  // Get Results
  const midTerm1 = studentResults['نصف الفصل الأول']?.[student.id] || {};
  const finalTerm1 = studentResults['نهاية الفصل الأول']?.[student.id] || {};
  const midTerm2 = studentResults['نصف الفصل الثاني']?.[student.id] || {};
  const finalTerm2 = studentResults['نهاية الفصل الثاني']?.[student.id] || {};
  
  const allSubjects = Array.from(new Set([
    ...Object.keys(midTerm1), 
    ...Object.keys(finalTerm1),
    ...Object.keys(midTerm2),
    ...Object.keys(finalTerm2)
  ]));

  // Get Attendance
  const studentAttendance = (attendanceRecords || []).filter(a => a.studentId === student.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const absentDays = studentAttendance.filter(a => a.status === 'غائب').length;
  const lateDays = studentAttendance.filter(a => a.status === 'متأخر').length;

  // Get Financial Data
  const studentReceipts = (receipts || []).filter(r => r.studentId === student.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalFees = gradeFees?.[student.grade] || student.totalFees || 0;
  const totalPaid = studentReceipts.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
  const totalRemaining = totalFees - totalPaid;
  const dynamicPaymentStatus = totalPaid === 0 ? 'غير مسدد' : (totalPaid >= totalFees ? 'مسدد' : 'جزئي');

  // Get Education Path Data
  const studentLessonLogs = (lessonLogs || []).filter(l => l.grade === student.grade && l.classRoom === student.classRoom).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const studentEvaluationsList = (studentEvaluations || []).filter(e => e.studentId === student.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', padding: 32, borderRadius: 16, marginBottom: 24, boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)', position: 'relative', overflow: 'hidden' }}>
        <button onClick={onLogout} style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontFamily: 'Cairo, sans-serif' }}>
          تسجيل الخروج
        </button>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {student.photo ? (
            <img src={student.photo} alt={student.name} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)' }} />
          ) : (
            <div style={{ width: 100, height: 100, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, border: '3px solid rgba(255,255,255,0.5)' }}>👨‍🎓</div>
          )}
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: 32 }}>مرحباً بك يا ولي أمر الطالب</h1>
            <h2 style={{ margin: 0, fontSize: 24, color: '#bfdbfe' }}>{student.name}</h2>
            <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 8 }}>الصف: {student.grade} - فصل {student.classRoom}</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 8 }}>رقم القيد: {student.enrollmentNumber}</span>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: -20, top: -40, fontSize: 180, opacity: 0.1, zIndex: 1, pointerEvents: 'none' }}>👨‍🎓</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button 
          onClick={() => setActiveTab('info')}
          style={{ flex: 1, padding: '16px', background: activeTab === 'info' ? 'var(--primary-color)' : 'var(--bg-card)', color: activeTab === 'info' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 12, fontWeight: 'bold', fontSize: 18, cursor: 'pointer', transition: '0.3s' }}
        >
          📋 البيانات الأساسية
        </button>
        <button 
          onClick={() => setActiveTab('timetable')}
          style={{ flex: 1, padding: '16px', background: activeTab === 'timetable' ? 'var(--primary-color)' : 'var(--bg-card)', color: activeTab === 'timetable' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 12, fontWeight: 'bold', fontSize: 18, cursor: 'pointer', transition: '0.3s' }}
        >
          📅 الجدول الدراسي
        </button>
        <button 
          onClick={() => setActiveTab('attendance')}
          style={{ flex: 1, padding: '16px', background: activeTab === 'attendance' ? 'var(--primary-color)' : 'var(--bg-card)', color: activeTab === 'attendance' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 12, fontWeight: 'bold', fontSize: 18, cursor: 'pointer', transition: '0.3s' }}
        >
          ⏰ الغياب والحضور
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          style={{ flex: 1, padding: '16px', background: activeTab === 'results' ? 'var(--primary-color)' : 'var(--bg-card)', color: activeTab === 'results' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 12, fontWeight: 'bold', fontSize: 18, cursor: 'pointer', transition: '0.3s' }}
        >
          📊 الدرجات والنتائج
        </button>
        <button 
          onClick={() => setActiveTab('educationPath')}
          style={{ flex: 1, padding: '16px', background: activeTab === 'educationPath' ? 'var(--primary-color)' : 'var(--bg-card)', color: activeTab === 'educationPath' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 12, fontWeight: 'bold', fontSize: 18, cursor: 'pointer', transition: '0.3s' }}
        >
          🛣️ المسار التعليمي
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ background: 'var(--bg-card)', padding: 32, borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 24, borderBottom: '2px solid var(--border-color)', paddingBottom: 10 }}>بيانات الطالب الشخصية</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              <div style={{ padding: 16, background: 'var(--input-bg)', borderRadius: 12 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>الاسم الرباعي</div>
                <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 'bold' }}>{student.name}</div>
              </div>
              <div style={{ padding: 16, background: 'var(--input-bg)', borderRadius: 12 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>تاريخ الميلاد</div>
                <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 'bold' }}>{student.birthDate || 'غير مسجل'}</div>
              </div>
              <div style={{ padding: 16, background: 'var(--input-bg)', borderRadius: 12 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>حالة الرسوم الدراسية</div>
                <div style={{ 
                  color: dynamicPaymentStatus === 'مسدد' ? '#10b981' : dynamicPaymentStatus === 'جزئي' ? '#f59e0b' : '#ef4444', 
                  fontSize: 18, fontWeight: 'bold' 
                }}>
                  {dynamicPaymentStatus}
                </div>
              </div>
              <div style={{ padding: 16, background: 'var(--input-bg)', borderRadius: 12 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>حالة طبية أو ملاحظات</div>
                <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 'bold' }}>{student.medicalCondition || 'لا يوجد ملاحظات'}</div>
              </div>
            </div>

            {/* Financial Section */}
            <h3 style={{ color: 'var(--primary-color)', marginTop: 40, marginBottom: 24, borderBottom: '2px solid var(--border-color)', paddingBottom: 10 }}>💰 الرسوم الدراسية والأقساط</h3>
            
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ padding: 20, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 'bold', marginBottom: 8 }}>الرسوم الإجمالية</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1e40af' }}>{totalFees.toLocaleString()} د.ل</div>
              </div>
              <div style={{ padding: 20, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#10b981', fontWeight: 'bold', marginBottom: 8 }}>إجمالي المدفوع</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#059669' }}>{totalPaid.toLocaleString()} د.ل</div>
              </div>
              <div style={{ padding: 20, background: totalRemaining > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: `1px solid ${totalRemaining > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: totalRemaining > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold', marginBottom: 8 }}>المتبقي</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: totalRemaining > 0 ? '#dc2626' : '#059669' }}>{totalRemaining > 0 ? totalRemaining.toLocaleString() : '0'} د.ل</div>
              </div>
              <div style={{ padding: 20, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#f59e0b', fontWeight: 'bold', marginBottom: 8 }}>عدد الأقساط المسددة</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#d97706' }}>{studentReceipts.length} / {student.installmentsCount || '-'}</div>
              </div>
            </div>

            {/* Receipts Table */}
            {studentReceipts.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontFamily: 'Cairo, sans-serif' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff' }}>
                      <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>رقم الإيصال</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>رقم القسط</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>المبلغ المستحق</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>المبلغ المدفوع</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>المتبقي</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>طريقة الدفع</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentReceipts.map((receipt, idx) => (
                      <tr key={receipt.id} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e40af' }}>{receipt.id}</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>القسط {receipt.installmentNo}</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0' }}>{(receipt.totalDue || 0).toLocaleString()} د.ل</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', color: '#059669', fontWeight: 'bold' }}>{(receipt.paidAmount || 0).toLocaleString()} د.ل</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', color: (receipt.remaining || 0) > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{(receipt.remaining || 0).toLocaleString()} د.ل</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0' }}>{receipt.paymentMethod}</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0' }}>{receipt.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', background: 'var(--input-bg)', borderRadius: 12 }}>
                لا توجد إيصالات دفع مسجلة حتى الآن.
              </div>
            )}
          </div>
        )}

        {/* Timetable Tab */}
        {activeTab === 'timetable' && (
          <div>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 24, borderBottom: '2px solid var(--border-color)', paddingBottom: 10 }}>الجدول الدراسي الأسبوعي - {student.grade}</h3>
            {gradeTimetable.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>لم يتم إعداد الجدول الدراسي بعد.</div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ textAlign: 'center' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 120 }}>اليوم / الحصة</th>
                      {periods.map(p => <th key={p}>الحصة {p}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map(day => (
                      <tr key={day}>
                        <td style={{ fontWeight: 'bold', background: 'var(--bg-hover)' }}>{day}</td>
                        {periods.map(period => {
                          const entry = gradeTimetable.find(e => e.day === day && e.periodId === period);
                          return (
                            <td key={`${day}-${period}`} style={{ padding: 8 }}>
                              {entry ? (
                                <div style={{ background: 'var(--input-bg)', padding: '8px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{entry.subject}</div>
                                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.teacher}</div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 24, borderBottom: '2px solid var(--border-color)', paddingBottom: 10 }}>سجل الحضور والغياب</h3>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1, padding: 20, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ef4444' }}>{absentDays}</div>
                <div style={{ color: '#b91c1c', fontWeight: 'bold' }}>أيام الغياب</div>
              </div>
              <div style={{ flex: 1, padding: 20, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#f59e0b' }}>{lateDays}</div>
                <div style={{ color: '#d97706', fontWeight: 'bold' }}>تأخيرات</div>
              </div>
            </div>

            {studentAttendance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>لا يوجد سجل غياب أو تأخير مسجل.</div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ textAlign: 'center' }}>
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>الحالة</th>
                      <th>ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentAttendance.map(record => (
                      <tr key={record.id}>
                        <td style={{ fontWeight: 'bold' }}>{record.date}</td>
                        <td style={{ fontWeight: 'bold', color: record.status === 'غائب' ? '#ef4444' : record.status === 'متأخر' ? '#f59e0b' : '#10b981' }}>
                          {record.status}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {record.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 24, borderBottom: '2px solid var(--border-color)', paddingBottom: 10 }}>سجل الدرجات</h3>
            {allSubjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>لم يتم رصد أي درجات بعد.</div>
            ) : (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontFamily: 'Cairo, sans-serif' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff' }}>
                      <th style={{ padding: '14px 12px', border: '1px solid #ddd', fontWeight: 'bold', fontSize: 15 }}>المادة</th>
                      <th style={{ padding: '14px 12px', border: '1px solid #ddd', fontWeight: 'bold', fontSize: 15 }}>نصف الأول</th>
                      <th style={{ padding: '14px 12px', border: '1px solid #ddd', fontWeight: 'bold', fontSize: 15 }}>نهاية الأول</th>
                      <th style={{ padding: '14px 12px', border: '1px solid #ddd', fontWeight: 'bold', fontSize: 15 }}>نصف الثاني</th>
                      <th style={{ padding: '14px 12px', border: '1px solid #ddd', fontWeight: 'bold', fontSize: 15 }}>نهاية الثاني</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSubjects.map((sub, idx) => (
                      <tr key={sub} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                        <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', fontWeight: 'bold', background: 'var(--bg-hover)', textAlign: 'right' }}>{sub}</td>
                        <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: midTerm1[sub] ? '#1e40af' : '#cbd5e1', fontSize: 16 }}>
                          {midTerm1[sub] || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: finalTerm1[sub] ? '#1e40af' : '#cbd5e1', fontSize: 16 }}>
                          {finalTerm1[sub] || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: midTerm2[sub] ? '#1e40af' : '#cbd5e1', fontSize: 16 }}>
                          {midTerm2[sub] || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: finalTerm2[sub] ? '#1e40af' : '#cbd5e1', fontSize: 16 }}>
                          {finalTerm2[sub] || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Education Path Tab */}
        {activeTab === 'educationPath' && (() => {
          const subjectColors = ['#2563eb', '#27ae60', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12', '#3498db', '#e91e63', '#00bcd4'];
          const allPathSubjects = Array.from(new Set([
            ...studentLessonLogs.map(l => l.subject),
            ...studentEvaluationsList.map(e => e.subject)
          ]));
          const activeSubject = selectedPathSubject && allPathSubjects.includes(selectedPathSubject) ? selectedPathSubject : (allPathSubjects[0] || '');
          const filteredLessons = studentLessonLogs.filter(l => l.subject === activeSubject);
          const filteredEvals = studentEvaluationsList.filter(e => e.subject === activeSubject);

          return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '2px solid var(--border-color)', paddingBottom: 10, flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>🛣️ المسار التعليمي</h3>
              <div style={{ display: 'flex', gap: '8px', background: 'var(--input-bg)', padding: '4px', borderRadius: '12px' }}>
                <button 
                  onClick={() => setPathViewMode('subject')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: pathViewMode === 'subject' ? '#2563eb' : 'transparent', color: pathViewMode === 'subject' ? '#fff' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  📖 عرض حسب المادة
                </button>
                <button 
                  onClick={() => setPathViewMode('date')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: pathViewMode === 'date' ? '#2563eb' : 'transparent', color: pathViewMode === 'date' ? '#fff' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  📅 سجل اليوميات
                </button>
              </div>
            </div>
            
            {pathViewMode === 'date' && (
              <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '24px' }}>📅</div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>اختر اليوم لعرض ما تم أخذه:</label>
                  <input 
                    type="date" 
                    value={pathDate} 
                    onChange={e => setPathDate(e.target.value)} 
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'Cairo, sans-serif', fontSize: '16px' }} 
                  />
                </div>
              </div>
            )}

            {allPathSubjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--input-bg)', borderRadius: '16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                <p>لا توجد بيانات مسار تعليمي بعد. سيتم عرض الدروس والتقييمات هنا بمجرد إضافتها من قبل المعلمين.</p>
              </div>
            ) : (
              <>
                {/* Subject Tabs */}
                {pathViewMode === 'subject' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                    {allPathSubjects.map((sub, idx) => {
                      const color = subjectColors[idx % subjectColors.length];
                      const isActive = sub === activeSubject;
                      return (
                        <button
                          key={sub}
                          onClick={() => setSelectedPathSubject(sub)}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '25px',
                            border: isActive ? 'none' : '2px solid ' + color,
                            background: isActive ? color : 'transparent',
                            color: isActive ? '#fff' : color,
                            fontWeight: 'bold',
                            fontSize: '15px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontFamily: 'Cairo, sans-serif'
                          }}
                        >
                          📖 {sub}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Lessons Section */}
                <div style={{ background: 'var(--input-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                  <h4 style={{ color: '#27ae60', marginTop: 0 }}>📚 الدروس والواجبات {pathViewMode === 'subject' ? `- ${activeSubject}` : `(تاريخ: ${pathDate})`}</h4>
                  {(pathViewMode === 'subject' ? filteredLessons : studentLessonLogs.filter(l => l.date === pathDate)).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>لا توجد دروس مسجلة {pathViewMode === 'subject' ? 'لهذه المادة بعد' : 'في هذا اليوم'}.</p>
                  ) : (
                    (pathViewMode === 'subject' ? filteredLessons : studentLessonLogs.filter(l => l.date === pathDate)).map(log => (
                      <div key={log.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '12px', background: 'var(--bg-card)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ 
                              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                              background: log.type === 'درس' ? 'rgba(39, 174, 96, 0.15)' : log.type === 'واجب' ? 'rgba(243, 156, 18, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                              color: log.type === 'درس' ? '#27ae60' : log.type === 'واجب' ? '#f39c12' : '#e74c3c'
                            }}>
                              {log.type === 'درس' ? '📖' : log.type === 'واجب' ? '📝' : '📋'} {log.type}
                            </span>
                            {pathViewMode === 'date' && <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>{log.subject}</span>}
                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '16px' }}>{log.topic}</span>
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '4px 10px', borderRadius: '8px' }}>📅 {log.date}</span>
                        </div>
                        {log.homework && (
                          <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(243, 156, 18, 0.08)', borderRadius: '8px', border: '1px solid rgba(243, 156, 18, 0.2)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <strong style={{ color: '#f39c12' }}>📝 الواجب:</strong> {log.homework}
                          </div>
                        )}
                        {(log.imageUrls || log.imageUrl) && (
                          <div style={{ marginTop: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>الصور المرفقة للدرس:</div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              {(log.imageUrls || (log.imageUrl ? [log.imageUrl] : [])).map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt={`مرفق الدرس ${i+1}`} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', border: '2px solid var(--primary-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', objectFit: 'cover' }} />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Evaluations Section */}
                <div style={{ background: 'var(--input-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: '#f59e0b', marginTop: 0 }}>⭐ تقييمات المعلم {pathViewMode === 'subject' ? `- ${activeSubject}` : `(تاريخ: ${pathDate})`}</h4>
                  {(pathViewMode === 'subject' ? filteredEvals : studentEvaluationsList.filter(e => e.date === pathDate)).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>لا توجد تقييمات {pathViewMode === 'subject' ? 'لهذه المادة بعد' : 'في هذا اليوم'}.</p>
                  ) : (
                    (pathViewMode === 'subject' ? filteredEvals : studentEvaluationsList.filter(e => e.date === pathDate)).map(ev => (
                      <div key={ev.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '12px', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            {pathViewMode === 'date' && <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>{ev.subject}</span>}
                            <div style={{ 
                              fontWeight: 'bold', fontSize: '18px',
                              color: ev.rating === 'ممتاز' ? '#27ae60' : ev.rating === 'جيد جداً' ? '#2563eb' : ev.rating === 'جيد' ? '#f39c12' : ev.rating === 'ضعيف' ? '#e74c3c' : '#f59e0b'
                            }}>
                              {ev.rating === 'ممتاز' ? '⭐⭐⭐' : ev.rating === 'جيد جداً' ? '⭐⭐' : ev.rating === 'جيد' ? '⭐' : ev.rating === 'ضعيف' ? '🔻' : '😐'} {ev.rating}
                            </div>
                          </div>
                          {ev.notes && <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>💬 {ev.notes}</div>}
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '4px 10px', borderRadius: '8px' }}>📅 {ev.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
          );
        })()}
      </div>

    </div>
  );
}
