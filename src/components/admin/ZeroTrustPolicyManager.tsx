import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useZeroTrust } from '@/hooks/useZeroTrust';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Network, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  Brain,
  Lock,
  Globe,
  Clock,
  Monitor
} from 'lucide-react';

interface ZeroTrustPolicy {
  id: string;
  name: string;
  description: string;
  type: 'device' | 'network' | 'behavioral' | 'location' | 'time';
  conditions: Record<string, any>;
  actions: Record<string, any>;
  priority: number;
  isEnabled: boolean;
  createdAt: Date;
}

export function ZeroTrustPolicyManager() {
  const { policies, calculateTrustScore } = useZeroTrust();
  const { toast } = useToast();
  const [localPolicies, setLocalPolicies] = useState<ZeroTrustPolicy[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState<Partial<ZeroTrustPolicy>>({
    name: '',
    description: '',
    type: 'device',
    conditions: {},
    actions: {},
    priority: 1,
    isEnabled: true
  });

  useEffect(() => {
    // Initialize with some default policies to demonstrate functionality
    setLocalPolicies([
      {
        id: '1',
        name: 'Trusted Device Policy',
        description: 'Require device to be registered and trusted',
        type: 'device',
        conditions: {
          deviceRegistered: true,
          deviceTrusted: true,
          minimumTrustScore: 80
        },
        actions: {
          allow: true,
          requireMFA: false,
          logAccess: true
        },
        priority: 1,
        isEnabled: true,
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Network Security Policy',
        description: 'Block access from untrusted networks',
        type: 'network',
        conditions: {
          allowedNetworks: ['192.168.1.0/24', '10.0.0.0/8'],
          blockVPN: false,
          requireSSL: true
        },
        actions: {
          allow: true,
          requireMFA: true,
          logAccess: true
        },
        priority: 2,
        isEnabled: true,
        createdAt: new Date()
      },
      {
        id: '3',
        name: 'Behavioral Anomaly Policy',
        description: 'Detect and respond to unusual user behavior',
        type: 'behavioral',
        conditions: {
          maxAnomalyScore: 30,
          checkLoginTimes: true,
          checkAccessPatterns: true
        },
        actions: {
          allow: false,
          requireMFA: true,
          notifyAdmin: true,
          temporaryBlock: true
        },
        priority: 3,
        isEnabled: true,
        createdAt: new Date()
      },
      {
        id: '4',
        name: 'Geographic Policy',
        description: 'Restrict access based on location',
        type: 'location',
        conditions: {
          allowedCountries: ['US', 'CA', 'GB'],
          blockedRegions: ['CN', 'RU'],
          maxDistanceFromHome: 1000
        },
        actions: {
          allow: true,
          requireMFA: true,
          logAccess: true,
          requireApproval: false
        },
        priority: 4,
        isEnabled: true,
        createdAt: new Date()
      },
      {
        id: '5',
        name: 'Time-based Access Policy',
        description: 'Restrict access during off-hours',
        type: 'time',
        conditions: {
          allowedHours: { start: 8, end: 18 },
          allowedDays: [1, 2, 3, 4, 5], // Monday-Friday
          timezone: 'UTC'
        },
        actions: {
          allow: false,
          requireMFA: true,
          requireApproval: true,
          logAccess: true
        },
        priority: 5,
        isEnabled: false,
        createdAt: new Date()
      }
    ]);
  }, []);

  const handleAddPolicy = () => {
    const policy: ZeroTrustPolicy = {
      id: Math.random().toString(36).substring(7),
      name: newPolicy.name || '',
      description: newPolicy.description || '',
      type: newPolicy.type || 'device',
      conditions: newPolicy.conditions || {},
      actions: newPolicy.actions || {},
      priority: newPolicy.priority || 1,
      isEnabled: newPolicy.isEnabled ?? true,
      createdAt: new Date()
    };

    setLocalPolicies(prev => [...prev, policy]);
    setIsAddDialogOpen(false);
    setNewPolicy({
      name: '',
      description: '',
      type: 'device',
      conditions: {},
      actions: {},
      priority: 1,
      isEnabled: true
    });

    toast({
      title: "Policy Created",
      description: `Zero Trust policy "${policy.name}" has been created`
    });
  };

  const handleTogglePolicy = (policyId: string) => {
    setLocalPolicies(prev => 
      prev.map(policy => 
        policy.id === policyId 
          ? { ...policy, isEnabled: !policy.isEnabled }
          : policy
      )
    );
  };

  const handleDeletePolicy = (policyId: string) => {
    setLocalPolicies(prev => prev.filter(policy => policy.id !== policyId));
    toast({
      title: "Policy Deleted",
      description: "Zero Trust policy has been deleted"
    });
  };

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case 'device': return Monitor;
      case 'network': return Network;
      case 'behavioral': return Brain;
      case 'location': return Globe;
      case 'time': return Clock;
      default: return Shield;
    }
  };

  const getPolicyColor = (type: string) => {
    switch (type) {
      case 'device': return 'bg-blue-100 text-blue-800';
      case 'network': return 'bg-green-100 text-green-800';
      case 'behavioral': return 'bg-purple-100 text-purple-800';
      case 'location': return 'bg-orange-100 text-orange-800';
      case 'time': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentTrustScore = calculateTrustScore({
    deviceTrusted: true,
    networkTrusted: true,
    locationTrusted: true,
    behavioralScore: 85
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Zero Trust Policy Manager
              </CardTitle>
              <CardDescription>
                Configure and manage zero trust security policies
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy
                </Button>
              </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{newPolicy.id ? 'Edit' : 'Create'} Zero Trust Policy</DialogTitle>
                    <DialogDescription>
                      Define conditions and actions for zero trust security
                    </DialogDescription>
                  </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Policy Name</Label>
                      <Input
                        value={newPolicy.name}
                        onChange={(e) => setNewPolicy(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Device Trust Policy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select 
                        value={newPolicy.type} 
                        onValueChange={(value: any) => setNewPolicy(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="device">Device</SelectItem>
                          <SelectItem value="network">Network</SelectItem>
                          <SelectItem value="behavioral">Behavioral</SelectItem>
                          <SelectItem value="location">Location</SelectItem>
                          <SelectItem value="time">Time-based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newPolicy.description}
                      onChange={(e) => setNewPolicy(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this policy does..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority (1-10)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={newPolicy.priority}
                        onChange={(e) => setNewPolicy(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                      <Switch
                        checked={newPolicy.isEnabled}
                        onCheckedChange={(checked) => setNewPolicy(prev => ({ ...prev, isEnabled: checked }))}
                      />
                      <Label>Enable Policy</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPolicy}>
                    Create Policy
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="policies">Active Policies</TabsTrigger>
          <TabsTrigger value="score">Trust Score</TabsTrigger>
          <TabsTrigger value="analytics">Policy Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <div className="grid gap-4">
            {localPolicies.map((policy) => {
              const Icon = getPolicyIcon(policy.type);
              return (
                <Card key={policy.id} className={`${!policy.isEnabled ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${getPolicyColor(policy.type)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{policy.name}</h3>
                          <p className="text-sm text-muted-foreground">{policy.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Priority {policy.priority}</Badge>
                        <Switch
                          checked={policy.isEnabled}
                          onCheckedChange={() => handleTogglePolicy(policy.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewPolicy(policy);
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePolicy(policy.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Conditions:</Label>
                        <div className="mt-1 space-y-1">
                          {Object.entries(policy.conditions).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span>{key}:</span>
                              <span className="font-mono">{JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Actions:</Label>
                        <div className="mt-1 space-y-1">
                          {Object.entries(policy.actions).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span>{key}:</span>
                              <span className="font-mono">{JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="score" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Trust Score</CardTitle>
              <CardDescription>
                Real-time zero trust assessment based on active policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {currentTrustScore.overall}%
                </div>
                <p className="text-muted-foreground">Overall Trust Score</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Device Trust</span>
                    <span className="text-sm">{currentTrustScore.device}%</span>
                  </div>
                  <Progress value={currentTrustScore.device} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Network Security</span>
                    <span className="text-sm">{currentTrustScore.network}%</span>
                  </div>
                  <Progress value={currentTrustScore.network} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Behavioral Analysis</span>
                    <span className="text-sm">{currentTrustScore.behavioral}%</span>
                  </div>
                  <Progress value={currentTrustScore.behavioral} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Location Verification</span>
                    <span className="text-sm">{currentTrustScore.location}%</span>
                  </div>
                  <Progress value={currentTrustScore.location} className="h-2" />
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Trust score calculation: Device security ({currentTrustScore.device}%) + Network assessment ({currentTrustScore.network}%) + 
                  Behavioral patterns ({currentTrustScore.behavioral}%) + Location verification ({currentTrustScore.location}%) 
                  = Overall trust score of {currentTrustScore.overall}%
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Policy Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Active Policies</span>
                    <Badge variant="default">{localPolicies.filter(p => p.isEnabled).length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Disabled Policies</span>
                    <Badge variant="secondary">{localPolicies.filter(p => !p.isEnabled).length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Priority</span>
                    <Badge variant="outline">
                      {(localPolicies.reduce((sum, p) => sum + p.priority, 0) / localPolicies.length).toFixed(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['device', 'network', 'behavioral', 'location', 'time'].map((type) => {
                    const count = localPolicies.filter(p => p.type === type).length;
                    const Icon = getPolicyIcon(type);
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="capitalize">{type}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trust Score Logic Breakdown</CardTitle>
              <CardDescription>
                Understanding how the zero trust score is calculated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Device Trust Calculation:</strong> Registered device (25 points) + Known fingerprint (25 points) + 
                    Security compliance (25 points) + Update status (25 points) = {currentTrustScore.device}%
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <Network className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Network Security:</strong> Trusted network (30 points) + SSL/TLS (25 points) + 
                    VPN status (20 points) + Firewall (25 points) = {currentTrustScore.network}%
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Behavioral Analysis:</strong> Normal login time (25 points) + Typical location (25 points) + 
                    Standard access patterns (25 points) + Expected device usage (25 points) = {currentTrustScore.behavioral}%
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Location Verification:</strong> Known location (50 points) + Country compliance (30 points) + 
                    Reasonable distance (20 points) = {currentTrustScore.location}%
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}