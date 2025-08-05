import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface SessionSettings {
  id: string;
  user_id: string;
  max_session_duration: string;
  idle_timeout: string;
  max_concurrent_sessions: number;
  require_reauth_for_sensitive: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateSessionSettingsData {
  max_session_duration?: string;
  idle_timeout?: string;
  max_concurrent_sessions?: number;
  require_reauth_for_sensitive?: boolean;
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

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      setSessionSettings(data as SessionSettings || null);
    } catch (error) {
      console.error('Error fetching session settings:', error);
      setSessionSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionSettings = async (settings: UpdateSessionSettingsData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_session_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        })
        .select()
        .single();

      if (error) throw error;

      setSessionSettings(data as SessionSettings);
      return data as SessionSettings;
    } catch (error) {
      console.error('Error updating session settings:', error);
      throw error;
    }
  };

  const resetToDefaults = async () => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_session_settings')
        .upsert({
          user_id: user.id,
          max_session_duration: '24 hours',
          idle_timeout: '2 hours',
          max_concurrent_sessions: 5,
          require_reauth_for_sensitive: true,
        })
        .select()
        .single();

      if (error) throw error;

      setSessionSettings(data as SessionSettings);
      return data as SessionSettings;
    } catch (error) {
      console.error('Error resetting session settings:', error);
      throw error;
    }
  };

  return {
    sessionSettings,
    loading,
    fetchSessionSettings,
    updateSessionSettings,
    resetToDefaults,
  };
}