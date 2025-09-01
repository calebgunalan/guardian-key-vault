import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, Shield, AlertTriangle, CheckCircle, TrendingUp, Eye, Zap } from 'lucide-react';

interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  score: number;
  confidence: number;
}

interface AIAnalysis {
  behavioral_confidence: number;
  session_anomaly_score: string;
  device_trust_level: string;
  ml_confidence: number;
  threat_indicators: number;
  network_type: string;
}

interface RiskAssessment {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: RiskFactor[];
  ai_analysis: AIAnalysis;
  recommendations: string[];
  calculated_at: string;
  expires_at: string;
}

export function ComprehensiveRiskAssessment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (user) {
      calculateRiskScore();
      
      if (autoRefresh) {
        const interval = setInterval(calculateRiskScore, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(interval);
      }
    }
  }, [user, autoRefresh]);

  const calculateRiskScore = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get current context (IP, location, etc.)
      const contextData = {
        current_time: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      };

      // Call AI risk calculation function
      const { data, error } = await supabase.rpc('calculate_ai_risk_score', {
        _user_id: user.id,
        _current_context: contextData as any
      });

      if (error) throw error;

      const riskData = data as any;
      setAssessment(riskData);
      
      // Store the assessment in the database  
      await supabase
        .from('user_risk_scores')
        .upsert({
          user_id: user.id,
          risk_score: riskData.risk_score,
          risk_level: riskData.risk_level,
          risk_factors: riskData.risk_factors as any,
          calculated_at: riskData.calculated_at,
          expires_at: riskData.expires_at
        });

    } catch (error) {
      console.error('Error calculating risk score:', error);
      toast({
        title: "Error",
        description: "Failed to calculate risk assessment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'hsl(var(--success))';
      case 'medium': return 'hsl(var(--warning))';
      case 'high': return 'hsl(var(--destructive))';
      case 'critical': return 'hsl(var(--destructive))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium': return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'critical': return <Shield className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  if (loading && !assessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Risk Assessment
          </CardTitle>
          <CardDescription>Analyzing behavioral patterns and security factors...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Risk Assessment
              </CardTitle>
              <CardDescription>
                Real-time behavioral analysis and threat detection using machine learning
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={calculateRiskScore}
                disabled={loading}
              >
                <Zap className="h-4 w-4 mr-2" />
                {loading ? 'Analyzing...' : 'Refresh Analysis'}
              </Button>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {assessment ? (
            <>
              {/* Main Risk Score */}
              <div className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full border-8" 
                     style={{ borderColor: getRiskColor(assessment.risk_level) }}>
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: getRiskColor(assessment.risk_level) }}>
                      {assessment.risk_score}
                    </div>
                    <div className="text-sm text-muted-foreground">/ 100</div>
                  </div>
                </div>
                <div>
                  <Badge variant={assessment.risk_level === 'low' ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                    {assessment.risk_level.toUpperCase()} RISK
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    ML Confidence: {formatConfidence(assessment.ai_analysis.ml_confidence)}
                  </p>
                </div>
              </div>

              {/* AI Analysis Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Behavioral Analysis</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Confidence:</span>
                      <span className="text-sm font-medium">
                        {formatConfidence(assessment.ai_analysis.behavioral_confidence)}
                      </span>
                    </div>
                    <Progress value={assessment.ai_analysis.behavioral_confidence * 100} className="h-2" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Device Trust</span>
                  </div>
                  <div className="text-center">
                    <Badge variant={assessment.ai_analysis.device_trust_level === 'high' ? 'default' : 'secondary'}>
                      {assessment.ai_analysis.device_trust_level.toUpperCase()}
                    </Badge>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Network Analysis</span>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline">
                      {assessment.ai_analysis.network_type.toUpperCase()}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      Session Anomaly: {assessment.ai_analysis.session_anomaly_score}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Risk Factors */}
              {assessment.risk_factors && assessment.risk_factors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    AI-Detected Risk Factors ({assessment.ai_analysis.threat_indicators})
                  </h3>
                  <div className="space-y-3">
                    {assessment.risk_factors.map((factor, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getSeverityIcon(factor.severity)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium capitalize">
                              {factor.type.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant={factor.severity === 'high' || factor.severity === 'critical' ? 'destructive' : 'secondary'}>
                                {factor.severity}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                +{factor.score} points
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{factor.description}</p>
                          <div className="mt-2">
                            <div className="flex justify-between text-xs">
                              <span>AI Confidence</span>
                              <span>{formatConfidence(factor.confidence)}</span>
                            </div>
                            <Progress value={factor.confidence * 100} className="h-1 mt-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendations */}
              {assessment.recommendations && assessment.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">AI Security Recommendations</h3>
                  <div className="space-y-2">
                    {assessment.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment Metadata */}
              <div className="text-xs text-muted-foreground border-t pt-4">
                <div className="flex justify-between items-center">
                  <span>
                    Last calculated: {new Date(assessment.calculated_at).toLocaleString()}
                  </span>
                  <span>
                    Expires: {new Date(assessment.expires_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2">
                  This assessment uses advanced machine learning algorithms to analyze user behavior patterns, 
                  device fingerprints, network characteristics, and contextual factors to provide real-time 
                  security risk scoring.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No risk assessment available. Click "Refresh Analysis" to generate one.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}