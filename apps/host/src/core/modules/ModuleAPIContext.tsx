import { createContext, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '@erp/theme';
import { hasPermission } from '../security/permissionUtils';
import type { ModuleAPI, User } from '@erp/shared';

const ModuleAPIContext = createContext<ModuleAPI | undefined>(undefined);

export const ModuleAPIProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const api = useMemo<ModuleAPI>(
    () => ({
      getUser: (): User | null => user,
      hasPermission: (permissions: string[]) => hasPermission(user, permissions),
      getTheme: () => theme,
      toggleTheme: () => toggleTheme(),
      navigate: (path: string) => navigate(path),
      notify: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        // TODO: Implement notification system
        console.log(`[${type.toUpperCase()}] ${message}`);
      },
      log: (level: 'info' | 'warn' | 'error', message: string, data?: unknown) => {
        const logFn = console[level] || console.log;
        logFn(`[Module] ${message}`, data || '');
      }
    }),
    [user, theme, toggleTheme, navigate]
  );

  return <ModuleAPIContext.Provider value={api}>{children}</ModuleAPIContext.Provider>;
};

export const useModuleAPI = (): ModuleAPI => {
  const context = useContext(ModuleAPIContext);
  if (!context) {
    throw new Error('useModuleAPI must be used within a ModuleAPIProvider');
  }
  return context;
};

