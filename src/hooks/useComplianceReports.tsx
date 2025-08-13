import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface ComplianceReport {
  id: string;
  report_type: 'access_review' | 'permission_audit' | 'login_activity' | 'failed_logins' | 'privileged_access';
  report_data: any;
  generated_by: string;
  date_range_start?: string;
  date_range_end?: string;
  created_at: string;
  generator_profile?: {
    email: string;
    full_name?: string;
  };
}

export function useComplianceReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReports();
    } else {
      setReports([]);
      setLoading(false);
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_reports')
        .select(`
          *,
          generator_profile:profiles!compliance_reports_generated_by_fkey (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports((data || []).map(item => ({
        ...item,
        report_type: item.report_type as ComplianceReport['report_type'],
        generator_profile: ((item.generator_profile as any)?.email) ? item.generator_profile as unknown as { email: string; full_name?: string } : { email: '', full_name: null }
      })));
    } catch (error) {
      console.error('Error fetching compliance reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const generateAccessReviewReport = async (startDate?: string, endDate?: string) => {
    try {
      // Fetch all users with their roles and permissions
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          full_name,
          created_at
        `);

      if (usersError) throw usersError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          assigned_at
        `);

      if (rolesError) throw rolesError;

      // Fetch group memberships
      const { data: groups, error: groupsError } = await supabase
        .from('user_group_memberships')
        .select(`
          user_id,
          user_groups (name, description)
        `);

      if (groupsError) throw groupsError;

      const reportData = {
        total_users: users?.length || 0,
        users_with_roles: roles?.length || 0,
        users_in_groups: groups?.length || 0,
        users: users?.map(user => ({
          ...user,
          roles: roles?.filter(r => r.user_id === user.user_id) || [],
          groups: groups?.filter(g => g.user_id === user.user_id) || []
        })) || [],
        generated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('compliance_reports')
        .insert({
          report_type: 'access_review',
          report_data: reportData,
          generated_by: user?.id,
          date_range_start: startDate,
          date_range_end: endDate
        })
        .select()
        .single();

      if (error) throw error;

      setReports(prev => [{
        ...data,
        report_type: data.report_type as ComplianceReport['report_type']
      }, ...prev]);
      return data;
    } catch (error) {
      console.error('Error generating access review report:', error);
      throw error;
    }
  };

  const generatePermissionAuditReport = async () => {
    try {
      // Fetch all permissions and their assignments
      const { data: permissions, error: permError } = await supabase
        .from('permissions')
        .select('*');

      if (permError) throw permError;

      const { data: rolePermissions, error: rolePermError } = await supabase
        .from('role_permissions')
        .select(`
          *,
          permissions (name, action, resource)
        `);

      if (rolePermError) throw rolePermError;

      const { data: groupPermissions, error: groupPermError } = await supabase
        .from('group_permissions')
        .select(`
          *,
          permissions (name, action, resource),
          user_groups (name)
        `);

      if (groupPermError) throw groupPermError;

      const reportData = {
        total_permissions: permissions?.length || 0,
        role_assignments: rolePermissions?.length || 0,
        group_assignments: groupPermissions?.length || 0,
        permissions: permissions || [],
        role_permissions: rolePermissions || [],
        group_permissions: groupPermissions || [],
        generated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('compliance_reports')
        .insert({
          report_type: 'permission_audit',
          report_data: reportData,
          generated_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setReports(prev => [{
        ...data,
        report_type: data.report_type as ComplianceReport['report_type']
      }, ...prev]);
      return data;
    } catch (error) {
      console.error('Error generating permission audit report:', error);
      throw error;
    }
  };

  const generateLoginActivityReport = async (startDate: string, endDate: string) => {
    try {
      // Fetch audit logs for login activities
      const { data: loginLogs, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (email, full_name)
        `)
        .in('action', ['LOGIN', 'LOGOUT', 'LOGIN_FAILED'])
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reportData = {
        total_login_events: loginLogs?.length || 0,
        successful_logins: loginLogs?.filter(log => log.action === 'LOGIN').length || 0,
        failed_logins: loginLogs?.filter(log => log.action === 'LOGIN_FAILED').length || 0,
        logouts: loginLogs?.filter(log => log.action === 'LOGOUT').length || 0,
        unique_users: new Set(loginLogs?.map(log => log.user_id)).size,
        generated_at: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('compliance_reports')
        .insert({
          report_type: 'login_activity',
          report_data: reportData,
          generated_by: user?.id,
          date_range_start: startDate,
          date_range_end: endDate
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setReports(prev => [{
        ...data,
        report_type: data.report_type as ComplianceReport['report_type']
      }, ...prev]);
      return data;
    } catch (error) {
      console.error('Error generating login activity report:', error);
      throw error;
    }
  };

  const generatePrivilegedAccessReport = async () => {
    try {
      // Fetch users with admin or moderator roles
      const { data: privilegedUsers, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles (email, full_name)
        `)
        .in('role', ['admin', 'moderator']);

      if (error) throw error;

      // Fetch temporary role assignments
      const { data: tempRoles, error: tempError } = await supabase
        .from('temporary_role_assignments')
        .select(`
          *,
          profiles (email, full_name)
        `)
        .eq('is_active', true);

      if (tempError) throw tempError;

      const reportData = {
        privileged_users_count: privilegedUsers?.length || 0,
        temporary_assignments_count: tempRoles?.length || 0,
        privileged_users: privilegedUsers || [],
        temporary_assignments: tempRoles || [],
        generated_at: new Date().toISOString()
      };

      const { data: reportData2, error: insertError } = await supabase
        .from('compliance_reports')
        .insert({
          report_type: 'privileged_access',
          report_data: reportData,
          generated_by: user?.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setReports(prev => [{
        ...reportData2,
        report_type: reportData2.report_type as ComplianceReport['report_type']
      }, ...prev]);
      return reportData2;
    } catch (error) {
      console.error('Error generating privileged access report:', error);
      throw error;
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('compliance_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  };

  const exportReport = (report: ComplianceReport, format: 'json' | 'csv' = 'json') => {
    const filename = `${report.report_type}_${new Date(report.created_at).toISOString().split('T')[0]}.${format}`;
    
    if (format === 'json') {
      const dataStr = JSON.stringify(report.report_data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csvData = convertToCSV(report.report_data);
      const dataBlob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const convertToCSV = (data: any): string => {
    // Simple CSV conversion - can be enhanced based on needs
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      );
      
      return [csvHeaders, ...csvRows].join('\n');
    }
    
    // For non-array data, convert to key-value pairs
    return Object.entries(data)
      .map(([key, value]) => `${key},${JSON.stringify(value)}`)
      .join('\n');
  };

  return {
    reports,
    loading,
    fetchReports,
    generateAccessReviewReport,
    generatePermissionAuditReport,
    generateLoginActivityReport,
    generatePrivilegedAccessReport,
    deleteReport,
    exportReport
  };
}