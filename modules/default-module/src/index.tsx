import type { Module } from '@erp/shared';
import DemoNavigation from './components/DemoNavigation';
import DemoHomePage from './pages/DemoHomePage';
import DemoDataPage from './pages/DemoDataPage';
import DemoSettingsPage from './pages/DemoSettingsPage';

const basePath = '/modules/demo';

const ModulePageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '1.5rem' }}>
    <DemoNavigation basePath={basePath} />
    {children}
  </div>
);

const defaultModule: Module = {
  manifest: {
    id: 'default-module',
    title: 'Demo Module',
    icon: '🧩',
    basePath: basePath,
    requiredPermissions: ['modules.demo.view']
  },
  routes: [
    {
      path: '/',
      element: (
        <ModulePageWrapper>
          <DemoHomePage />
        </ModulePageWrapper>
      )
    },
    {
      path: '/data',
      element: (
        <ModulePageWrapper>
          <DemoDataPage />
        </ModulePageWrapper>
      )
    },
    {
      path: '/settings',
      element: (
        <ModulePageWrapper>
          <DemoSettingsPage />
        </ModulePageWrapper>
      )
    }
  ]
};

export default defaultModule;
