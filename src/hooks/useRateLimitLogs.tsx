import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface RateLimitLog {
  id: string;
  api_key_id: string;
  user_id: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  window_end: string;
  created_at: string;
  user_api_keys?: {
    id: string;
    name: string;
    key_prefix: string;
  };
}

export function useRateLimitLogs() {
  const { user } = useAuth();
  const [rateLimitLogs, setRateLimitLogs] = useState<RateLimitLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRateLimitLogs();
    } else {
      setRateLimitLogs([]);
      setLoading(false);
    }
  }, [user]);

  const fetchRateLimitLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('api_rate_limit_logs')
        .select(`
          *,
          user_api_keys (
            id,
            name,
            key_prefix
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setRateLimitLogs(data || []);
    } catch (error) {
      console.error('Error fetching rate limit logs:', error);
      setRateLimitLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getRateLimitStats = async (apiKeyId?: string, hours: number = 24) => {
    if (!user) return null;

    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('api_rate_limit_logs')
        .select('endpoint, request_count, window_start')
        .eq('user_id', user.id)
        .gte('window_start', since);

      if (apiKeyId) {
        query = query.eq('api_key_id', apiKeyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate stats
      const stats = data?.reduce((acc, log) => {
        acc.totalRequests += log.request_count;
        acc.endpointStats[log.endpoint] = (acc.endpointStats[log.endpoint] || 0) + log.request_count;
        return acc;
      }, {
        totalRequests: 0,
        endpointStats: {} as Record<string, number>,
      });

      return stats;
    } catch (error) {
      console.error('Error fetching rate limit stats:', error);
      return null;
    }
  };

  return {
    rateLimitLogs,
    loading,
    fetchRateLimitLogs,
    getRateLimitStats,
  };
}