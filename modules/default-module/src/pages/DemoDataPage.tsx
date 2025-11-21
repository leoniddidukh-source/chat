const DemoDataPage = () => {
  // Get theme from document (set by ThemeProvider in Host App)
  const theme = typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'light' : 'light';
  const isDark = theme === 'dark';
  
  // Text colors for light/dark theme
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const textColorSecondary = isDark ? '#cbd5e1' : '#64748b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="card">
        <h2 style={{ color: textColor }}>📊 Data Table</h2>
        <p style={{ marginTop: '0.5rem', color: textColorSecondary }}>
          This is a stub page for the Data Table feature.
        </p>
      </section>

      <section className="card">
        <div style={{ 
          padding: '3rem 2rem', 
          textAlign: 'center',
          border: '2px dashed var(--color-border)',
          borderRadius: '12px',
          backgroundColor: 'var(--color-bg)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ marginBottom: '0.5rem', color: textColor }}>Data Table Coming Soon</h3>
          <p style={{ color: textColorSecondary }}>
            This page will display a data table with filtering, sorting, and pagination features.
          </p>
        </div>
      </section>

      <section className="card">
        <h3 style={{ color: textColor }}>Planned Features</h3>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: textColor }}>
          <li>📊 Interactive data table with sortable columns</li>
          <li>🔍 Search and filter functionality</li>
          <li>📄 Pagination support</li>
          <li>📥 Export to CSV/Excel</li>
          <li>🎨 Customizable column visibility</li>
        </ul>
      </section>
    </div>
  );
};

export default DemoDataPage;

