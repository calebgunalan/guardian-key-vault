import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Filter, Search, AlertTriangle, Shield, Eye, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  log_type: 'audit' | 'security_attack' | 'quantum_attack';
}

export function EnhancedAuditLogManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    log_type: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 50,
    total: 0
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters, pagination.page]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('comprehensive_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pagination.page * pagination.limit, (pagination.page + 1) * pagination.limit - 1);

      // Apply filters
      if (filters.action) {
        query = query.ilike('action', `%${filters.action}%`);
      }
      if (filters.resource) {
        query = query.ilike('resource', `%${filters.resource}%`);
      }
      if (filters.log_type) {
        query = query.eq('log_type', filters.log_type);
      }
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Client-side search for details if search term provided
      let filteredData = data || [];
      if (filters.search) {
        filteredData = filteredData.filter(log => 
          JSON.stringify(log.details).toLowerCase().includes(filters.search.toLowerCase()) ||
          log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
          log.resource.toLowerCase().includes(filters.search.toLowerCase()) ||
          (log.ip_address && String(log.ip_address).includes(filters.search))
        );
      }

      setLogs(filteredData as AuditLog[]);
      setPagination(prev => ({ ...prev, total: count || 0 }));

    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setLoading(true);
      
      // Fetch all logs for export (remove pagination)
      let query = supabase
        .from('comprehensive_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply same filters
      if (filters.action) query = query.ilike('action', `%${filters.action}%`);
      if (filters.resource) query = query.ilike('resource', `%${filters.resource}%`);
      if (filters.log_type) query = query.eq('log_type', filters.log_type);
      if (filters.start_date) query = query.gte('created_at', filters.start_date);
      if (filters.end_date) query = query.lte('created_at', filters.end_date);

      const { data, error } = await query;
      if (error) throw error;

      // Prepare data for Excel
      const exportData = (data || []).map(log => ({
        'Timestamp': format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        'Type': log.log_type,
        'Action': log.action,
        'Resource': log.resource,
        'User ID': log.user_id || 'System',
        'IP Address': log.ip_address || 'N/A',
        'Details': typeof log.details === 'object' ? JSON.stringify(log.details) : log.details,
        'User Agent': log.user_agent || 'N/A'
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');

      // Generate filename
      const filename = `audit_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export Successful",
        description: `Audit logs exported to ${filename}`
      });

    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getLogTypeIcon = (logType: string) => {
    switch (logType) {
      case 'security_attack':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'quantum_attack':
        return <Shield className="h-4 w-4 text-orange-500" />;
      default:
        return <Eye className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogTypeColor = (logType: string) => {
    switch (logType) {
      case 'security_attack':
        return 'destructive';
      case 'quantum_attack':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDetails = (details: any) => {
    if (typeof details !== 'object') return details;
    
    const keyDetails = [];
    if (details.attack_type) keyDetails.push(`Attack: ${details.attack_type}`);
    if (details.severity) keyDetails.push(`Severity: ${details.severity}`);
    if (details.blocked !== undefined) keyDetails.push(`Blocked: ${details.blocked ? 'Yes' : 'No'}`);
    if (details.quantum_protected !== undefined) keyDetails.push(`Quantum Protected: ${details.quantum_protected ? 'Yes' : 'No'}`);
    
    return keyDetails.length > 0 ? keyDetails.join(', ') : JSON.stringify(details).slice(0, 100) + '...';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Enhanced Audit Log Manager
            </CardTitle>
            <CardDescription>
              Comprehensive audit trail including security attacks and system events
            </CardDescription>
          </div>
          <Button onClick={exportToExcel} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Log Type</Label>
            <Select value={filters.log_type} onValueChange={(value) => setFilters(prev => ({ ...prev, log_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="audit">System Audit</SelectItem>
                <SelectItem value="security_attack">Security Attacks</SelectItem>
                <SelectItem value="quantum_attack">Quantum Attacks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Action</Label>
            <Input
              placeholder="Filter by action..."
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Resource</Label>
            <Input
              placeholder="Filter by resource..."
              value={filters.resource}
              onChange={(e) => setFilters(prev => ({ ...prev, resource: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="datetime-local"
              value={filters.start_date}
              onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="datetime-local"
              value={filters.end_date}
              onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchAuditLogs} disabled={loading}>
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          <Button variant="outline" onClick={() => {
            setFilters({
              action: '',
              resource: '',
              log_type: '',
              start_date: '',
              end_date: '',
              search: ''
            });
            setPagination(prev => ({ ...prev, page: 0 }));
          }}>
            Clear Filters
          </Button>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {logs.length} of {pagination.total} total logs
        </div>

        {/* Audit Logs Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No audit logs found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getLogTypeIcon(log.log_type)}
                        <Badge variant={getLogTypeColor(log.log_type) as any}>
                          {log.log_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.resource}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">
                        {log.ip_address || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm" title={JSON.stringify(log.details)}>
                        {formatDetails(log.details)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page + 1} of {Math.ceil(pagination.total / pagination.limit)}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 0}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(pagination.page + 1) * pagination.limit >= pagination.total}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Attack Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Security Events</p>
                <p className="text-sm text-muted-foreground">
                  {logs.filter(log => log.log_type === 'security_attack').length} attacks detected
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium">Quantum Events</p>
                <p className="text-sm text-muted-foreground">
                  {logs.filter(log => log.log_type === 'quantum_attack').length} quantum attacks
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Audit Events</p>
                <p className="text-sm text-muted-foreground">
                  {logs.filter(log => log.log_type === 'audit').length} system actions
                </p>
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}