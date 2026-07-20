import { useState, useEffect } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import Students from './components/Students';
import Teachers from './components/Teachers';
import Expenses from './components/Expenses';
import Receipts from './components/Receipts';
import Reports from './components/Reports';
import WithdrawnStudents from './components/WithdrawnStudents';
import Attendance from './components/Attendance';
import Timetable from './components/Timetable';
import WhatsApp from './components/WhatsApp';
import Results from './components/Results';
import Login from './components/Login';
import UsersComponent from './components/Users';
import RecycleBin from './components/RecycleBin';
import Subjects from './components/Subjects';
import Classrooms from './components/Classrooms';
import ParentPortal from './components/ParentPortal';
import TeacherPortal from './components/TeacherPortal';
import { useAppContext } from './context/AppContext';

function App() {
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('qirtas_currentView') || 'dashboard';
  });
  const { schoolName, setSchoolName, schoolLogo, setSchoolLogo, gradeFees, setGradeFees, students, setStudents, receipts, expenses, teachers, currentUser, setCurrentUser, theme, setTheme, timetables, classRooms, recycleBin, users, academicYear, setAcademicYear, studentResults, attendanceRecords, withdrawnStudents, gradeSubjects, isServerLoaded, lessonLogs } = useAppContext();
  
  const [notifications, setNotifications] = useState<{id: number, message: string, type: 'info' | 'warning'}[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('qirtas_currentView', currentView);
  }, [currentView]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  // AUTOMATIC MIGRATION HACK FOR THE USER
  useEffect(() => {
    const doAutoMigrate = async () => {
      if (!isServerLoaded) return;
      // Only run this if we are running locally on localhost
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') return;
      if (localStorage.getItem('qirtas_auto_migrated_to_render')) return;

      const payload = {
        students,
        teachers,
        receipts,
        users,
        settings: { schoolName, gradeFees, classRooms, expenses, timetables, studentResults, attendanceRecords, withdrawnStudents, gradeSubjects, recycleBin }
      };
      
      try {
        console.log('Auto migrating to Render...');
        const res = await fetch('https://nooralbayan.onrender.com/api/migration/migrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ تمت مزامنة جميع بياناتك إلى موقعك الجديد بنجاح! يمكنك الآن إغلاق هذه الصفحة واستخدام الموقع الأونلاين فقط.');
          localStorage.setItem('qirtas_auto_migrated_to_render', 'true');
        }
      } catch (err) {
        console.error('Migration error:', err);
      }
    };
    // Delay slightly to ensure local states are loaded
    setTimeout(doAutoMigrate, 2000);
  }, [students, receipts]);

  // Notification System for periods
  useEffect(() => {
    if (!currentUser) return;
    
    const PERIODS = [
      { id: 1, label: 'الأولى', time: '08:00 - 08:45' },
      { id: 2, label: 'الثانية', time: '08:50 - 09:35' },
      { id: 3, label: 'الثالثة', time: '09:40 - 10:25' },
      { id: 4, label: 'الرابعة', time: '10:45 - 11:30' },
      { id: 5, label: 'الخامسة', time: '11:35 - 12:20' },
      { id: 6, label: 'السادسة', time: '12:25 - 13:10' },
    ];
    
    const checkPeriods = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const dayIndex = now.getDay(); // 0 is Sunday
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
      if (dayIndex > 4) return; // Friday, Saturday
      const today = days[dayIndex];

      PERIODS.forEach((period, idx) => {
        const [, end] = period.time.split(' - ');
        const [endH, endM] = end.split(':').map(Number);
        const endTotal = endH * 60 + endM;

        // Trigger notification exactly when a period ends
        if (minutes === endTotal) {
          const nextPeriod = PERIODS[idx + 1];
          let msg = `انتهت الحصة ${period.label}. `;
          let isWarning = false;

          if (nextPeriod) {
            msg += `تبدأ الحصة ${nextPeriod.label} بعد قليل. `;
            // Check for absent teachers in the next period
            const absentTeachersInNext = [];
            for (const [grade, entries] of Object.entries(timetables)) {
              const entry = entries.find(e => e.day === today && e.periodId === nextPeriod.id);
              if (entry) {
                const teacherObj = teachers.find(t => t.name === entry.teacher);
                if (teacherObj?.isAbsent) {
                  absentTeachersInNext.push(`${teacherObj.name} (حصة ${entry.subject} - ${grade})`);
                }
              }
            }

            if (absentTeachersInNext.length > 0) {
              msg += `\n⚠️ تنبيه غياب: ${absentTeachersInNext.join('، ')} - يرجى توفير بديل!`;
              isWarning = true;
            }
          } else {
            msg += `نهاية الدوام الرسمي!`;
          }

          setNotifications(prev => {
            // Avoid duplicate notifications in the same minute
            if (prev.some(n => n.message === msg)) return prev;
            return [...prev, { id: Date.now(), message: msg, type: isWarning ? 'warning' : 'info' }];
          });
        }
      });
    };

    const interval = setInterval(checkPeriods, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [timetables, teachers, currentUser]);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const menuItems = [
    { id: 'students', label: 'إدارة بيانات الطلاب', icon: '👨‍🎓', roles: ['admin', 'student_affairs'] },
    { id: 'classrooms', label: 'إدارة الفصول الدراسية', icon: '🏫', roles: ['admin', 'student_affairs'] },
    { id: 'teachers', label: 'إدارة المعلمين', icon: '👨‍🏫', roles: ['admin', 'hr'] },
    { id: 'withdrawn', label: 'الطلاب المنسحبون', icon: '⏳', roles: ['admin', 'student_affairs'] },
    { id: 'attendance', label: 'الغياب والحضور', icon: '⏰', roles: ['admin', 'student_affairs', 'hr'] },
    { id: 'timetable', label: 'الجدول الدراسي', icon: '📅', roles: ['admin', 'student_affairs'] },
    { id: 'expenses', label: 'إدارة المصروفات', icon: '🧾', roles: ['admin', 'accountant'] },
    { id: 'receipts', label: 'إدارة سندات القبض', icon: '💵', roles: ['admin', 'accountant'] },
    { id: 'reports', label: 'التقارير', icon: '📊', roles: ['admin', 'accountant'] },
    { id: 'whatsapp', label: 'تواصل أولياء الأمور', icon: '📱', roles: ['admin', 'accountant', 'student_affairs'] },
    { id: 'results', label: 'النتائج المدرسية', icon: '🏆', roles: ['admin', 'student_affairs'] },
    { id: 'subjects', label: 'المواد الدراسية', icon: '📚', roles: ['admin', 'student_affairs'] },
    { id: 'users', label: 'إدارة المستخدمين', icon: '👥', roles: ['admin'] },
    { id: 'settings', label: 'الإعدادات', icon: '⚙️', roles: ['admin'] },
    { id: 'recyclebin', label: 'سلة المحذوفات', icon: '🗑️', roles: ['admin'] },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFeeChange = (grade: string, fee: number) => {
    setGradeFees({ ...gradeFees, [grade]: fee });
  };

  // KPI Calculations
  const totalStudents = students.length;
  const totalCollected = receipts.reduce((acc, r) => acc + r.paidAmount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalCollected - totalExpenses;
  
  // Storage Calculations (ImgBB)
  const totalStudentImages = students.filter(s => s.photo).length;
  const totalTeacherImages = teachers.filter(t => t.photo).length;
  const totalLessonImages = lessonLogs ? lessonLogs.reduce((acc, log) => {
    let count = 0;
    if (log.imageUrl) count += 1;
    if (log.imageUrls && log.imageUrls.length > 0) count += log.imageUrls.length;
    return acc + count;
  }, 0) : 0;
  const hasLogo = schoolLogo && schoolLogo.startsWith('http') ? 1 : 0;
  const totalImagesCount = totalStudentImages + totalTeacherImages + totalLessonImages + hasLogo;
  // Estimate ~500KB per image
  const estimatedStorageMb = (totalImagesCount * 0.5).toFixed(1);

  const renderView = () => {
    switch (currentView) {
      case 'students': return <Students onBack={() => setCurrentView('dashboard')} />;
      case 'teachers': return <Teachers onBack={() => setCurrentView('dashboard')} />;
      case 'withdrawn': return <WithdrawnStudents onBack={() => setCurrentView('dashboard')} />;
      case 'attendance': return <Attendance onBack={() => setCurrentView('dashboard')} />;
      case 'timetable': return <Timetable onBack={() => setCurrentView('dashboard')} />;
      case 'expenses': return <Expenses onBack={() => setCurrentView('dashboard')} />;
      case 'receipts': return <Receipts onBack={() => setCurrentView('dashboard')} />;
      case 'reports': return <Reports onBack={() => setCurrentView('dashboard')} />;
      case 'whatsapp': return <WhatsApp onBack={() => setCurrentView('dashboard')} />;
      case 'results': return <Results onBack={() => setCurrentView('dashboard')} />;
      case 'subjects': return <Subjects onBack={() => setCurrentView('dashboard')} />;
      case 'users': return <UsersComponent onBack={() => setCurrentView('dashboard')} />;
      case 'recyclebin': return <RecycleBin onBack={() => setCurrentView('dashboard')} />;
      case 'classrooms': return <Classrooms onBack={() => setCurrentView('dashboard')} />;
      case 'settings':
        const handleSaveSettings = () => {
          alert('تم حفظ الإعدادات بنجاح!');
        };

        const handleSyncFees = () => {
          if (window.confirm('هل أنت متأكد من تطبيق هذه الرسوم على جميع الطلبة المسجلين؟ سيتم تعديل الرسوم الإجمالية لكل طالب لتطابق هذه الإعدادات (قد يلغي هذا أي تخفيضات يدوية سابقة).')) {
            setStudents(students.map(s => ({
              ...s,
              totalFees: gradeFees[s.grade] || s.totalFees
            })));
            alert('تم تحديث بيانات الرسوم والأقساط لجميع الطلبة بنجاح.');
          }
        };
        
        return (
          <div className="settings-container">
            <button className="btn btn-back" onClick={() => setCurrentView('dashboard')} style={{ background: 'linear-gradient(135deg, var(--primary-color), #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content', marginBottom: 24 }}>
              <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>إعدادات النظام العامة</h2>
              <button onClick={handleSaveSettings} style={{ background: 'var(--success-color)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Cairo' }}>
                💾 حفظ التعديلات
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* General Settings */}
              <div className="card" style={{ padding: 24, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 20, color: 'var(--text-primary)' }}>بيانات المدرسة</h3>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-secondary)' }}>اسم المدرسة / المؤسسة</label>
                  <input 
                    type="text" 
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, boxSizing: 'border-box', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-secondary)' }}>العام الدراسي</label>
                  <input 
                    type="text" 
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, boxSizing: 'border-box', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-secondary)' }}>شعار المدرسة</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, boxSizing: 'border-box', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              {/* Fee Settings */}
              <div className="card" style={{ padding: 24, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 20, color: 'var(--text-primary)' }}>إعدادات رسوم الصفوف (د.ل)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxHeight: 300, overflowY: 'auto', paddingRight: 10 }}>
                  {Object.entries(gradeFees).map(([grade, fee]) => (
                    <div key={grade} style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>{grade}</label>
                      <input 
                        type="number" 
                        value={fee}
                        onChange={(e) => handleFeeChange(grade, Number(e.target.value))}
                        style={{ padding: '8px 12px', borderRadius: 6, width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                      />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleSyncFees} 
                  style={{ marginTop: 20, width: '100%', background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, fontFamily: 'Cairo' }}
                >
                  🔄 تطبيق الرسوم على جميع الطلبة المسجلين مسبقاً
                </button>
              </div>
            </div>

            <div className="card" style={{ marginTop: 24, padding: 24, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 20, color: 'var(--text-primary)' }}>النسخ الاحتياطي للبيانات</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>قم بتنزيل نسخة احتياطية كاملة لجميع بيانات النظام (الطلاب، الرسوم، السندات، الإعدادات) في ملف واحد.</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <button 
                    onClick={() => {
                      const backup = {
                        students, receipts, expenses, teachers, gradeFees, schoolName, classRooms, timetables, recycleBin, users
                      };
                      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `qirtas_backup_${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }} 
                    style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, fontFamily: 'Cairo', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    📥 تحميل نسخة احتياطية
                  </button>
                  <label style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, fontFamily: 'Cairo', display: 'flex', alignItems: 'center', gap: 8 }}>
                    📤 استعادة نسخة احتياطية
                    <input 
                      type="file" 
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!window.confirm('تحذير: سيتم مسح كافة البيانات الحالية واستبدالها ببيانات النسخة الاحتياطية. هل أنت متأكد؟')) return;
                        
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          try {
                            const data = JSON.parse(evt.target?.result as string);
                            Object.keys(data).forEach(key => {
                              window.localStorage.setItem(`qirtas_${key}`, JSON.stringify(data[key]));
                            });
                            alert('تمت استعادة النسخة الاحتياطية بنجاح! سيتم إعادة تحميل النظام.');
                            window.location.reload();
                          } catch (err) {
                            alert('ملف النسخة الاحتياطية غير صالح.');
                          }
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>
                  <button 
                    onClick={async () => {
                      if (!window.confirm('تحذير: سيتم رفع كافة البيانات المحلية إلى السحابة. قد يستغرق هذا بعض الوقت. هل تود الاستمرار؟')) return;
                      try {
                        const payload = {
                          students,
                          teachers,
                          receipts,
                          users,
                          settings: { schoolName, gradeFees, classRooms, expenses, timetables, studentResults, attendanceRecords, withdrawnStudents, gradeSubjects, recycleBin }
                        };
                        const res = await fetch('/api/migration/migrate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert('تم ترحيل البيانات إلى السحابة بنجاح!');
                        } else {
                          alert('حدث خطأ أثناء الترحيل: ' + data.error);
                        }
                      } catch (err) {
                        alert('تعذر الاتصال بالخادم. يرجى التأكد من تشغيل خادم الباك إند.');
                      }
                    }} 
                    style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, fontFamily: 'Cairo', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    ☁️ ترحيل البيانات للسحابة
                  </button>
                </div>
            </div>

          </div>
        );
      default:
        return (
          <div>
            {/* KPI Dashboard Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
              {currentUser?.role === 'admin' || currentUser?.role === 'accountant' ? (
                <>
                  <div style={{ background: 'linear-gradient(135deg, #0056b3, #003d82)', color: '#fff', padding: 24, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <div>
                      <h4 style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>الإيرادات</h4>
                      <h1 style={{ margin: '8px 0 0', fontSize: 26 }}>{totalCollected} <span style={{ fontSize: 14 }}>د.ل</span></h1>
                    </div>
                    <div style={{ fontSize: 30, opacity: 0.5 }}>📥</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', padding: 24, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <div>
                      <h4 style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>المصروفات</h4>
                      <h1 style={{ margin: '8px 0 0', fontSize: 26 }}>{totalExpenses} <span style={{ fontSize: 14 }}>د.ل</span></h1>
                    </div>
                    <div style={{ fontSize: 30, opacity: 0.5 }}>📤</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: 24, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <div>
                      <h4 style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>السيولة الصافية</h4>
                      <h1 style={{ margin: '8px 0 0', fontSize: 26 }}>{netProfit} <span style={{ fontSize: 14 }}>د.ل</span></h1>
                    </div>
                    <div style={{ fontSize: 30, opacity: 0.5 }}>💰</div>
                  </div>
                </>
              ) : (
                <div style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #334155, #1e293b)', color: '#fff', padding: 24, borderRadius: 12, display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ margin: 0, opacity: 0.9 }}>مرحباً بك مجدداً، {currentUser?.name}</h3>
                </div>
              )}
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', padding: 24, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <h4 style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>الطلاب المقيدين</h4>
                  <h1 style={{ margin: '8px 0 0', fontSize: 26 }}>{totalStudents}</h1>
                </div>
                <div style={{ fontSize: 30, opacity: 0.5 }}>👨‍🎓</div>
              </div>
              
              {/* ImgBB Storage KPI */}
              {(currentUser?.role === 'admin') && (
                <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', padding: 24, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <div>
                    <h4 style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>تخزين الصور (ImgBB)</h4>
                    <h1 style={{ margin: '8px 0 0', fontSize: 26 }}>{totalImagesCount} <span style={{ fontSize: 12, opacity: 0.8 }}>صورة (~{estimatedStorageMb}MB)</span></h1>
                    <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10, marginTop: 6, display: 'inline-block' }}>السعة المتبقية: غير محدودة ♾️</div>
                  </div>
                  <div style={{ fontSize: 30, opacity: 0.5 }}>☁️</div>
                </div>
              )}
            </div>

            <h2 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>الوصول السريع</h2>
            <div className="grid-menu" style={{ gap: '24px' }}>
            {menuItems.filter(item => {
              if (currentUser?.role === 'admin') return true;
              if (currentUser?.permissions) return currentUser.permissions.includes(item.id);
              return item.roles.includes(currentUser?.role || '');
            }).map(item => (
              <div 
                key={item.id} 
                className="menu-card" 
                onClick={() => setCurrentView(item.id)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '32px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ 
                  color: 'var(--primary-color)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '24px',
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }} className="icon-wrapper">
                  <span style={{ fontSize: '48px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))', lineHeight: 1 }}>{item.icon}</span>
                </div>
                <div className="title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center' }}>{item.label}</div>
              </div>
            ))}
          </div>
          </div>
        );
    }
  };

  if (!currentUser) {
    return <Login />;
  }

  if (currentUser.role === 'parent') {
    return (
      <div className="app-container" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
        <ParentPortal onLogout={() => {
          if(window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            setCurrentUser(null);
            setCurrentView('dashboard');
          }
        }} />
      </div>
    );
  }

  if (currentUser.role === 'teacher') {
    return (
      <div className="app-container" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
        <TeacherPortal onLogout={() => {
          if(window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            setCurrentUser(null);
            setCurrentView('dashboard');
          }
        }} />
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header - Glassmorphism style */}
      <header className="app-header no-print" style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 40px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {schoolLogo ? (
            <img src={schoolLogo} alt="School Logo" style={{ height: '60px', width: 'auto', borderRadius: '8px', objectFit: 'contain', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
          ) : (
            <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, var(--primary-color), #1e40af)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '28px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)' }}>ش</div>
          )}
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            {schoolName || 'نظام إدارة المدرسة'}
          </h1>
        </div>
        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>{currentUser.name}</span>
            <span style={{ 
              background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 
            }}>
              {currentUser.role === 'admin' ? 'مدير النظام' : currentUser.role === 'accountant' ? 'محاسب' : currentUser.role === 'hr' ? 'شؤون موظفين' : 'شؤون طلبة'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', width: '44px', height: '44px' }}
              title="تغيير المظهر"
            >
              {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
            <button 
              onClick={() => {
                if(window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                  setCurrentUser(null);
                  setCurrentView('dashboard');
                }
              }} 
              style={{ background: 'var(--danger-color)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', width: '44px', height: '44px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}
              title="تسجيل الخروج"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '32px 0' }}>
        {renderView()}
      </main>

      {/* Toast Notifications Container */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifications.map(n => (
          <div key={n.id} className="toast-enter" style={{
            background: n.type === 'warning' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #2563eb, #1e40af)',
            color: '#fff',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            minWidth: 320,
            maxWidth: 400
          }}>
            <div style={{ fontSize: 24 }}>{n.type === 'warning' ? '⚠️' : '🔔'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{n.type === 'warning' ? 'تنبيه غياب!' : 'إشعار الحصص'}</div>
              <div style={{ fontSize: 14, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{n.message}</div>
            </div>
            <button onClick={() => removeNotification(n.id)} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.7, cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;
