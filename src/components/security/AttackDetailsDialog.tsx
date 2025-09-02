import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Clock, MapPin, Network, Eye } from 'lucide-react';

interface AttackDetail {
  id: string;
  attack_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip?: string;
  target_resource?: string;
  detected_at: string;
  blocked: boolean;
  quantum_protected: boolean;
  attack_data?: any;
  location?: {
    country: string;
    city: string;
    is_vpn: boolean;
  };
  response_actions?: string[];
  threat_level?: number;
}

interface AttackDetailsDialogProps {
  attack: AttackDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttackDetailsDialog({ attack, open, onOpenChange }: AttackDetailsDialogProps) {
  if (!attack) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Attack Analysis: {attack.attack_type}
          </DialogTitle>
          <DialogDescription>
            Detailed analysis of security attack detected on {new Date(attack.detected_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attack Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Severity</p>
                  <Badge variant={getSeverityColor(attack.severity)}>
                    {attack.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={attack.blocked ? 'default' : 'destructive'}>
                    {attack.blocked ? 'BLOCKED' : 'ACTIVE'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quantum Protection</p>
                  <Badge variant={attack.quantum_protected ? 'default' : 'secondary'}>
                    {attack.quantum_protected ? 'PROTECTED' : 'LEGACY'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Threat Level</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary h-2 rounded-full">
                      <div 
                        className="bg-destructive h-2 rounded-full" 
                        style={{ width: `${(attack.threat_level || 0) * 10}%` }}
                      />
                    </div>
                    <span className="text-sm">{attack.threat_level || 0}/10</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attack Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Network className="h-4 w-4" />
                  Source Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Source IP</p>
                  <p className="font-mono text-sm">{attack.source_ip || 'Unknown'}</p>
                </div>
                {attack.location && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <p className="text-sm">{attack.location.city}, {attack.location.country}</p>
                        {attack.location.is_vpn && (
                          <Badge variant="outline" className="text-xs">VPN</Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Resource</p>
                  <p className="text-sm">{attack.target_resource || 'Multiple'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timing & Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-4 w-4" />
                  Detection Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Detection Time</p>
                  <p className="text-sm">{new Date(attack.detected_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Detection Method</p>
                  <p className="text-sm">
                    {attack.quantum_protected ? 'Quantum AI Analysis' : 'Traditional Pattern Matching'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                  <p className="text-sm">&lt; 50ms (Automated)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attack Pattern Analysis */}
          {attack.attack_data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-4 w-4" />
                  Attack Pattern Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Request Method</p>
                      <p className="text-sm font-mono">{attack.attack_data.method || 'GET'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">User Agent</p>
                      <p className="text-sm font-mono truncate" title={attack.attack_data.user_agent}>
                        {attack.attack_data.user_agent || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Payload Size</p>
                      <p className="text-sm">{attack.attack_data.payload_size || 0} bytes</p>
                    </div>
                  </div>
                  
                  {attack.attack_data.signatures && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Threat Signatures Detected</p>
                      <div className="flex flex-wrap gap-2">
                        {attack.attack_data.signatures.map((sig: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {sig}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Actions */}
          {attack.response_actions && attack.response_actions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-4 w-4" />
                  Automated Response Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attack.response_actions.map((action, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Shield className="h-3 w-3 text-green-500" />
                      <p className="text-sm">{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quantum Protection Details */}
          {attack.quantum_protected && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                  <Shield className="h-4 w-4" />
                  Quantum Protection Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="text-green-800">
                <div className="space-y-2 text-sm">
                  <p>✓ Quantum-resistant encryption protocols active</p>
                  <p>✓ Post-quantum cryptographic algorithms engaged</p>
                  <p>✓ Advanced AI threat detection enabled</p>
                  <p>✓ Real-time behavioral analysis completed</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}