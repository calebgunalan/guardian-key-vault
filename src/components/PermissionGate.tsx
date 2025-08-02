import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";

interface PermissionGateProps {
  children: ReactNode;
  action: string;
  resource: string;
  fallback?: ReactNode;
  requireAll?: boolean;
  permissions?: Array<{ action: string; resource: string }>;
}

export function PermissionGate({ 
  children, 
  action, 
  resource, 
  fallback = null,
  requireAll = false,
  permissions 
}: PermissionGateProps) {
  const { userRole } = useAuth();
  const { hasPermission, hasAnyPermission, loading } = usePermissions();

  if (loading) {
    return <>{fallback}</>;
  }

  // Admins bypass all permission checks
  if (userRole === 'admin') {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (permissions) {
    hasAccess = requireAll 
      ? permissions.every(({ action, resource }) => hasPermission(action, resource))
      : hasAnyPermission(permissions);
  } else {
    hasAccess = hasPermission(action, resource);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common permission patterns
export function AdminGate({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { userRole } = useAuth();
  return userRole === 'admin' ? <>{children}</> : <>{fallback}</>;
}

export function ModeratorGate({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { userRole } = useAuth();
  return (userRole === 'admin' || userRole === 'moderator') ? <>{children}</> : <>{fallback}</>;
}