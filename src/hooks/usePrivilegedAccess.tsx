import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  PrivilegedAccessManager, 
  PrivilegedAccount, 
  PrivilegedSession, 
  PAMCheckoutRequest, 
  PAMCheckoutResult,
  SessionActivity 
} from '@/lib/privileged-access';
import { QuantumRandom } from '@/lib/quantum-crypto';
import { toast } from 'sonner';

export interface PrivilegedAccountData {
  id: string;
  account_name: string;
  account_type: 'service' | 'admin' | 'emergency' | 'shared';
  target_system: string;
  credentials_encrypted: string;
  access_policy: any;
  checkout_duration: string;
  auto_rotate: boolean;
  rotation_interval: string;
  last_rotation?: string;
  next_rotation?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PrivilegedSessionData {
  id: string;
  privileged_account_id: string;
  user_id: string;
  session_purpose: string;
  approval_request_id?: string;
  session_start: string;
  session_end?: string;
  activities: SessionActivity[];
  is_recorded: boolean;
  recording_path?: string;
  risk_score: number;
  created_at: string;
}

export function usePrivilegedAccess() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<PrivilegedAccountData[]>([]);
  const [sessions, setSessions] = useState<PrivilegedSessionData[]>([]);
  const [activeSessions, setActiveSessions] = useState<PrivilegedSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPrivilegedAccounts();
      fetchPrivilegedSessions();
    }
  }, [user]);

  const fetchPrivilegedAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('privileged_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_name');

      if (error) throw error;
      setAccounts((data || []).map(item => ({
        ...item,
        account_type: item.account_type as PrivilegedAccountData['account_type']
      })));
    } catch (error) {
      console.error('Error fetching privileged accounts:', error);
      toast.error('Failed to load privileged accounts');
    }
  };

  const fetchPrivilegedSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('privileged_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('session_start', { ascending: false })
        .limit(50);

      if (error) throw error;

      const allSessions = (data || []).map(item => ({
        ...item,
        activities: (item.activities as any) || []
      }));
      setSessions(allSessions);
      setActiveSessions(allSessions.filter(s => !s.session_end));
    } catch (error) {
      console.error('Error fetching privileged sessions:', error);
      toast.error('Failed to load privileged sessions');
    } finally {
      setLoading(false);
    }
  };

  const createPrivilegedAccount = async (accountData: {
    account_name: string;
    account_type: 'service' | 'admin' | 'emergency' | 'shared';
    target_system: string;
    credentials: Record<string, string>;
    access_policy: any;
    checkout_duration?: string;
    rotation_interval?: string;
  }): Promise<{ success: boolean; accountId?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Generate master key for encryption
      const masterKey = await QuantumRandom.bytes(32);
      
      // Create account using PAM library
      const account = await PrivilegedAccessManager.createPrivilegedAccount(
        {
          account_name: accountData.account_name,
          account_type: accountData.account_type,
          target_system: accountData.target_system,
          access_policy: accountData.access_policy,
          checkout_duration: accountData.checkout_duration || 'PT4H',
          auto_rotate: true,
          rotation_interval: accountData.rotation_interval || 'P30D',
          is_active: true
        },
        accountData.credentials,
        masterKey
      );

      // Store in database
      const { data, error } = await supabase
        .from('privileged_accounts')
        .insert({
          account_name: account.account_name,
          account_type: account.account_type,
          target_system: account.target_system,
          credentials_encrypted: account.credentials_encrypted,
          access_policy: account.access_policy,
          checkout_duration: account.checkout_duration,
          auto_rotate: account.auto_rotate,
          rotation_interval: account.rotation_interval,
          last_rotation: account.last_rotation,
          next_rotation: account.next_rotation,
          is_active: account.is_active,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Store master key securely (in production, use proper key management)
      localStorage.setItem(`pam_key_${data.id}`, btoa(String.fromCharCode(...masterKey)));

      await fetchPrivilegedAccounts();
      toast.success('Privileged account created successfully');

      return { success: true, accountId: data.id };
    } catch (error) {
      console.error('Error creating privileged account:', error);
      toast.error('Failed to create privileged account');
      return { success: false, error: error.message };
    }
  };

  const checkoutCredentials = async (
    accountId: string,
    purpose: string,
    duration?: number,
    justification: string = ''
  ): Promise<{ success: boolean; result?: PAMCheckoutResult; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setCheckingOut(true);
    try {
      const account = accounts.find(a => a.id === accountId);
      if (!account) {
        return { success: false, error: 'Account not found' };
      }

      // Retrieve master key
      const keyData = localStorage.getItem(`pam_key_${accountId}`);
      if (!keyData) {
        return { success: false, error: 'Unable to decrypt credentials' };
      }

      const masterKey = new Uint8Array(
        atob(keyData).split('').map(char => char.charCodeAt(0))
      );

      // Prepare checkout request
      const request: PAMCheckoutRequest = {
        account_id: accountId,
        purpose,
        duration,
        justification,
        ip_address: '192.168.1.1' // In production, get real IP
      };

      // Checkout credentials
      const result = await PrivilegedAccessManager.checkoutCredentials(
        account as PrivilegedAccount,
        request,
        masterKey,
        user.id
      );

      if (result.success && result.session_id) {
        // Create session record
        const { error: sessionError } = await supabase
          .from('privileged_sessions')
          .insert({
            privileged_account_id: accountId,
            user_id: user.id,
            session_purpose: purpose,
            session_start: new Date().toISOString(),
            activities: [],
            is_recorded: true,
            risk_score: 0
          });

        if (sessionError) {
          console.error('Error creating session record:', sessionError);
        }

        await fetchPrivilegedSessions();
        toast.success('Credentials checked out successfully');
      }

      return { success: result.success, result, error: result.error };
    } catch (error) {
      console.error('Error checking out credentials:', error);
      toast.error('Failed to checkout credentials');
      return { success: false, error: error.message };
    } finally {
      setCheckingOut(false);
    }
  };

  const recordSessionActivity = async (
    sessionId: string,
    activityType: SessionActivity['activity_type'],
    description: string,
    riskLevel: SessionActivity['risk_level'] = 'low'
  ): Promise<boolean> => {
    try {
      const activity = PrivilegedAccessManager.recordSessionActivity(sessionId, {
        activity_type: activityType,
        description,
        risk_level: riskLevel
      });

      // Update session in database
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        const updatedActivities = [...session.activities, activity];
        const newRiskScore = PrivilegedAccessManager.calculateSessionRiskScore(updatedActivities);

        const { error } = await supabase
          .from('privileged_sessions')
          .update({
            activities: updatedActivities as any,
            risk_score: newRiskScore
          })
          .eq('id', sessionId);

        if (error) throw error;

        await fetchPrivilegedSessions();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error recording session activity:', error);
      return false;
    }
  };

  const endSession = async (
    sessionId: string,
    reason: string = 'normal'
  ): Promise<{ success: boolean; summary?: any; error?: string }> => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // Calculate session summary
      const summary = await PrivilegedAccessManager.endSession(
        session as PrivilegedSession,
        reason
      );

      // Update database
      const { error } = await supabase
        .from('privileged_sessions')
        .update({
          session_end: new Date().toISOString(),
          risk_score: summary.session_summary.risk_score
        })
        .eq('id', sessionId);

      if (error) throw error;

      await fetchPrivilegedSessions();
      toast.success('Session ended successfully');

      return { success: true, summary };
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
      return { success: false, error: error.message };
    }
  };

  const rotateCredentials = async (accountId: string): Promise<boolean> => {
    try {
      const account = accounts.find(a => a.id === accountId);
      if (!account) {
        toast.error('Account not found');
        return false;
      }

      // In a real implementation, this would integrate with the target system
      // to actually rotate the credentials
      const newCredentials = {
        username: account.account_name,
        password: await QuantumRandom.string(16)
      };

      // Retrieve master key
      const keyData = localStorage.getItem(`pam_key_${accountId}`);
      if (!keyData) {
        toast.error('Unable to decrypt credentials');
        return false;
      }

      const masterKey = new Uint8Array(
        atob(keyData).split('').map(char => char.charCodeAt(0))
      );

      // Rotate credentials
      const rotatedAccount = await PrivilegedAccessManager.rotateCredentials(
        account as PrivilegedAccount,
        newCredentials,
        masterKey
      );

      // Update database
      const { error } = await supabase
        .from('privileged_accounts')
        .update({
          credentials_encrypted: rotatedAccount.credentials_encrypted,
          last_rotation: rotatedAccount.last_rotation,
          next_rotation: rotatedAccount.next_rotation
        })
        .eq('id', accountId);

      if (error) throw error;

      await fetchPrivilegedAccounts();
      toast.success('Credentials rotated successfully');
      return true;
    } catch (error) {
      console.error('Error rotating credentials:', error);
      toast.error('Failed to rotate credentials');
      return false;
    }
  };

  const getRotationSchedule = () => {
    return PrivilegedAccessManager.generateRotationSchedule(accounts as PrivilegedAccount[]);
  };

  return {
    accounts,
    sessions,
    activeSessions,
    loading,
    checkingOut,
    createPrivilegedAccount,
    checkoutCredentials,
    recordSessionActivity,
    endSession,
    rotateCredentials,
    getRotationSchedule,
    refetch: () => {
      fetchPrivilegedAccounts();
      fetchPrivilegedSessions();
    }
  };
}