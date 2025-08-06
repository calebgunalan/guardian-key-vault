import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description?: string;
  resource_type: string;
  approval_steps: ApprovalStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ApprovalStep {
  approver_id: string;
  approver_name?: string;
  required_role?: string;
  timeout_hours?: number;
}

export interface ApprovalRequest {
  id: string;
  workflow_id: string;
  requester_id: string;
  resource_type: string;
  resource_data: Record<string, any>;
  current_step: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approval_history: ApprovalHistoryEntry[];
  expires_at?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  approval_workflows?: {
    id: string;
    name: string;
    resource_type: string;
  };
  profiles?: {
    id: string;
    full_name?: string;
    email: string;
  };
}

export interface ApprovalHistoryEntry {
  step: number;
  action: 'approve' | 'reject';
  approver_id: string;
  comments?: string;
  timestamp: string;
}

export interface CreateApprovalRequestData {
  workflow_id: string;
  resource_type: string;
  resource_data: Record<string, any>;
  expires_at?: string;
}

export function useApprovalWorkflows() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWorkflows();
      fetchRequests();
    } else {
      setWorkflows([]);
      setRequests([]);
      setLoading(false);
    }
  }, [user]);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('approval_workflows')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setWorkflows((data || []).map(workflow => ({
        ...workflow,
        approval_steps: (workflow.approval_steps as unknown) as ApprovalStep[],
      })));
    } catch (error) {
      console.error('Error fetching approval workflows:', error);
      setWorkflows([]);
    }
  };

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          *,
          approval_workflows (
            id,
            name,
            resource_type
          ),
          profiles (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests((data || []).map(request => ({
        ...request,
        status: request.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
        resource_data: request.resource_data as Record<string, any>,
        approval_history: (request.approval_history as unknown) as ApprovalHistoryEntry[],
      } as unknown as ApprovalRequest)));
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const createApprovalRequest = async (requestData: CreateApprovalRequestData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .insert({
          ...requestData,
          requester_id: user.id,
        })
        .select(`
          *,
          approval_workflows (
            id,
            name,
            resource_type
          ),
          profiles (
            id,
            full_name,
            email
          )
        `)
        .single();

      if (error) throw error;

      setRequests(prev => [
        {
          ...data,
          status: data.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
          resource_data: data.resource_data as Record<string, any>,
          approval_history: (data.approval_history as unknown) as ApprovalHistoryEntry[],
        } as unknown as ApprovalRequest,
        ...prev
      ]);
      return data;
    } catch (error) {
      console.error('Error creating approval request:', error);
      throw error;
    }
  };

  const processApprovalRequest = async (
    requestId: string, 
    action: 'approve' | 'reject', 
    comments?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase.rpc('process_approval_request', {
        _request_id: requestId,
        _action: action,
        _approver_id: user.id,
        _comments: comments,
      });

      if (error) throw error;

      // Refresh requests after processing
      await fetchRequests();
      return data;
    } catch (error) {
      console.error('Error processing approval request:', error);
      throw error;
    }
  };

  const cancelApprovalRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('approval_requests')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('requester_id', user?.id); // Ensure user can only cancel their own requests

      if (error) throw error;

      setRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: 'cancelled' as const, completed_at: new Date().toISOString() }
            : request
        )
      );
    } catch (error) {
      console.error('Error cancelling approval request:', error);
      throw error;
    }
  };

  const getMyRequests = () => {
    return requests.filter(request => request.requester_id === user?.id);
  };

  const getPendingRequests = () => {
    return requests.filter(request => request.status === 'pending');
  };

  const getRequestsRequiringMyApproval = () => {
    return requests.filter(request => {
      if (request.status !== 'pending') return false;
      
      // For now, return empty array since we need workflow details with approval steps
      // This will be implemented when we have the full workflow data
      return false;
    });
  };

  return {
    workflows,
    requests,
    loading,
    fetchWorkflows,
    fetchRequests,
    createApprovalRequest,
    processApprovalRequest,
    cancelApprovalRequest,
    getMyRequests,
    getPendingRequests,
    getRequestsRequiringMyApproval,
  };
}