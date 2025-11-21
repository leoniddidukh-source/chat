const DemoSettingsPage = () => {
  // Get theme from document (set by ThemeProvider in Host App)
  const theme = typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'light' : 'light';
  const isDark = theme === 'dark';
  
  // Toggle theme by dispatching a custom event that Host App can listen to
  const toggleTheme = () => {
    window.dispatchEvent(new CustomEvent('toggle-theme'));
  };

  // Text colors for light/dark theme
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const textColorSecondary = isDark ? '#cbd5e1' : '#64748b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="card">
        <h2 style={{ color: textColor }}>⚙️ Settings</h2>
        <p style={{ marginTop: '0.5rem', color: textColorSecondary }}>
          This is a stub page for the Settings feature.
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
          <h3 style={{ marginBottom: '0.5rem', color: textColor }}>Settings Coming Soon</h3>
          <p style={{ color: textColorSecondary, marginBottom: '1.5rem' }}>
            This page will contain module-specific settings and preferences.
          </p>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '1rem',
            padding: '1rem',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)'
          }}>
            <span style={{ fontWeight: '500', color: textColor }}>Theme:</span>
            <span style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: 'var(--color-primary)', 
              color: '#ffffff',
              borderRadius: '6px',
              fontWeight: '500'
            }}>
              {theme}
            </span>
            <button
              className="secondary-button"
              onClick={toggleTheme}
              type="button"
            >
              Toggle Theme
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <h3 style={{ color: textColor }}>Planned Features</h3>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: textColor }}>
          <li>🎨 Theme customization (already working via header)</li>
          <li>🔔 Notification preferences</li>
          <li>🌐 Language selection</li>
          <li>💾 Auto-save settings</li>
          <li>📊 Display preferences</li>
        </ul>
      </section>
    </div>
  );
};

export default DemoSettingsPage;

