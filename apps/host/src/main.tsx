import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@erp/theme';
import { AuthProvider } from './core/auth/AuthContext';
import { ModuleRegistryProvider } from './core/modules/ModuleRegistryContext';
import { ModuleAPIProvider } from './core/modules/ModuleAPIContext';
import { ErrorBoundary } from './core/errors/ErrorBoundary';
import App from './App';
import './styles/global.css';

const startApp = async () => {
  if (typeof __webpack_init_sharing__ === 'function') {
    await __webpack_init_sharing__('default');
  }

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <ModuleRegistryProvider>
              <BrowserRouter>
                <ModuleAPIProvider>
                  <App />
                </ModuleAPIProvider>
              </BrowserRouter>
            </ModuleRegistryProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

startApp().catch((error) => {
  console.error('Failed to start host app:', error);
});

