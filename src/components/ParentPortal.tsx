import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface ParentPortalProps {
  onLogout: () => void;
}

export default function ParentPortal({ onLogout }: ParentPortalProps) {
  const { currentUser, students, timetables, studentResults, attendanceRecords, gradeFees, receipts, lessonLogs } = useAppContext();
  const [activeTab, setActiveTab] = useState<'info' | 'timetable' | 'results' | 'attendance' | 'lessons'>('info');

  // The parent user object has a custom `studentId` attached to it
  const studentId = (currentUser as any)?.studentId;
  const studentList = Array.isArray(students) ? students : [];
  const student = studentList.find(s => s.id === studentId);

  // Dynamic Payment Calculation
  const studentReceipts = (receipts || []).filter(r => String(r.studentId) === String(student?.id));
  const paidAmount = studentReceipts.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
  const netFees = Math.max(0, (student?.totalFees || 0) - (student?.discountAmount || 0));
  const remainingAmount = Math.max(0, netFees - paidAmount);
  const effectivePaymentStatus = netFees > 0 && remainingAmount <= 0 ? 'مسدد' : paidAmount > 0 ? 'جزئي' : (student?.paymentStatus === 'مسدد' || student?.paymentStatus === 'جزئي' ? student.paymentStatus : 'غير مسدد');

  if (!student) {
    return (
      <div style={{ textAlign: 'center', padding: 50, color: 'var(--text-primary)' }}>
        <h2>حدث خطأ: تعذر العثور على بيانات الطالب.</h2>
        <button onClick={onLogout} style={{ padding: '10px 20px', background: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 20 }}>تسجيل الخروج</button>
      </div>
    );
  }

  // Get Timetable for the student's grade
  const safeTimetables = timetables || {};
  const rawTimetable = safeTimetables[student.grade];
  const gradeTimetable = Array.isArray(rawTimetable) ? rawTimetable : [];
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const periods = [1, 2, 3, 4, 5, 6];

  // Get Results
  const safeResults = studentResults || {};
  const term1Results = safeResults['الفصل الأول']?.[student.id] || {};
  const term2Results = safeResults['الفصل الثاني']?.[student.id] || {};
  const allSubjects = Array.from(new Set([...Object.keys(term1Results), ...Object.keys(term2Results)]));

  // Get Attendance
  const safeAttendance = Array.isArray(attendanceRecords) ? attendanceRecords : [];
  const studentAttendance = safeAttendance.filter(a => a.studentId === student.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const absentDays = studentAttendance.filter(a => a.status === 'غائب').length;
  const lateDays = studentAttendance.filter(a => a.status === 'متأخر').length;

  const safeGradeFees = gradeFees || {};
  const totalFees = safeGradeFees[student.grade] || 0;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', padding: 32, borderRadius: 16, marginBottom: 24, boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)', position: 'relative', overflow: 'hidden' }}>
        {/* Logout Button */}
        <button
          onClick={onLogout}
          style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: 14, fontWeight: 'bold', backdropFilter: 'blur(4px)', transition: '0.2s' }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
          onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        >
          🚪 تسجيل الخروج
        </button>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Student Photo */}
          <div style={{ flexShrink: 0 }}>
            {student.photo ? (
              <img
                src={student.photo}
                alt={student.name}
                style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
              />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, border: '3px solid rgba(255,255,255,0.3)' }}>
                👤
              </div>
            )}
          </div>
          {/* Info */}
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: 28 }}>مرحباً بك يا ولي أمر الطالب</h1>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 22, color: '#bfdbfe' }}>{student.name}</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 8, fontSize: 14 }}>الصف: {student.grade} - فصل {student.classRoom}</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 8, fontSize: 14 }}>رقم القيد: {student.enrollmentNumber}</span>
            </div>
          </div>
        </div>
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
          onClick={() => setActiveTab('lessons')}
          style={{ flex: 1, padding: '16px', background: activeTab === 'lessons' ? 'var(--primary-color)' : 'var(--bg-card)', color: activeTab === 'lessons' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 12, fontWeight: 'bold', fontSize: 18, cursor: 'pointer', transition: '0.3s' }}
        >
          📖 المسار الدروسي والواجبات
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
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>الرسوم الدراسية وحالة السداد</div>
                <div style={{ 
                  color: effectivePaymentStatus === 'مسدد' ? '#10b981' : effectivePaymentStatus === 'جزئي' ? '#f59e0b' : '#ef4444', 
                  fontSize: 18, fontWeight: 'bold', marginBottom: 4 
                }}>
                  الحالة: {effectivePaymentStatus === 'مسدد' ? 'مسدد بالكامل ✅' : effectivePaymentStatus === 'جزئي' ? 'دفع جزئي ⏳' : 'غير مسدد ⚠️'}
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: 14, marginTop: 4 }}>
                  الإجمالي: <strong>{netFees || student.totalFees || totalFees} د.ل</strong> | المدفوع: <strong style={{ color: '#10b981' }}>{paidAmount} د.ل</strong> | المتبقي: <strong style={{ color: '#ef4444' }}>{remainingAmount} د.ل</strong>
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
                <table className="table" style={{ textAlign: 'center' }}>
                  <thead>
                    <tr>
                      <th>المادة</th>
                      <th>الفصل الأول</th>
                      <th>الفصل الثاني</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSubjects.map(sub => (
                      <tr key={sub}>
                        <td style={{ fontWeight: 'bold', background: 'var(--bg-hover)' }}>{sub}</td>
                        <td style={{ fontWeight: 'bold', color: term1Results[sub] ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {term1Results[sub] || '-'}
                        </td>
                        <td style={{ fontWeight: 'bold', color: term2Results[sub] ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {term2Results[sub] || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Lessons Tab */}
        {activeTab === 'lessons' && (
          <div>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 24, borderBottom: '2px solid var(--border-color)', paddingBottom: 10 }}>المسار الدراسي والدروس المنفذة - {student.grade} (فصل {student.classRoom})</h3>
            {(() => {
              const safeLogs = Array.isArray(lessonLogs) ? lessonLogs : [];
              const studentLessons = safeLogs.filter(l => l.grade === student.grade && (!l.classRoom || l.classRoom === 'الكل' || l.classRoom === student.classRoom)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              
              if (studentLessons.length === 0) {
                return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>لم يتم إدراج دروس في المسار الدراسي لصف الطالب حتى الآن.</div>;
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {studentLessons.map(log => (
                    <div key={log.id} style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '4px 12px', borderRadius: 8, fontSize: 13, fontWeight: 'bold' }}>
                          {log.subject}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          📅 {log.date}
                        </span>
                      </div>
                      <h4 style={{ margin: '8px 0', fontSize: 18, color: 'var(--text-primary)' }}>{log.lessonTitle}</h4>
                      {log.teacherName && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>👨‍🏫 المعلم: {log.teacherName}</div>}
                      {log.homework && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderRight: '4px solid #f59e0b', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginTop: 8 }}>
                          📝 <strong>الواجب المنزلي:</strong> {log.homework}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

    </div>
  );
}
