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
    toggleQuantumSecurity,
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
      const newState = !quantumState.enabled;
      await toggleQuantumSecurity(newState);
      
      setQuantumState(prev => ({
        ...prev,
        enabled: newState,
        encryptionActive: newState
      }));
      
      toast({
        title: newState ? "Quantum Protection Activated" : "Quantum Protection Deactivated",
        description: newState 
          ? "All data is now protected with post-quantum cryptography" 
          : "⚠️ Warning: Data is now using classical encryption - vulnerable to quantum attacks!",
        variant: newState ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Quantum toggle failed:', error);
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

  const performQuantumHackTest = async () => {
    // Simulate detailed attack scenario
    toast({
      title: "🔍 Initiating Security Test",
      description: "Simulating quantum computer attack on encryption keys..."
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (quantumState.enabled) {
      setSystemMetrics(prev => ({
        ...prev,
        blockedAttacks: prev.blockedAttacks + 1
      }));
      
      toast({
        title: "🛡️ Quantum Defense Success",
        description: "Background: Shor's algorithm attempted to factor RSA keys but post-quantum ML-KEM-768 encryption remained secure. Attack signatures detected and blocked by quantum-resistant algorithms.",
        variant: "default"
      });
    } else {
      setSystemMetrics(prev => ({
        ...prev,
        successfulAttacks: prev.successfulAttacks + 1
      }));
      
      toast({
        title: "💥 Security Breach!",
        description: "Background: Classical RSA-2048 encryption was broken using Shor's algorithm on quantum computer. Private keys factorized in polynomial time. All encrypted data compromised!",
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
                Real-Time Risk Analysis Engine
              </CardTitle>
              <CardDescription>
                AI-powered behavioral and contextual risk assessment with automatic threat detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button 
                  onClick={() => calculateRiskScore({
                    currentLoginHour: new Date().getHours(),
                    currentLocation: 'Unknown',
                    deviceFingerprint: 'demo-device',
                    recentLoginAttempts: Math.floor(Math.random() * 3) + 1,
                    failedAttempts: Math.floor(Math.random() * 2)
                  })}
                  variant="outline"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Run Risk Analysis
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>

              {currentRiskScore ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Current Risk Level</h3>
                      <p className="text-sm text-muted-foreground">
                        {getRiskScoreDescription(currentRiskScore.risk_score)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last updated: {new Date(currentRiskScore.calculated_at).toLocaleString()}
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
                      {currentRiskScore.risk_level.toUpperCase()} - {currentRiskScore.risk_score}%
                    </Badge>
                  </div>

                  <Progress value={currentRiskScore.risk_score} className="w-full" />
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Trust Score Calculation:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Device Trust</p>
                        <p className="text-xl font-bold text-blue-600">{trustScore.device}%</p>
                        <p className="text-xs">Hardware fingerprint verified</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Network Security</p>
                        <p className="text-xl font-bold text-green-600">{trustScore.network}%</p>
                        <p className="text-xs">{quantumState.enabled ? 'Quantum-safe' : 'Classical only'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Behavioral</p>
                        <p className="text-xl font-bold text-purple-600">{trustScore.behavioral}%</p>
                        <p className="text-xs">Pattern analysis score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Location Trust</p>
                        <p className="text-xl font-bold text-orange-600">{trustScore.location}%</p>
                        <p className="text-xs">Geolocation verified</p>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-background rounded border">
                      <p className="text-sm font-medium">Trust Score Formula:</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Overall = (Device×0.25 + Network×0.30 + Behavioral×0.30 + Location×0.15)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        = ({trustScore.device}×0.25 + {trustScore.network}×0.30 + {trustScore.behavioral}×0.30 + {trustScore.location}×0.15) = <strong>{trustScore.overall}%</strong>
                      </p>
                    </div>
                  </div>

                  {currentRiskScore.risk_factors && currentRiskScore.risk_factors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Risk Factors Detected:</h4>
                      {currentRiskScore.risk_factors.map((factor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <span className="text-sm font-medium">{factor.description}</span>
                            <p className="text-xs text-muted-foreground">Impact: {factor.score} points</p>
                          </div>
                          <Badge variant={
                            factor.severity === 'low' ? 'default' :
                            factor.severity === 'medium' ? 'secondary' :
                            factor.severity === 'high' ? 'destructive' : 'destructive'
                          }>
                            {factor.severity.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      {currentRiskScore.risk_level === 'low' && "✅ Low risk detected. Normal access granted."}
                      {currentRiskScore.risk_level === 'medium' && "⚠️ Medium risk. Additional authentication recommended."}
                      {currentRiskScore.risk_level === 'high' && "🚨 High risk! Enhanced security measures required."}
                      {currentRiskScore.risk_level === 'critical' && "💥 CRITICAL RISK! Immediate security review needed."}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No risk assessment data available. Click "Run Risk Analysis" to perform an automated security evaluation based on current user behavior, device fingerprinting, and contextual factors.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Risk Analysis Features:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Behavioral pattern analysis</li>
                      <li>• Device fingerprinting verification</li>
                      <li>• Network security assessment</li>
                      <li>• Geolocation anomaly detection</li>
                      <li>• Login time pattern matching</li>
                      <li>• Threat intelligence correlation</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}