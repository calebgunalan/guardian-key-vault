import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuantumSecurity } from '@/hooks/useQuantumSecurity';
import { 
  Shield, 
  Key, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  QrCode,
  Download,
  Copy,
  Zap
} from 'lucide-react';

export function QuantumSecurityManagement() {
  const { toast } = useToast();
  const {
    quantumKeys,
    loading,
    quantumEnabled,
    enableQuantumSecurity,
    rotateQuantumKeys,
    setupQuantumMFA,
    getQuantumSecurityStatus
  } = useQuantumSecurity();

  const [enabling, setEnabling] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<{
    secret: string;
    backupCodes: string[];
    qrCode: string;
  } | null>(null);
  const [apiKeyName, setApiKeyName] = useState('');
  const [generatedApiKey, setGeneratedApiKey] = useState('');

  const securityStatus = getQuantumSecurityStatus();

  const handleEnableQuantum = async () => {
    setEnabling(true);
    try {
      await enableQuantumSecurity();
      toast({
        title: 'Quantum Security Enabled',
        description: 'Your account is now protected with post-quantum cryptography.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to enable quantum security. Please try again.',
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rotate quantum keys. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRotating(false);
    }
  };

  const handleSetupMFA = async () => {
    try {
      const mfaData = await setupQuantumMFA();
      setMfaSetup(mfaData);
      toast({
        title: 'Quantum MFA Setup',
        description: 'Quantum-resistant MFA has been configured.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to setup quantum MFA. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard successfully.',
    });
  };

  const downloadBackupCodes = () => {
    if (!mfaSetup) return;
    
    const blob = new Blob([mfaSetup.backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum-mfa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSecurityScore = () => {
    let score = 0;
    if (securityStatus.enabled) score += 30;
    if (securityStatus.kemKeyActive) score += 25;
    if (securityStatus.signatureKeyActive) score += 25;
    if (quantumKeys.length >= 2) score += 20;
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
      {/* Quantum Security Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Quantum Security Status</CardTitle>
            </div>
            <Badge variant={quantumEnabled ? 'default' : 'secondary'}>
              {quantumEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <CardDescription>
            Post-quantum cryptography protection against future quantum computing threats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Security Score</p>
              <p className="text-sm text-muted-foreground">
                Based on quantum-resistant configurations
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{getSecurityScore()}%</p>
              <Progress value={getSecurityScore()} className="w-24" />
            </div>
          </div>

          {!quantumEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your account is not protected against quantum computing threats. 
                Enable quantum security to future-proof your authentication.
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
              <span className="text-sm">KEM Key Active</span>
            </div>
            <div className="flex items-center space-x-2">
              {securityStatus.signatureKeyActive ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm">Signature Key Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span className="text-sm">{quantumKeys.length} Quantum Keys</span>
            </div>
          </div>

          {!quantumEnabled ? (
            <Button 
              onClick={handleEnableQuantum} 
              disabled={enabling}
              className="w-full"
            >
              {enabling ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enabling Quantum Security...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Enable Quantum Security
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleRotateKeys} 
              disabled={rotating}
              variant="outline"
              className="w-full"
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
        </CardContent>
      </Card>

      {quantumEnabled && (
        <Tabs defaultValue="keys" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="keys">Quantum Keys</TabsTrigger>
            <TabsTrigger value="mfa">Quantum MFA</TabsTrigger>
            <TabsTrigger value="api">Quantum API</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Quantum Keys</CardTitle>
                <CardDescription>
                  Post-quantum cryptographic keys protecting your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quantumKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{key.key_type.toUpperCase()} Key</p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(key.created_at).toLocaleDateString()}
                        </p>
                        {key.expires_at && (
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(key.expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(key.public_key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mfa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quantum-Resistant MFA</CardTitle>
                <CardDescription>
                  Multi-factor authentication with quantum-safe algorithms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!mfaSetup ? (
                  <Button onClick={handleSetupMFA}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Setup Quantum MFA
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Quantum MFA has been configured successfully. Save your backup codes!
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label>Secret Key</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input value={mfaSetup.secret} readOnly />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(mfaSetup.secret)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>QR Code Data</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input value={mfaSetup.qrCode} readOnly />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(mfaSetup.qrCode)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Backup Codes</Label>
                        <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mfaSetup.backupCodes.map((code, index) => (
                          <div key={index} className="p-2 bg-muted rounded font-mono text-sm">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quantum-Safe API Keys</CardTitle>
                <CardDescription>
                  Generate API keys with quantum-resistant security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="API Key Name"
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                  />
                  <Button
                    onClick={async () => {
                      try {
                        const { generateQuantumAPIKey } = useQuantumSecurity();
                        const key = await generateQuantumAPIKey(apiKeyName);
                        setGeneratedApiKey(key);
                        setApiKeyName('');
                        toast({
                          title: 'API Key Generated',
                          description: 'Quantum-safe API key created successfully.',
                        });
                      } catch (error) {
                        toast({
                          title: 'Error',
                          description: 'Failed to generate API key.',
                          variant: 'destructive',
                        });
                      }
                    }}
                    disabled={!apiKeyName.trim()}
                  >
                    Generate Key
                  </Button>
                </div>

                {generatedApiKey && (
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>Your quantum-safe API key (save this now, it won't be shown again):</p>
                        <div className="flex items-center space-x-2">
                          <code className="bg-muted p-2 rounded flex-1 font-mono text-sm">
                            {generatedApiKey}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generatedApiKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}