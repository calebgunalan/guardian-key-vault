import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ThreatIntelligenceEngine, 
  ThreatIndicator, 
  ThreatAnalysisResult,
  ThreatMatch,
  BehavioralAnomaly 
} from '@/lib/threat-intelligence';
import { toast } from 'sonner';

export interface ThreatIndicatorData {
  id: string;
  threat_type: 'credential_stuffing' | 'account_takeover' | 'insider_threat' | 'apt' | 'brute_force' | 'lateral_movement';
  indicator_type: 'ip' | 'user_agent' | 'behavioral_pattern' | 'device_fingerprint' | 'timing_pattern';
  indicator_value: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
  source: 'internal' | 'external_feed' | 'ml_detection' | 'manual' | 'honeypot';
  first_seen: string;
  last_seen: string;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface LoginAnalysisData {
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  location?: { country: string; city: string; lat: number; lng: number };
  deviceFingerprint?: string;
  success: boolean;
}

export function useThreatIntelligence() {
  const { user } = useAuth();
  const [threatIndicators, setThreatIndicators] = useState<ThreatIndicatorData[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<ThreatAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchThreatIndicators();
    }
  }, [user]);

  const fetchThreatIndicators = async () => {
    try {
      const { data, error } = await supabase
        .from('threat_intelligence')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setThreatIndicators((data || []).map(item => ({
        ...item,
        threat_type: item.threat_type as ThreatIndicatorData['threat_type'],
        indicator_type: item.indicator_type as ThreatIndicatorData['indicator_type'],
        threat_level: item.threat_level as ThreatIndicatorData['threat_level'],
        source: item.source as ThreatIndicatorData['source'],
        metadata: item.metadata as Record<string, any>
      })));
    } catch (error) {
      console.error('Error fetching threat indicators:', error);
      toast.error('Failed to load threat indicators');
    } finally {
      setLoading(false);
    }
  };

  const analyzeLoginAttempt = async (loginData: LoginAnalysisData): Promise<{
    success: boolean;
    analysis?: ThreatAnalysisResult;
    error?: string;
  }> => {
    setAnalyzing(true);
    try {
      // Perform threat analysis
      const analysis = await ThreatIntelligenceEngine.analyzeLoginAttempt(loginData);
      
      // Store analysis results
      setRecentAnalyses(prev => [analysis, ...prev.slice(0, 19)]); // Keep last 20

      // Store new threats in database if any critical ones are found
      for (const threat of analysis.detected_threats) {
        if (threat.severity_adjusted === 'critical' || threat.severity_adjusted === 'high') {
          await addThreatIndicator({
            threat_type: threat.indicator.threat_type,
            indicator_type: threat.indicator.indicator_type,
            indicator_value: threat.indicator.indicator_value,
            threat_level: threat.indicator.threat_level,
            confidence_score: threat.indicator.confidence_score,
            source: 'ml_detection',
            metadata: {
              ...threat.indicator.metadata,
              analysis_context: threat.context,
              detected_at: new Date().toISOString()
            }
          });
        }
      }

      // Log quantum attack if detected
      if (analysis.requires_immediate_action) {
        await logQuantumAttack(analysis, loginData);
      }

      return { success: true, analysis };
    } catch (error) {
      console.error('Error analyzing login attempt:', error);
      return { success: false, error: error.message };
    } finally {
      setAnalyzing(false);
    }
  };

  const addThreatIndicator = async (indicator: Omit<ThreatIndicatorData, 'id' | 'first_seen' | 'last_seen' | 'is_active' | 'created_at'>): Promise<{
    success: boolean;
    indicatorId?: string;
    error?: string;
  }> => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('threat_intelligence')
        .insert({
          ...indicator,
          first_seen: now,
          last_seen: now,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      await fetchThreatIndicators();
      toast.success('Threat indicator added successfully');

      return { success: true, indicatorId: data.id };
    } catch (error) {
      console.error('Error adding threat indicator:', error);
      toast.error('Failed to add threat indicator');
      return { success: false, error: error.message };
    }
  };

  const updateThreatIndicator = async (
    indicatorId: string,
    updates: Partial<Pick<ThreatIndicatorData, 'threat_level' | 'confidence_score' | 'is_active' | 'metadata'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('threat_intelligence')
        .update({
          ...updates,
          last_seen: new Date().toISOString()
        })
        .eq('id', indicatorId);

      if (error) throw error;

      await fetchThreatIndicators();
      toast.success('Threat indicator updated');
      return true;
    } catch (error) {
      console.error('Error updating threat indicator:', error);
      toast.error('Failed to update threat indicator');
      return false;
    }
  };

  const enrichThreatIndicator = async (indicatorId: string): Promise<boolean> => {
    try {
      const indicator = threatIndicators.find(i => i.id === indicatorId);
      if (!indicator) {
        toast.error('Indicator not found');
        return false;
      }

      // Enrich the indicator using threat intelligence
      const enriched = await ThreatIntelligenceEngine.enrichThreatIndicator(indicator as ThreatIndicator);

      // Update in database
      const { error } = await supabase
        .from('threat_intelligence')
        .update({
          metadata: enriched.metadata,
          last_seen: new Date().toISOString()
        })
        .eq('id', indicatorId);

      if (error) throw error;

      await fetchThreatIndicators();
      toast.success('Threat indicator enriched');
      return true;
    } catch (error) {
      console.error('Error enriching threat indicator:', error);
      toast.error('Failed to enrich threat indicator');
      return false;
    }
  };

  const logQuantumAttack = async (analysis: ThreatAnalysisResult, loginData: LoginAnalysisData) => {
    try {
      // Determine attack type based on analysis
      let attackType = 'unknown';
      let attackSignature = '';

      if (analysis.detected_threats.some(t => t.indicator.threat_type === 'credential_stuffing')) {
        attackType = 'credential_stuffing';
        attackSignature = 'high_velocity_login_attempts';
      } else if (analysis.detected_threats.some(t => t.indicator.threat_type === 'account_takeover')) {
        attackType = 'account_takeover';
        attackSignature = 'impossible_travel_detected';
      } else if (analysis.behavioral_anomalies.some(a => a.severity === 'critical')) {
        attackType = 'behavioral_anomaly';
        attackSignature = 'critical_behavioral_deviation';
      }

      const { error } = await supabase
        .from('quantum_attack_logs')
        .insert({
          attack_type: attackType,
          attack_signature: attackSignature,
          severity: analysis.overall_risk,
          detection_method: 'ml_behavioral_analysis',
          source_ip: loginData.ipAddress,
          target_user_id: loginData.userId || null,
          target_resource: 'authentication',
          is_blocked: analysis.requires_immediate_action,
          metadata: {
            threat_count: analysis.detected_threats.length,
            anomaly_count: analysis.behavioral_anomalies.length,
            risk_score: analysis.risk_score,
            overall_risk: analysis.overall_risk
          } as any
        });

      if (error) {
        console.error('Error logging quantum attack:', error);
      }
    } catch (error) {
      console.error('Error logging quantum attack:', error);
    }
  };

  const simulateLoginAttempt = async (scenario: 'normal' | 'suspicious' | 'malicious'): Promise<LoginAnalysisData> => {
    const baseData = {
      userId: user?.id,
      timestamp: new Date().toISOString(),
      success: true,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    switch (scenario) {
      case 'normal':
        return {
          ...baseData,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: { country: 'US', city: 'New York', lat: 40.7128, lng: -74.0060 }
        };
      
      case 'suspicious':
        return {
          ...baseData,
          ipAddress: '185.220.101.50', // Tor exit node
          userAgent: 'curl/7.68.0',
          location: { country: 'RU', city: 'Moscow', lat: 55.7558, lng: 37.6176 }
        };
      
      case 'malicious':
        return {
          ...baseData,
          ipAddress: '192.168.1.100', // Same IP but impossible travel
          userAgent: 'python-requests/2.25.1',
          location: { country: 'CN', city: 'Beijing', lat: 39.9042, lng: 116.4074 },
          success: false
        };
    }
  };

  const getThreatSummary = () => {
    const total = threatIndicators.length;
    const critical = threatIndicators.filter(i => i.threat_level === 'critical').length;
    const high = threatIndicators.filter(i => i.threat_level === 'high').length;
    const medium = threatIndicators.filter(i => i.threat_level === 'medium').length;
    const low = threatIndicators.filter(i => i.threat_level === 'low').length;

    const byType = threatIndicators.reduce((acc, indicator) => {
      acc[indicator.threat_type] = (acc[indicator.threat_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentThreats = threatIndicators.filter(i => {
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return new Date(i.created_at) > dayAgo;
    }).length;

    return {
      total,
      levels: { critical, high, medium, low },
      byType,
      recentThreats
    };
  };

  return {
    threatIndicators,
    recentAnalyses,
    loading,
    analyzing,
    analyzeLoginAttempt,
    addThreatIndicator,
    updateThreatIndicator,
    enrichThreatIndicator,
    simulateLoginAttempt,
    getThreatSummary,
    refetch: fetchThreatIndicators
  };
}