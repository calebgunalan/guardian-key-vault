import { useState, useEffect } from "react";
import { useSessionSettings } from "@/hooks/useSessionSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, RotateCcw, Save } from "lucide-react";

export function SessionSettings() {
  const { sessionSettings, loading, updateSessionSettings, resetToDefaults } = useSessionSettings();
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form state
  const [maxSessionHours, setMaxSessionHours] = useState(24);
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = useState(120);
  const [maxConcurrentSessions, setMaxConcurrentSessions] = useState(5);
  const [requireReauth, setRequireReauth] = useState(true);

  // Update form when settings are loaded
  useEffect(() => {
    if (sessionSettings) {
      // Parse duration strings (e.g., "24:00:00" or "2 hours")
      const parseHours = (duration: string) => {
        if (duration.includes('hour')) {
          return parseInt(duration.split(' ')[0]);
        }
        const parts = duration.split(':');
        return parseInt(parts[0]);
      };

      const parseMinutes = (duration: string) => {
        if (duration.includes('hour')) {
          return parseInt(duration.split(' ')[0]) * 60;
        }
        if (duration.includes('minute')) {
          return parseInt(duration.split(' ')[0]);
        }
        const parts = duration.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      };

      setMaxSessionHours(parseHours(sessionSettings.max_session_duration));
      setIdleTimeoutMinutes(parseMinutes(sessionSettings.idle_timeout));
      setMaxConcurrentSessions(sessionSettings.max_concurrent_sessions);
      setRequireReauth(sessionSettings.require_reauth_for_sensitive);
    }
  }, [sessionSettings]);

  const handleSaveSettings = async () => {
    setActionLoading(true);
    try {
      await updateSessionSettings({
        max_session_duration: `${maxSessionHours} hours`,
        idle_timeout: `${idleTimeoutMinutes} minutes`,
        max_concurrent_sessions: maxConcurrentSessions,
        require_reauth_for_sensitive: requireReauth,
      });
      
      toast.success('Session settings updated successfully');
    } catch (error) {
      toast.error('Failed to update session settings');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    setActionLoading(true);
    try {
      await resetToDefaults();
      toast.success('Settings reset to defaults');
    } catch (error) {
      toast.error('Failed to reset settings');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div>Loading session settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Session Settings
        </CardTitle>
        <CardDescription>
          Configure session timeouts and security settings for your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-session">Maximum Session Duration (hours)</Label>
            <Input
              id="max-session"
              type="number"
              min={1}
              max={168} // 1 week
              value={maxSessionHours}
              onChange={(e) => setMaxSessionHours(parseInt(e.target.value) || 24)}
            />
            <p className="text-xs text-muted-foreground">
              How long a session can remain active before requiring re-authentication.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idle-timeout">Idle Timeout (minutes)</Label>
            <Input
              id="idle-timeout"
              type="number"
              min={5}
              max={480} // 8 hours
              value={idleTimeoutMinutes}
              onChange={(e) => setIdleTimeoutMinutes(parseInt(e.target.value) || 120)}
            />
            <p className="text-xs text-muted-foreground">
              How long a session can be inactive before automatically signing out.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-concurrent">Maximum Concurrent Sessions</Label>
            <Input
              id="max-concurrent"
              type="number"
              min={1}
              max={20}
              value={maxConcurrentSessions}
              onChange={(e) => setMaxConcurrentSessions(parseInt(e.target.value) || 5)}
            />
            <p className="text-xs text-muted-foreground">
              How many devices can be logged in simultaneously.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="require-reauth">Require Re-authentication for Sensitive Actions</Label>
              <p className="text-xs text-muted-foreground">
                Require password confirmation for sensitive operations like changing passwords or deleting data.
              </p>
            </div>
            <Switch
              id="require-reauth"
              checked={requireReauth}
              onCheckedChange={setRequireReauth}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSaveSettings} disabled={actionLoading}>
            <Save className="h-4 w-4 mr-2" />
            {actionLoading ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button variant="outline" onClick={handleResetToDefaults} disabled={actionLoading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>

        {!sessionSettings && (
          <p className="text-sm text-muted-foreground">
            No custom settings found. Default settings are currently in effect.
          </p>
        )}
      </CardContent>
    </Card>
  );
}