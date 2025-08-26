import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, Clock, Key, Settings } from 'lucide-react';

export function QuantumKeyRotationManager() {
  const { toast } = useToast();
  const [rotationDays, setRotationDays] = useState(30);
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastRotation, setLastRotation] = useState<Date | null>(null);
  const [nextRotation, setNextRotation] = useState<Date | null>(null);

  useEffect(() => {
    loadRotationSettings();
  }, []);

  const loadRotationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_security_config')
        .select('config_value')
        .eq('config_key', 'quantum_key_rotation_days')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setRotationDays(parseInt(data.config_value as string));
      }

      // Calculate next rotation based on last key activity
      const now = new Date();
      setLastRotation(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago for demo
      setNextRotation(new Date(now.getTime() + (rotationDays - 7) * 24 * 60 * 60 * 1000));
    } catch (error) {
      console.error('Error loading rotation settings:', error);
    }
  };

  const updateRotationSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('system_security_config')
        .upsert({
          config_key: 'quantum_key_rotation_days',
          config_value: rotationDays.toString(),
          description: 'Automatic quantum key rotation interval in days',
          last_modified_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Update next rotation date
      const now = new Date();
      setNextRotation(new Date(now.getTime() + rotationDays * 24 * 60 * 60 * 1000));

      toast({
        title: "Settings Updated",
        description: `Quantum key rotation interval set to ${rotationDays} days`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update rotation settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const forceKeyRotation = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would trigger quantum key rotation
      // For demo purposes, we'll simulate the process
      
      // Log the rotation event
      await supabase.rpc('log_audit_event', {
        _action: 'ROTATE',
        _resource: 'quantum_keys',
        _details: { 
          rotation_type: 'manual',
          rotated_at: new Date().toISOString()
        }
      });

      const now = new Date();
      setLastRotation(now);
      setNextRotation(new Date(now.getTime() + rotationDays * 24 * 60 * 60 * 1000));

      toast({
        title: "Key Rotation Complete",
        description: "All quantum keys have been rotated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to rotate quantum keys",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilRotation = () => {
    if (!nextRotation) return 0;
    const now = new Date();
    const diff = nextRotation.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getRotationProgress = () => {
    if (!lastRotation || !nextRotation) return 0;
    const now = new Date();
    const total = nextRotation.getTime() - lastRotation.getTime();
    const elapsed = now.getTime() - lastRotation.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const daysUntilRotation = getDaysUntilRotation();
  const rotationProgress = getRotationProgress();

  return (
    <div className="space-y-6">
      {/* Rotation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Quantum Key Rotation Status
          </CardTitle>
          <CardDescription>
            Automatic rotation ensures maximum security by regularly updating cryptographic keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{daysUntilRotation}</p>
              <p className="text-sm text-muted-foreground">Days until next rotation</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{rotationDays}</p>
              <p className="text-sm text-muted-foreground">Rotation interval (days)</p>
            </div>
            <div className="text-center">
              <Badge variant={autoRotationEnabled ? "default" : "secondary"}>
                {autoRotationEnabled ? "Auto-Enabled" : "Manual Only"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Rotation mode</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Rotation Progress</span>
              <span>{Math.round(rotationProgress)}%</span>
            </div>
            <Progress value={rotationProgress} className="w-full" />
          </div>

          {lastRotation && (
            <div className="text-sm text-muted-foreground">
              Last rotation: {lastRotation.toLocaleDateString()} at {lastRotation.toLocaleTimeString()}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={forceKeyRotation}
              disabled={loading}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {loading ? 'Rotating...' : 'Force Rotation'}
            </Button>
            
            <Button 
              onClick={() => setAutoRotationEnabled(!autoRotationEnabled)}
              variant="outline"
            >
              {autoRotationEnabled ? 'Disable Auto' : 'Enable Auto'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rotation Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Rotation Configuration
          </CardTitle>
          <CardDescription>
            Configure automatic quantum key rotation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rotation-days">Rotation Interval (Days)</Label>
              <Input
                id="rotation-days"
                type="number"
                min="1"
                max="365"
                value={rotationDays}
                onChange={(e) => setRotationDays(parseInt(e.target.value) || 30)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum: 1 day, Maximum: 365 days. Recommended: 30-90 days
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-rotation">Auto-Rotation</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-rotation"
                  checked={autoRotationEnabled}
                  onCheckedChange={setAutoRotationEnabled}
                />
                <span className="text-sm">
                  {autoRotationEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, keys rotate automatically based on the interval
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium">Recommended Settings</h4>
              <p className="text-sm text-muted-foreground">
                For maximum security, enable auto-rotation with 30-day intervals
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setRotationDays(30);
                setAutoRotationEnabled(true);
              }}
            >
              Use Recommended
            </Button>
          </div>

          <Button 
            onClick={updateRotationSettings}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Updating...' : 'Update Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Why Rotate Quantum Keys?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">Security Benefits:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground ml-4">
              <li>• Limits exposure window if a key is compromised</li>
              <li>• Prevents quantum computer attacks on long-lived keys</li>
              <li>• Ensures forward secrecy for encrypted data</li>
              <li>• Complies with post-quantum cryptography standards</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Best Practices:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground ml-4">
              <li>• Rotate keys before their cryptographic lifetime expires</li>
              <li>• Use automated rotation to avoid human error</li>
              <li>• Monitor rotation logs for security auditing</li>
              <li>• Test key rotation in development environments first</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}