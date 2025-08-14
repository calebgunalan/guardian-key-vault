import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { EnterpriseBiometrics, BiometricTemplate, BiometricMatchResult } from '@/lib/enterprise-biometrics';
import { QuantumRandom } from '@/lib/quantum-crypto';
import { toast } from 'sonner';

export interface BiometricData {
  id: string;
  user_id: string;
  template_type: 'fingerprint' | 'face' | 'voice' | 'iris' | 'multimodal';
  template_data_encrypted: string;
  quality_metrics: {
    quality_score: number;
    feature_count: number;
    template_size: number;
    extraction_confidence: number;
  };
  extraction_algorithm: string;
  matching_threshold: number;
  enrollment_date: string;
  last_matched?: string;
  match_count: number;
  is_active: boolean;
}

export function useBiometrics() {
  const { user } = useAuth();
  const [biometricTemplates, setBiometricTemplates] = useState<BiometricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBiometricTemplates();
    }
  }, [user]);

  const fetchBiometricTemplates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('biometric_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('enrollment_date', { ascending: false });

      if (error) throw error;

      setBiometricTemplates((data || []).map(item => ({
        ...item,
        template_type: item.template_type as BiometricData['template_type'],
        quality_metrics: item.quality_metrics as BiometricData['quality_metrics']
      })));
    } catch (error) {
      console.error('Error fetching biometric templates:', error);
      toast.error('Failed to load biometric templates');
    } finally {
      setLoading(false);
    }
  };

  const enrollBiometric = async (
    biometricData: Uint8Array,
    templateType: BiometricTemplate['template_type']
  ): Promise<{ success: boolean; templateId?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setEnrolling(true);
    try {
      // Generate user-specific encryption key
      const userKey = await QuantumRandom.bytes(32);
      
      // Extract and encrypt biometric template
      const result = await EnterpriseBiometrics.enrollBiometric(
        user.id,
        biometricData,
        templateType,
        userKey
      );

      // Store in database
      const { data, error } = await supabase
        .from('biometric_templates')
        .insert({
          user_id: user.id,
          template_type: templateType,
          template_data_encrypted: result.encryptedTemplate,
          quality_metrics: result.qualityMetrics,
          extraction_algorithm: 'quantum-safe-v1',
          matching_threshold: 0.8,
          enrollment_date: new Date().toISOString(),
          match_count: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Store the encryption key securely (in a real app, this would be in secure storage)
      localStorage.setItem(`biometric_key_${data.id}`, btoa(String.fromCharCode(...userKey)));

      await fetchBiometricTemplates();
      toast.success('Biometric template enrolled successfully');

      return { success: true, templateId: data.id };
    } catch (error) {
      console.error('Biometric enrollment error:', error);
      toast.error('Failed to enroll biometric template');
      return { success: false, error: error.message };
    } finally {
      setEnrolling(false);
    }
  };

  const verifyBiometric = async (
    biometricData: Uint8Array,
    templateId?: string
  ): Promise<{ success: boolean; matchResult?: BiometricMatchResult; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // If no specific template ID provided, try all active templates
      const templatesToCheck = templateId 
        ? biometricTemplates.filter(t => t.id === templateId)
        : biometricTemplates;

      if (templatesToCheck.length === 0) {
        return { success: false, error: 'No biometric templates found' };
      }

      let bestMatch: BiometricMatchResult | null = null;
      let matchedTemplate: BiometricData | null = null;

      for (const template of templatesToCheck) {
        try {
          // Retrieve encryption key
          const keyData = localStorage.getItem(`biometric_key_${template.id}`);
          if (!keyData) continue;

          const userKey = new Uint8Array(
            atob(keyData).split('').map(char => char.charCodeAt(0))
          );

          // Perform verification
          const matchResult = await EnterpriseBiometrics.verifyBiometric(
            biometricData,
            {
              id: template.id,
              template_type: template.template_type,
              template_data_encrypted: template.template_data_encrypted,
              quality_metrics: template.quality_metrics,
              extraction_algorithm: template.extraction_algorithm,
              matching_threshold: template.matching_threshold
            },
            userKey
          );

          if (matchResult.matched && (!bestMatch || matchResult.confidence > bestMatch.confidence)) {
            bestMatch = matchResult;
            matchedTemplate = template;
          }
        } catch (error) {
          console.error(`Error verifying template ${template.id}:`, error);
        }
      }

      if (bestMatch && bestMatch.matched && matchedTemplate) {
        // Update match statistics
        await supabase
          .from('biometric_templates')
          .update({
            last_matched: new Date().toISOString(),
            match_count: matchedTemplate.match_count + 1
          })
          .eq('id', matchedTemplate.id);

        return { success: true, matchResult: bestMatch };
      }

      return { success: false, error: 'Biometric verification failed' };
    } catch (error) {
      console.error('Biometric verification error:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteBiometricTemplate = async (templateId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('biometric_templates')
        .update({ is_active: false })
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Remove encryption key from local storage
      localStorage.removeItem(`biometric_key_${templateId}`);

      await fetchBiometricTemplates();
      toast.success('Biometric template deleted');
      return true;
    } catch (error) {
      console.error('Error deleting biometric template:', error);
      toast.error('Failed to delete biometric template');
      return false;
    }
  };

  const getBiometricQualityAssessment = (template: BiometricData) => {
    return EnterpriseBiometrics.assessTemplateQuality(template.quality_metrics);
  };

  const simulateImageCapture = async (type: 'fingerprint' | 'face'): Promise<Uint8Array> => {
    // Simulate biometric data capture
    // In a real implementation, this would interface with biometric sensors
    const simulatedData = await QuantumRandom.bytes(type === 'fingerprint' ? 256 : 512);
    return simulatedData;
  };

  return {
    biometricTemplates,
    loading,
    enrolling,
    enrollBiometric,
    verifyBiometric,
    deleteBiometricTemplate,
    getBiometricQualityAssessment,
    simulateImageCapture,
    refetch: fetchBiometricTemplates
  };
}