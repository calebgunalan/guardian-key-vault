import { useSessionManagement } from "@/hooks/useSessionManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Monitor, Smartphone, MapPin, Calendar, Clock, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function SessionManagement() {
  const { sessions, loading, terminateSession, terminateAllOtherSessions } = useSessionManagement();

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await terminateSession(sessionId);
      toast.success('Session terminated successfully');
    } catch (error) {
      toast.error('Failed to terminate session');
    }
  };

  const handleTerminateAllOther = async () => {
    if (!confirm('Are you sure you want to terminate all other sessions? You will need to log in again on other devices.')) {
      return;
    }

    try {
      await terminateAllOtherSessions();
      toast.success('All other sessions terminated successfully');
    } catch (error) {
      toast.error('Failed to terminate other sessions');
    }
  };

  const getDeviceIcon = (userAgent?: string | null) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getDeviceInfo = (userAgent?: string | null) => {
    if (!userAgent) return 'Unknown Device';
    
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    
    return 'Unknown Browser';
  };

  const getCurrentSessionToken = () => {
    // This would ideally come from the auth context
    // For now, we'll mark the first session as current
    return sessions.length > 0 ? sessions[0].session_token : null;
  };

  if (loading) {
    return <div>Loading sessions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          Monitor and manage your active login sessions across all devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            You have {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
          </p>
          {sessions.length > 1 && (
            <Button variant="outline" size="sm" onClick={handleTerminateAllOther}>
              <LogOut className="h-4 w-4 mr-2" />
              End All Other Sessions
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.map((session, index) => {
            const isCurrentSession = index === 0; // Simplified current session detection
            
            return (
              <div key={session.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(session.user_agent)}
                    <div>
                      <p className="font-medium">{getDeviceInfo(session.user_agent)}</p>
                      {isCurrentSession && (
                        <Badge variant="secondary" className="text-xs">
                          Current Session
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!isCurrentSession && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTerminateSession(session.id)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">
                        {session.location_city && session.location_country 
                          ? `${session.location_city}, ${session.location_country}`
                          : session.ip_address || 'Unknown'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Started</p>
                      <p className="text-muted-foreground">
                        {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Last Activity</p>
                      <p className="text-muted-foreground">
                        {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>

                {session.ip_address && (
                  <div className="text-xs text-muted-foreground">
                    IP: {session.ip_address}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No active sessions found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}