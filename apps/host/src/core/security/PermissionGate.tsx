import { PropsWithChildren } from 'react';
import ForbiddenPage from '../../components/common/ForbiddenPage';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from './permissionUtils';

interface PermissionGateProps extends PropsWithChildren {
  requiredPermissions: string[];
}

const PermissionGate = ({ requiredPermissions, children }: PermissionGateProps) => {
  const { user } = useAuth();
  const allowed = hasPermission(user, requiredPermissions);

  if (!allowed) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
};

export default PermissionGate;

