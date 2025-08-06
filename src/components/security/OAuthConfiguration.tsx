import { useState } from "react";
import { useOAuthProviders } from "@/hooks/useOAuthProviders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Shield, ExternalLink, Key } from "lucide-react";

export function OAuthConfiguration() {
  const { providers, loading, updateOAuthProvider, signInWithOAuth } = useOAuthProviders();
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form state
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const handleEditProvider = (provider: any) => {
    setEditingProvider(provider.id);
    setClientId(provider.client_id || '');
    setClientSecret(provider.client_secret || '');
  };

  const handleSaveProvider = async () => {
    if (!editingProvider) return;

    setActionLoading(true);
    try {
      await updateOAuthProvider(editingProvider, {
        client_id: clientId,
        client_secret: clientSecret,
      });
      
      toast.success('OAuth provider updated successfully');
      setEditingProvider(null);
      setClientId('');
      setClientSecret('');
    } catch (error) {
      toast.error('Failed to update OAuth provider');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleProvider = async (providerId: string, currentEnabled: boolean) => {
    setActionLoading(true);
    try {
      await updateOAuthProvider(providerId, {
        is_enabled: !currentEnabled,
      });
      
      toast.success(`Provider ${!currentEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update provider status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestSignIn = async (providerName: string) => {
    try {
      await signInWithOAuth(providerName);
      toast.success(`Redirecting to ${providerName} sign-in...`);
    } catch (error) {
      toast.error(`Failed to initiate ${providerName} sign-in`);
    }
  };

  const getProviderInstructions = (providerName: string) => {
    const instructions = {
      google: {
        setup: "Go to Google Cloud Console → APIs & Services → Credentials",
        redirect: "Add your site URL to Authorized JavaScript origins and redirect URLs",
        docs: "https://supabase.com/docs/guides/auth/social-login/auth-google"
      },
      github: {
        setup: "Go to GitHub → Settings → Developer settings → OAuth Apps",
        redirect: "Set Authorization callback URL to your Supabase project URL",
        docs: "https://supabase.com/docs/guides/auth/social-login/auth-github"
      },
      microsoft: {
        setup: "Go to Azure Portal → App registrations → New registration",
        redirect: "Add redirect URI to your Supabase project",
        docs: "https://supabase.com/docs/guides/auth/social-login/auth-azure"
      },
      linkedin_oidc: {
        setup: "Go to LinkedIn Developer Portal → Create App",
        redirect: "Add your Supabase redirect URL to authorized redirect URLs",
        docs: "https://supabase.com/docs/guides/auth/social-login/auth-linkedin"
      }
    };

    return instructions[providerName as keyof typeof instructions];
  };

  if (loading) {
    return <div>Loading OAuth providers...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          OAuth/SSO Configuration
        </CardTitle>
        <CardDescription>
          Configure OAuth providers for single sign-on authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {providers.map((provider) => {
            const instructions = getProviderInstructions(provider.name);
            
            return (
              <div key={provider.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">{provider.display_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        OAuth provider for {provider.display_name} authentication
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={provider.is_enabled ? "secondary" : "outline"}>
                      {provider.is_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    {provider.is_enabled && provider.client_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestSignIn(provider.name)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Client ID</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {provider.client_id ? `${provider.client_id.substring(0, 20)}...` : 'Not configured'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Client Secret</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {provider.client_secret ? '••••••••••••••••' : 'Not configured'}
                    </p>
                  </div>
                </div>

                {instructions && (
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-medium mb-2">Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>{instructions.setup}</li>
                      <li>{instructions.redirect}</li>
                      <li>
                        <a 
                          href={instructions.docs} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Follow the complete setup guide
                        </a>
                      </li>
                    </ol>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={provider.is_enabled}
                      onCheckedChange={() => handleToggleProvider(provider.id, provider.is_enabled)}
                      disabled={actionLoading}
                    />
                    <Label className="text-sm">Enable this provider</Label>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleEditProvider(provider)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Configure {provider.display_name}</DialogTitle>
                        <DialogDescription>
                          Enter your OAuth application credentials from {provider.display_name}.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="client-id">Client ID</Label>
                          <Input
                            id="client-id"
                            placeholder="Enter your OAuth client ID"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="client-secret">Client Secret</Label>
                          <Input
                            id="client-secret"
                            type="password"
                            placeholder="Enter your OAuth client secret"
                            value={clientSecret}
                            onChange={(e) => setClientSecret(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleSaveProvider} disabled={actionLoading}>
                            <Key className="h-4 w-4 mr-2" />
                            {actionLoading ? 'Saving...' : 'Save Configuration'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })}
        </div>

        {providers.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No OAuth providers available. Contact your administrator to set up OAuth providers.
          </div>
        )}
      </CardContent>
    </Card>
  );
}