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

