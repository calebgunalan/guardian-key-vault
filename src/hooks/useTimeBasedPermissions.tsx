import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface TimeBasedPermission {
  id: string;
  user_id: string;
  permission_id: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  permissions?: {
    id: string;
    name: string;
    action: string;
    resource: string;
    description?: string;
  };
}

export interface CreateTimeBasedPermissionData {
  user_id: string;
  permission_id: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  timezone?: string;
}

export function useTimeBasedPermissions() {
  const { user } = useAuth();
  const [timeBasedPermissions, setTimeBasedPermissions] = useState<TimeBasedPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTimeBasedPermissions();
    } else {
      setTimeBasedPermissions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchTimeBasedPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('time_based_permissions')
        .select(`
          *,
          permissions (
            id,
            name,
            action,
            resource,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTimeBasedPermissions(data || []);
    } catch (error) {
      console.error('Error fetching time-based permissions:', error);
      setTimeBasedPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const createTimeBasedPermission = async (permissionData: CreateTimeBasedPermissionData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('time_based_permissions')
        .insert({
          ...permissionData,
          created_by: user.id,
        })
        .select(`
          *,
          permissions (
            id,
            name,
            action,
            resource,
            description
          )
        `)
        .single();

      if (error) throw error;

      setTimeBasedPermissions(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating time-based permission:', error);
      throw error;
    }
  };

  const updateTimeBasedPermission = async (
    permissionId: string, 
    updates: Partial<CreateTimeBasedPermissionData & { is_active: boolean }>
  ) => {
    try {
      const { data, error } = await supabase
        .from('time_based_permissions')
        .update(updates)
        .eq('id', permissionId)
        .select(`
          *,
          permissions (
            id,
            name,
            action,
            resource,
            description
          )
        `)
        .single();

      if (error) throw error;

      setTimeBasedPermissions(prev => 
        prev.map(perm => perm.id === permissionId ? data : perm)
      );
      return data;
    } catch (error) {
      console.error('Error updating time-based permission:', error);
      throw error;
    }
  };

  const deleteTimeBasedPermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('time_based_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;

      setTimeBasedPermissions(prev => 
        prev.filter(perm => perm.id !== permissionId)
      );
    } catch (error) {
      console.error('Error deleting time-based permission:', error);
      throw error;
    }
  };

  return {
    timeBasedPermissions,
    loading,
    fetchTimeBasedPermissions,
    createTimeBasedPermission,
    updateTimeBasedPermission,
    deleteTimeBasedPermission,
  };
}