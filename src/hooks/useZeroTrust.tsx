import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface ZeroTrustPolicy {
  id: string;
  name: string;
  description?: string;
  policy_type: 'device' | 'network' | 'behavioral' | 'location' | 'time_based';
  conditions: Record<string, any>;
  actions: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyEvaluation {
  policyId: string;
  policyName: string;
  matched: boolean;
  action: string;
  reason: string;
  timestamp: Date;
}

export interface TrustScore {
  device: number;
  network: number;
  behavioral: number;
  location: number;
  overall: number;
}

export function useZeroTrust() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<ZeroTrustPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('zero_trust_policies')
        .select('*')
        .eq('is_active', true)
        .order('severity', { ascending: false });

      if (error) throw error;
      setPolicies((data || []).map(policy => ({
        ...policy,
        policy_type: policy.policy_type as 'device' | 'network' | 'behavioral' | 'location' | 'time_based',
        severity: policy.severity as 'low' | 'medium' | 'high' | 'critical',
        conditions: policy.conditions as Record<string, any>,
        actions: policy.actions as Record<string, any>
      })));
    } catch (error) {
      console.error('Error fetching zero trust policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (policy: Omit<ZeroTrustPolicy, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<ZeroTrustPolicy> => {
    try {
      const { data, error } = await supabase
        .from('zero_trust_policies')
        .insert({
          ...policy,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      await fetchPolicies();
      return {
        ...data,
        policy_type: data.policy_type as 'device' | 'network' | 'behavioral' | 'location' | 'time_based',
        severity: data.severity as 'low' | 'medium' | 'high' | 'critical',
        conditions: data.conditions as Record<string, any>,
        actions: data.actions as Record<string, any>
      };
    } catch (error) {
      console.error('Error creating policy:', error);
      throw error;
    }
  };

  const updatePolicy = async (policyId: string, updates: Partial<ZeroTrustPolicy>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('zero_trust_policies')
        .update(updates)
        .eq('id', policyId);

      if (error) throw error;
      await fetchPolicies();
    } catch (error) {
      console.error('Error updating policy:', error);
      throw error;
    }
  };

  const deletePolicy = async (policyId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('zero_trust_policies')
        .update({ is_active: false })
        .eq('id', policyId);

      if (error) throw error;
      await fetchPolicies();
    } catch (error) {
      console.error('Error deleting policy:', error);
      throw error;
    }
  };

  const evaluatePolicies = async (context: {
    deviceId?: string;
    ipAddress?: string;
    location?: string;
    userAgent?: string;
    behavioralScore?: number;
    timeOfAccess?: Date;
  }): Promise<PolicyEvaluation[]> => {
    const evaluations: PolicyEvaluation[] = [];
    const now = context.timeOfAccess || new Date();

    for (const policy of policies) {
      let matched = false;
      let reason = '';

      switch (policy.policy_type) {
        case 'device':
          matched = evaluateDevicePolicy(policy, context);
          reason = matched ? 'Device criteria matched' : 'Device criteria not met';
          break;

        case 'network':
          matched = evaluateNetworkPolicy(policy, context);
          reason = matched ? 'Network criteria matched' : 'Network criteria not met';
          break;

        case 'location':
          matched = evaluateLocationPolicy(policy, context);
          reason = matched ? 'Location criteria matched' : 'Location criteria not met';
          break;

        case 'behavioral':
          matched = evaluateBehavioralPolicy(policy, context);
          reason = matched ? 'Behavioral criteria matched' : 'Behavioral criteria not met';
          break;

        case 'time_based':
          matched = evaluateTimeBasedPolicy(policy, now);
          reason = matched ? 'Time criteria matched' : 'Time criteria not met';
          break;
      }

      evaluations.push({
        policyId: policy.id,
        policyName: policy.name,
        matched,
        action: matched ? policy.actions.action || 'allow' : 'none',
        reason,
        timestamp: now
      });
    }

    return evaluations;
  };

  const evaluateDevicePolicy = (policy: ZeroTrustPolicy, context: any): boolean => {
    const conditions = policy.conditions;
    
    if (conditions.trusted_devices && context.deviceId) {
      return conditions.trusted_devices.includes(context.deviceId);
    }

    if (conditions.allowed_user_agents && context.userAgent) {
      return conditions.allowed_user_agents.some((ua: string) => 
        context.userAgent.includes(ua)
      );
    }

    if (conditions.blocked_user_agents && context.userAgent) {
      return !conditions.blocked_user_agents.some((ua: string) => 
        context.userAgent.includes(ua)
      );
    }

    return true;
  };

  const evaluateNetworkPolicy = (policy: ZeroTrustPolicy, context: any): boolean => {
    const conditions = policy.conditions;
    
    if (conditions.allowed_ip_ranges && context.ipAddress) {
      return conditions.allowed_ip_ranges.some((range: string) => 
        isIPInRange(context.ipAddress, range)
      );
    }

    if (conditions.blocked_ip_ranges && context.ipAddress) {
      return !conditions.blocked_ip_ranges.some((range: string) => 
        isIPInRange(context.ipAddress, range)
      );
    }

    if (conditions.require_vpn && context.ipAddress) {
      // In a real implementation, check if IP is from known VPN ranges
      return isVPNIP(context.ipAddress);
    }

    return true;
  };

  const evaluateLocationPolicy = (policy: ZeroTrustPolicy, context: any): boolean => {
    const conditions = policy.conditions;
    
    if (conditions.allowed_countries && context.location) {
      return conditions.allowed_countries.includes(context.location);
    }

    if (conditions.blocked_countries && context.location) {
      return !conditions.blocked_countries.includes(context.location);
    }

    return true;
  };

  const evaluateBehavioralPolicy = (policy: ZeroTrustPolicy, context: any): boolean => {
    const conditions = policy.conditions;
    
    if (conditions.min_behavioral_score && context.behavioralScore !== undefined) {
      return context.behavioralScore >= conditions.min_behavioral_score;
    }

    if (conditions.max_behavioral_score && context.behavioralScore !== undefined) {
      return context.behavioralScore <= conditions.max_behavioral_score;
    }

    return true;
  };

  const evaluateTimeBasedPolicy = (policy: ZeroTrustPolicy, accessTime: Date): boolean => {
    const conditions = policy.conditions;
    
    if (conditions.allowed_hours) {
      const hour = accessTime.getHours();
      return conditions.allowed_hours.includes(hour);
    }

    if (conditions.allowed_days) {
      const day = accessTime.getDay();
      return conditions.allowed_days.includes(day);
    }

    if (conditions.business_hours_only) {
      const hour = accessTime.getHours();
      const day = accessTime.getDay();
      // Monday-Friday, 9 AM - 5 PM
      return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
    }

    return true;
  };

  const calculateTrustScore = (context: {
    deviceTrusted?: boolean;
    networkTrusted?: boolean;
    locationTrusted?: boolean;
    behavioralScore?: number;
  }): TrustScore => {
    const deviceScore = context.deviceTrusted ? 100 : 0;
    const networkScore = context.networkTrusted ? 100 : 50; // Partial trust for unknown networks
    const locationScore = context.locationTrusted ? 100 : 25; // Low trust for unknown locations
    const behavioralScore = context.behavioralScore || 50; // Default neutral score

    const overall = (deviceScore + networkScore + locationScore + behavioralScore) / 4;

    return {
      device: deviceScore,
      network: networkScore,
      behavioral: behavioralScore,
      location: locationScore,
      overall
    };
  };

  const shouldAllowAccess = (evaluations: PolicyEvaluation[]): boolean => {
    // Check for any "deny" actions
    const denyActions = evaluations.filter(e => 
      e.matched && (e.action === 'deny' || e.action === 'block')
    );

    if (denyActions.length > 0) return false;

    // Check for "require_mfa" actions
    const mfaRequired = evaluations.some(e => 
      e.matched && e.action === 'require_mfa'
    );

    // For simplicity, we'll allow access but note MFA requirement
    return true;
  };

  const getRequiredActions = (evaluations: PolicyEvaluation[]): string[] => {
    const actions = new Set<string>();

    evaluations.forEach(evaluation => {
      if (evaluation.matched && evaluation.action !== 'allow') {
        actions.add(evaluation.action);
      }
    });

    return Array.from(actions);
  };

  // Helper functions
  const isIPInRange = (ip: string, range: string): boolean => {
    // Simplified IP range check - in production, use proper CIDR matching
    if (range.includes('/')) {
      const [network, prefix] = range.split('/');
      // Implement proper CIDR matching here
      return ip.startsWith(network.split('.').slice(0, 2).join('.'));
    }
    return ip === range;
  };

  const isVPNIP = (ip: string): boolean => {
    // In production, check against known VPN IP ranges
    // This is a simplified implementation
    const vpnRanges = ['10.', '192.168.', '172.16.'];
    return vpnRanges.some(range => ip.startsWith(range));
  };

  const getDefaultPolicies = (): Omit<ZeroTrustPolicy, 'id' | 'created_by' | 'created_at' | 'updated_at'>[] => {
    return [
      {
        name: 'Block High-Risk Countries',
        description: 'Block access from high-risk geographical locations',
        policy_type: 'location',
        conditions: {
          blocked_countries: ['Unknown', 'TOR']
        },
        actions: {
          action: 'deny'
        },
        severity: 'high',
        is_active: true
      },
      {
        name: 'Require MFA for New Devices',
        description: 'Require multi-factor authentication for unrecognized devices',
        policy_type: 'device',
        conditions: {
          trusted_devices: []
        },
        actions: {
          action: 'require_mfa'
        },
        severity: 'medium',
        is_active: true
      },
      {
        name: 'Business Hours Access',
        description: 'Restrict access to business hours for sensitive operations',
        policy_type: 'time_based',
        conditions: {
          business_hours_only: true
        },
        actions: {
          action: 'require_approval'
        },
        severity: 'low',
        is_active: false
      },
      {
        name: 'Low Behavioral Score Block',
        description: 'Block access when behavioral score indicates high risk',
        policy_type: 'behavioral',
        conditions: {
          max_behavioral_score: 20
        },
        actions: {
          action: 'deny'
        },
        severity: 'critical',
        is_active: true
      }
    ];
  };

  return {
    policies,
    loading,
    createPolicy,
    updatePolicy,
    deletePolicy,
    evaluatePolicies,
    calculateTrustScore,
    shouldAllowAccess,
    getRequiredActions,
    getDefaultPolicies,
    fetchPolicies
  };
}