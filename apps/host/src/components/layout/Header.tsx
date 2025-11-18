import { useAuth } from '../../core/auth/AuthContext';
import { useTheme } from '@erp/theme';

const Header = () => {
  const { user, isAuthenticated, loginAsAdmin, loginAsUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="app-header">
      <div className="header-meta">
        <div>
          <h1 className="app-title">Host App</h1>
          <p className="app-subtitle">
            {isAuthenticated
              ? `${user?.name} (${user?.role})`
              : 'Not authenticated — use a quick login below.'}
          </p>
        </div>
      </div>

      <div className="header-actions">
        <button className="ghost-button" onClick={toggleTheme} type="button">
          Toggle Theme ({theme})
        </button>

        {isAuthenticated ? (
          <button className="primary-button" onClick={logout} type="button">
            Logout
          </button>
        ) : (
          <>
            <button className="secondary-button" onClick={loginAsUser} type="button">
              Login as User
            </button>
            <button className="primary-button" onClick={loginAsAdmin} type="button">
              Login as Admin
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;

