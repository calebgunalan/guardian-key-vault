import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, Eye, Download, Clock, MapPin, Monitor } from 'lucide-react';

interface AttackLog {
  id: string;
  attack_type: string;
  severity: string;
  source_ip: string;
  target_resource?: string;
  blocked: boolean;
  detected_at: string;
  attack_data?: any;
  quantum_protected?: boolean;
}

export function AttackStatistics() {
  const { toast } = useToast();
  const [attacks, setAttacks] = useState<AttackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttack, setSelectedAttack] = useState<AttackLog | null>(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchAttacks();
  }, [timeRange]);

  const fetchAttacks = async () => {
    try {
      setLoading(true);
      const hours = getHoursFromRange(timeRange);
      const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('security_attacks')
        .select('*')
        .gte('detected_at', timeThreshold)
        .order('detected_at', { ascending: false });

      if (error) throw error;
      setAttacks((data || []).map(attack => ({
        ...attack,
        source_ip: String(attack.source_ip)
      })));
    } catch (error) {
      console.error('Error fetching attacks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attack statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getHoursFromRange = (range: string): number => {
    switch (range) {
      case '1h': return 1;
      case '24h': return 24;
      case '7d': return 168;
      case '30d': return 720;
      default: return 24;
    }
  };

  const getStatistics = () => {
    const total = attacks.length;
    const blocked = attacks.filter(a => a.blocked).length;
    const successful = total - blocked;
    const byType = attacks.reduce((acc, attack) => {
      acc[attack.attack_type] = (acc[attack.attack_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const bySeverity = attacks.reduce((acc, attack) => {
      acc[attack.severity] = (acc[attack.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, blocked, successful, byType, bySeverity };
  };

  const exportAttackData = () => {
    const csvContent = [
      ['Timestamp', 'Attack Type', 'Severity', 'Source IP', 'Target', 'Status', 'Quantum Protected'].join(','),
      ...attacks.map(attack => [
        attack.detected_at,
        attack.attack_type,
        attack.severity,
        attack.source_ip,
        attack.target_resource || 'N/A',
        attack.blocked ? 'Blocked' : 'Successful',
        attack.quantum_protected ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attack-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Attack logs have been exported to CSV"
    });
  };

  const getSeverityColor = (severity: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Attack Statistics & Monitoring
              </CardTitle>
              <CardDescription>
                Real-time security attack detection and analysis
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <Button onClick={exportAttackData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-destructive">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Attacks</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.blocked}</div>
              <div className="text-sm text-muted-foreground">
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
                  onClick={() => {/* Show blocked attacks details */}}
                >
                  Blocked Attacks ↗
                </Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.successful}</div>
              <div className="text-sm text-muted-foreground">
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
                  onClick={() => {/* Show successful attacks details */}}
                >
                  Successful Attacks ↗
                </Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {attacks.filter(a => a.quantum_protected).length}
              </div>
              <div className="text-sm text-muted-foreground">Quantum Protected</div>
            </div>
          </div>

          {/* Attack Types Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Attack Types</h3>
              <div className="space-y-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm">{type}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Severity Distribution</h3>
              <div className="space-y-2">
                {Object.entries(stats.bySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{severity}</span>
                    <Badge variant={getSeverityColor(severity)}>{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Attacks Table */}
          <div className="space-y-4">
            <h3 className="font-semibold">Recent Attack Attempts</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source IP</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : attacks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No attacks detected in the selected time range
                      </TableCell>
                    </TableRow>
                  ) : (
                    attacks.slice(0, 10).map((attack) => (
                      <TableRow key={attack.id}>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {new Date(attack.detected_at).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{attack.attack_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-mono text-sm">
                            <MapPin className="h-3 w-3" />
                            {attack.source_ip}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Monitor className="h-3 w-3" />
                            {attack.target_resource || 'System'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(attack.severity)}>
                            {attack.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={attack.blocked ? "default" : "destructive"}>
                            {attack.blocked ? 'Blocked' : 'Successful'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedAttack(attack)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Attack Details</DialogTitle>
                                <DialogDescription>
                                  Comprehensive information about the security incident
                                </DialogDescription>
                              </DialogHeader>
                              {selectedAttack && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Attack Type</label>
                                      <p className="text-sm text-muted-foreground">{selectedAttack.attack_type}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Severity</label>
                                      <Badge variant={getSeverityColor(selectedAttack.severity)}>
                                        {selectedAttack.severity}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Source IP</label>
                                      <p className="text-sm font-mono text-muted-foreground">{selectedAttack.source_ip}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Detection Time</label>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(selectedAttack.detected_at).toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Target Resource</label>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedAttack.target_resource || 'System-wide'}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Response</label>
                                      <Badge variant={selectedAttack.blocked ? "default" : "destructive"}>
                                        {selectedAttack.blocked ? 'Attack Blocked' : 'Attack Succeeded'}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {selectedAttack.attack_data && (
                                    <div>
                                      <label className="text-sm font-medium">Attack Data</label>
                                      <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-40">
                                        {JSON.stringify(selectedAttack.attack_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      <strong>System Response:</strong> {selectedAttack.blocked 
                                        ? "Our quantum-enhanced security system successfully detected and blocked this attack attempt. The source IP has been temporarily blacklisted and relevant security teams have been notified."
                                        : "This attack attempt was detected but not fully mitigated. Please review the attack details and consider implementing additional security measures."}
                                    </AlertDescription>
                                  </Alert>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}