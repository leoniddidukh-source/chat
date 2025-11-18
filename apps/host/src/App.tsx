import { useEffect, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import defaultModule from '@modules/default-module';
import { useModuleRegistry } from './core/modules/ModuleRegistryContext';
import { ErrorBoundary } from './core/errors/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ModulesPlaceholderPage from './pages/ModulesPlaceholderPage';
import ForbiddenPage from './components/common/ForbiddenPage';
import PermissionGate from './core/security/PermissionGate';

const App = () => {
  const { modules, registerModule } = useModuleRegistry();

  const bootstrapModules = useMemo(() => [defaultModule], []);

  useEffect(() => {
    bootstrapModules.forEach(registerModule);
  }, [bootstrapModules, registerModule]);

  const renderModuleRoutes = () => {
    return modules.flatMap((module) =>
      module.routes.map((route) => {
        const path = normalizeModuleRoute(module.manifest.basePath, route.path);
        return (
          <Route
            key={`${module.manifest.id}:${path}`}
            path={path}
            element={
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
            }
          />
        );
      })
    );
  };

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/modules" element={<ModulesPlaceholderPage />} />
        {renderModuleRoutes()}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
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

