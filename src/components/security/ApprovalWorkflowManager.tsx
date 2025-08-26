import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApprovalWorkflows } from '@/hooks/useApprovalWorkflows';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Send, Plus, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ApprovalWorkflowManager() {
  const { workflows, requests, createApprovalRequest, processApprovalRequest, loading } = useApprovalWorkflows();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [requestData, setRequestData] = useState({
    resource_type: 'privilege_escalation',
    justification: '',
    duration_hours: 4,
    target_resource: ''
  });

  const handleSubmitRequest = async () => {
    if (!selectedWorkflow) {
      toast({
        title: "Error",
        description: "Please select a workflow",
        variant: "destructive"
      });
      return;
    }

    try {
      await createApprovalRequest({
        workflow_id: selectedWorkflow,
        resource_type: requestData.resource_type,
        resource_data: {
          justification: requestData.justification,
          duration_hours: requestData.duration_hours,
          target_resource: requestData.target_resource,
          requested_at: new Date().toISOString()
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

      toast({
        title: "Request Submitted",
        description: "Your approval request has been submitted successfully"
      });

      setIsCreateDialogOpen(false);
      setRequestData({
        resource_type: 'privilege_escalation',
        justification: '',
        duration_hours: 4,
        target_resource: ''
      });
      setSelectedWorkflow('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit approval request",
        variant: "destructive"
      });
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject', comments?: string) => {
    try {
      await processApprovalRequest(requestId, action, comments);
      toast({
        title: "Request Processed",
        description: `Request has been ${action}d successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} request`,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Request Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{requests.length}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
              <Send className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{requests.filter(r => r.status === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'approved').length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{requests.filter(r => r.status === 'rejected').length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Approval Requests</CardTitle>
              <CardDescription>
                Submit and manage approval requests for privileged access
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Submit Approval Request</DialogTitle>
                  <DialogDescription>
                    Request approval for privileged access or sensitive operations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Workflow</Label>
                    <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workflow" />
                      </SelectTrigger>
                      <SelectContent>
                        {workflows.map(workflow => (
                          <SelectItem key={workflow.id} value={workflow.id}>
                            {workflow.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Request Type</Label>
                    <Select 
                      value={requestData.resource_type} 
                      onValueChange={(value) => setRequestData(prev => ({ ...prev, resource_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="privilege_escalation">Privilege Escalation</SelectItem>
                        <SelectItem value="system_access">System Access</SelectItem>
                        <SelectItem value="data_export">Data Export</SelectItem>
                        <SelectItem value="emergency_access">Emergency Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Resource</Label>
                    <Input
                      value={requestData.target_resource}
                      onChange={(e) => setRequestData(prev => ({ ...prev, target_resource: e.target.value }))}
                      placeholder="e.g., Production Database, Admin Panel"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (hours)</Label>
                    <Input
                      type="number"
                      value={requestData.duration_hours}
                      onChange={(e) => setRequestData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) }))}
                      min="1"
                      max="168"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Justification</Label>
                    <Textarea
                      value={requestData.justification}
                      onChange={(e) => setRequestData(prev => ({ ...prev, justification: e.target.value }))}
                      placeholder="Please provide a detailed justification for this request..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitRequest}>
                    Submit Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Target Resource</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No approval requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.resource_type}</TableCell>
                      <TableCell>{request.resource_data?.target_resource || 'N/A'}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{request.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(request.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(request.status)}
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(request.created_at))} ago
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProcessRequest(request.id, 'approve')}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProcessRequest(request.id, 'reject')}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}