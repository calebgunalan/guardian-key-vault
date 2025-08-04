import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import CryptoJS from "crypto-js";

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: any;
  rate_limit: number;
  is_active: boolean;
  last_used_at?: string;
  expires_at?: string;
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
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApiKeys((data || []).map(key => ({
        ...key,
        permissions: Array.isArray(key.permissions) ? key.permissions : []
      })));
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAPIKey = async (
    name: string,
    permissions: string[] = [],
    rateLimit: number = 1000,
    expiresAt?: Date
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Generate a secure API key
      const randomBytes = CryptoJS.lib.WordArray.random(32);
      const apiKey = `iam_${randomBytes.toString(CryptoJS.enc.Hex)}`;
      
      // Create hash of the key for storage
      const keyHash = CryptoJS.SHA256(apiKey).toString();
      const keyPrefix = apiKey.substring(0, 12) + '...';

      const { data, error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions,
          rate_limit: rateLimit,
          expires_at: expiresAt?.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAPIKeys();

      // Return the full API key only once
      return {
        ...data,
        full_key: apiKey,
      };
    } catch (error) {
      console.error('Error generating API key:', error);
      throw error;
    }
  };

  const updateAPIKey = async (
    keyId: string,
    updates: {
      name?: string;
      permissions?: string[];
      rate_limit?: number;
      is_active?: boolean;
      expires_at?: Date | null;
    }
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updateData: any = { ...updates };
      if (updates.expires_at !== undefined) {
        updateData.expires_at = updates.expires_at?.toISOString() || null;
      }

      const { data, error } = await supabase
        .from('user_api_keys')
        .update(updateData)
        .eq('id', keyId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchAPIKeys();
      return data;
    } catch (error) {
      console.error('Error updating API key:', error);
      throw error;
    }
  };

  const deleteAPIKey = async (keyId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchAPIKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  };

  const validateAPIKey = async (apiKey: string): Promise<APIKey | null> => {
    try {
      const keyHash = CryptoJS.SHA256(apiKey).toString();
      
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

      // Check if key is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return null;
      }

      // Update last_used_at
      await supabase
        .from('user_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id);

      return {
        ...data,
        permissions: Array.isArray(data.permissions) ? data.permissions : []
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  };

  const rotateAPIKey = async (keyId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get existing key data
      const { data: existingKey, error: fetchError } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('id', keyId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingKey) throw new Error('API key not found');

      // Generate new key
      const randomBytes = CryptoJS.lib.WordArray.random(32);
      const newApiKey = `iam_${randomBytes.toString(CryptoJS.enc.Hex)}`;
      const newKeyHash = CryptoJS.SHA256(newApiKey).toString();
      const newKeyPrefix = newApiKey.substring(0, 12) + '...';

      // Update the existing record
      const { data, error } = await supabase
        .from('user_api_keys')
        .update({
          key_hash: newKeyHash,
          key_prefix: newKeyPrefix,
        })
        .eq('id', keyId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchAPIKeys();

      return {
        ...data,
        full_key: newApiKey,
      };
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
    validateAPIKey,
    rotateAPIKey,
    refetch: fetchAPIKeys,
  };
}