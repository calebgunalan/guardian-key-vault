import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string | null;
  user_agent?: string | null;
  location_country?: string | null;
  location_city?: string | null;
  is_active: boolean;
  last_activity: string;
  created_at: string;
  expires_at: string;
}

export function useSessionManagement() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserSessions();
      trackCurrentSession();
    } else {
      setSessions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchUserSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;

      setSessions((data || []).map(session => ({
        ...session,
        ip_address: session.ip_address as string | null,
        user_agent: session.user_agent as string | null,
        location_country: session.location_country as string | null,
        location_city: session.location_city as string | null,
      })));
    } catch (error) {
      console.error('Error fetching user sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackCurrentSession = async () => {
    if (!user) return;

    try {
      // Get current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's IP and location (basic implementation)
      const userAgent = navigator.userAgent;
      const sessionToken = session.access_token;

      // Insert or update current session
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: user.id,
          session_token: sessionToken,
          user_agent: userAgent,
          is_active: true,
          last_activity: new Date().toISOString(),
        });

      if (error) {
        console.error('Error tracking session:', error);
      }
    } catch (error) {
      console.error('Error tracking current session:', error);
    }
  };

  const terminateSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // If terminating current session, sign out
      const currentSession = sessions.find(s => s.id === sessionId);
      if (currentSession) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && currentSession.session_token === session.access_token) {
          await supabase.auth.signOut();
        }
      }

      await fetchUserSessions();
    } catch (error) {
      console.error('Error terminating session:', error);
      throw error;
    }
  };

  const terminateAllOtherSessions = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('session_token', session.access_token);

      if (error) throw error;

      await fetchUserSessions();
    } catch (error) {
      console.error('Error terminating other sessions:', error);
      throw error;
    }
  };

  const updateSessionActivity = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('session_token', session.access_token);

      if (error) {
        console.error('Error updating session activity:', error);
      }
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  };

  const getLocationInfo = async (ipAddress: string) => {
    try {
      // Basic IP geolocation (in production, use a proper service)
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const data = await response.json();
      
      return {
        country: data.country_name,
        city: data.city,
      };
    } catch (error) {
      console.error('Error getting location info:', error);
      return null;
    }
  };

  // Auto-update session activity every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(updateSessionActivity, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return {
    sessions,
    loading,
    fetchUserSessions,
    terminateSession,
    terminateAllOtherSessions,
    updateSessionActivity,
    trackCurrentSession,
  };
}