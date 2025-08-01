import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, Settings } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface RolePermission {
  role: string;
  permission_count: number;
  permissions: Permission[];
}

export default function Roles() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchRolePermissions();
    }
  }, [user, userRole]);

  const fetchRolePermissions = async () => {
    try {
      const { data: permissions, error: permError } = await supabase
        .from('permissions')
        .select('*');

      if (permError) throw permError;

      const { data: rolePerms, error: roleError } = await supabase
        .from('role_permissions')
        .select(`
          role,
          permission_id,
          permissions (
            id,
            name,
            resource,
            action,
            description
          )
        `);

      if (roleError) throw roleError;

      // Group by role
      const grouped = rolePerms?.reduce((acc: any, item: any) => {
        const role = item.role;
        if (!acc[role]) {
          acc[role] = {
            role,
            permission_count: 0,
            permissions: []
          };
        }
        acc[role].permissions.push(item.permissions);
        acc[role].permission_count++;
        return acc;
      }, {});

      // Add roles without permissions
      const allRoles = ['admin', 'moderator', 'user'];
      allRoles.forEach(role => {
        if (!grouped[role]) {
          grouped[role] = {
            role,
            permission_count: 0,
            permissions: []
          };
        }
      });

      setRolePermissions(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch role permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    navigate("/dashboard");
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Role Management</h1>
              <p className="text-muted-foreground">Manage system roles and their permissions</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Roles</CardTitle>
            <CardDescription>
              Overview of roles and their assigned permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions Count</TableHead>
                  <TableHead>Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolePermissions.map((roleData) => (
                  <TableRow key={roleData.role}>
                    <TableCell>
                      <Badge variant={getRoleColor(roleData.role)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {roleData.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{roleData.permission_count}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {roleData.permissions.length > 0 ? (
                          roleData.permissions.map((perm: Permission) => (
                            <Badge key={perm.id} variant="outline" className="text-xs">
                              {perm.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No permissions assigned</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}