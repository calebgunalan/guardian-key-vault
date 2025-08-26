import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface RateLimitLog {
  id: string;
  api_key_id?: string;
  user_id: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  window_end: string;
  created_at: string;
}

export function useRateLimitLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<RateLimitLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRateLimitLogs();
    } else {
      setLogs([]);
      setLoading(false);
    }
  }, [user]);

  const fetchRateLimitLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('api_rate_limit_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching rate limit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogsByEndpoint = (endpoint: string) => {
    return logs.filter(log => log.endpoint === endpoint);
  };

  const getLogsByTimeRange = (startDate: Date, endDate: Date) => {
    return logs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= startDate && logDate <= endDate;
    });
  };

  const getTotalRequestsInPeriod = (hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return logs
      .filter(log => new Date(log.created_at) >= cutoff)
      .reduce((total, log) => total + log.request_count, 0);
  };

  const getTopEndpoints = (limit: number = 10) => {
    const endpointCounts: Record<string, number> = {};
    
    logs.forEach(log => {
      endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + log.request_count;
    });

    return Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([endpoint, count]) => ({ endpoint, count }));
  };

  return {
    logs,
    loading,
    fetchRateLimitLogs,
    getLogsByEndpoint,
    getLogsByTimeRange,
    getTotalRequestsInPeriod,
    getTopEndpoints
  };
}