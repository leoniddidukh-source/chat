/**
 * User Permissions Configuration
 * 
 * This file defines available permissions and default user configurations.
 * In production, this would be managed via API/database.
 */

export const AVAILABLE_PERMISSIONS = {
  // Dashboard
  'dashboard.view': 'View Dashboard',
  
  // Modules
  'modules.demo.view': 'View Demo Module',
  'modules.manage': 'Manage Modules',
  
  // User Management
  'users.manage': 'Manage Users',
  
  // Admin
  '*': 'Full Access (Admin)',
  
  // Add more permissions as modules are created
  // Example:
  // 'inventory.view': 'View Inventory',
  // 'inventory.edit': 'Edit Inventory',
  // 'inventory.delete': 'Delete Inventory',
} as const;

export type PermissionKey = keyof typeof AVAILABLE_PERMISSIONS;

export interface UserConfig {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
  permissions: PermissionKey[];
}

/**
 * Default user configurations
 * In production, these would come from a database/API
 */
export const DEFAULT_USERS: Record<string, UserConfig> = {
  admin: {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['*']
  },
  user: {
    id: 'user-1',
    name: 'Demo User',
    email: 'user@example.com',
    role: 'user',
    permissions: ['dashboard.view']
  },
  manager: {
    id: 'manager-1',
    name: 'Manager User',
    email: 'manager@example.com',
    role: 'manager',
    permissions: ['dashboard.view', 'modules.demo.view']
  }
};

/**
 * Get user config by email (for login)
 */
export const getUserByEmail = (email: string): UserConfig | null => {
  const user = Object.values(DEFAULT_USERS).find(u => u.email === email);
  return user || null;
};

/**
 * Get all available permissions as array
 */
export const getAllPermissions = (): Array<{ key: PermissionKey; label: string }> => {
  return Object.entries(AVAILABLE_PERMISSIONS).map(([key, label]) => ({
    key: key as PermissionKey,
    label
  }));
};

