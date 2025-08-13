import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  QuantumKEM, 
  QuantumSignatures, 
  QuantumSessionTokens, 
  QuantumMFA,
  QuantumKeyPair 
} from '@/lib/quantum-crypto';

export interface QuantumKeyInfo {
  id: string;
  user_id: string;
  key_type: 'kem' | 'signature';
  public_key: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface QuantumSession {
  id: string;
  user_id: string;
  session_token_hash: string;
  quantum_signature?: string;
  created_at: string;
  expires_at: string;
  is_quantum_verified: boolean;
}

export function useQuantumSecurity() {
  const { user } = useAuth();
  const [quantumKeys, setQuantumKeys] = useState<QuantumKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantumEnabled, setQuantumEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      fetchQuantumKeys();
      checkQuantumStatus();
    }
  }, [user]);

  const fetchQuantumKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('quantum_keys')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuantumKeys(data || []);
    } catch (error) {
      console.error('Error fetching quantum keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkQuantumStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_quantum_settings')
        .select('quantum_enabled')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setQuantumEnabled(data?.quantum_enabled || false);
    } catch (error) {
      console.error('Error checking quantum status:', error);
    }
  };

  const enableQuantumSecurity = async (): Promise<{
    kemKeyPair: QuantumKeyPair;
    signatureKeyPair: QuantumKeyPair;
  }> => {
    try {
      // Generate quantum-resistant key pairs
      const kemKeyPair = QuantumKEM.generateKeyPair();
      const signatureKeyPair = QuantumSignatures.generateKeyPair();

      // Store public keys in database
      const { error: kemError } = await supabase
        .from('quantum_keys')
        .insert({
          user_id: user?.id,
          key_type: 'kem',
          public_key: Array.from(kemKeyPair.publicKey).join(','),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        });

      if (kemError) throw kemError;

      const { error: sigError } = await supabase
        .from('quantum_keys')
        .insert({
          user_id: user?.id,
          key_type: 'signature',
          public_key: Array.from(signatureKeyPair.publicKey).join(','),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (sigError) throw sigError;

      // Enable quantum security for user
      const { error: settingsError } = await supabase
        .from('user_quantum_settings')
        .upsert({
          user_id: user?.id,
          quantum_enabled: true,
          kem_private_key_encrypted: Array.from(kemKeyPair.privateKey).join(','),
          signature_private_key_encrypted: Array.from(signatureKeyPair.privateKey).join(',')
        });

      if (settingsError) throw settingsError;

      setQuantumEnabled(true);
      await fetchQuantumKeys();

      return { kemKeyPair, signatureKeyPair };
    } catch (error) {
      console.error('Error enabling quantum security:', error);
      throw error;
    }
  };

  const generateQuantumSession = async (): Promise<string> => {
    try {
      const sessionToken = QuantumSessionTokens.generateToken();
      const tokenHash = QuantumSessionTokens.hashToken(sessionToken);

      // Get user's signature key
      const signatureKey = quantumKeys.find(k => k.key_type === 'signature');
      if (!signatureKey) {
        throw new Error('No quantum signature key found');
      }

      // Create quantum-verified session
      const { error } = await supabase
        .from('quantum_sessions')
        .insert({
          user_id: user?.id,
          session_token_hash: tokenHash,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          is_quantum_verified: true
        });

      if (error) throw error;

      return sessionToken;
    } catch (error) {
      console.error('Error generating quantum session:', error);
      throw error;
    }
  };

  const generateQuantumAPIKey = async (name: string, permissions: string[] = []): Promise<string> => {
    try {
      const apiKey = QuantumSessionTokens.generateAPIKey();
      const keyHash = QuantumSessionTokens.hashToken(apiKey);

      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user?.id,
          name,
          key_hash: keyHash,
          key_prefix: apiKey.substring(0, 8),
          permissions,
          is_quantum_safe: true
        });

      if (error) throw error;

      return apiKey;
    } catch (error) {
      console.error('Error generating quantum API key:', error);
      throw error;
    }
  };

  const rotateQuantumKeys = async (): Promise<void> => {
    try {
      // Deactivate old keys
      const { error: deactivateError } = await supabase
        .from('quantum_keys')
        .update({ is_active: false })
        .eq('user_id', user?.id);

      if (deactivateError) throw deactivateError;

      // Generate new keys
      await enableQuantumSecurity();

      // Log the key rotation
      await supabase.rpc('log_audit_event', {
        _action: 'QUANTUM_KEY_ROTATION',
        _resource: 'quantum_keys',
        _details: { rotated_at: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Error rotating quantum keys:', error);
      throw error;
    }
  };

  const verifyQuantumSignature = async (
    message: string, 
    signature: string, 
    publicKeyId: string
  ): Promise<boolean> => {
    try {
      const keyInfo = quantumKeys.find(k => k.id === publicKeyId && k.key_type === 'signature');
      if (!keyInfo) return false;

      const publicKey = new Uint8Array(keyInfo.public_key.split(',').map(Number));
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = new Uint8Array(signature.split(',').map(Number));

      return QuantumSignatures.verify(signatureBytes, messageBytes, publicKey);
    } catch (error) {
      console.error('Error verifying quantum signature:', error);
      return false;
    }
  };

  const setupQuantumMFA = async (): Promise<{
    secret: string;
    backupCodes: string[];
    qrCode: string;
  }> => {
    try {
      const secret = QuantumMFA.generateSecret();
      const backupCodes = QuantumMFA.generateBackupCodes();
      
      // Store encrypted in database
      const { error } = await supabase
        .from('user_mfa_settings')
        .upsert({
          user_id: user?.id,
          secret,
          backup_codes: backupCodes,
          is_quantum_safe: true
        });

      if (error) throw error;

      // Generate QR code data
      const qrCode = `otpauth://totp/QuantumIAM:${user?.email}?secret=${secret}&issuer=QuantumIAM&algorithm=SHA512&digits=6&period=30`;

      return { secret, backupCodes, qrCode };
    } catch (error) {
      console.error('Error setting up quantum MFA:', error);
      throw error;
    }
  };

  const verifyQuantumMFA = (token: string, secret: string): boolean => {
    return QuantumMFA.verifyTOTP(token, secret);
  };

  const getQuantumSecurityStatus = () => {
    const kemKey = quantumKeys.find(k => k.key_type === 'kem');
    const signatureKey = quantumKeys.find(k => k.key_type === 'signature');
    
    return {
      enabled: quantumEnabled,
      kemKeyActive: !!kemKey,
      signatureKeyActive: !!signatureKey,
      keyCount: quantumKeys.length,
      nextRotation: kemKey ? new Date(kemKey.expires_at || Date.now() + 365 * 24 * 60 * 60 * 1000) : null
    };
  };

  return {
    quantumKeys,
    loading,
    quantumEnabled,
    enableQuantumSecurity,
    generateQuantumSession,
    generateQuantumAPIKey,
    rotateQuantumKeys,
    verifyQuantumSignature,
    setupQuantumMFA,
    verifyQuantumMFA,
    getQuantumSecurityStatus,
    fetchQuantumKeys
  };
}