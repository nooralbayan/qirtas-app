import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface ParentPortalProps {
  onLogout: () => void;
}

export default function ParentPortal({ onLogout }: ParentPortalProps) {
  const { currentUser, students, timetables, studentResults, attendanceRecords } = useAppContext();
  const [activeTab, setActiveTab] = useState<'info' | 'timetable' | 'results' | 'attendance'>('info');

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

  // Get Timetable for the student's grade
  const gradeTimetable = timetables[student.grade] || [];
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
                  color: student.paymentStatus === 'مسدد' ? '#10b981' : student.paymentStatus === 'جزئي' ? '#f59e0b' : '#ef4444', 
                  fontSize: 18, fontWeight: 'bold' 
                }}>
                  {student.paymentStatus}
                </div>
              </div>
              <div style={{ padding: 16, background: 'var(--input-bg)', borderRadius: 12 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>حالة طبية أو ملاحظات</div>
                <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 'bold' }}>{student.medicalCondition || 'لا يوجد ملاحظات'}</div>
              </div>
            </div>
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
      </div>

    </div>
  );
}
