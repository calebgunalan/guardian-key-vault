import { useState } from "react";
import { useApprovalWorkflows } from "@/hooks/useApprovalWorkflows";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, FileText, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ApprovalWorkflows() {
  const { 
    requests, 
    loading, 
    processApprovalRequest, 
    cancelApprovalRequest,
    getMyRequests,
    getPendingRequests,
    getRequestsRequiringMyApproval 
  } = useApprovalWorkflows();
  
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [approvalComments, setApprovalComments] = useState('');

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      await processApprovalRequest(requestId, action, approvalComments);
      toast.success(`Request ${action}d successfully`);
      setSelectedRequest(null);
      setApprovalComments('');
    } catch (error) {
      toast.error(`Failed to ${action} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    setActionLoading(true);
    try {
      await cancelApprovalRequest(requestId);
      toast.success('Request cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'secondary';
      case 'rejected':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatResourceData = (resourceData: Record<string, any>) => {
    return Object.entries(resourceData).map(([key, value]) => (
      <div key={key} className="flex justify-between text-sm">
        <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
        <span className="text-muted-foreground">{String(value)}</span>
      </div>
    ));
  };

  const RequestCard = ({ request, showApprovalActions = false }: { request: any, showApprovalActions?: boolean }) => (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(request.status)}
          <div>
            <p className="font-medium">
              {request.approval_workflows?.name || 'Unknown Workflow'}
            </p>
            <p className="text-sm text-muted-foreground">
              {request.resource_type} request
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(request.status) as any}>
            {request.status}
          </Badge>
          {request.status === 'pending' && !showApprovalActions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCancelRequest(request.id)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-sm font-medium">Request Details:</p>
        <div className="bg-muted p-3 rounded space-y-1">
          {formatResourceData(request.resource_data)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium">Requested by</p>
          <p className="text-muted-foreground">
            {request.profiles?.full_name || request.profiles?.email || 'Unknown User'}
          </p>
        </div>
        <div>
          <p className="font-medium">Created</p>
          <p className="text-muted-foreground">
            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {request.approval_history && request.approval_history.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Approval History:</p>
          <div className="space-y-2">
            {request.approval_history.map((entry: any, index: number) => (
              <div key={index} className="bg-muted p-2 rounded text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Step {entry.step + 1}: {entry.action}d
                  </span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                  </span>
                </div>
                {entry.comments && (
                  <p className="text-muted-foreground mt-1">{entry.comments}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showApprovalActions && request.status === 'pending' && (
        <div className="pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedRequest(request.id)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Review Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Approval Request</DialogTitle>
                <DialogDescription>
                  Approve or reject this {request.resource_type} request.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="font-medium">Request Details:</p>
                  <div className="bg-muted p-3 rounded space-y-1">
                    {formatResourceData(request.resource_data)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="comments" className="text-sm font-medium">
                    Comments (optional)
                  </label>
                  <Textarea
                    id="comments"
                    placeholder="Add any comments for this decision..."
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleProcessRequest(request.id, 'approve')}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleProcessRequest(request.id, 'reject')}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div>Loading approval workflows...</div>;
  }

  const myRequests = getMyRequests();
  const pendingRequests = getPendingRequests();
  const requestsForMyApproval = getRequestsRequiringMyApproval();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Approval Workflows
        </CardTitle>
        <CardDescription>
          Manage approval requests and review pending approvals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="my-requests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-requests">
              My Requests ({myRequests.length})
            </TabsTrigger>
            <TabsTrigger value="pending-approval">
              Pending Approval ({requestsForMyApproval.length})
            </TabsTrigger>
            <TabsTrigger value="all-requests">
              All Requests ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-requests" className="space-y-4">
            {myRequests.length > 0 ? (
              myRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                You haven't submitted any approval requests yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending-approval" className="space-y-4">
            {requestsForMyApproval.length > 0 ? (
              requestsForMyApproval.map((request) => (
                <RequestCard key={request.id} request={request} showApprovalActions />
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No requests pending your approval.
              </div>
            )}
          </TabsContent>

          <TabsContent value="all-requests" className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No pending approval requests in the system.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}