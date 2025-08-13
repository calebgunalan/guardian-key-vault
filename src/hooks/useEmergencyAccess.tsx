import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface EmergencyAccessToken {
  id: string;
  token_hash: string;
  created_by: string;
  used_by?: string;
  reason: string;
  granted_permissions: any[];
  expires_at: string;
  used_at?: string;
  is_active: boolean;
  created_at: string;
  creator_profile?: {
    email: string;
    full_name?: string;
  };
  user_profile?: {
    email: string;
    full_name?: string;
  };
}

export function useEmergencyAccess() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<EmergencyAccessToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTokens();
    } else {
      setTokens([]);
      setLoading(false);
    }
  }, [user]);

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_access_tokens')
        .select(`
          *,
          creator_profile:profiles!emergency_access_tokens_created_by_fkey (
            email,
            full_name
          ),
          user_profile:profiles!emergency_access_tokens_used_by_fkey (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTokens((data || []).map(item => ({
        ...item,
        granted_permissions: Array.isArray(item.granted_permissions) ? item.granted_permissions : [],
        creator_profile: ((item.creator_profile as any)?.email) ? item.creator_profile as unknown as { email: string; full_name?: string } : { email: '', full_name: null },
        user_profile: ((item.user_profile as any)?.email) ? item.user_profile as unknown as { email: string; full_name?: string } : { email: '', full_name: null }
      })));
    } catch (error) {
      console.error('Error fetching emergency tokens:', error);
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async (
    reason: string, 
    permissions: any[], 
    expiresInHours: number = 4
  ): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_emergency_token', {
        _reason: reason,
        _permissions: permissions,
        _expires_in_hours: expiresInHours
      });

      if (error) throw error;

      await fetchTokens(); // Refresh the list
      return data; // This is the actual token string
    } catch (error) {
      console.error('Error generating emergency token:', error);
      throw error;
    }
  };

  const useToken = async (token: string) => {
    try {
      // Hash the token to match against stored hashes
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Find the token and mark it as used
      const { data: tokenData, error } = await supabase
        .from('emergency_access_tokens')
        .update({
          used_by: user?.id,
          used_at: new Date().toISOString(),
          is_active: false
        })
        .eq('token_hash', tokenHash)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .select()
        .single();

      if (error) throw error;

      await fetchTokens(); // Refresh the list
      return tokenData;
    } catch (error) {
      console.error('Error using emergency token:', error);
      throw error;
    }
  };

  const revokeToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_access_tokens')
        .update({
          is_active: false
        })
        .eq('id', tokenId);

      if (error) throw error;

      setTokens(prev => 
        prev.map(token => 
          token.id === tokenId 
            ? { ...token, is_active: false }
            : token
        )
      );
    } catch (error) {
      console.error('Error revoking emergency token:', error);
      throw error;
    }
  };

  const getActiveTokens = () => {
    return tokens.filter(token => 
      token.is_active && 
      new Date(token.expires_at) > new Date() &&
      !token.used_at
    );
  };

  const getExpiredTokens = () => {
    return tokens.filter(token => 
      new Date(token.expires_at) <= new Date() ||
      token.used_at ||
      !token.is_active
    );
  };

  return {
    tokens,
    loading,
    fetchTokens,
    generateToken,
    useToken,
    revokeToken,
    getActiveTokens,
    getExpiredTokens
  };
}