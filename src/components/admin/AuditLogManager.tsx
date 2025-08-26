import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Search, Filter, Eye, Shield, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as XLSX from 'xlsx';

interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email: string;
  };
}

interface SecurityAttack {
  id: string;
  attack_type: string;
  severity: string;
  source_ip?: string;
  target_resource?: string;
  blocked: boolean;
  attack_data?: any;
  detected_at: string;
  quantum_protected: boolean;
}

export function AuditLogManager() {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityAttacks, setSecurityAttacks] = useState<SecurityAttack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [showAttacks, setShowAttacks] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
    fetchSecurityAttacks();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setAuditLogs((data || []).map(log => ({
        ...log,
        ip_address: log.ip_address as string,
        user_agent: log.user_agent as string,
        profiles: log.profiles as any
      })));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive"
      });
    }
  };

  const fetchSecurityAttacks = async () => {
    try {
      const { data, error } = await supabase
        .from('security_attacks')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setSecurityAttacks((data || []).map(attack => ({
        ...attack,
        source_ip: attack.source_ip as string,
        target_resource: attack.target_resource as string,
        attack_data: attack.attack_data as any
      })));
    } catch (error) {
      console.error('Error fetching security attacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || log.resource === resourceFilter;
    
    return matchesSearch && matchesAction && matchesResource;
  });

  const filteredAttacks = securityAttacks.filter(attack => {
    return attack.attack_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
           attack.source_ip?.includes(searchTerm) ||
           attack.target_resource?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const exportToExcel = () => {
    const dataToExport = showAttacks ? filteredAttacks : filteredLogs;
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, showAttacks ? 'Security Attacks' : 'Audit Logs');
    
    const fileName = `${showAttacks ? 'security_attacks' : 'audit_logs'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "Export Complete",
      description: `${showAttacks ? 'Security attacks' : 'Audit logs'} exported successfully`
    });
  };

  const exportToCSV = () => {
    const dataToExport = showAttacks ? filteredAttacks : filteredLogs;
    const headers = showAttacks 
      ? ['ID', 'Attack Type', 'Severity', 'Source IP', 'Target Resource', 'Blocked', 'Detected At', 'Quantum Protected']
      : ['ID', 'User Email', 'Action', 'Resource', 'IP Address', 'Created At'];
    
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(item => {
        if (showAttacks) {
          const attack = item as SecurityAttack;
          return [
            attack.id,
            attack.attack_type,
            attack.severity,
            attack.source_ip || 'N/A',
            attack.target_resource || 'N/A',
            attack.blocked ? 'Yes' : 'No',
            attack.detected_at,
            attack.quantum_protected ? 'Yes' : 'No'
          ].join(',');
        } else {
          const log = item as AuditLog;
          return [
            log.id,
            log.profiles?.email || 'System',
            log.action,
            log.resource,
            log.ip_address || 'N/A',
            log.created_at
          ].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${showAttacks ? 'security_attacks' : 'audit_logs'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${showAttacks ? 'Security attacks' : 'Audit logs'} exported to CSV successfully`
    });
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      case 'login': return 'default';
      case 'logout': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getUniqueActions = () => {
    return [...new Set(auditLogs.map(log => log.action))];
  };

  const getUniqueResources = () => {
    return [...new Set(auditLogs.map(log => log.resource))];
  };

  const getAttackStats = () => {
    const total = securityAttacks.length;
    const blocked = securityAttacks.filter(a => a.blocked).length;
    const successful = total - blocked;
    const critical = securityAttacks.filter(a => a.severity === 'critical').length;
    
    return { total, blocked, successful, critical };
  };

  const stats = getAttackStats();

  return (
    <div className="space-y-6">
      {/* Attack Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Attacks</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.blocked}</p>
                <p className="text-sm text-muted-foreground">Blocked</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.successful}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.critical}</p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {showAttacks ? 'Security Attacks Log' : 'Audit Logs'}
              </CardTitle>
              <CardDescription>
                {showAttacks 
                  ? 'Monitor and analyze security attacks on your system'
                  : 'Monitor all system activities and user actions'
                }
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={showAttacks ? "default" : "outline"}
                onClick={() => setShowAttacks(!showAttacks)}
              >
                {showAttacks ? 'Show Audit Logs' : 'Show Attacks'}
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <FileDown className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={exportToExcel}>
                <FileDown className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder={showAttacks ? "Search attacks..." : "Search logs..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            {!showAttacks && (
              <>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {getUniqueActions().map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by resource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {getUniqueResources().map(resource => (
                      <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {showAttacks ? (
                    <>
                      <TableHead>Attack Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Source IP</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Protection</TableHead>
                      <TableHead>Time</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Details</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={showAttacks ? 7 : 6} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : showAttacks ? (
                  filteredAttacks.map((attack) => (
                    <TableRow key={attack.id}>
                      <TableCell className="font-medium">{attack.attack_type}</TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(attack.severity)}>
                          {attack.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{attack.source_ip || 'Unknown'}</TableCell>
                      <TableCell>{attack.target_resource || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={attack.blocked ? "default" : "destructive"}>
                          {attack.blocked ? 'Blocked' : 'Successful'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={attack.quantum_protected ? "default" : "secondary"}>
                          {attack.quantum_protected ? 'Quantum' : 'Standard'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(attack.detected_at))} ago
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.profiles?.full_name || 'System'}</p>
                          <p className="text-sm text-muted-foreground">{log.profiles?.email || 'system@iam.local'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ip_address || 'N/A'}</TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(log.created_at))} ago
                      </TableCell>
                      <TableCell>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                
                {!loading && (showAttacks ? filteredAttacks.length === 0 : filteredLogs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={showAttacks ? 7 : 6} className="text-center py-8 text-muted-foreground">
                      No {showAttacks ? 'attacks' : 'logs'} found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}