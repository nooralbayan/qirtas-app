import React from 'react';

const getArabicOrdinal = (rank: number, gender: 'ذكر' | 'أنثى' | 'غير محدد' = 'ذكر'): string => {
  const ordinalsM = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
  const ordinalsF = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'];
  if (rank >= 1 && rank <= 10) return gender === 'أنثى' ? ordinalsF[rank - 1] : ordinalsM[rank - 1];
  return rank.toString();
};

interface StudentReportCardProps {
  student: {
    id: number;
    name: string;
    grade: string;
    classRoom: string;
    enrollmentNumber: string;
    gender?: 'ذكر' | 'أنثى' | 'غير محدد';
  };
  examType: string;
  results: Record<string, string>;
  subjects: string[];
  totalScore?: number;
  rank?: number;
  schoolName: string;
  schoolLogo: string;
  academicYear: string;
}

export const StudentReportCard = React.forwardRef<HTMLDivElement, StudentReportCardProps>(
  ({ student, examType, results, subjects, totalScore, rank, schoolName, schoolLogo, academicYear }, ref) => {
    
    return (
      <div 
        ref={ref} 
        style={{
          width: '800px', // Fixed width for A4-like aspect ratio
          minHeight: '1130px',
          padding: '40px',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontFamily: "'Cairo', sans-serif",
          direction: 'rtl',
          boxSizing: 'border-box',
          position: 'relative',
          border: rank !== undefined ? '15px solid #fbbf24' : '15px solid #1e3a8a', // Gold for top students
        }}
      >
        {/* Inner border */}
        <div style={{
          position: 'absolute',
          top: 20, left: 20, right: 20, bottom: 20,
          border: rank !== undefined ? '2px solid #1e3a8a' : '2px solid #fbbf24', // Swap inner border for top students
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '3px solid #1e3a8a', paddingBottom: '20px' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '28px', fontWeight: 'bold' }}>{schoolName}</h2>
            <p style={{ margin: '5px 0 0', fontSize: '16px', color: 'var(--text-secondary)' }}>قسم شؤون الطلبة والامتحانات</p>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {schoolLogo?.startsWith('data:image') ? (
              <img src={schoolLogo} alt="Logo" style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #1e3a8a', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#1e3a8a' }}>
                {schoolLogo || '🎓'}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '24px' }}>
              {rank !== undefined ? 'شهادة تفوق وتقدير 🏆' : 'شهادة درجات'}
            </h2>
            <p style={{ margin: '5px 0 0', fontSize: '16px', color: 'var(--text-secondary)' }}>للعام الدراسي {academicYear}</p>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ textAlign: 'center', color: '#1e3a8a', fontSize: '32px', marginBottom: '40px', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
          نتائج اختبارات {examType}
        </h1>

        {/* Student Info Box */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', 
          backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px',
          border: '1px solid #e2e8f0', marginBottom: '40px'
        }}>
          <div>
            <p style={{ margin: '5px 0', fontSize: '18px' }}><strong style={{ color: '#1e3a8a' }}>{student.gender === 'أنثى' ? 'اسم الطالبة:' : 'اسم الطالب:'}</strong> {student.name}</p>
            <p style={{ margin: '5px 0', fontSize: '18px' }}><strong style={{ color: '#1e3a8a' }}>رقم القيد:</strong> {student.enrollmentNumber || student.id}</p>
          </div>
          <div>
            <p style={{ margin: '5px 0', fontSize: '18px' }}><strong style={{ color: '#1e3a8a' }}>الصف:</strong> {student.grade}</p>
            <p style={{ margin: '5px 0', fontSize: '18px' }}><strong style={{ color: '#1e3a8a' }}>الفصل الدراسي:</strong> {student.classRoom || '-'}</p>
          </div>
        </div>

        {/* Grades Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e3a8a', color: '#fff' }}>
              <th style={{ padding: '15px', textAlign: 'center', border: '1px solid #cbd5e1', fontSize: '18px', width: '60%' }}>المادة الدراسية</th>
              <th style={{ padding: '15px', textAlign: 'center', border: '1px solid #cbd5e1', fontSize: '18px', width: '40%' }}>الدرجة</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subj, index) => {
              const scoreStr = results[subj] || '-';
              const scoreNum = parseFloat(scoreStr);
              let scoreColor = '#333';
              if (!isNaN(scoreNum)) {
                if (scoreNum < 50) scoreColor = '#dc2626'; // Red for fail
                else if (scoreNum >= 90) scoreColor = '#16a34a'; // Green for excellent
              }

              return (
                <tr key={subj} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ padding: '15px', textAlign: 'center', border: '1px solid #cbd5e1', fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' }}>{subj}</td>
                  <td style={{ padding: '15px', textAlign: 'center', border: '1px solid #cbd5e1', fontSize: '20px', fontWeight: 'bold', color: scoreColor }}>{scoreStr}</td>
                </tr>
              )
            })}
            
            {totalScore !== undefined && (
              <tr style={{ backgroundColor: '#fef3c7' }}>
                <td style={{ padding: '15px', textAlign: 'center', border: '1px solid #cbd5e1', fontSize: '20px', fontWeight: 'bold', color: '#b45309' }}>المجموع الكلي</td>
                <td style={{ padding: '15px', textAlign: 'center', border: '1px solid #cbd5e1', fontSize: '22px', fontWeight: 'bold', color: '#b45309' }}>{totalScore}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Rank & Congratulations */}
        {rank !== undefined && rank <= 10 && (
          <div style={{ textAlign: 'center', margin: '30px 0', padding: '20px', backgroundColor: '#ecfdf5', border: '2px dashed #10b981', borderRadius: '12px' }}>
            <h2 style={{ margin: 0, color: '#047857', fontSize: '28px' }}>🎉 تـهـانـيـنـا! 🎉</h2>
            <p style={{ fontSize: '20px', color: '#065f46', marginTop: '10px' }}>
              {student.gender === 'أنثى' ? 'الطالبة حاصلة على الترتيب' : 'الطالب حاصل على الترتيب'} <strong>{getArabicOrdinal(rank, student.gender)}</strong> على مستوى الفصل.
            </p>
          </div>
        )}

        {/* Footer Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', padding: '0 40px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '40px' }}>اعتماد المعلم</p>
            <p>.................................</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '40px' }}>ختم المدرسة</p>
            <div style={{ width: '80px', height: '80px', border: '2px solid #cbd5e1', borderRadius: '50%', margin: '0 auto' }}></div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '40px' }}>مدير المدرسة</p>
            <p>.................................</p>
          </div>
        </div>

      </div>
    );
  }
);

StudentReportCard.displayName = 'StudentReportCard';
