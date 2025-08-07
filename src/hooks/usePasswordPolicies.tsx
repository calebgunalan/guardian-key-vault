import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface PasswordPolicy {
  id: string;
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  password_expiry_days?: number;
  password_history_count?: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePasswordPolicies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<PasswordPolicy[]>([]);
  const [activePolicy, setActivePolicy] = useState<PasswordPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPolicies();
    } else {
      setPolicies([]);
      setActivePolicy(null);
      setLoading(false);
    }
  }, [user]);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('password_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPolicies(data || []);
      setActivePolicy(data?.find(p => p.is_active) || null);
    } catch (error) {
      console.error('Error fetching password policies:', error);
      setPolicies([]);
      setActivePolicy(null);
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (policyData: Omit<PasswordPolicy, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('password_policies')
        .insert(policyData)
        .select()
        .single();

      if (error) throw error;

      setPolicies(prev => [data, ...prev]);
      if (data.is_active) {
        setActivePolicy(data);
      }
      return data;
    } catch (error) {
      console.error('Error creating password policy:', error);
      throw error;
    }
  };

  const updatePolicy = async (policyId: string, updates: Partial<PasswordPolicy>) => {
    try {
      const { data, error } = await supabase
        .from('password_policies')
        .update(updates)
        .eq('id', policyId)
        .select()
        .single();

      if (error) throw error;

      setPolicies(prev => 
        prev.map(policy => 
          policy.id === policyId ? data : policy
        )
      );

      if (data.is_active) {
        setActivePolicy(data);
      }
      return data;
    } catch (error) {
      console.error('Error updating password policy:', error);
      throw error;
    }
  };

  const activatePolicy = async (policyId: string) => {
    try {
      // Deactivate all policies first
      await supabase
        .from('password_policies')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Activate the selected policy
      const { data, error } = await supabase
        .from('password_policies')
        .update({ is_active: true })
        .eq('id', policyId)
        .select()
        .single();

      if (error) throw error;

      setPolicies(prev => 
        prev.map(policy => ({
          ...policy,
          is_active: policy.id === policyId
        }))
      );
      setActivePolicy(data);
      return data;
    } catch (error) {
      console.error('Error activating password policy:', error);
      throw error;
    }
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    if (!activePolicy) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    if (password.length < activePolicy.min_length) {
      errors.push(`Password must be at least ${activePolicy.min_length} characters long`);
    }

    if (activePolicy.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (activePolicy.require_lowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (activePolicy.require_numbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (activePolicy.require_special_chars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['destructive', 'destructive', 'secondary', 'secondary', 'default', 'default'];

    return {
      score,
      label: labels[score] || 'Very Weak',
      color: colors[score] || 'destructive'
    };
  };

  return {
    policies,
    activePolicy,
    loading,
    fetchPolicies,
    createPolicy,
    updatePolicy,
    activatePolicy,
    validatePassword,
    getPasswordStrength
  };
}