import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppProvider } from './context/AppContext.tsx'

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
          <h1 style={{ color: '#ef4444' }}>عذراً، حدث خطأ غير متوقع في النظام!</h1>
          <p style={{ color: '#666', marginBottom: 20 }}>البيانات المخزنة مؤقتاً قد تكون تالفة أو غير مكتملة.</p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ background: '#3b82f6', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 'bold' }}
          >
            🔄 إصلاح الخلل وإعادة التشغيل
          </button>
          <pre style={{ marginTop: 30, background: '#f1f5f9', padding: 20, borderRadius: 8, textAlign: 'left', direction: 'ltr', overflowX: 'auto', fontSize: 12 }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
