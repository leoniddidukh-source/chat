import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useModuleRegistry } from './core/modules/ModuleRegistryContext';
import { useAuth } from './core/auth/AuthContext';
import { useTheme } from '@erp/theme';
import { ErrorBoundary } from './core/errors/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import ModulesPlaceholderPage from './pages/ModulesPlaceholderPage';
import UserManagementPage from './pages/UserManagementPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForbiddenPage from './components/common/ForbiddenPage';
import PermissionGate from './core/security/PermissionGate';
import { loadModule } from './core/modules/moduleLoader';
import type { Module, RouteConfig } from '@erp/shared';

const App = () => {
  const { modules, registerModule } = useModuleRegistry();
  const { isAuthenticated } = useAuth();
  const { toggleTheme } = useTheme();
  const [modulesLoading, setModulesLoading] = useState(true);
  const [modulesError, setModulesError] = useState<string | null>(null);

  // Listen for theme toggle events from modules
  useEffect(() => {
    const handleToggleTheme = () => {
      toggleTheme();
    };

    window.addEventListener('toggle-theme', handleToggleTheme);
    return () => {
      window.removeEventListener('toggle-theme', handleToggleTheme);
    };
  }, [toggleTheme]);

  // Available module IDs to load
  const availableModuleIds = ['default-module', 'chat-module'];

  useEffect(() => {
    const loadModules = async () => {
      setModulesLoading(true);
      setModulesError(null);

      try {
        // Load all modules in parallel
        const loadPromises = availableModuleIds.map(async (moduleId) => {
          try {
            const module = await loadModule(moduleId);
            registerModule(module);
          } catch (error) {
            console.warn(`Failed to load module ${moduleId}:`, error);
            // Don't throw - allow other modules to load
          }
        });

        await Promise.allSettled(loadPromises);
      } catch (error) {
        console.error('Error loading modules:', error);
        setModulesError('Failed to load some modules. Please refresh the page.');
      } finally {
        setModulesLoading(false);
      }
    };

    loadModules();
  }, [registerModule]);

  const renderModuleRoutes = () => {
    return modules.flatMap((module) =>
      module.routes.map((route: RouteConfig) => {
        const path = normalizeModuleRoute(module.manifest.basePath, route.path);
        return (
          <Route
            key={`${module.manifest.id}:${path}`}
            path={path}
            element={
              <ProtectedRoute>
                <ErrorBoundary
                  fallback={
                    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                      <h2 style={{ color: '#ef4444' }}>⚠️ Module Error</h2>
                      <p style={{ marginTop: '1rem', opacity: 0.7 }}>
                        The module "{module.manifest.title}" encountered an error.
                      </p>
                      <button
                        className="primary-button"
                        onClick={() => window.location.reload()}
                        type="button"
                        style={{ marginTop: '1rem' }}
                      >
                        Reload
                      </button>
                    </div>
                  }
                >
                  <PermissionGate requiredPermissions={module.manifest.requiredPermissions}>
                    {route.element}
                  </PermissionGate>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
        );
      })
    );
  };

  if (modulesLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '1.5rem' }}>Loading modules...</div>
        {modulesError && (
          <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{modulesError}</div>
        )}
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes - no layout */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} 
      />
      
      {/* Protected routes - with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/modules"
        element={
          <ProtectedRoute>
            <ModulesPlaceholderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <PermissionGate requiredPermissions={['*', 'users.manage']}>
              <UserManagementPage />
            </PermissionGate>
          </ProtectedRoute>
        }
      />
      {renderModuleRoutes()}
      <Route
        path="/403"
        element={
          <ProtectedRoute>
            <ForbiddenPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
    </Routes>
  );
};

const normalizeModuleRoute = (basePath: string, routePath: string): string => {
  const sanitizedBase = basePath.endsWith('/') && basePath !== '/' ? basePath.slice(0, -1) : basePath;
  if (!routePath || routePath === '/') {
    return sanitizedBase || '/';
  }
  const sanitizedRoute = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${sanitizedBase}${sanitizedRoute}`;
};

export default App;

