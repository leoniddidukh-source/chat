import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getUserByEmail } from './userPermissions';
import type { User } from '@erp/shared';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  loginAsAdmin: () => void;
  loginAsUser: () => void;
  logout: () => void;
}

// Keep for backward compatibility
const ADMIN_USER: User = {
  id: 'admin-1',
  name: 'Admin User',
  role: 'admin',
  permissions: ['*'],
  email: 'admin@example.com'
};

const REGULAR_USER: User = {
  id: 'user-1',
  name: 'Demo User',
  role: 'user',
  permissions: ['dashboard.view'],
  email: 'user@example.com'
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string): boolean => {
    // Simple demo authentication
    // In production, this would call an API
    const userConfig = getUserByEmail(email);
    
    if (userConfig && password) {
      // Convert UserConfig to User
      setUser({
        id: userConfig.id,
        name: userConfig.name,
        role: userConfig.role,
        permissions: userConfig.permissions as string[],
        email: userConfig.email
      });
      return true;
    }
    
    return false;
  }, []);

  const loginAsAdmin = useCallback(() => {
    setUser({ ...ADMIN_USER });
  }, []);

  const loginAsUser = useCallback(() => {
    setUser({ ...REGULAR_USER });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      loginAsAdmin,
      loginAsUser,
      logout
    }),
    [user, login, loginAsAdmin, loginAsUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

