import { useState } from "react";
import { useAPIKeys } from "@/hooks/useAPIKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Key, Plus, Copy, RotateCcw, Trash2, Eye, EyeOff, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function APIKeyManagement() {
  const { apiKeys, loading, generateAPIKey, updateAPIKey, deleteAPIKey, rotateAPIKey } = useAPIKeys();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000);
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreateAPIKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    setActionLoading(true);
    try {
      const result = await generateAPIKey(newKeyName, [], newKeyRateLimit);
      setGeneratedKey(result?.full_key || '');
      setShowGeneratedKey(true);
      setNewKeyName('');
      setNewKeyRateLimit(1000);
      toast.success('API key generated successfully');
    } catch (error) {
      toast.error('Failed to generate API key');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAPIKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to delete the API key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteAPIKey(keyId);
      toast.success('API key deleted successfully');
    } catch (error) {
      toast.error('Failed to delete API key');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRotateAPIKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to rotate the API key "${keyName}"? The old key will stop working immediately.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await rotateAPIKey(keyId);
      setGeneratedKey(result?.full_key || '');
      setShowGeneratedKey(true);
      toast.success('API key rotated successfully');
    } catch (error) {
      toast.error('Failed to rotate API key');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAPIKey = async (keyId: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      await updateAPIKey(keyId, { is_active: !currentStatus });
      toast.success(`API key ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update API key');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setShowGeneratedKey(false);
    setGeneratedKey('');
  };

  if (loading) {
    return <div>Loading API keys...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Keys
        </CardTitle>
        <CardDescription>
          Generate and manage API keys for programmatic access to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            You have {apiKeys.length} API key{apiKeys.length !== 1 ? 's' : ''}
          </p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Generate a new API key for programmatic access to your account.
                </DialogDescription>
              </DialogHeader>

              {!showGeneratedKey ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g., Mobile App, Integration Service"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate-limit">Rate Limit (requests per hour)</Label>
                    <Input
                      id="rate-limit"
                      type="number"
                      value={newKeyRateLimit}
                      onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value) || 1000)}
                      min={100}
                      max={10000}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateAPIKey} disabled={actionLoading}>
                      {actionLoading ? 'Generating...' : 'Generate Key'}
                    </Button>
                    <Button variant="outline" onClick={closeCreateDialog}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <p className="font-medium mb-2">Your new API key:</p>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm">
                        <code className="flex-1">{generatedKey}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Make sure to copy this key now. You won't be able to see it again!
                      </p>
                    </AlertDescription>
                  </Alert>
                  <Button onClick={closeCreateDialog} className="w-full">
                    Done
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{apiKey.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {apiKey.key_prefix}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={apiKey.is_active ? "secondary" : "outline"}>
                    {apiKey.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAPIKey(apiKey.id, apiKey.is_active)}
                    disabled={actionLoading}
                  >
                    {apiKey.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotateAPIKey(apiKey.id, apiKey.name)}
                    disabled={actionLoading}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAPIKey(apiKey.id, apiKey.name)}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Rate Limit</p>
                  <p className="text-muted-foreground">{apiKey.rate_limit} requests/hour</p>
                </div>

                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">
                    {formatDistanceToNow(new Date(apiKey.created_at), { addSuffix: true })}
                  </p>
                </div>

                <div>
                  <p className="font-medium">Last Used</p>
                  <p className="text-muted-foreground">
                    {apiKey.last_used_at 
                      ? formatDistanceToNow(new Date(apiKey.last_used_at), { addSuffix: true })
                      : 'Never'
                    }
                  </p>
                </div>
              </div>

              {apiKey.expires_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Expires {formatDistanceToNow(new Date(apiKey.expires_at), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {apiKeys.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No API keys found. Create your first API key to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}