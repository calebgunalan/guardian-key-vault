import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuantumPKI } from '@/hooks/useQuantumPKI';
import { useRiskAssessment } from '@/hooks/useRiskAssessment';
import { useZeroTrust } from '@/hooks/useZeroTrust';
import { useTrustScore } from '@/hooks/useTrustScore';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  Award, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Network,
  Brain,
  Lock,
  Eye
} from 'lucide-react';

export function EnterpriseQuantumDashboard() {
  const { user } = useAuth();
  const { certificates, loading: pkiLoading, requestCertificate } = useQuantumPKI();
  const { currentRiskScore, loading: riskLoading } = useRiskAssessment();
  const { policies } = useZeroTrust();
  const { getOverallTrustScore, getTrustScoreByType, networkTrust, loading: trustLoading } = useTrustScore();

  const trustScore = {
    overall: getOverallTrustScore(),
    device: getTrustScoreByType('device'),
    network: getTrustScoreByType('network'),
    behavioral: getTrustScoreByType('behavioral'),
    location: getTrustScoreByType('location')
  };

  const getStatusColor = (score: number) => {
    if (score >= 90) return 'hsl(var(--quantum-success))';
    if (score >= 70) return 'hsl(var(--quantum-warning))';
    return 'hsl(var(--quantum-danger))';
  };

  const getStatusText = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const handleRequestCertificate = async () => {
    try {
      await requestCertificate('identity', `CN=${user?.email}`, 365);
    } catch (error) {
      console.error('Error requesting certificate:', error);
    }
  };

  if (pkiLoading || riskLoading || trustLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Enterprise Quantum Security
          </h1>
          <p className="text-muted-foreground">Advanced quantum-resistant identity and access management</p>
        </div>
        <Badge variant="default" className="px-4 py-2">
          <Shield className="w-4 h-4 mr-2" />
          Quantum Protected
        </Badge>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: getStatusColor(trustScore.overall) }}>
              {Math.round(trustScore.overall)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {getStatusText(trustScore.overall)} security posture
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates.length}</div>
            <p className="text-xs text-muted-foreground">
              Active quantum certificates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ 
              color: currentRiskScore ? 
                (currentRiskScore.risk_level === 'low' ? 'hsl(var(--quantum-success))' : 
                 currentRiskScore.risk_level === 'medium' ? 'hsl(var(--quantum-warning))' : 
                 'hsl(var(--quantum-danger))') : 'hsl(var(--muted-foreground))'
            }}>
              {currentRiskScore?.risk_level.toUpperCase() || 'UNKNOWN'}
            </div>
            <p className="text-xs text-muted-foreground">
              Score: {currentRiskScore?.risk_score || 0}/100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policies</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length}</div>
            <p className="text-xs text-muted-foreground">
              Active zero-trust policies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="trust-metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trust-metrics">Trust Metrics</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
          <TabsTrigger value="policies">Zero Trust</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trust-metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zero Trust Score Breakdown</CardTitle>
              <CardDescription>
                Comprehensive trust assessment across all security dimensions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Network className="h-4 w-4" />
                    <span className="text-sm font-medium">Device Trust</span>
                  </div>
                  <span className="text-sm font-bold">{Math.round(trustScore.device)}%</span>
                </div>
                <Progress value={trustScore.device} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Network Security</span>
                  </div>
                  <span className="text-sm font-bold">{Math.round(trustScore.network)}%</span>
                </div>
                <Progress value={trustScore.network} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4" />
                    <span className="text-sm font-medium">Behavioral Analysis</span>
                  </div>
                  <span className="text-sm font-bold">{Math.round(trustScore.behavioral)}%</span>
                </div>
                <Progress value={trustScore.behavioral} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Location Trust</span>
                  </div>
                  <span className="text-sm font-bold">{Math.round(trustScore.location)}%</span>
                </div>
                <Progress value={trustScore.location} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quantum Certificate Management</CardTitle>
              <CardDescription>
                Post-quantum cryptographic certificates for enhanced security
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No quantum certificates found</p>
                  <Button className="mt-4" onClick={handleRequestCertificate}>Request Certificate</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {certificates.slice(0, 3).map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{cert.certificate_type.toUpperCase()} Certificate</p>
                          <p className="text-sm text-muted-foreground">
                            Subject: {cert.subject}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(cert.valid_until).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={cert.is_revoked ? 'destructive' : 'default'}>
                        {cert.is_revoked ? 'Revoked' : 'Active'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>
                AI-powered behavioral analysis and threat detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentRiskScore ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Current Risk Level:</span>
                    <Badge variant={
                      currentRiskScore.risk_level === 'low' ? 'default' :
                      currentRiskScore.risk_level === 'medium' ? 'secondary' :
                      'destructive'
                    }>
                      {currentRiskScore.risk_level.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Risk Score</span>
                      <span>{currentRiskScore.risk_score}/100</span>
                    </div>
                    <Progress value={currentRiskScore.risk_score} className="h-2" />
                  </div>

                  {currentRiskScore.risk_factors.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Risk Factors:</p>
                      {currentRiskScore.risk_factors.map((factor, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          <span>{factor.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No risk assessment available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zero Trust Policies</CardTitle>
              <CardDescription>
                Active security policies enforcing zero trust principles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policies.length === 0 ? (
                <div className="text-center py-8">
                  <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No policies configured</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {policies.slice(0, 5).map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium text-sm">{policy.name}</p>
                        <p className="text-xs text-muted-foreground">{policy.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          policy.severity === 'critical' ? 'destructive' :
                          policy.severity === 'high' ? 'destructive' :
                          policy.severity === 'medium' ? 'secondary' : 'default'
                        }>
                          {policy.severity}
                        </Badge>
                        {policy.is_active ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}