import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import { useTheme } from '@erp/theme';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="header-meta">
        <div>
          <h1 className="app-title">Host App</h1>
          <p className="app-subtitle">
            {isAuthenticated
              ? `${user?.name} (${user?.role})`
              : 'Not authenticated — please log in to continue.'}
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
          <button 
            className="primary-button" 
            onClick={() => navigate('/login')} 
            type="button"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

