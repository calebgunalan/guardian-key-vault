import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface Permission {
  id: string;
  name: string;
  action: string;
  resource: string;
  description?: string;
}

export function usePermissions() {
  const { user, userRole } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userRole) {
      fetchUserPermissions();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [user, userRole]);

  const fetchUserPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          permissions (
            id,
            name,
            action,
            resource,
            description
          )
        `)
        .eq('role', userRole as any);

      if (error) throw error;

      const userPermissions = data?.map(rp => rp.permissions).filter(Boolean) || [];
      setPermissions(userPermissions as Permission[]);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (action: string, resource: string): boolean => {
    if (userRole === 'admin') return true; // Admins have all permissions
    
    return permissions.some(
      permission => 
        permission.action === action && 
        permission.resource === resource
    );
  };

  const hasAnyPermission = (requiredPermissions: Array<{ action: string; resource: string }>): boolean => {
    if (userRole === 'admin') return true;
    
    return requiredPermissions.some(({ action, resource }) => 
      hasPermission(action, resource)
    );
  };

  const canAccess = (resource: string): boolean => {
    return hasPermission('VIEW', resource) || hasPermission('MANAGE', resource);
  };

  const canManage = (resource: string): boolean => {
    return hasPermission('MANAGE', resource);
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    canAccess,
    canManage,
    refetch: fetchUserPermissions
  };
}