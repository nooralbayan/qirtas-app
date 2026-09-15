import { useState } from 'react';

interface SalaryRecord {
  id: number;
  teacherName: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paid: boolean;
}

const initialRecords: SalaryRecord[] = [
  { id: 1, teacherName: 'أحمد محمد العلي', baseSalary: 8500, allowances: 1200, deductions: 400, netSalary: 9300, paid: true },
  { id: 2, teacherName: 'فاطمة عبدالله الحربي', baseSalary: 7800, allowances: 1000, deductions: 350, netSalary: 8450, paid: true },
  { id: 3, teacherName: 'خالد سعد الدوسري', baseSalary: 9200, allowances: 1500, deductions: 500, netSalary: 10200, paid: false },
  { id: 4, teacherName: 'نورة إبراهيم القحطاني', baseSalary: 8000, allowances: 1100, deductions: 300, netSalary: 8800, paid: false },
  { id: 5, teacherName: 'عبدالرحمن يوسف الشهري', baseSalary: 7500, allowances: 900, deductions: 250, netSalary: 8150, paid: true },
  { id: 6, teacherName: 'منال حسن الغامدي', baseSalary: 9000, allowances: 1300, deductions: 450, netSalary: 9850, paid: false },
];

export default function Salaries({ onBack }: { onBack: () => void }) {
  const [records, setRecords] = useState<SalaryRecord[]>(initialRecords);

  const togglePaid = (id: number) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, paid: !r.paid } : r)));
  };

  const totalSalaries = records.reduce((s, r) => s + r.netSalary, 0);
  const totalPaid = records.filter((r) => r.paid).reduce((s, r) => s + r.netSalary, 0);
  const totalRemaining = totalSalaries - totalPaid;

  // ── Styles ──────────────────────────────────────────────
  const container: React.CSSProperties = {
    maxWidth: 1200,
    margin: '2rem auto',
    padding: '0 1rem',
    fontFamily: "'Cairo', sans-serif",
    direction: 'rtl',
  };

  const btnBack: React.CSSProperties = {
    padding: '0.6rem 1.25rem',
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginBottom: '1rem',
    fontSize: '0.95rem',
  };

  const summaryRow: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  };

  const summaryCard = (accent: string): React.CSSProperties => ({
    background: 'var(--bg-card)',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: '1.25rem 1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    borderRight: `4px solid ${accent}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  });

  const card: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  const table: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.95rem',
  };

  const th: React.CSSProperties = {
    background: 'var(--bg-primary)',
    padding: '0.75rem 0.6rem',
    textAlign: 'right',
    fontWeight: 700,
    borderBottom: '2px solid #e0e0e0',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
  };

  const td: React.CSSProperties = {
    padding: '0.7rem 0.6rem',
    borderBottom: '1px solid #f0f0f0',
    textAlign: 'right',
    verticalAlign: 'middle',
  };

  const badge = (paid: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: 12,
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#fff',
    background: paid ? '#27ae60' : '#e74c3c',
  });

  const payBtn = (paid: boolean): React.CSSProperties => ({
    padding: '0.35rem 0.85rem',
    background: paid ? '#95a5a6' : '#0056b3',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 600,
  });

  // ── Render ──────────────────────────────────────────────
  return (
    <div style={container}>
      <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: 24, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 30px', borderRadius: 30, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.3s ease', width: 'fit-content' }}>
        <span style={{ fontSize: 24, display: 'flex', alignItems: 'center' }}>⟵</span> العودة للوحة التحكم
      </button>

      <h2 style={{ marginBottom: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>💰 إدارة الرواتب — شهر يوليو 2026</h2>

      {/* ── Summary Cards ─────────────────────────────── */}
      <div style={summaryRow}>
        <div style={summaryCard('#0056b3')}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>إجمالي الرواتب</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0056b3' }}>
            {totalSalaries.toLocaleString()} ر.س
          </span>
        </div>
        <div style={summaryCard('#27ae60')}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>تم الصرف</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#27ae60' }}>
            {totalPaid.toLocaleString()} ر.س
          </span>
        </div>
        <div style={summaryCard('#e74c3c')}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>المتبقي</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e74c3c' }}>
            {totalRemaining.toLocaleString()} ر.س
          </span>
        </div>
      </div>

      {/* ── Salaries Table ────────────────────────────── */}
      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>اسم المعلم</th>
                <th style={th}>الراتب الأساسي</th>
                <th style={th}>البدلات</th>
                <th style={th}>الخصومات</th>
                <th style={th}>صافي الراتب</th>
                <th style={th}>حالة الصرف</th>
                <th style={th}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr
                  key={r.id}
                  style={{
                    background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#eef4fb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbfc')}
                >
                  <td style={{ ...td, fontWeight: 600 }}>{r.teacherName}</td>
                  <td style={td}>{r.baseSalary.toLocaleString()} ر.س</td>
                  <td style={{ ...td, color: '#27ae60' }}>+{r.allowances.toLocaleString()}</td>
                  <td style={{ ...td, color: '#e74c3c' }}>-{r.deductions.toLocaleString()}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{r.netSalary.toLocaleString()} ر.س</td>
                  <td style={td}>
                    <span style={badge(r.paid)}>{r.paid ? 'تم الصرف' : 'لم يصرف'}</span>
                  </td>
                  <td style={td}>
                    <button style={payBtn(r.paid)} onClick={() => togglePaid(r.id)}>
                      {r.paid ? 'تراجع' : 'صرف الراتب'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>
            عدد المعلمين: <strong>{records.length}</strong>
          </span>
          <span>
            تم الصرف: <strong style={{ color: '#27ae60' }}>{records.filter((r) => r.paid).length}</strong> | المتبقي:{' '}
            <strong style={{ color: '#e74c3c' }}>{records.filter((r) => !r.paid).length}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
