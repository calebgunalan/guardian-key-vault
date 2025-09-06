import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PermissionGate, AdminGate, ModeratorGate } from "@/components/PermissionGate";
import { Users, Shield, Settings, LogOut, Activity, Eye, BarChart3 } from "lucide-react";

export default function Dashboard() {
  const { user, userRole, signOut, loading } = useAuth();
  const { canAccess, canManage } = usePermissions();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPermissions: 0,
    recentActivity: 0
  });

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchDashboardStats();
      logDashboardAccess();
    }
  }, [user, userRole]);

  const fetchDashboardStats = async () => {
    try {
      const [usersResult, permissionsResult, activityResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('permissions').select('id', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalPermissions: permissionsResult.count || 0,
        recentActivity: activityResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const logDashboardAccess = async () => {
    try {
      await supabase.rpc('log_audit_event', {
        _action: 'VIEW',
        _resource: 'dashboard',
        _details: { timestamp: new Date().toISOString() } as any
      });
    } catch (error) {
      console.error('Error logging dashboard access:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Profile</span>
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Role</p>
                <Badge variant={getRoleColor(userRole || 'user')}>
                  {userRole || 'user'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">User ID</p>
                <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/profile")}
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Admin Functions */}
          <PermissionGate
            action="VIEW" 
            resource="users"
            fallback={
              <ModeratorGate>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Administration</span>
                    </CardTitle>
                    <CardDescription>View system information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate("/admin/user-management")}
                      className="w-full justify-start"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Users
                    </Button>
                  </CardContent>
                </Card>
              </ModeratorGate>
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Administration</span>
                </CardTitle>
                <CardDescription>
                  {canManage('users') ? 'Manage users and permissions' : 'View system information'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/admin/user-management")}
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {canManage('users') ? 'Manage Users' : 'View Users'}
                </Button>
                
                <AdminGate>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate("/admin/roles")}
                    className="w-full justify-start"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Manage Roles
                  </Button>
                </AdminGate>

                <PermissionGate action="MANAGE" resource="permissions">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate("/admin/permissions")}
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Permissions
                  </Button>
                </PermissionGate>

                <PermissionGate action="VIEW" resource="audit_logs">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate("/admin/audit-logs")}
                    className="w-full justify-start"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Audit Logs
                  </Button>
                </PermissionGate>

                <AdminGate>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate("/admin/user-groups")}
                    className="w-full justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    User Groups
                  </Button>
                </AdminGate>

                <AdminGate>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate("/admin/zero-trust")}
                    className="w-full justify-start"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Zero Trust
                  </Button>
                </AdminGate>
              </CardContent>
            </Card>
          </PermissionGate>

          {/* Session Management */}
          <AdminGate>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Session Management</span>
                </CardTitle>
                <CardDescription>Monitor and manage user sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  View active sessions and user activities across the system.
                </p>
                <Button 
                  onClick={() => navigate("/admin/session-management")}
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Sessions
                </Button>
              </CardContent>
            </Card>
          </AdminGate>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>System Analytics</span>
              </CardTitle>
              <CardDescription>Real-time system overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Users</span>
                  <Badge variant="outline">{stats.totalUsers}</Badge>
                </div>
                {userRole === 'admin' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Permissions</span>
                      <Badge variant="outline">{stats.totalPermissions}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Activity (24h)</span>
                      <Badge variant="outline">{stats.recentActivity}</Badge>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm">Your Role</span>
                  <Badge variant={getRoleColor(userRole || 'user')}>
                    {userRole || 'user'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}