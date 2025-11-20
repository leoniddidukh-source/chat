import { useModuleRegistry } from '../core/modules/ModuleRegistryContext';
import { useAuth } from '../core/auth/AuthContext';

const ModulesPlaceholderPage = () => {
  const { modules, enableModule, disableModule } = useModuleRegistry();
  const { user } = useAuth();
  const canManage = user?.permissions.includes('*') || user?.permissions.includes('modules.manage');

  const toggleModule = (moduleId: string, enabled: boolean) => {
    if (enabled) {
      disableModule(moduleId);
    } else {
      enableModule(moduleId);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="card">
        <h2>📦 Module Management</h2>
        <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>
          View and manage registered modules. Enable or disable modules as needed.
        </p>
      </section>

      {modules.length === 0 ? (
        <section className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3>No Modules Registered</h3>
            <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>
              Modules will appear here once they are registered in the system.
            </p>
          </div>
        </section>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {modules.map((module) => {
            const isEnabled = module.manifest.enabled !== false;
            const hasAccess = !user || 
              user.permissions.includes('*') || 
              module.manifest.requiredPermissions.every((p: string) => user.permissions.includes(p));

            return (
              <section key={module.manifest.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{module.manifest.icon || '📦'}</span>
                      <h3 style={{ margin: 0 }}>{module.manifest.title}</h3>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: isEnabled 
                            ? 'var(--color-primary)' 
                            : 'var(--color-border)',
                          color: isEnabled 
                            ? '#ffffff' 
                            : 'var(--color-text)',
                          opacity: isEnabled ? 1 : 0.7
                        }}
                      >
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      {!hasAccess && (
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: 'var(--color-bg)',
                            color: 'var(--color-text)',
                            opacity: 0.7,
                            border: '1px solid var(--color-border)'
                          }}
                        >
                          No Access
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                        <strong>ID:</strong> <code style={{ fontFamily: 'monospace' }}>{module.manifest.id}</code>
                      </div>
                      
                      {module.manifest.description && (
                        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                          <strong>Description:</strong> {module.manifest.description}
                        </div>
                      )}

                      {module.manifest.version && (
                        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                          <strong>Version:</strong> {module.manifest.version}
                        </div>
                      )}

                      <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                        <strong>Base Path:</strong> <code style={{ fontFamily: 'monospace' }}>{module.manifest.basePath}</code>
                      </div>

                      <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                        <strong>Routes:</strong> {module.routes.length} route(s)
                      </div>

                      {module.manifest.requiredPermissions.length > 0 && (
                        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                          <strong>Required Permissions:</strong>
                          <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {module.manifest.requiredPermissions.map((perm: string) => (
                              <span
                                key={perm}
                                style={{
                                  padding: '0.125rem 0.5rem',
                                  backgroundColor: 'var(--color-bg)',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {module.manifest.dependencies && module.manifest.dependencies.length > 0 && (
                        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                          <strong>Dependencies:</strong>
                          <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {module.manifest.dependencies.map((dep: string) => (
                              <span
                                key={dep}
                                style={{
                                  padding: '0.125rem 0.5rem',
                                  backgroundColor: 'var(--color-bg)',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {dep}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        className={isEnabled ? 'secondary-button' : 'primary-button'}
                        onClick={() => toggleModule(module.manifest.id, isEnabled)}
                        type="button"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {isEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!canManage && modules.length > 0 && (
        <section className="card" style={{ backgroundColor: 'var(--color-bg)' }}>
          <p style={{ fontSize: '0.875rem', opacity: '0.7', margin: 0 }}>
            ℹ️ You don't have permission to manage modules. Contact an administrator to enable or disable modules.
          </p>
        </section>
      )}
    </div>
  );
};

export default ModulesPlaceholderPage;
