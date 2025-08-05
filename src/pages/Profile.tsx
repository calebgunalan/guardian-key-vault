import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, User, Shield, Monitor, Key } from "lucide-react";
import { MFASetup } from "@/components/security/MFASetup";
import { SessionManagement } from "@/components/security/SessionManagement";
import { APIKeyManagement } from "@/components/security/APIKeyManagement";
import { TimeBasedPermissions } from "@/components/security/TimeBasedPermissions";
import { SessionSettings } from "@/components/security/SessionSettings";
import { RateLimitMonitoring } from "@/components/security/RateLimitMonitoring";

export default function Profile() {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    avatar_url: ""
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await updateProfile(profile);
    setLoading(false);
  };

  if (authLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold">Profile & Security</h1>
          <p className="text-muted-foreground">Manage your account information and security settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="text-lg">
                        {profile.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Profile Picture</p>
                      <p className="text-sm text-muted-foreground">
                        Update your avatar URL below
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed from this interface
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Enter your full name"
                      value={profile.full_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar_url">Avatar URL</Label>
                    <Input
                      id="avatar_url"
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={profile.avatar_url}
                      onChange={(e) => setProfile(prev => ({ ...prev, avatar_url: e.target.value }))}
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Tabs defaultValue="mfa" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="mfa">MFA</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                <TabsTrigger value="time-permissions">Time-Based</TabsTrigger>
                <TabsTrigger value="session-settings">Settings</TabsTrigger>
                <TabsTrigger value="rate-monitoring">Rate Limits</TabsTrigger>
              </TabsList>

              <TabsContent value="mfa">
                <MFASetup />
              </TabsContent>

              <TabsContent value="sessions">
                <SessionManagement />
              </TabsContent>

              <TabsContent value="api-keys">
                <APIKeyManagement />
              </TabsContent>

              <TabsContent value="time-permissions">
                <TimeBasedPermissions />
              </TabsContent>

              <TabsContent value="session-settings">
                <SessionSettings />
              </TabsContent>

              <TabsContent value="rate-monitoring">
                <RateLimitMonitoring />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}