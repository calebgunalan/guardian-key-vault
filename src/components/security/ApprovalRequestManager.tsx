import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Send, FileText, User, Key, Shield, Settings } from 'lucide-react';

interface ApprovalRequest {
  resourceType: string;
  resourceData: Record<string, any>;
  justification: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export function ApprovalRequestManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<ApprovalRequest>({
    resourceType: '',
    resourceData: {},
    justification: '',
    urgencyLevel: 'medium'
  });

  const resourceTypes = [
    { value: 'user_role', label: 'User Role Change', icon: User, description: 'Request to change user roles or permissions' },
    { value: 'api_key', label: 'API Key Creation', icon: Key, description: 'Request high-privilege API key generation' },
    { value: 'security_policy', label: 'Security Policy Update', icon: Shield, description: 'Modify zero trust or security policies' },
    { value: 'system_config', label: 'System Configuration', icon: Settings, description: 'Change system-wide configuration' },
    { value: 'privileged_access', label: 'Privileged Access', icon: FileText, description: 'Request elevated system access' }
  ];

  const handleResourceTypeChange = (type: string) => {
    setRequest(prev => ({ ...prev, resourceType: type }));
    
    // Pre-populate some fields based on resource type
    switch (type) {
      case 'user_role':
        setRequest(prev => ({
          ...prev,
          resourceData: {
            target_user_id: '',
            current_role: '',
            requested_role: '',
            effective_date: new Date().toISOString().split('T')[0]
          }
        }));
        break;
      case 'api_key':
        setRequest(prev => ({
          ...prev,
          resourceData: {
            key_name: '',
            permissions: [],
            rate_limit: 1000,
            expires_in_days: 90,
            quantum_safe: true
          }
        }));
        break;
      case 'security_policy':
        setRequest(prev => ({
          ...prev,
          resourceData: {
            policy_name: '',
            policy_type: '',
            scope: 'organization',
            enforcement_level: 'monitor'
          }
        }));
        break;
      case 'system_config':
        setRequest(prev => ({
          ...prev,
          resourceData: {
            config_key: '',
            new_value: '',
            environment: 'production'
          }
        }));
        break;
      case 'privileged_access':
        setRequest(prev => ({
          ...prev,
          resourceData: {
            access_type: 'temporary',
            duration_hours: 4,
            target_systems: [],
            access_level: 'read-only'
          }
        }));
        break;
    }
  };

  const updateResourceData = (field: string, value: any) => {
    setRequest(prev => ({
      ...prev,
      resourceData: {
        ...prev.resourceData,
        [field]: value
      }
    }));
  };

