import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PermissionGate, AdminGate } from "@/components/PermissionGate";
import { 
  Shield, 
  Users, 
  Settings, 
  LogOut, 
  Activity, 
  Key, 
  Lock, 
  Clock, 
  CheckCircle, 
  BarChart3, 
  Home, 
  User,
  Atom
} from "lucide-react";

export default function Navigation() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

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

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/quantum-security", icon: Atom, label: "Quantum Security" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const adminItems = [
    { path: "/admin/users", icon: Users, label: "Users", permission: "VIEW", resource: "users" },
    { path: "/admin/roles", icon: Shield, label: "Roles", adminOnly: true },
    { path: "/admin/permissions", icon: Settings, label: "Permissions", permission: "MANAGE", resource: "permissions" },
    { path: "/admin/audit-logs", icon: Activity, label: "Audit Logs", permission: "VIEW", resource: "audit_logs" },
  ];

  return (
    <Card className="w-64 h-screen fixed left-0 top-0 border-r bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold">IAM System</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate">{user.email}</span>
            <Badge variant={getRoleColor(userRole || 'user')} className="text-xs w-fit">
              {userRole || 'user'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Admin Section */}
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Administration</h3>
          <div className="space-y-1">
            {adminItems.map((item) => {
              if (item.adminOnly) {
                return (
                  <AdminGate key={item.path}>
                    <Button
                      variant={isActive(item.path) ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => navigate(item.path)}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </AdminGate>
                );
              }

              if (item.permission && item.resource) {
                return (
                  <PermissionGate
                    key={item.path}
                    action={item.permission}
                    resource={item.resource}
                  >
                    <Button
                      variant={isActive(item.path) ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => navigate(item.path)}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </PermissionGate>
                );
              }

              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </Card>
  );
}