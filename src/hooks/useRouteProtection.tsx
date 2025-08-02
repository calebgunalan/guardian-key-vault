import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { usePermissions } from "./usePermissions";

interface RouteProtectionOptions {
  requireAuth?: boolean;
  requiredRole?: 'admin' | 'moderator' | 'user';
  requiredPermission?: { action: string; resource: string };
  redirectTo?: string;
}

export function useRouteProtection({
  requireAuth = true,
  requiredRole,
  requiredPermission,
  redirectTo = '/auth'
}: RouteProtectionOptions = {}) {
  const { user, userRole, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || permissionsLoading) return;

    // Check authentication
    if (requireAuth && !user) {
      navigate(redirectTo);
      return;
    }

    // Check role requirements
    if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
      navigate('/dashboard');
      return;
    }

    // Check permission requirements
    if (requiredPermission && userRole !== 'admin') {
      const { action, resource } = requiredPermission;
      if (!hasPermission(action, resource)) {
        navigate('/dashboard');
        return;
      }
    }
  }, [
    user, 
    userRole, 
    authLoading, 
    permissionsLoading, 
    requireAuth, 
    requiredRole, 
    requiredPermission, 
    redirectTo,
    navigate,
    hasPermission
  ]);

  return {
    isLoading: authLoading || permissionsLoading,
    isAuthenticated: !!user,
    hasRequiredRole: !requiredRole || userRole === requiredRole || userRole === 'admin',
    hasRequiredPermission: !requiredPermission || userRole === 'admin' || 
      hasPermission(requiredPermission.action, requiredPermission.resource)
  };
}