import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import CryptoJS from "crypto-js";

export interface MFASettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  secret?: string;
  backup_codes?: string[];
  created_at: string;
  updated_at: string;
}

export function useMFA() {
  const { user } = useAuth();
  const [mfaSettings, setMfaSettings] = useState<MFASettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMFASettings();
    } else {
      setMfaSettings(null);
      setLoading(false);
    }
  }, [user]);

  const fetchMFASettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setMfaSettings(data);
    } catch (error) {
      console.error('Error fetching MFA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupMFA = async (serviceName: string = 'IAM System') => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Generate secret
      const secret = new OTPAuth.Secret({ size: 20 });
      const secretBase32 = secret.base32;

      // Create TOTP instance
      const totp = new OTPAuth.TOTP({
        issuer: serviceName,
        label: user.email || 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secretBase32,
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(totp.toString());

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );

      // Save to database
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .upsert({
          user_id: user.id,
          is_enabled: false, // Will be enabled after verification
          secret: secretBase32,
          backup_codes: backupCodes,
        })
        .select()
        .single();

      if (error) throw error;

      setMfaSettings(data);

      return {
        secret: secretBase32,
        qrCodeUrl,
        backupCodes,
        totpUrl: totp.toString(),
      };
    } catch (error) {
      console.error('Error setting up MFA:', error);
      throw error;
    }
  };

  const verifyAndEnableMFA = async (token: string) => {
    if (!user || !mfaSettings?.secret) throw new Error('MFA not set up');

    try {
      const totp = new OTPAuth.TOTP({
        secret: mfaSettings.secret,
      });

      const isValid = totp.validate({ token, window: 1 }) !== null;

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      const { data, error } = await supabase
        .from('user_mfa_settings')
        .update({ is_enabled: true })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setMfaSettings(data);
      return true;
    } catch (error) {
      console.error('Error verifying MFA:', error);
      throw error;
    }
  };

  const disableMFA = async () => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('user_mfa_settings')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setMfaSettings(null);
      return true;
    } catch (error) {
      console.error('Error disabling MFA:', error);
      throw error;
    }
  };

  const verifyMFAToken = async (token: string): Promise<boolean> => {
    if (!mfaSettings?.secret) return false;

    try {
      const totp = new OTPAuth.TOTP({
        secret: mfaSettings.secret,
      });

      const isValid = totp.validate({ token, window: 1 }) !== null;

      // Also check backup codes
      if (!isValid && mfaSettings.backup_codes) {
        const isBackupCode = mfaSettings.backup_codes.includes(token.toUpperCase());
        if (isBackupCode) {
          // Remove used backup code
          const updatedCodes = mfaSettings.backup_codes.filter(code => code !== token.toUpperCase());
          await supabase
            .from('user_mfa_settings')
            .update({ backup_codes: updatedCodes })
            .eq('user_id', user?.id);
          
          return true;
        }
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying MFA token:', error);
      return false;
    }
  };

  const regenerateBackupCodes = async () => {
    if (!user) throw new Error('User not authenticated');

    try {
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );

      const { data, error } = await supabase
        .from('user_mfa_settings')
        .update({ backup_codes: backupCodes })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setMfaSettings(data);
      return backupCodes;
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      throw error;
    }
  };

  return {
    mfaSettings,
    loading,
    setupMFA,
    verifyAndEnableMFA,
    disableMFA,
    verifyMFAToken,
    regenerateBackupCodes,
    refetch: fetchMFASettings,
  };
}