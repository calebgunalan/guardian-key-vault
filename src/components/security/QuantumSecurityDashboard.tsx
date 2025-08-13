import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuantumSecurity } from '@/hooks/useQuantumSecurity';
import { 
  Shield, 
  Key, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Lock,
  Atom
} from 'lucide-react';

export function QuantumSecurityDashboard() {
  const { toast } = useToast();
  const {
    quantumKeys,
    loading,
    quantumEnabled,
    enableQuantumSecurity,
    rotateQuantumKeys,
    getQuantumSecurityStatus
  } = useQuantumSecurity();

  const [enabling, setEnabling] = useState(false);
  const [rotating, setRotating] = useState(false);

  const securityStatus = getQuantumSecurityStatus();

  const handleEnableQuantum = async () => {
    setEnabling(true);
    try {
      await enableQuantumSecurity();
      toast({
        title: 'Quantum Security Enabled',
        description: 'Your account is now protected with quantum-resistant cryptography.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable quantum security. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setEnabling(false);
    }
  };

  const handleRotateKeys = async () => {
    setRotating(true);
    try {
      await rotateQuantumKeys();
      toast({
        title: 'Keys Rotated',
        description: 'Your quantum-resistant keys have been successfully rotated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to rotate quantum keys. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRotating(false);
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    if (securityStatus.enabled) score += 40;
    if (securityStatus.kemKeyActive) score += 30;
    if (securityStatus.signatureKeyActive) score += 30;
    return score;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Atom className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Quantum Security</h1>
        <Badge variant={quantumEnabled ? 'default' : 'secondary'}>
          {quantumEnabled ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Quantum Protection Status</CardTitle>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{getSecurityScore()}%</p>
              <p className="text-sm text-muted-foreground">Security Score</p>
            </div>
          </div>
          <CardDescription>
            Future-proof your security against quantum computing threats with post-quantum cryptography
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={getSecurityScore()} className="h-2" />

          {!quantumEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Quantum Vulnerability Detected!</strong><br />
                Your current security is vulnerable to future quantum computers. 
                Enable quantum protection to secure your data against quantum attacks.
              </AlertDescription>
            </Alert>
          )}

          {quantumEnabled && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Quantum Protected!</strong><br />
                Your account is secured with post-quantum cryptography algorithms 
                that remain secure even against quantum computers.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              {securityStatus.kemKeyActive ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm">Key Exchange</span>
            </div>
            <div className="flex items-center space-x-2">
              {securityStatus.signatureKeyActive ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm">Digital Signatures</span>
            </div>
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span className="text-sm">{quantumKeys.length} Active Keys</span>
            </div>
          </div>

          <div className="flex space-x-2">
            {!quantumEnabled ? (
              <Button 
                onClick={handleEnableQuantum} 
                disabled={enabling}
                className="flex-1"
                size="lg"
              >
                {enabling ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Activating Quantum Shield...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Activate Quantum Shield
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleRotateKeys} 
                disabled={rotating}
                variant="outline"
                className="flex-1"
              >
                {rotating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Rotating Keys...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Rotate Quantum Keys
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Management */}
      {quantumEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Quantum Key Management</CardTitle>
            <CardDescription>
              Your active quantum-resistant cryptographic keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quantumKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No quantum keys found</p>
                </div>
              ) : (
                quantumKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Key className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {key.key_type === 'kem' ? 'Key Exchange' : 'Digital Signature'} Key
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(key.created_at).toLocaleDateString()}
                        </p>
                        {key.expires_at && (
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(key.expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={key.is_active ? 'default' : 'secondary'}>
                      {key.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Quantum Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <Atom className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Quantum-Resistant Algorithms</p>
              <p className="text-sm text-muted-foreground">
                Uses cryptographic algorithms that remain secure against quantum computer attacks
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Future-Proof Security</p>
              <p className="text-sm text-muted-foreground">
                Protects your data today and against future quantum computing threats
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Key className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Advanced Key Management</p>
              <p className="text-sm text-muted-foreground">
                Automatic key rotation and quantum-safe key generation and storage
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}