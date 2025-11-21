import { NavLink, useLocation } from 'react-router-dom';

interface DemoNavigationProps {
  basePath: string;
}

const DemoNavigation = ({ basePath }: DemoNavigationProps) => {
  const location = useLocation();
  // Get theme from document (set by ThemeProvider in Host App)
  const theme = typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'light' : 'light';
  const isDark = theme === 'dark';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠', exact: true },
    { path: '/data', label: 'Data Table', icon: '📊', exact: false },
    { path: '/settings', label: 'Settings', icon: '⚙️', exact: false },
  ];

  const isActive = (itemPath: string, exact: boolean) => {
    const fullPath = `${basePath}${itemPath}`;
    if (exact) {
      return location.pathname === fullPath || location.pathname === basePath;
    }
    return location.pathname.startsWith(fullPath) && location.pathname !== basePath;
  };

  return (
    <nav
      style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '1rem',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        marginBottom: '1.5rem',
      }}
    >
      {navItems.map((item) => {
        const active = isActive(item.path, item.exact || false);
        return (
          <NavLink
            key={item.path}
            to={`${basePath}${item.path}`}
            end={item.exact}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'all 0.2s',
              backgroundColor: active ? 'var(--color-primary)' : 'transparent',
              color: active ? '#ffffff' : textColor,
              border: active ? 'none' : '1px solid var(--color-border)',
            }}
          >
            <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default DemoNavigation;

