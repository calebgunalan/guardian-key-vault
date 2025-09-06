import { useState, useEffect } from "react";
import { AdminGate } from "@/components/PermissionGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Activity, Users, Shield, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserSession {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  location_country: string | null;
  location_city: string | null;
  last_activity: string;
  is_active: boolean;
  created_at: string;
  user_email?: string;
  user_role?: string;
}

export default function SessionManagement() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeSessions: 0,
    totalUsers: 0,
    adminSessions: 0
  });

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, []);

  const fetchSessions = async () => {
    try {
      // First get sessions with profiles
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get user emails and roles for each session
      const sessionsWithUserInfo = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const [profileResult, roleResult] = await Promise.all([
            supabase.from('profiles').select('email').eq('user_id', session.user_id).single(),
            supabase.from('user_roles').select('role').eq('user_id', session.user_id).single()
          ]);

          return {
            ...session,
            ip_address: session.ip_address as string | null,
            user_agent: session.user_agent as string | null,
            location_country: session.location_country as string | null,
            location_city: session.location_city as string | null,
            user_email: profileResult.data?.email || 'Unknown',
            user_role: roleResult.data?.role || 'user'
          };
        })
      );

      setSessions(sessionsWithUserInfo);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [sessionsResult, usersResult, adminSessionsResult] = await Promise.all([
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_sessions')
          .select(`
            id,
            user_roles!inner(role)
          `, { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('user_roles.role', 'admin')
      ]);

      setStats({
        activeSessions: sessionsResult.count || 0,
        totalUsers: usersResult.count || 0,
        adminSessions: adminSessionsResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const terminateSession = async (sessionId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_audit_event', {
        _action: 'TERMINATE',
        _resource: 'user_session',
        _resource_id: sessionId,
        _details: { terminated_user_id: userId } as any
      });

      toast.success('Session terminated successfully');
      fetchSessions();
      fetchStats();
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'default';
    }
  };

  const formatLastActivity = (timestamp: string) => {
    const now = new Date();
    const activity = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - activity.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <AdminGate>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Session Management</h1>
          </div>
          <p className="text-muted-foreground">
            Monitor active user sessions and manage user activities across the system.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">
                Currently logged in users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Sessions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adminSessions}</div>
              <p className="text-xs text-muted-foreground">
                Administrative access
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              Real-time view of all active user sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No active sessions found.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {session.user_email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleColor(session.user_role || 'user')}>
                          {session.user_role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {session.location_city && session.location_country
                          ? `${session.location_city}, ${session.location_country}`
                          : 'Unknown'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {session.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {formatLastActivity(session.last_activity)}
                      </TableCell>
                      <TableCell>
                        {formatLastActivity(session.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => terminateSession(session.id, session.user_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Terminate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGate>
  );
}