  const submitApprovalRequest = async () => {
    if (!user || !request.resourceType || !request.justification) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Find appropriate workflow for this resource type
      const { data: workflows, error: workflowError } = await supabase
        .from('approval_workflows')
        .select('*')
        .eq('resource_type', request.resourceType)
        .eq('is_active', true)
        .limit(1);

      if (workflowError) throw workflowError;

      const workflow = workflows[0];
      if (!workflow) {
        throw new Error(`No approval workflow found for resource type: ${request.resourceType}`);
      }

      // Create approval request
      const { data, error } = await supabase
        .from('approval_requests')
        .insert({
          workflow_id: workflow.id,
          requester_id: user.id,
          resource_type: request.resourceType,
          resource_data: {
            ...request.resourceData,
            justification: request.justification,
            urgency_level: request.urgencyLevel,
            requested_at: new Date().toISOString()
          },
          status: 'pending',
          current_step: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'CREATE',
        _resource: 'approval_request',
        _resource_id: data.id,
        _details: {
          resource_type: request.resourceType,
          workflow_id: workflow.id,
          urgency: request.urgencyLevel
        } as any
      });

      toast({
        title: "Request Submitted",
        description: "Your approval request has been submitted successfully"
      });

      // Reset form
      setRequest({
        resourceType: '',
        resourceData: {},
        justification: '',
        urgencyLevel: 'medium'
      });
      setIsDialogOpen(false);

    } catch (error: any) {
      console.error('Error submitting approval request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit approval request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderResourceFields = () => {
    const selectedType = resourceTypes.find(rt => rt.value === request.resourceType);
    
    if (!selectedType) return null;

    switch (request.resourceType) {
      case 'user_role':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target User Email</Label>
                <Input
                  placeholder="user@company.com"
                  value={request.resourceData.target_user_id || ''}
                  onChange={(e) => updateResourceData('target_user_id', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Current Role</Label>
                <Select value={request.resourceData.current_role || ''} onValueChange={(value) => updateResourceData('current_role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Current role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Requested Role</Label>
                <Select value={request.resourceData.requested_role || ''} onValueChange={(value) => updateResourceData('requested_role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Requested role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Effective Date</Label>
                <Input
                  type="date"
                  value={request.resourceData.effective_date || ''}
                  onChange={(e) => updateResourceData('effective_date', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      
      case 'api_key':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>API Key Name</Label>
                <Input
                  placeholder="Production Integration Key"
                  value={request.resourceData.key_name || ''}
                  onChange={(e) => updateResourceData('key_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Rate Limit (requests/hour)</Label>
                <Input
                  type="number"
                  value={request.resourceData.rate_limit || 1000}
                  onChange={(e) => updateResourceData('rate_limit', parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expires In (days)</Label>
                <Input
                  type="number"
                  value={request.resourceData.expires_in_days || 90}
                  onChange={(e) => updateResourceData('expires_in_days', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantum Safe</Label>
                <Select value={request.resourceData.quantum_safe ? 'true' : 'false'} onValueChange={(value) => updateResourceData('quantum_safe', value === 'true')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {selectedType.description}
            </div>
            <div className="p-4 border rounded-lg bg-muted">
              <p className="text-sm">
                Additional configuration fields will be added based on the specific requirements 
                for {selectedType.label.toLowerCase()} requests.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Approval Request Manager
            </CardTitle>
            <CardDescription>
              Submit requests for privileged actions that require administrative approval
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit Approval Request</DialogTitle>
                <DialogDescription>
                  Request approval for privileged actions or system changes
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Resource Type Selection */}
                <div className="space-y-3">
                  <Label>Request Type</Label>
                  <Select value={request.resourceType} onValueChange={handleResourceTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resource-specific fields */}
                {request.resourceType && renderResourceFields()}

                {/* Justification */}
                <div className="space-y-2">
                  <Label>Justification *</Label>
                  <Textarea
                    placeholder="Provide a detailed justification for this request..."
                    value={request.justification}
                    onChange={(e) => setRequest(prev => ({ ...prev, justification: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Urgency Level */}
                <div className="space-y-2">
                  <Label>Urgency Level</Label>
                  <Select value={request.urgencyLevel} onValueChange={(value: any) => setRequest(prev => ({ ...prev, urgencyLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Normal processing time</SelectItem>
                      <SelectItem value="medium">Medium - Standard priority</SelectItem>
                      <SelectItem value="high">High - Expedited review</SelectItem>
                      <SelectItem value="critical">Critical - Immediate attention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitApprovalRequest} disabled={loading || !request.resourceType || !request.justification}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resourceTypes.map((type) => (
              <Card key={type.value} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      handleResourceTypeChange(type.value);
                      setIsDialogOpen(true);
                    }}>
                <div className="flex items-center gap-3">
                  <type.icon className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium">{type.label}</h3>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">How Approval Requests Work:</h4>
            <ul className="space-y-1">
              <li>• Requests are routed through predefined approval workflows</li>
              <li>• Each request type has specific approvers and requirements</li>
              <li>• All requests are logged for audit and compliance purposes</li>
              <li>• You can track request status in the Approval Workflows section</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}