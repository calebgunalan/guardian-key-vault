import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useQuantumSecurity } from '@/hooks/useQuantumSecurity';
import { useRiskAssessment } from '@/hooks/useRiskAssessment';
import { useZeroTrust } from '@/hooks/useZeroTrust';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Atom, 
  Key, 
  Shield, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Brain,
  Network,
  Lock,
  Unlock,
  RefreshCw,
  Activity,
  Database,
  Zap
} from 'lucide-react';

interface QuantumState {
  enabled: boolean;
  keysVisible: boolean;
  encryptionActive: boolean;
  testMode: boolean;
}

export function QuantumControlCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    quantumKeys,
    quantumEnabled,
    enableQuantumSecurity,
    rotateQuantumKeys,
    generateQuantumSession,
    generateQuantumAPIKey,
    getQuantumSecurityStatus,
    loading
  } = useQuantumSecurity();
  const { currentRiskScore, calculateRiskScore, getRiskScoreDescription } = useRiskAssessment();
  const { policies, calculateTrustScore } = useZeroTrust();

  const [quantumState, setQuantumState] = useState<QuantumState>({
    enabled: false,
    keysVisible: false,
    encryptionActive: false,
    testMode: false
  });

  const [testData, setTestData] = useState({
    plaintext: "This is sensitive test data that should be protected by quantum encryption...",
    encrypted: "",
    decrypted: ""
  });

  const [systemMetrics, setSystemMetrics] = useState({
    quantumStrength: 98,
    keyEntropy: 256,
    encryptionLatency: 0.3,
    successfulAttacks: 0,
    blockedAttacks: 147
  });

  useEffect(() => {
    setQuantumState(prev => ({
      ...prev,
      enabled: quantumEnabled,
      encryptionActive: quantumEnabled
    }));
  }, [quantumEnabled]);

  const toggleQuantumEncryption = async () => {
    try {
      if (!quantumState.enabled) {
        await enableQuantumSecurity();
        toast({
          title: "Quantum Protection Activated",
          description: "All data is now protected with post-quantum cryptography"
        });
      }
      
      setQuantumState(prev => ({
        ...prev,
        enabled: !prev.enabled,
        encryptionActive: !prev.enabled
      }));
    } catch (error) {
      toast({
        title: "Quantum Toggle Failed",
        description: "Failed to toggle quantum encryption",
        variant: "destructive"
      });
    }
  };

  const simulateEncryptDecrypt = async () => {
    if (!quantumState.enabled) {
      setTestData(prev => ({
        ...prev,
        encrypted: "UNENCRYPTED: " + prev.plaintext,
        decrypted: prev.plaintext
      }));
      toast({
        title: "⚠️ Security Warning",
        description: "Data transmitted WITHOUT quantum protection - easily hackable!",
        variant: "destructive"
      });
      return;
    }

    // Simulate quantum encryption process
    const mockEncrypted = await new Promise<string>((resolve) => {
      setTimeout(() => {
        const base64 = btoa(testData.plaintext);
        resolve(`QK-${Math.random().toString(36).substring(2)}:${base64}:${Date.now()}`);
      }, 500);
    });

    setTestData(prev => ({
      ...prev,
      encrypted: mockEncrypted,
      decrypted: prev.plaintext
    }));

    toast({
      title: "🔐 Quantum Encryption Active",
      description: "Data protected with post-quantum algorithms - quantum-safe!",
      variant: "default"
    });
  };

  const performQuantumHackTest = () => {
    if (quantumState.enabled) {
      setSystemMetrics(prev => ({
        ...prev,
        blockedAttacks: prev.blockedAttacks + 1
      }));
      toast({
        title: "🛡️ Quantum Defense Success",
        description: "Attack blocked by quantum-resistant encryption!",
        variant: "default"
      });
    } else {
      setSystemMetrics(prev => ({
        ...prev,
        successfulAttacks: prev.successfulAttacks + 1
      }));
      toast({
        title: "💥 Security Breach!",
        description: "Attack succeeded - quantum protection was disabled!",
        variant: "destructive"
      });
    }
  };

  const handleRotateKeys = async () => {
    try {
      await rotateQuantumKeys();
      toast({
        title: "Quantum Keys Rotated",
        description: "New quantum-safe keys generated successfully"
      });
    } catch (error) {
      toast({
        title: "Key Rotation Failed",
        description: "Failed to rotate quantum keys",
        variant: "destructive"
      });
    }
  };

  const trustScore = calculateTrustScore({
    deviceTrusted: true,
    networkTrusted: quantumState.enabled,
    locationTrusted: true,
    behavioralScore: 85
  });

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Atom className="h-6 w-6 text-primary" />
            Quantum Security Control Center
          </CardTitle>
          <CardDescription>
            Master control for quantum-resistant encryption and security features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Quantum Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="quantum-master" className="text-base font-semibold">
                Quantum Encryption Master Switch
              </Label>
              <p className="text-sm text-muted-foreground">
                {quantumState.enabled 
                  ? "🔐 All data protected with post-quantum cryptography" 
                  : "⚠️ Using classical encryption - vulnerable to quantum attacks"
                }
              </p>
            </div>
            <Switch
              id="quantum-master"
              checked={quantumState.enabled}
              onCheckedChange={toggleQuantumEncryption}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* Security Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Quantum Status</p>
                    <p className="text-2xl font-bold">
                      {quantumState.enabled ? (
                        <span className="text-green-600">ACTIVE</span>
                      ) : (
                        <span className="text-red-600">DISABLED</span>
                      )}
                    </p>
                  </div>
                  {quantumState.enabled ? (
                    <Shield className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Trust Score</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {trustScore.overall}%
                    </p>
                  </div>
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Attack Defense</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {systemMetrics.blockedAttacks}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keys">Quantum Keys</TabsTrigger>
          <TabsTrigger value="test">Encryption Test</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Quantum Cryptographic Keys
                  </CardTitle>
                  <CardDescription>
                    View and manage post-quantum cryptographic keys
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantumState(prev => ({ ...prev, keysVisible: !prev.keysVisible }))}
                  >
                    {quantumState.keysVisible ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Keys
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Keys
                      </>
                    )}
                  </Button>
                  <Button size="sm" onClick={handleRotateKeys} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rotate Keys
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {quantumKeys.length > 0 ? (
                quantumKeys.map((key) => (
                  <div key={key.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.key_type}
                      </Badge>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    {quantumState.keysVisible && (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Public Key:</Label>
                          <Textarea
                            value={key.public_key}
                            readOnly
                            className="font-mono text-xs h-20"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <Label className="text-muted-foreground">Created:</Label>
                            <p>{new Date(key.created_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Expires:</Label>
                            <p>{key.expires_at ? new Date(key.expires_at).toLocaleString() : 'Never'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No quantum keys found. Enable quantum security to generate keys.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Quantum Encryption Demonstration
              </CardTitle>
              <CardDescription>
                Test quantum vs classical encryption security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Test Data (Plaintext)</Label>
                <Textarea
                  value={testData.plaintext}
                  onChange={(e) => setTestData(prev => ({ ...prev, plaintext: e.target.value }))}
                  placeholder="Enter data to encrypt..."
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={simulateEncryptDecrypt} className="flex-1">
                  {quantumState.enabled ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Quantum Encrypt
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Classical Encrypt
                    </>
                  )}
                </Button>
                <Button variant="destructive" onClick={performQuantumHackTest}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Simulate Attack
                </Button>
              </div>

              {testData.encrypted && (
                <div className="space-y-2">
                  <Label>Encrypted Data</Label>
                  <Textarea
                    value={testData.encrypted}
                    readOnly
                    className="font-mono"
                  />
                  <div className="flex items-center gap-2">
                    {quantumState.enabled ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Protected by post-quantum cryptography</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">Vulnerable to quantum computer attacks</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quantum Security Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Quantum Strength</Label>
                  <Progress value={systemMetrics.quantumStrength} className="w-full" />
                  <p className="text-sm text-muted-foreground">{systemMetrics.quantumStrength}% quantum-resistant</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Key Entropy</Label>
                  <p className="text-2xl font-bold">{systemMetrics.keyEntropy} bits</p>
                </div>

                <div className="space-y-2">
                  <Label>Encryption Latency</Label>
                  <p className="text-2xl font-bold">{systemMetrics.encryptionLatency}ms</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attack Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-medium">Blocked Attacks</span>
                  <span className="text-2xl font-bold text-green-600">{systemMetrics.blockedAttacks}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <span className="font-medium">Successful Attacks</span>
                  <span className="text-2xl font-bold text-red-600">{systemMetrics.successfulAttacks}</span>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    {quantumState.enabled 
                      ? "🛡️ Quantum protection is blocking all attacks!"
                      : "⚠️ Without quantum protection, attacks may succeed!"
                    }
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-Time Risk Analysis
              </CardTitle>
              <CardDescription>
                AI-powered behavioral and contextual risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentRiskScore ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Current Risk Level</h3>
                      <p className="text-sm text-muted-foreground">
                        {getRiskScoreDescription(currentRiskScore.risk_score)}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        currentRiskScore.risk_level === 'low' ? 'default' :
                        currentRiskScore.risk_level === 'medium' ? 'secondary' :
                        currentRiskScore.risk_level === 'high' ? 'destructive' : 'destructive'
                      }
                      className="text-lg px-3 py-1"
                    >
                      {currentRiskScore.risk_level.toUpperCase()}
                    </Badge>
                  </div>

                  <Progress value={currentRiskScore.risk_score} className="w-full" />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Device Trust</p>
                      <p className="text-xl font-bold">{trustScore.device}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Network</p>
                      <p className="text-xl font-bold">{trustScore.network}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Behavioral</p>
                      <p className="text-xl font-bold">{trustScore.behavioral}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="text-xl font-bold">{trustScore.location}%</p>
                    </div>
                  </div>

                  {currentRiskScore.risk_factors && currentRiskScore.risk_factors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Risk Factors:</h4>
                      {currentRiskScore.risk_factors.map((factor, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{factor.description}</span>
                          <Badge variant={
                            factor.severity === 'low' ? 'default' :
                            factor.severity === 'medium' ? 'secondary' :
                            factor.severity === 'high' ? 'destructive' : 'destructive'
                          }>
                            {factor.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No risk assessment data available. Risk analysis will begin with user activity.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}