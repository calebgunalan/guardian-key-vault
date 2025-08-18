import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useTrustScore } from '@/hooks/useTrustScore';
import { 
  Shield, 
  Network, 
  MapPin, 
  Brain, 
  Monitor,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export function TrustScoreDetails() {
  const { 
    trustFactors, 
    networkTrust, 
    getOverallTrustScore, 
    getTrustScoreByType,
    refreshTrustScore,
    loading 
  } = useTrustScore();

  const overallScore = getOverallTrustScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 60) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-success" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Trust Score Analysis</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshTrustScore}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
          <CardDescription>
            Real-time trust assessment based on multiple security factors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2" style={{ color: getScoreColor(overallScore) }}>
              {overallScore}%
            </div>
            <Badge variant={overallScore >= 80 ? 'default' : overallScore >= 60 ? 'secondary' : 'destructive'}>
              {overallScore >= 80 ? 'High Trust' : overallScore >= 60 ? 'Medium Trust' : 'Low Trust'}
            </Badge>
          </div>

          {/* Trust Factor Breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Trust Factors</h4>
            
            {/* Device Trust */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm">Device Trust</span>
                </div>
                <div className="flex items-center gap-2">
                  {getScoreIcon(getTrustScoreByType('device'))}
                  <span className="text-sm font-bold">{getTrustScoreByType('device')}%</span>
                </div>
              </div>
              <Progress value={getTrustScoreByType('device')} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Based on device management status and compliance
              </p>
            </div>

            {/* Network Security */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  <span className="text-sm">Network Security</span>
                </div>
                <div className="flex items-center gap-2">
                  {getScoreIcon(getTrustScoreByType('network'))}
                  <span className="text-sm font-bold">{getTrustScoreByType('network')}%</span>
                </div>
              </div>
              <Progress value={getTrustScoreByType('network')} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Network reputation and VPN detection analysis
              </p>
            </div>

            {/* Location Trust */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Location Trust</span>
                </div>
                <div className="flex items-center gap-2">
                  {getScoreIcon(getTrustScoreByType('location'))}
                  <span className="text-sm font-bold">{getTrustScoreByType('location')}%</span>
                </div>
              </div>
              <Progress value={getTrustScoreByType('location')} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Geographic location and geopolitical risk assessment
              </p>
            </div>

            {/* Behavioral Analysis */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span className="text-sm">Behavioral Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  {getScoreIcon(getTrustScoreByType('behavioral'))}
                  <span className="text-sm font-bold">{getTrustScoreByType('behavioral')}%</span>
                </div>
              </div>
              <Progress value={getTrustScoreByType('behavioral')} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Login patterns and access behavior analysis
              </p>
            </div>
          </div>

          {/* Location & Network Details */}
          {networkTrust && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Location & Network Analysis</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Country:</span>
                  <p className="text-muted-foreground">{networkTrust.location.country}</p>
                </div>
                <div>
                  <span className="font-medium">City:</span>
                  <p className="text-muted-foreground">{networkTrust.location.city}</p>
                </div>
                <div>
                  <span className="font-medium">VPN Detected:</span>
                  <p className="text-muted-foreground">
                    {networkTrust.location.is_vpn ? '✓' : '✗'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Coordinates:</span>
                  <p className="text-muted-foreground">
                    {networkTrust.location.latitude.toFixed(2)}, {networkTrust.location.longitude.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trust Factors History */}
          {trustFactors.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Recent Calculations</h4>
              <div className="space-y-2">
                {trustFactors.slice(0, 3).map((factor) => (
                  <div key={factor.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{factor.factor_name}</span>
                    <div className="flex items-center gap-2">
                      <span>{Math.round(factor.score)}%</span>
                      <span className="text-muted-foreground">
                        {new Date(factor.calculated_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}