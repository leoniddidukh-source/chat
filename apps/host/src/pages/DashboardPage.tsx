const DashboardPage = () => {
  // Get theme for text colors
  const theme = typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'light' : 'light';
  const isDark = theme === 'dark';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const textColorSecondary = isDark ? '#cbd5e1' : '#64748b';

  return (
    <section className="card">
      <h2 style={{ color: textColor }}>Dashboard</h2>
      <p style={{ color: textColorSecondary, marginTop: '0.5rem' }}>
        Welcome to the Host App. Use the sidebar to explore modules.
      </p>
    </section>
  );
};

export default DashboardPage;

