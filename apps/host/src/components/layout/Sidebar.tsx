import { NavLink } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import { useModuleRegistry } from '../../core/modules/ModuleRegistryContext';

const Sidebar = () => {
  const { user } = useAuth();
  const { getEnabledModules } = useModuleRegistry();
  const userPermissions = user?.permissions ?? [];

  const modules = getEnabledModules(userPermissions);

  return (
    <aside className="app-sidebar">
      <nav>
        <p className="sidebar-label">Core</p>
        <SidebarLink to="/" label="Dashboard" exact />
        <SidebarLink to="/modules" label="Modules" />

        <p className="sidebar-label">Modules</p>
        {modules.length === 0 && <span className="sidebar-empty">No modules available</span>}
        {modules.map((module) => (
          <SidebarLink key={module.manifest.id} to={module.manifest.basePath} label={module.manifest.title} />
        ))}
      </nav>
    </aside>
  );
};

interface SidebarLinkProps {
  to: string;
  label: string;
  exact?: boolean;
}

const SidebarLink = ({ to, label, exact = false }: SidebarLinkProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      end={exact}
    >
      {label}
    </NavLink>
  );
};

export default Sidebar;

