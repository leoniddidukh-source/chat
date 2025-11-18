import { User } from '../auth/AuthContext';

export const hasPermission = (user: User | null, requiredPermissions: string[]): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  if (!user) {
    return false;
  }

  if (user.permissions.includes('*')) {
    return true;
  }

  return requiredPermissions.every((permission) => user.permissions.includes(permission));
};

