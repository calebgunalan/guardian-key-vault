import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface OAuthProvider {
  id: string;
  name: string;
  display_name: string;
  client_id?: string;
  client_secret?: string;
  authorization_url?: string;
  token_url?: string;
  user_info_url?: string;
  scope?: string;
  is_enabled: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UpdateOAuthProviderData {
  client_id?: string;
  client_secret?: string;
  is_enabled?: boolean;
  config?: Record<string, any>;
}

export function useOAuthProviders() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOAuthProviders();
    } else {
      setProviders([]);
      setLoading(false);
    }
  }, [user]);

  const fetchOAuthProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('oauth_providers')
        .select('*')
        .order('display_name');

      if (error) throw error;

      setProviders((data || []).map(provider => ({
        ...provider,
        config: provider.config as Record<string, any>,
      })));
    } catch (error) {
      console.error('Error fetching OAuth providers:', error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOAuthProvider = async (providerId: string, updates: UpdateOAuthProviderData) => {
    try {
      const { data, error } = await supabase
        .from('oauth_providers')
        .update(updates)
        .eq('id', providerId)
        .select()
        .single();

      if (error) throw error;

      setProviders(prev => 
        prev.map(provider => provider.id === providerId ? {
          ...data,
          config: data.config as Record<string, any>,
        } : provider)
      );
      return data;
    } catch (error) {
      console.error('Error updating OAuth provider:', error);
      throw error;
    }
  };

  const getEnabledProviders = () => {
    return providers.filter(provider => provider.is_enabled);
  };

  const signInWithOAuth = async (providerName: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: providerName as any,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error signing in with ${providerName}:`, error);
      throw error;
    }
  };

  return {
    providers,
    loading,
    fetchOAuthProviders,
    updateOAuthProvider,
    getEnabledProviders,
    signInWithOAuth,
  };
}