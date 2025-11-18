import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Role = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  role: Role;
  permissions: string[];
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loginAsAdmin: () => void;
  loginAsUser: () => void;
  logout: () => void;
}

const ADMIN_USER: User = {
  id: 'admin-1',
  name: 'Admin User',
  role: 'admin',
  permissions: ['*']
};

const REGULAR_USER: User = {
  id: 'user-1',
  name: 'Demo User',
  role: 'user',
  permissions: ['dashboard.view']
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

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
      loginAsAdmin,
      loginAsUser,
      logout
    }),
    [user, loginAsAdmin, loginAsUser, logout]
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

