import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface SessionSettings {
  id: string;
  user_id: string;
  session_timeout_minutes: number;
  max_concurrent_sessions: number;
  require_mfa_for_sensitive_ops: boolean;
  allowed_ip_ranges?: string[];
  block_concurrent_sessions: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export function useSessionSettings() {
  const { user } = useAuth();
  const [sessionSettings, setSessionSettings] = useState<SessionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessionSettings();
    } else {
      setSessionSettings(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSessionSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_session_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Create default settings if none exist
        await createDefaultSettings();
      } else {
        setSessionSettings(data);
      }
    } catch (error) {
      console.error('Error fetching session settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_session_settings')
        .insert({
          user_id: user.id,
          session_timeout_minutes: 30,
          max_concurrent_sessions: 5,
          require_mfa_for_sensitive_ops: true,
          block_concurrent_sessions: false,
          timezone: 'UTC'
        })
        .select()
        .single();

      if (error) throw error;
      setSessionSettings(data);
    } catch (error) {
      console.error('Error creating default session settings:', error);
    }
  };

  const updateSessionSettings = async (updates: Partial<SessionSettings>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_session_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'UPDATE',
        _resource: 'session_settings',
        _resource_id: data.id,
        _details: updates
      });

      setSessionSettings(data);
      return data;
    } catch (error) {
      console.error('Error updating session settings:', error);
      throw error;
    }
  };

  const resetToDefaults = async () => {
    const defaultSettings = {
      session_timeout_minutes: 30,
      max_concurrent_sessions: 5,
      require_mfa_for_sensitive_ops: true,
      allowed_ip_ranges: null,
      block_concurrent_sessions: false,
      timezone: 'UTC'
    };

    return updateSessionSettings(defaultSettings);
  };

  return {
    sessionSettings,
    loading,
    updateSessionSettings,
    resetToDefaults,
    fetchSessionSettings
  };
}