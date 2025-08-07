import { useState } from "react";
import { useEmergencyAccess } from "@/hooks/useEmergencyAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertTriangle, Plus, Copy, Shield, Clock, User } from "lucide-react";
import { toast } from "sonner";

export default function EmergencyAccessManagement() {
  const {
    tokens,
    loading,
    generateToken,
    revokeToken,
    getActiveTokens,
    getExpiredTokens
  } = useEmergencyAccess();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    reason: "",
    expiresInHours: 4,
    permissions: [] as string[]
  });

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await generateToken(
        formData.reason,
        formData.permissions,
        formData.expiresInHours
      );
      setGeneratedToken(token);
      toast.success("Emergency access token generated");
    } catch (error) {
      toast.error("Failed to generate emergency token");
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    try {
      await revokeToken(tokenId);
      toast.success("Emergency token revoked");
    } catch (error) {
      toast.error("Failed to revoke token");
    }
  };

  const copyTokenToClipboard = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      toast.success("Token copied to clipboard");
    }
  };

  const resetForm = () => {
    setFormData({
      reason: "",
      expiresInHours: 4,
      permissions: []
    });
    setGeneratedToken(null);
    setIsCreateDialogOpen(false);
  };

  const activeTokens = getActiveTokens();
  const expiredTokens = getExpiredTokens();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Emergency Access Warning */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
            <AlertTriangle className="h-5 w-5" />
            <span>Emergency Access System</span>
          </CardTitle>
          <CardDescription className="text-orange-700 dark:text-orange-300">
            Emergency access tokens provide temporary elevated privileges for break-glass scenarios. 
            Use only when immediate access is critical and normal authentication is unavailable.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Active Tokens */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span>Active Emergency Tokens</span>
                <Badge variant="outline">{activeTokens.length}</Badge>
              </CardTitle>
              <CardDescription>Currently valid emergency access tokens</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-orange-200 text-orange-800 hover:bg-orange-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Emergency Token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span>Generate Emergency Access Token</span>
                  </DialogTitle>
                </DialogHeader>
                {!generatedToken ? (
                  <form onSubmit={handleGenerateToken} className="space-y-4">
                    <div>
                      <Label htmlFor="reason">Emergency Reason</Label>
                      <Textarea
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Describe the emergency situation requiring this access..."
                        required
                        className="min-h-20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiresInHours">Expires In (Hours)</Label>
                      <Input
                        id="expiresInHours"
                        type="number"
                        min="1"
                        max="24"
                        value={formData.expiresInHours}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiresInHours: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                          Security Warning
                        </span>
                      </div>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        This token will grant temporary administrative access. 
                        Ensure it's used only for the specified emergency and securely shared.
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                        Generate Token
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Emergency Token Generated
                        </span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                        Copy this token immediately. It will not be shown again.
                      </p>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={generatedToken}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={copyTokenToClipboard}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={resetForm}>
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {activeTokens.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No active emergency tokens</h3>
              <p className="text-muted-foreground">All emergency tokens have expired or been used</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={token.reason}>
                        {token.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{token.creator_profile?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{new Date(token.expires_at).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round((new Date(token.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))}h remaining
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                            Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Emergency Token</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke this emergency access token? 
                              This action cannot be undone and will immediately invalidate the token.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeToken(token.id)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              Revoke Token
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Historical Tokens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span>Token History</span>
            <Badge variant="outline">{expiredTokens.length}</Badge>
          </CardTitle>
          <CardDescription>Previously used or expired emergency tokens</CardDescription>
        </CardHeader>
        <CardContent>
          {expiredTokens.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No token history</h3>
              <p className="text-muted-foreground">No emergency tokens have been created yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Used By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredTokens.slice(0, 10).map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={token.reason}>
                        {token.reason}
                      </div>
                    </TableCell>
                    <TableCell>{token.creator_profile?.email}</TableCell>
                    <TableCell>
                      {token.used_by ? (
                        token.user_profile?.email || 'Unknown'
                      ) : (
                        <span className="text-muted-foreground">Unused</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {token.used_at ? (
                        <Badge variant="secondary">Used</Badge>
                      ) : new Date(token.expires_at) <= new Date() ? (
                        <Badge variant="outline">Expired</Badge>
                      ) : (
                        <Badge variant="destructive">Revoked</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(token.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}