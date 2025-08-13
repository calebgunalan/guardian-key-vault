import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  member_count?: number;
  permissions?: GroupPermission[];
}

export interface GroupPermission {
  id: string;
  group_id: string;
  permission_id: string;
  assigned_at: string;
  assigned_by: string;
  permissions: {
    id: string;
    name: string;
    action: string;
    resource: string;
    description?: string;
  };
}

export interface GroupMembership {
  id: string;
  user_id: string;
  group_id: string;
  assigned_at: string;
  assigned_by: string;
  user_groups: UserGroup;
}

export function useUserGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGroups();
    } else {
      setGroups([]);
      setLoading(false);
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get member counts
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('user_group_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return {
            ...group,
            member_count: count || 0,
            permissions: []
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .insert({
          name,
          description,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setGroups(prev => [...prev, { ...data, member_count: 0, permissions: [] }]);
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  const updateGroup = async (groupId: string, updates: { name?: string; description?: string }) => {
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;

      setGroups(prev => 
        prev.map(group => 
          group.id === groupId ? { ...group, ...data } : group
        )
      );
      return data;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      setGroups(prev => prev.filter(group => group.id !== groupId));
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  };

  const addUserToGroup = async (userId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from('user_group_memberships')
        .insert({
          user_id: userId,
          group_id: groupId,
          assigned_by: user?.id
        });

      if (error) throw error;

      // Update member count
      setGroups(prev => 
        prev.map(group => 
          group.id === groupId 
            ? { ...group, member_count: (group.member_count || 0) + 1 }
            : group
        )
      );
    } catch (error) {
      console.error('Error adding user to group:', error);
      throw error;
    }
  };

  const removeUserFromGroup = async (userId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from('user_group_memberships')
        .delete()
        .eq('user_id', userId)
        .eq('group_id', groupId);

      if (error) throw error;

      // Update member count
      setGroups(prev => 
        prev.map(group => 
          group.id === groupId 
            ? { ...group, member_count: Math.max(0, (group.member_count || 0) - 1) }
            : group
        )
      );
    } catch (error) {
      console.error('Error removing user from group:', error);
      throw error;
    }
  };

  const assignPermissionToGroup = async (groupId: string, permissionId: string) => {
    try {
      const { error } = await supabase
        .from('group_permissions')
        .insert({
          group_id: groupId,
          permission_id: permissionId,
          assigned_by: user?.id
        });

      if (error) throw error;

      await fetchGroups(); // Refresh to get updated permissions
    } catch (error) {
      console.error('Error assigning permission to group:', error);
      throw error;
    }
  };

  const removePermissionFromGroup = async (groupId: string, permissionId: string) => {
    try {
      const { error } = await supabase
        .from('group_permissions')
        .delete()
        .eq('group_id', groupId)
        .eq('permission_id', permissionId);

      if (error) throw error;

      await fetchGroups(); // Refresh to get updated permissions
    } catch (error) {
      console.error('Error removing permission from group:', error);
      throw error;
    }
  };

  const getUserGroups = async (userId: string): Promise<GroupMembership[]> => {
    try {
      const { data, error } = await supabase
        .from('user_group_memberships')
        .select(`
          *,
          user_groups (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        user_groups: ((item.user_groups as any)?.id) ? item.user_groups as unknown as UserGroup : { 
          id: '', 
          name: '', 
          description: null, 
          created_at: '', 
          updated_at: '', 
          created_by: '' 
        }
      }));
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  };

  return {
    groups,
    loading,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    addUserToGroup,
    removeUserFromGroup,
    assignPermissionToGroup,
    removePermissionFromGroup,
    getUserGroups
  };
}