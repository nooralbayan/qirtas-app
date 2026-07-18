import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function Classrooms({ onBack }: { onBack: () => void }) {
  const { students, setStudents, gradeFees, classRooms, setClassRooms, schoolName, schoolLogo } = useAppContext();
  const [selectedGrade, setSelectedGrade] = useState<string>(Object.keys(gradeFees)[0] || '');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showParents, setShowParents] = useState(false);

  const grades = Object.keys(gradeFees);
  const currentClassRooms = classRooms[selectedGrade] || ['أ'];

  // Get students for selected grade & class
  const gradeStudents = students.filter(s => s.grade === selectedGrade);
  const classStudents = selectedClass
    ? gradeStudents.filter(s => s.classRoom === selectedClass)
    : gradeStudents;

  // Stats
  const maleCount = (list: typeof students) => list.filter(s => s.gender === 'ذكر').length;
  const femaleCount = (list: typeof students) => list.filter(s => s.gender === 'أنثى').length;
  const unknownCount = (list: typeof students) => list.filter(s => !s.gender || s.gender === 'غير محدد').length;

  // ─── Smart Auto Distribution ───
  const handleSmartDistribute = () => {
    if (!selectedGrade) return;
    const gradeStudentsList = students.filter(s => s.grade === selectedGrade);
    if (gradeStudentsList.length === 0) {
      alert('لا يوجد طلاب في هذا الصف لتوزيعهم.');
      return;
    }

    const MAX_PER_CLASS = 30;
    const totalStudents = gradeStudentsList.length;
    const neededClasses = Math.ceil(totalStudents / MAX_PER_CLASS);

    // Generate class names
    const classLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];
    const newClassNames = classLetters.slice(0, neededClasses);

    // Confirm
    if (!window.confirm(
      `سيتم توزيع ${totalStudents} طالب/طالبة في "${selectedGrade}" على ${neededClasses} فصل (بحد أقصى ${MAX_PER_CLASS} لكل فصل) مع محاولة التوازن بين الذكور والإناث.\n\nالفصول: ${newClassNames.join('، ')}\n\nهل تريد المتابعة؟`
    )) return;

    // Split by gender
    const males = gradeStudentsList.filter(s => s.gender === 'ذكر');
    const females = gradeStudentsList.filter(s => s.gender === 'أنثى');
    const unknown = gradeStudentsList.filter(s => !s.gender || s.gender === 'غير محدد');

    // Shuffle for fairness
    const shuffle = (arr: typeof students) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const shuffledMales = shuffle(males);
    const shuffledFemales = shuffle(females);
    const shuffledUnknown = shuffle(unknown);

    // Distribute round-robin
    const buckets: Map<string, number[]> = new Map();
    newClassNames.forEach(cn => buckets.set(cn, []));

    let idx = 0;
    // Distribute males
    for (const s of shuffledMales) {
      const className = newClassNames[idx % neededClasses];
      buckets.get(className)!.push(s.id);
      idx++;
    }
    // Distribute females
    idx = 0;
    for (const s of shuffledFemales) {
      const className = newClassNames[idx % neededClasses];
      buckets.get(className)!.push(s.id);
      idx++;
    }
    // Distribute unknown
    idx = 0;
    for (const s of shuffledUnknown) {
      const className = newClassNames[idx % neededClasses];
      buckets.get(className)!.push(s.id);
      idx++;
    }

    // Build id -> className map
    const idToClass: Record<number, string> = {};
    buckets.forEach((ids, className) => {
      ids.forEach(id => { idToClass[id] = className; });
    });

    // Update students
    setStudents(prev => prev.map(s => {
      if (s.grade === selectedGrade && idToClass[s.id]) {
        return { ...s, classRoom: idToClass[s.id] };
      }
      return s;
    }));

    // Update classRooms registry
    setClassRooms(prev => ({ ...prev, [selectedGrade]: newClassNames }));

    // Show summary
    let summary = `✅ تم التوزيع بنجاح!\n\n`;
    newClassNames.forEach(cn => {
      const ids = buckets.get(cn)!;
      const cStudents = gradeStudentsList.filter(s => ids.includes(s.id));
      const m = cStudents.filter(s => s.gender === 'ذكر').length;
      const f = cStudents.filter(s => s.gender === 'أنثى').length;
      const u = cStudents.length - m - f;
      summary += `فصل ${cn}: ${cStudents.length} طالب (${m} ذكور، ${f} إناث${u > 0 ? `، ${u} غير محدد` : ''})\n`;
    });
    alert(summary);
  };

  // ─── Print Class List ───
  const handlePrintClassList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const listStudents = classStudents;
    const title = `قائمة طلبة ${selectedGrade}${selectedClass ? ' - فصل ' + selectedClass : ''}`;
    const m = maleCount(listStudents);
    const f = femaleCount(listStudents);
    const u = unknownCount(listStudents);

    const logoHtml = schoolLogo?.startsWith('data:image')
      ? `<img src="${schoolLogo}" alt="Logo" style="height:60px;" />`
      : `<div style="font-size:30px;">${schoolLogo || ''}</div>`;

    const today = new Date().toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = listStudents.map((s, i) => `
      <tr style="background:${i % 2 === 0 ? '#fafbfc' : '#fff'};">
        <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">${i + 1}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;">${s.enrollmentNumber || '-'}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;font-weight:600;">${s.name}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">${s.gender || 'غير محدد'}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;">${s.nationalId || '-'}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;">${s.notes || '-'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px 30px; color: #111; }
          @page { size: A4; margin: 12mm 10mm; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1e3a5f; color: #fff; padding: 6px 8px; font-size: 11px; border: 1px solid #1e3a5f; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 12px; }
          .stats { display: flex; gap: 20px; margin: 10px 0 16px; font-size: 13px; color: #444; }
          .stats span { background: #f0f4f8; padding: 4px 12px; border-radius: 6px; font-weight: 600; }
          .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #555; padding-top: 12px; border-top: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="font-size:20px;margin-bottom:4px;">${schoolName}</h2>
            <h4 style="color:#555;font-weight:500;">${title}</h4>
            <p style="font-size:12px;color:#888;margin-top:4px;">تاريخ الطباعة: ${today} | عدد الطلاب: ${listStudents.length}</p>
          </div>
          <div>${logoHtml}</div>
        </div>

        <div class="stats">
          <span>👨‍🎓 الإجمالي: ${listStudents.length}</span>
          <span>🧑 ذكور: ${m}</span>
          <span>👩 إناث: ${f}</span>
          ${u > 0 ? `<span>❓ غير محدد: ${u}</span>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:5%;">م</th>
              <th style="width:12%;">رقم القيد</th>
              <th style="width:30%;">اسم الطالب</th>
              <th style="width:10%;">الجنس</th>
              <th style="width:20%;">الرقم الوطني</th>
              <th style="width:23%;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          <div>الموقع: ..................</div>
          <div>المدير: ..................</div>
          <div>الختم: ..................</div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 600);
  };

  // ─── Print Parents List ───
  const handlePrintParentsList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const listStudents = classStudents;
    const title = `بيانات أولياء الأمور - ${selectedGrade}${selectedClass ? ' - فصل ' + selectedClass : ''}`;

    const logoHtml = schoolLogo?.startsWith('data:image')
      ? `<img src="${schoolLogo}" alt="Logo" style="height:60px;" />`
      : `<div style="font-size:30px;">${schoolLogo || ''}</div>`;

    const today = new Date().toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = listStudents.map((s, i) => `
      <tr style="background:${i % 2 === 0 ? '#fafbfc' : '#fff'};">
        <td style="border:1px solid #bbb;padding:4px 8px;text-align:center;font-size:11px;">${i + 1}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;font-weight:600;">${s.name}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;">${s.fatherName || '-'}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;direction:ltr;text-align:center;">${s.fatherPhone || '-'}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;">${s.motherName || '-'}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;direction:ltr;text-align:center;">${s.motherPhone || '-'}</td>
        <td style="border:1px solid #bbb;padding:4px 8px;font-size:11px;">${s.address || '-'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px 30px; color: #111; }
          @page { size: A4 landscape; margin: 10mm; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1e3a5f; color: #fff; padding: 6px 8px; font-size: 11px; border: 1px solid #1e3a5f; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 16px; }
          .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #555; padding-top: 12px; border-top: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="font-size:20px;margin-bottom:4px;">${schoolName}</h2>
            <h4 style="color:#555;font-weight:500;">${title}</h4>
            <p style="font-size:12px;color:#888;margin-top:4px;">تاريخ الطباعة: ${today} | عدد الطلاب: ${listStudents.length}</p>
          </div>
          <div>${logoHtml}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:4%;">م</th>
              <th style="width:18%;">اسم الطالب</th>
              <th style="width:18%;">اسم ولي الأمر</th>
              <th style="width:14%;">هاتف الأب</th>
              <th style="width:16%;">اسم الأم</th>
              <th style="width:14%;">هاتف الأم</th>
              <th style="width:16%;">العنوان</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          <div>الموقع: ..................</div>
          <div>المدير: ..................</div>
          <div>الختم: ..................</div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 600);
  };

  // Styles
  const inputStyle: React.CSSProperties = { padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', outline: 'none', width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif', padding: 24, backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
        <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
      </button>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#0056b3', fontSize: 26 }}>🏫 إدارة الفصول الدراسية</h2>
        </div>

        {/* Grade Selector */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <select
            value={selectedGrade}
            onChange={(e) => { setSelectedGrade(e.target.value); setSelectedClass(''); }}
            style={{ ...inputStyle, maxWidth: 220 }}
          >
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ ...inputStyle, maxWidth: 180 }}
          >
            <option value="">كل الفصول</option>
            {currentClassRooms.map(c => <option key={c} value={c}>فصل {c}</option>)}
          </select>

          <button onClick={handleSmartDistribute} style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            🤖 توزيع ذكي للطلاب
          </button>
          <button onClick={handlePrintClassList} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            🖨️ طباعة قائمة الطلاب
          </button>
          <button onClick={handlePrintParentsList} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            👨‍👩‍👧 طباعة بيانات أولياء الأمور
          </button>
          <button onClick={() => setShowParents(!showParents)} style={{ backgroundColor: showParents ? '#f59e0b' : '#64748b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            {showParents ? '📋 عرض بيانات الطلاب' : '👥 عرض بيانات أولياء الأمور'}
          </button>
        </div>

        {/* Grade Overview - Class Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {currentClassRooms.map(cr => {
            const cStudents = gradeStudents.filter(s => s.classRoom === cr);
            const m = maleCount(cStudents);
            const f = femaleCount(cStudents);
            const total = cStudents.length;
            const isFull = total >= 30;
            return (
              <div
                key={cr}
                onClick={() => setSelectedClass(selectedClass === cr ? '' : cr)}
                style={{
                  background: selectedClass === cr ? 'linear-gradient(135deg, #2563eb, #1e40af)' : 'var(--bg-primary)',
                  color: selectedClass === cr ? '#fff' : 'var(--text-primary)',
                  borderRadius: 12,
                  padding: 20,
                  cursor: 'pointer',
                  border: isFull ? '2px solid #ef4444' : '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedClass === cr ? '0 4px 15px rgba(37, 99, 235, 0.4)' : 'none',
                }}
              >
                <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>فصل {cr}</h3>
                <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>{total}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, opacity: 0.85 }}>
                  <span>🧑 {m}</span>
                  <span>👩 {f}</span>
                </div>
                {isFull && <div style={{ marginTop: 8, fontSize: 12, color: selectedClass === cr ? '#fca5a5' : '#ef4444', fontWeight: 700 }}>⚠️ الفصل ممتلئ</div>}
              </div>
            );
          })}
        </div>

        {/* Summary Bar */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ background: 'linear-gradient(135deg, #0056b3, #003d82)', color: '#fff', padding: '14px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
            👨‍🎓 الإجمالي: {classStudents.length}
          </div>
          <div style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', color: '#fff', padding: '14px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
            🧑 ذكور: {maleCount(classStudents)}
          </div>
          <div style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)', color: '#fff', padding: '14px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
            👩 إناث: {femaleCount(classStudents)}
          </div>
          {unknownCount(classStudents) > 0 && (
            <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', padding: '14px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
              ❓ غير محدد: {unknownCount(classStudents)}
            </div>
          )}
        </div>

        {/* Students / Parents Table */}
        <div style={{ overflowX: 'auto' }}>
          {showParents ? (
            /* Parents View */
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: 12, minWidth: 40 }}>م</th>
                  <th style={{ padding: 12 }}>اسم الطالب</th>
                  <th style={{ padding: 12 }}>الفصل</th>
                  <th style={{ padding: 12 }}>اسم ولي الأمر</th>
                  <th style={{ padding: 12 }}>هاتف الأب</th>
                  <th style={{ padding: 12 }}>اسم الأم</th>
                  <th style={{ padding: 12 }}>هاتف الأم</th>
                  <th style={{ padding: 12 }}>العنوان</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 12 }}>{i + 1}</td>
                    <td style={{ padding: 12, fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: 12 }}>{s.classRoom || '-'}</td>
                    <td style={{ padding: 12, fontWeight: 600, color: '#0056b3' }}>{s.fatherName || '-'}</td>
                    <td style={{ padding: 12, direction: 'ltr', textAlign: 'center' }}>{s.fatherPhone || '-'}</td>
                    <td style={{ padding: 12 }}>{s.motherName || '-'}</td>
                    <td style={{ padding: 12, direction: 'ltr', textAlign: 'center' }}>{s.motherPhone || '-'}</td>
                    <td style={{ padding: 12 }}>{s.address || '-'}</td>
                  </tr>
                ))}
                {classStudents.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>لا يوجد طلاب في هذا الفصل</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            /* Students View */
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: 12, minWidth: 40 }}>م</th>
                  <th style={{ padding: 12 }}>رقم القيد</th>
                  <th style={{ padding: 12 }}>اسم الطالب</th>
                  <th style={{ padding: 12 }}>الفصل</th>
                  <th style={{ padding: 12 }}>الجنس</th>
                  <th style={{ padding: 12 }}>الرقم الوطني</th>
                  <th style={{ padding: 12 }}>حالة الدفع</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 12 }}>{i + 1}</td>
                    <td style={{ padding: 12 }}>{s.enrollmentNumber || '-'}</td>
                    <td style={{ padding: 12, fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: 12 }}>
                      <select 
                        value={s.classRoom || ''} 
                        onChange={(e) => {
                          const newClass = e.target.value;
                          setStudents(prev => prev.map(student => 
                            student.id === s.id ? { ...student, classRoom: newClass } : student
                          ));
                        }}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="">غير محدد</option>
                        {currentClassRooms.map(c => <option key={c} value={c}>فصل {c}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 12 }}>
                      <select
                        value={s.gender || 'غير محدد'}
                        onChange={(e) => {
                          const newGender = e.target.value as any;
                          setStudents(prev => prev.map(student => 
                            student.id === s.id ? { ...student, gender: newGender } : student
                          ));
                        }}
                        style={{
                          padding: '3px 20px 3px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor: s.gender === 'ذكر' ? '#dbeafe' : s.gender === 'أنثى' ? '#fce7f3' : '#f1f5f9',
                          color: s.gender === 'ذكر' ? '#1d4ed8' : s.gender === 'أنثى' ? '#be185d' : '#64748b',
                          border: 'none',
                          outline: 'none',
                          cursor: 'pointer',
                          appearance: 'auto'
                        }}
                      >
                        <option value="غير محدد">غير محدد</option>
                        <option value="ذكر">ذكر</option>
                        <option value="أنثى">أنثى</option>
                      </select>
                    </td>
                    <td style={{ padding: 12 }}>{s.nationalId || '-'}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '4px 14px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 700,
                        backgroundColor: s.paymentStatus === 'مسدد' ? '#d4edda' : s.paymentStatus === 'جزئي' ? '#fff3cd' : '#f8d7da',
                        color: s.paymentStatus === 'مسدد' ? '#155724' : s.paymentStatus === 'جزئي' ? '#856404' : '#721c24',
                      }}>
                        {s.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {classStudents.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>لا يوجد طلاب في هذا الفصل</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
