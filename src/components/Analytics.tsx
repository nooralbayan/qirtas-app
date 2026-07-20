import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Analytics({ onBack }: { onBack: () => void }) {
  const { students, receipts, expenses, teachers } = useAppContext();

  const totalCollected = receipts.reduce((acc, r) => acc + r.paidAmount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalCollected - totalExpenses;

  // Grade Distribution Data
  const gradesOrder = ['KG1', 'KG2', 'الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس', 'الصف السابع', 'الصف الثامن', 'الصف التاسع', 'تخرج'];
  const gradeData = gradesOrder.map(grade => ({
    name: grade,
    value: students.filter(s => s.grade === grade).length
  })).filter(d => d.value > 0);

  // Financial Debt Data
  const expectedRevenue = students.reduce((acc, s) => acc + (s.totalFees || 0), 0);
  const debt = expectedRevenue - totalCollected;

  return (
    <div style={{ direction: 'rtl', padding: 24, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 8px', color: 'var(--primary-color)' }}>📈 الإحصائيات الشاملة والتحليل</h1>
          <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)' }}>
            <span style={{ fontSize: 20 }}>⟵</span> العودة للوحة التحكم
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 40 }}>
        {/* Revenue vs Expenses Bar Chart */}
        <div className="card" style={{ padding: 24, borderRadius: 16, background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--primary-color)' }}>📊 نظرة عامة على التدفق النقدي</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={[
                { name: 'الإيرادات المحصلة', value: totalCollected, fill: '#3b82f6' },
                { name: 'المصروفات', value: totalExpenses, fill: '#ef4444' },
                { name: 'الصافي الحالي', value: netProfit, fill: netProfit >= 0 ? '#10b981' : '#f59e0b' }
              ]} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip cursor={{ fill: 'var(--bg-secondary)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {
                    [
                      { name: 'الإيرادات المحصلة', value: totalCollected, fill: '#3b82f6' },
                      { name: 'المصروفات', value: totalExpenses, fill: '#ef4444' },
                      { name: 'الصافي الحالي', value: netProfit, fill: netProfit >= 0 ? '#10b981' : '#f59e0b' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expected vs Actual Revenue Pie Chart */}
        <div className="card" style={{ padding: 24, borderRadius: 16, background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--primary-color)' }}>💰 التحصيل المالي (الديون)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[
                    { name: 'تم تحصيله', value: totalCollected },
                    { name: 'ديون غير محصلة', value: Math.max(0, debt) },
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {
                    [
                      { name: 'تم تحصيله', value: totalCollected },
                      { name: 'ديون غير محصلة', value: Math.max(0, debt) },
                    ].filter(d => d.value > 0).map((entry, index) => {
                      const COLORS = ['#10b981', '#ef4444'];
                      return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                    })
                  }
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution Bar Chart */}
        <div className="card" style={{ padding: 24, borderRadius: 16, background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--primary-color)' }}>🏫 كثافة الطلاب في الفصول الدراسية</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={gradeData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip cursor={{ fill: 'var(--bg-secondary)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics Pie Chart */}
        <div className="card" style={{ padding: 24, borderRadius: 16, background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--primary-color)' }}>👨‍🎓 ديموغرافية الطلاب (حسب الجنس)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[
                    { name: 'ذكور', value: students.filter(s => s.gender === 'ذكر').length },
                    { name: 'إناث', value: students.filter(s => s.gender === 'أنثى').length },
                    { name: 'غير محدد', value: students.filter(s => s.gender === 'غير محدد').length }
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {
                    [
                      { name: 'ذكور', value: students.filter(s => s.gender === 'ذكر').length },
                      { name: 'إناث', value: students.filter(s => s.gender === 'أنثى').length },
                      { name: 'غير محدد', value: students.filter(s => s.gender === 'غير محدد').length }
                    ].filter(d => d.value > 0).map((entry, index) => {
                      const COLORS = ['#3b82f6', '#ec4899', '#94a3b8'];
                      return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                    })
                  }
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
