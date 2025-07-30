import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Shield, Settings, LogOut } from "lucide-react";

export default function Dashboard() {
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">IAM Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.email}</span>
              <Badge variant={getRoleColor(userRole || 'user')}>
                {userRole || 'user'}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
          {(userRole === 'admin' || userRole === 'moderator') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Administration</span>
                </CardTitle>
                <CardDescription>Manage users and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/admin/users")}
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                {userRole === 'admin' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate("/admin/roles")}
                    className="w-full justify-start"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Manage Roles
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>System overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Account Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Access Level</span>
                  <span className="text-sm font-medium">{userRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Last Login</span>
                  <span className="text-sm text-muted-foreground">Now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}