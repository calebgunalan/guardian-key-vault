import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BehavioralAnalyzer, RiskAssessmentEngine, RiskAssessment } from '@/lib/quantum-analytics';

export interface BehavioralPatternInfo {
  id: string;
  user_id: string;
  pattern_type: 'login_times' | 'ip_locations' | 'device_usage' | 'access_patterns' | 'typing_patterns';
  pattern_data: Record<string, any>;
  confidence_score: number;
  last_updated: string;
  created_at: string;
}

export interface RiskScoreInfo {
  id: string;
  user_id: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  risk_factors: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
  calculated_at: string;
  expires_at: string;
}

export function useRiskAssessment() {
  const { user } = useAuth();
  const [behavioralPatterns, setBehavioralPatterns] = useState<BehavioralPatternInfo[]>([]);
  const [currentRiskScore, setCurrentRiskScore] = useState<RiskScoreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBehavioralPatterns();
      fetchCurrentRiskScore();
    }
  }, [user]);

  const fetchBehavioralPatterns = async () => {
    try {
      const { data, error } = await supabase
        .from('user_behavioral_patterns')
        .select('*')
        .eq('user_id', user?.id)
        .order('last_updated', { ascending: false });

      if (error) throw error;
      setBehavioralPatterns((data || []).map(pattern => ({
        ...pattern,
        pattern_type: pattern.pattern_type as 'login_times' | 'ip_locations' | 'device_usage' | 'access_patterns' | 'typing_patterns',
        pattern_data: pattern.pattern_data as Record<string, any>
      })));
    } catch (error) {
      console.error('Error fetching behavioral patterns:', error);
    }
  };

  const fetchCurrentRiskScore = async () => {
    try {
      const { data, error } = await supabase
        .from('user_risk_scores')
        .select('*')
        .eq('user_id', user?.id)
        .gt('expires_at', new Date().toISOString())
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCurrentRiskScore(data ? {
        ...data,
        risk_level: data.risk_level as 'low' | 'medium' | 'high' | 'critical',
        risk_factors: data.risk_factors as Array<{
          type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          description: string;
          score: number;
          metadata?: Record<string, any>;
        }>
      } : null);
    } catch (error) {
      console.error('Error fetching risk score:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeBehavioralPatterns = async (
    userId: string,
    loginHistory: Date[],
    ipHistory: Array<{ ip: string; location: string; timestamp: Date }>,
    deviceHistory: Array<{ deviceId: string; userAgent: string; lastUsed: Date }>
  ): Promise<void> => {
    try {
      // Analyze login times
      const loginPattern = BehavioralAnalyzer.analyzeLoginTimes(loginHistory);
      await supabase
        .from('user_behavioral_patterns')
        .upsert({
          user_id: userId,
          pattern_type: 'login_times',
          pattern_data: loginPattern.patternData,
          confidence_score: loginPattern.confidenceScore
        });

      // Analyze IP locations
      const locationPattern = BehavioralAnalyzer.analyzeIPLocations(ipHistory);
      await supabase
        .from('user_behavioral_patterns')
        .upsert({
          user_id: userId,
          pattern_type: 'ip_locations',
          pattern_data: locationPattern.patternData,
          confidence_score: locationPattern.confidenceScore
        });

      // Analyze device usage
      const devicePattern = BehavioralAnalyzer.analyzeDeviceUsage(deviceHistory);
      await supabase
        .from('user_behavioral_patterns')
        .upsert({
          user_id: userId,
          pattern_type: 'device_usage',
          pattern_data: devicePattern.patternData,
          confidence_score: devicePattern.confidenceScore
        });

      await fetchBehavioralPatterns();
    } catch (error) {
      console.error('Error analyzing behavioral patterns:', error);
      throw error;
    }
  };

  const calculateRiskScore = async (contextualFactors: Record<string, any>): Promise<RiskScoreInfo> => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Convert database patterns to analysis format
      const patterns = behavioralPatterns.map(p => ({
        userId: p.user_id,
        patternType: p.pattern_type,
        patternData: p.pattern_data,
        confidenceScore: p.confidence_score,
        lastUpdated: new Date(p.last_updated)
      }));

      // Calculate risk assessment
      const riskAssessment = await RiskAssessmentEngine.calculateRiskScore(
        user.id,
        patterns,
        contextualFactors
      );

      // Store risk score in database
      const { data, error } = await supabase
        .from('user_risk_scores')
        .insert({
          user_id: user.id,
          risk_level: riskAssessment.riskLevel,
          risk_score: riskAssessment.riskScore,
          risk_factors: riskAssessment.riskFactors as any,
          calculated_at: riskAssessment.calculatedAt.toISOString(),
          expires_at: riskAssessment.expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const typedData = {
        ...data,
        risk_level: data.risk_level as 'low' | 'medium' | 'high' | 'critical',
        risk_factors: data.risk_factors as Array<{
          type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          description: string;
          score: number;
          metadata?: Record<string, any>;
        }>
      };
      setCurrentRiskScore(typedData);
      return typedData;
    } catch (error) {
      console.error('Error calculating risk score:', error);
      throw error;
    }
  };

  const shouldRequireAdditionalAuth = (): boolean => {
    if (!currentRiskScore) return false;
    return currentRiskScore.risk_score >= 30 || 
           currentRiskScore.risk_level === 'high' || 
           currentRiskScore.risk_level === 'critical';
  };

  const shouldBlockAccess = (): boolean => {
    if (!currentRiskScore) return false;
    return currentRiskScore.risk_score >= 80 || currentRiskScore.risk_level === 'critical';
  };

  const getRiskRecommendations = (): string[] => {
    if (!currentRiskScore) return [];

    const recommendations: string[] = [];

    if (currentRiskScore.risk_level === 'critical') {
      recommendations.push('Immediate security review required');
      recommendations.push('Consider temporarily suspending account');
      recommendations.push('Contact security team for manual verification');
    } else if (currentRiskScore.risk_level === 'high') {
      recommendations.push('Enable additional multi-factor authentication');
      recommendations.push('Review recent account activity');
      recommendations.push('Update password and security questions');
    } else if (currentRiskScore.risk_level === 'medium') {
      recommendations.push('Consider enabling two-factor authentication');
      recommendations.push('Review login locations and devices');
    }

    // Specific recommendations based on risk factors
    currentRiskScore.risk_factors?.forEach(factor => {
      switch (factor.type) {
        case 'new_location':
          recommendations.push('Verify this login location is legitimate');
          break;
        case 'new_device':
          recommendations.push('Confirm this device belongs to you');
          break;
        case 'unusual_login_time':
          recommendations.push('Login time is outside normal pattern');
          break;
        case 'rapid_login_attempts':
          recommendations.push('Multiple rapid login attempts detected');
          break;
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  };

  const recordLoginEvent = async (
    ipAddress: string,
    location: string,
    userAgent: string,
    deviceFingerprint: string
  ): Promise<void> => {
    try {
      // This would typically be called automatically during login
      const contextualFactors = {
        currentLoginHour: new Date().getHours(),
        currentLocation: location,
        deviceFingerprint,
        recentLoginAttempts: 1, // This would be calculated from recent history
        failedAttempts: 0 // This would come from auth logs
      };

      await calculateRiskScore(contextualFactors);

      // Log the login event for future pattern analysis
      console.log('Login event recorded for risk analysis');
    } catch (error) {
      console.error('Error recording login event:', error);
    }
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'low': return 'hsl(var(--quantum-success))';
      case 'medium': return 'hsl(var(--quantum-warning))';
      case 'high': return 'hsl(var(--quantum-danger))';
      case 'critical': return 'hsl(var(--destructive))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getRiskScoreDescription = (score: number): string => {
    if (score >= 80) return 'Critical - Immediate action required';
    if (score >= 50) return 'High - Enhanced security measures recommended';
    if (score >= 25) return 'Medium - Monitor activity closely';
    return 'Low - Normal security posture';
  };

  return {
    behavioralPatterns,
    currentRiskScore,
    loading,
    analyzeBehavioralPatterns,
    calculateRiskScore,
    shouldRequireAdditionalAuth,
    shouldBlockAccess,
    getRiskRecommendations,
    recordLoginEvent,
    getRiskLevelColor,
    getRiskScoreDescription,
    fetchCurrentRiskScore
  };
}