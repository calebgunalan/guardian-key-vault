import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { QuantumSessionTokens } from "@/lib/quantum-crypto";

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  permissions: any;
  rate_limit: number;
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  is_quantum_safe: boolean;
  created_at: string;
}

export function useAPIKeys() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAPIKeys();
    } else {
      setApiKeys([]);
      setLoading(false);
    }
  }, [user]);

  const fetchAPIKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAPIKey = async (name: string, permissions: string[] = [], rateLimit: number = 1000) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Generate API key using quantum-safe method
      const apiKey = await QuantumSessionTokens.generateAPIKey();
      const keyHash = await QuantumSessionTokens.hashToken(apiKey);
      const keyPrefix = apiKey.substring(0, 8) + '...';

      const { data, error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions,
          rate_limit: rateLimit,
          is_active: true,
          is_quantum_safe: true
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'CREATE',
        _resource: 'api_key',
        _resource_id: data.id,
        _details: { name, permissions, rate_limit: rateLimit }
      });

      await fetchAPIKeys();
      return { ...data, full_key: apiKey }; // Return full key only once
    } catch (error) {
      console.error('Error generating API key:', error);
      throw error;
    }
  };

  const updateAPIKey = async (keyId: string, updates: Partial<APIKey>) => {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .update(updates)
        .eq('id', keyId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'UPDATE',
        _resource: 'api_key',
        _resource_id: keyId,
        _details: updates
      });

      await fetchAPIKeys();
    } catch (error) {
      console.error('Error updating API key:', error);
      throw error;
    }
  };

  const deleteAPIKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'DELETE',
        _resource: 'api_key',
        _resource_id: keyId,
        _details: {}
      });

      await fetchAPIKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  };

  const rotateAPIKey = async (keyId: string) => {
    try {
      // Generate new API key
      const newApiKey = await QuantumSessionTokens.generateAPIKey();
      const newKeyHash = await QuantumSessionTokens.hashToken(newApiKey);
      const newKeyPrefix = newApiKey.substring(0, 8) + '...';

      const { data, error } = await supabase
        .from('user_api_keys')
        .update({
          key_hash: newKeyHash,
          key_prefix: newKeyPrefix
        })
        .eq('id', keyId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'ROTATE',
        _resource: 'api_key',
        _resource_id: keyId,
        _details: { rotated_at: new Date().toISOString() }
      });

      await fetchAPIKeys();
      return { ...data, full_key: newApiKey }; // Return new full key
    } catch (error) {
      console.error('Error rotating API key:', error);
      throw error;
    }
  };

  return {
    apiKeys,
    loading,
    generateAPIKey,
    updateAPIKey,
    deleteAPIKey,
    rotateAPIKey,
    fetchAPIKeys
  };
}