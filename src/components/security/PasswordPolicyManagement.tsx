import { useState } from "react";
import { usePasswordPolicies } from "@/hooks/usePasswordPolicies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Shield, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function PasswordPolicyManagement() {
  const {
    policies,
    activePolicy,
    loading,
    createPolicy,
    activatePolicy,
    validatePassword,
    getPasswordStrength
  } = usePasswordPolicies();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [testPassword, setTestPassword] = useState("");
  const [formData, setFormData] = useState({
    min_length: 12,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: true,
    password_expiry_days: 90,
    password_history_count: 5,
    max_login_attempts: 3,
    lockout_duration_minutes: 15,
    is_active: false
  });

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPolicy(formData);
      toast.success("Password policy created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create password policy");
    }
  };

  const handleActivatePolicy = async (policyId: string) => {
    try {
      await activatePolicy(policyId);
      toast.success("Password policy activated");
    } catch (error) {
      toast.error("Failed to activate password policy");
    }
  };

  const resetForm = () => {
    setFormData({
      min_length: 12,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_special_chars: true,
      password_expiry_days: 90,
      password_history_count: 5,
      max_login_attempts: 3,
      lockout_duration_minutes: 15,
      is_active: false
    });
  };

  const passwordValidation = validatePassword(testPassword);
  const passwordStrength = getPasswordStrength(testPassword);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Policy Overview */}
      {activePolicy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Active Password Policy</span>
            </CardTitle>
            <CardDescription>Currently enforced password requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Length Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  Minimum {activePolicy.min_length} characters
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Character Requirements</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    {activePolicy.require_uppercase ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span>Uppercase letters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activePolicy.require_lowercase ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span>Lowercase letters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activePolicy.require_numbers ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span>Numbers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activePolicy.require_special_chars ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span>Special characters</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Security Settings</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Expiry: {activePolicy.password_expiry_days ? `${activePolicy.password_expiry_days} days` : 'Never'}</p>
                  <p>History: {activePolicy.password_history_count || 0} passwords</p>
                  <p>Max attempts: {activePolicy.max_login_attempts}</p>
                  <p>Lockout: {activePolicy.lockout_duration_minutes} minutes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Tester */}
      <Card>
        <CardHeader>
          <CardTitle>Password Strength Tester</CardTitle>
          <CardDescription>Test password strength against current policy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-password">Test Password</Label>
            <Input
              id="test-password"
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Enter password to test"
            />
          </div>
          {testPassword && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Strength:</span>
                <Badge variant={passwordStrength.color as any}>
                  {passwordStrength.label}
                </Badge>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Policy Compliance:</span>
                {passwordValidation.isValid ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Password meets all requirements</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {passwordValidation.errors.map((error, index) => (
                      <div key={index} className="flex items-center space-x-2 text-red-600">
                        <X className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Password Policies</CardTitle>
              <CardDescription>Manage password security policies</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Password Policy</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePolicy} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_length">Minimum Length</Label>
                      <Input
                        id="min_length"
                        type="number"
                        min="6"
                        max="128"
                        value={formData.min_length}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_length: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password_expiry_days">Password Expiry (days)</Label>
                      <Input
                        id="password_expiry_days"
                        type="number"
                        min="0"
                        value={formData.password_expiry_days}
                        onChange={(e) => setFormData(prev => ({ ...prev, password_expiry_days: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                      <Input
                        id="max_login_attempts"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.max_login_attempts}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_login_attempts: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lockout_duration_minutes">Lockout Duration (minutes)</Label>
                      <Input
                        id="lockout_duration_minutes"
                        type="number"
                        min="1"
                        value={formData.lockout_duration_minutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, lockout_duration_minutes: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Character Requirements</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="require_uppercase"
                          checked={formData.require_uppercase}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_uppercase: checked }))}
                        />
                        <Label htmlFor="require_uppercase">Require uppercase letters</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="require_lowercase"
                          checked={formData.require_lowercase}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_lowercase: checked }))}
                        />
                        <Label htmlFor="require_lowercase">Require lowercase letters</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="require_numbers"
                          checked={formData.require_numbers}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_numbers: checked }))}
                        />
                        <Label htmlFor="require_numbers">Require numbers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="require_special_chars"
                          checked={formData.require_special_chars}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_special_chars: checked }))}
                        />
                        <Label htmlFor="require_special_chars">Require special characters</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Policy</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No password policies found</h3>
              <p className="text-muted-foreground mb-4">Create your first password policy</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Policy
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Min Length</TableHead>
                  <TableHead>Requirements</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Max Attempts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      {policy.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>{policy.min_length}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {policy.require_uppercase && <Badge variant="outline">A-Z</Badge>}
                        {policy.require_lowercase && <Badge variant="outline">a-z</Badge>}
                        {policy.require_numbers && <Badge variant="outline">0-9</Badge>}
                        {policy.require_special_chars && <Badge variant="outline">!@#</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {policy.password_expiry_days ? `${policy.password_expiry_days}d` : 'Never'}
                    </TableCell>
                    <TableCell>{policy.max_login_attempts}</TableCell>
                    <TableCell>{new Date(policy.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {!policy.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivatePolicy(policy.id)}
                        >
                          Activate
                        </Button>
                      )}
                    </TableCell>
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