import { NavLink } from 'react-router-dom';

interface DemoNavigationProps {
  basePath: string;
}

const DemoNavigation = ({ basePath }: DemoNavigationProps) => {
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/data', label: 'Data Table', icon: '📊' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

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
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={`${basePath}${item.path}`}
          style={({ isActive }) => ({
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'all 0.2s',
            backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
            color: isActive ? '#ffffff' : 'var(--color-text)',
            border: isActive ? 'none' : '1px solid var(--color-border)',
          })}
        >
          <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default DemoNavigation;

