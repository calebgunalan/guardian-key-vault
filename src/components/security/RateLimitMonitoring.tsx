import { useState, useEffect } from "react";
import { useRateLimitLogs } from "@/hooks/useRateLimitLogs";
import { useAPIKeys } from "@/hooks/useAPIKeys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, BarChart3, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function RateLimitMonitoring() {
  const { logs: rateLimitLogs, loading } = useRateLimitLogs();
  const { apiKeys } = useAPIKeys();
  const [selectedApiKey, setSelectedApiKey] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<number>(24);
  const [stats, setStats] = useState<any>(null);

  const filteredLogs = rateLimitLogs.filter(log => 
    selectedApiKey === 'all' || log.api_key_id === selectedApiKey
  );

  // Calculate stats
  useEffect(() => {
    if (filteredLogs.length > 0) {
      const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);
      const recentLogs = filteredLogs.filter(log => 
        new Date(log.window_start) >= since
      );

      const totalRequests = recentLogs.reduce((sum, log) => sum + log.request_count, 0);
      
      const endpointStats = recentLogs.reduce((acc, log) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + log.request_count;
        return acc;
      }, {} as Record<string, number>);

      const topEndpoints = Object.entries(endpointStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      setStats({
        totalRequests,
        uniqueEndpoints: Object.keys(endpointStats).length,
        topEndpoints,
        averagePerHour: Math.round(totalRequests / timeRange),
      });
    } else {
      setStats(null);
    }
  }, [filteredLogs, timeRange]);

  if (loading) {
    return <div>Loading rate limit data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats?.totalRequests || 0}</p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Endpoints</p>
                <p className="text-2xl font-bold">{stats?.uniqueEndpoints || 0}</p>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Per Hour</p>
                <p className="text-2xl font-bold">{stats?.averagePerHour || 0}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Keys</p>
                <p className="text-2xl font-bold">{apiKeys.length}</p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Top Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Rate Limit Monitoring
          </CardTitle>
          <CardDescription>
            Monitor API usage and rate limiting across your keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select API key" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All API Keys</SelectItem>
                {apiKeys.map((key) => (
                  <SelectItem key={key.id} value={key.id}>
                    {key.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 hour</SelectItem>
                <SelectItem value="6">Last 6 hours</SelectItem>
                <SelectItem value="24">Last 24 hours</SelectItem>
                <SelectItem value="168">Last week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {stats?.topEndpoints && stats.topEndpoints.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Top Endpoints by Request Count</h4>
              <div className="space-y-2">
                {stats.topEndpoints.map(([endpoint, count]: [string, number]) => (
                  <div key={endpoint} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-mono text-sm">{endpoint}</span>
                    <Badge variant="secondary">{count} requests</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rate Limit Activity</CardTitle>
          <CardDescription>
            Latest API usage logs and rate limiting events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>API Key</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.slice(0, 20).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-mono text-sm">
                        API Key ID: {log.api_key_id || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.request_count}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.window_start).toLocaleTimeString()} - {new Date(log.window_end).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No rate limit activity found for the selected filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}