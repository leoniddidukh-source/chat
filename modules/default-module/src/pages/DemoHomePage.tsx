import { useState } from 'react';
import type { User } from '@erp/shared';

// Note: In a production system, modules would access auth through a module API
// or shared context provider. For this demo, we'll show how it would work.
// The actual auth context is available in the host app, and modules rendered
// inside it can access React context if the hook is exported from a shared location.
const useMockAuth = (): { user: User | null } => {
  // In production, this would be: import { useAuth } from '@erp/auth' or similar
  return {
    user: { 
      id: 'demo-1', 
      name: 'Demo User', 
      role: 'user', 
      permissions: ['modules.demo.view'] 
    }
  };
};

const DemoHomePage = () => {
  const { user } = useMockAuth();
  // Get theme from document (set by ThemeProvider in Host App)
  const theme = typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'light' : 'light';
  const [counter, setCounter] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="card">
        <h2>🎯 Demo Module - Home</h2>
        <p>This is a fully functional demo module showcasing the modular ERP platform capabilities.</p>
      </section>

      <section className="card">
        <h3>User Information</h3>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p><strong>Current User:</strong> {user?.name || 'Not logged in'}</p>
          <p><strong>Role:</strong> {user?.role || 'N/A'}</p>
          <p><strong>Permissions:</strong> {user?.permissions?.join(', ') || 'None'}</p>
          <p><strong>Current Theme:</strong> {theme}</p>
        </div>
      </section>

      <section className="card">
        <h3>Interactive Counter</h3>
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="primary-button"
            onClick={() => setCounter(c => c - 1)}
            type="button"
          >
            -
          </button>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', minWidth: '3rem', textAlign: 'center' }}>
            {counter}
          </span>
          <button
            className="primary-button"
            onClick={() => setCounter(c => c + 1)}
            type="button"
          >
            +
          </button>
          <button
            className="secondary-button"
            onClick={() => setCounter(0)}
            type="button"
            style={{ marginLeft: 'auto' }}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="card">
        <h3>Module Features</h3>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>✅ Multiple routes and pages</li>
          <li>✅ Permission-based access control</li>
          <li>✅ Theme integration (light/dark)</li>
          <li>✅ Access to auth context</li>
          <li>✅ Modular architecture</li>
        </ul>
      </section>
    </div>
  );
};

export default DemoHomePage;

