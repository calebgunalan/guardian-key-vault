import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRouteProtection } from "@/hooks/useRouteProtection";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Shield, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  action: string;
  resource: string;
  description?: string;
  created_at: string;
}

interface RolePermission {
  id: string;
  role: string;
  permission_id: string;
  permissions: Permission;
}

const Permissions = () => {
  const { user, userRole, loading } = useAuth();
  const { isLoading: routeLoading } = useRouteProtection({ 
    requiredPermission: { action: 'MANAGE', resource: 'permissions' } 
  });
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    action: "",
    resource: "",
    description: ""
  });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      navigate('/dashboard');
      return;
    }

    if (user && userRole === 'admin') {
      fetchData();
    }
  }, [user, userRole, loading, navigate]);

  const fetchData = async () => {
    try {
      const [permissionsResult, rolePermissionsResult] = await Promise.all([
        supabase.from('permissions').select('*').order('name'),
        supabase.from('role_permissions').select(`
          *,
          permissions (*)
        `).order('role')
      ]);

      if (permissionsResult.error) throw permissionsResult.error;
      if (rolePermissionsResult.error) throw rolePermissionsResult.error;

      setPermissions(permissionsResult.data || []);
      setRolePermissions(rolePermissionsResult.data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to fetch permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPermission) {
        const { error } = await supabase
          .from('permissions')
          .update(formData)
          .eq('id', editingPermission.id);
        
        if (error) throw error;
        toast.success('Permission updated successfully');
      } else {
        const { error } = await supabase
          .from('permissions')
          .insert([formData]);
        
        if (error) throw error;
        toast.success('Permission created successfully');
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: editingPermission ? 'UPDATE' : 'CREATE',
        _resource: 'permissions',
        _resource_id: editingPermission?.id || null,
        _details: formData as any
      });

      setIsDialogOpen(false);
      setEditingPermission(null);
      setFormData({ name: "", action: "", resource: "", description: "" });
      fetchData();
    } catch (error) {
      console.error('Error saving permission:', error);
      toast.error('Failed to save permission');
    }
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name,
      action: permission.action,
      resource: permission.resource,
      description: permission.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (permission: Permission) => {
    if (!confirm(`Are you sure you want to delete the permission "${permission.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('permissions')
        .delete()
        .eq('id', permission.id);
      
      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'DELETE',
        _resource: 'permissions',
        _resource_id: permission.id,
        _details: permission as any
      });

      toast.success('Permission deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Failed to delete permission');
    }
  };

  const toggleRolePermission = async (role: string, permissionId: string, hasPermission: boolean) => {
    try {
      if (hasPermission) {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role', role as any)
          .eq('permission_id', permissionId);
        
        if (error) throw error;
        toast.success(`Removed permission from ${role}`);
      } else {
        const { error } = await supabase
          .from('role_permissions')
          .insert({ role: role as any, permission_id: permissionId });
        
        if (error) throw error;
        toast.success(`Added permission to ${role}`);
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: hasPermission ? 'REMOVE' : 'GRANT',
        _resource: 'role_permissions',
        _details: { role, permission_id: permissionId } as any
      });

      fetchData();
    } catch (error) {
      console.error('Error updating role permission:', error);
      toast.error('Failed to update role permission');
    }
  };

  const getRolePermissions = (role: string): string[] => {
    return rolePermissions
      .filter(rp => rp.role === role)
      .map(rp => rp.permission_id);
  };

  const roles = ['admin', 'moderator', 'user'];

  if (loading || isLoading || routeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Permission Management</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Permissions List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>System Permissions</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingPermission(null);
                      setFormData({ name: "", action: "", resource: "", description: "" });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Permission
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPermission ? 'Edit Permission' : 'Create Permission'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., manage_users"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Action</label>
                      <Input
                        value={formData.action}
                        onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                        placeholder="e.g., MANAGE, VIEW, CREATE"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Resource</label>
                      <Input
                        value={formData.resource}
                        onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                        placeholder="e.g., users, roles, audit_logs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of what this permission allows"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">
                        {editingPermission ? 'Update' : 'Create'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissions.map((permission) => (
                  <div key={permission.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{permission.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{permission.action}</Badge>
                          <Badge variant="outline">{permission.resource}</Badge>
                        </div>
                        {permission.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {permission.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(permission)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(permission)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Permissions Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissions.map((permission) => (
                  <div key={permission.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{permission.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {permission.action} • {permission.resource}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {roles.map((role) => {
                        const hasPermission = getRolePermissions(role).includes(permission.id);
                        return (
                          <Button
                            key={role}
                            variant={hasPermission ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleRolePermission(role, permission.id, hasPermission)}
                            className="capitalize"
                          >
                            {role}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default Permissions;