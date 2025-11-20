import { useState } from 'react';
import { useAuth } from '../core/auth/AuthContext';
import { getAllPermissions, DEFAULT_USERS, type UserConfig, AVAILABLE_PERMISSIONS, type PermissionKey } from '../core/auth/userPermissions';

const UserManagementPage = () => {
  const { user } = useAuth();
  const [users] = useState<UserConfig[]>(Object.values(DEFAULT_USERS));
  const [selectedUser, setSelectedUser] = useState<UserConfig | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<PermissionKey[]>([]);

  // Check if current user can manage users
  const canManage = user?.permissions.includes('*') || user?.permissions.includes('users.manage');

  if (!canManage) {
    return (
      <section className="card">
        <h2>Access Denied</h2>
        <p>You don't have permission to manage users.</p>
      </section>
    );
  }

  const handleUserSelect = (userConfig: UserConfig) => {
    setSelectedUser(userConfig);
    setEditedPermissions([...userConfig.permissions]);
  };

  const togglePermission = (permission: PermissionKey) => {
    if (permission === '*') {
      // If selecting admin, only keep '*'
      setEditedPermissions(['*']);
    } else {
      // Remove '*' if selecting specific permissions
      const newPerms = editedPermissions.filter(p => p !== '*') as PermissionKey[];
      if (newPerms.includes(permission)) {
        setEditedPermissions(newPerms.filter(p => p !== permission));
      } else {
        setEditedPermissions([...newPerms, permission]);
      }
    }
  };

  const handleSave = () => {
    if (!selectedUser) return;
    
    // In production, this would call an API to update user permissions
    console.log('Saving permissions for user:', selectedUser.email, editedPermissions);
    alert('Permissions saved! (In production, this would update the database)');
    
    // Update local state
    const updatedUser = { ...selectedUser, permissions: editedPermissions };
    setSelectedUser(updatedUser);
  };

  const allPermissions = getAllPermissions();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="card">
        <h2>👥 User Management</h2>
        <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>
          Configure user permissions and roles. In production, this would connect to your user management system.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
        {/* User List */}
        <section className="card">
          <h3 style={{ marginBottom: '1rem' }}>Users</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {users.map((userConfig) => (
              <button
                key={userConfig.id}
                onClick={() => handleUserSelect(userConfig)}
                style={{
                  padding: '0.75rem',
                  textAlign: 'left',
                  border: selectedUser?.id === userConfig.id 
                    ? '2px solid var(--color-primary)' 
                    : '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: selectedUser?.id === userConfig.id 
                    ? 'var(--color-bg)' 
                    : 'transparent',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: '500', color: 'var(--color-text)' }}>{userConfig.name}</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.25rem', color: 'var(--color-text)' }}>
                  {userConfig.email}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem', color: 'var(--color-text)' }}>
                  {userConfig.role}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Permission Editor */}
        {selectedUser && (
          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3>{selectedUser.name}</h3>
                <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.25rem' }}>
                  {selectedUser.email} • {selectedUser.role}
                </p>
              </div>
              <button className="primary-button" onClick={handleSave} type="button">
                Save Changes
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Permissions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allPermissions.map(({ key, label }) => (
                  <label
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: editedPermissions.includes(key) 
                        ? 'var(--color-bg)' 
                        : 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={editedPermissions.includes(key)}
                      onChange={() => togglePermission(key)}
                      style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: 'var(--color-text)' }}>{label}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, fontFamily: 'monospace', color: 'var(--color-text)' }}>
                        {key}
                      </div>
                    </div>
                    {key === '*' && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem', 
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        borderRadius: '4px'
                      }}>
                        Admin
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'var(--color-bg)', 
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: 'var(--color-text)'
            }}>
              <strong style={{ color: 'var(--color-text)' }}>Current Permissions:</strong>
              <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', color: 'var(--color-text)' }}>
                {editedPermissions.length > 0 ? (
                  editedPermissions.map(p => (
                    <div key={p} style={{ marginTop: '0.25rem', color: 'var(--color-text)' }}>
                      • {p} {AVAILABLE_PERMISSIONS[p as keyof typeof AVAILABLE_PERMISSIONS] && `(${AVAILABLE_PERMISSIONS[p as keyof typeof AVAILABLE_PERMISSIONS]})`}
                    </div>
                  ))
                ) : (
                  <div style={{ opacity: 0.6, color: 'var(--color-text)' }}>No permissions assigned</div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;

