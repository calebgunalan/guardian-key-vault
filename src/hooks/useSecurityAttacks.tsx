import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SecurityAttack {
  id: string;
  attack_type: string;
  source_ip: string | null;
  target_resource: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
  quantum_protected: boolean;
  attack_data: Record<string, any>;
  detected_at: string;
}

export function useSecurityAttacks() {
  const { user } = useAuth();
  const [attacks, setAttacks] = useState<SecurityAttack[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAttacks, setTotalAttacks] = useState(0);

  useEffect(() => {
    fetchAttacks();
    
    // Set up real-time subscription for new attacks
    const channel = supabase
      .channel('security_attacks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_attacks'
        },
        (payload) => {
          setAttacks(prev => [payload.new as SecurityAttack, ...prev]);
          setTotalAttacks(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAttacks = async () => {
    try {
      // Get recent attacks
      const { data: recentAttacks, error: attacksError } = await supabase
        .from('security_attacks')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(50);

      if (attacksError) throw attacksError;

      // Get total count
      const { count, error: countError } = await supabase
        .from('security_attacks')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      setAttacks(recentAttacks?.map(attack => ({
        ...attack,
        source_ip: attack.source_ip as string | null,
        attack_data: attack.attack_data as Record<string, any>,
        severity: attack.severity as 'low' | 'medium' | 'high' | 'critical'
      })) || []);
      setTotalAttacks(count || 0);
    } catch (error) {
      console.error('Error fetching security attacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const logSecurityAttack = async (
    attackType: string,
    sourceIp?: string,
    targetResource?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    attackData: Record<string, any> = {},
    quantumProtected: boolean = false
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('security_attacks')
        .insert({
          attack_type: attackType,
          source_ip: sourceIp,
          target_resource: targetResource,
          severity: severity,
          blocked: true, // For demo purposes, assume all attacks are blocked
          quantum_protected: quantumProtected,
          attack_data: attackData,
          detected_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging security attack:', error);
      throw error;
    }
  };

  // Simulate some realistic attack patterns for demonstration
  const simulateAttacks = async () => {
    const attackTypes = [
      { type: 'brute_force_login', severity: 'high' as const, quantum: false },
      { type: 'sql_injection', severity: 'critical' as const, quantum: true },
      { type: 'xss_attempt', severity: 'medium' as const, quantum: false },
      { type: 'quantum_key_attack', severity: 'critical' as const, quantum: true },
      { type: 'session_hijack', severity: 'high' as const, quantum: true },
      { type: 'ddos_attempt', severity: 'medium' as const, quantum: false },
      { type: 'privilege_escalation', severity: 'critical' as const, quantum: true }
    ];

    const randomAttack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
    const randomIp = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    
    await logSecurityAttack(
      randomAttack.type,
      randomIp,
      `/api/${randomAttack.type}`,
      randomAttack.severity,
      {
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        blocked_by: randomAttack.quantum ? 'quantum_defense' : 'standard_firewall'
      },
      randomAttack.quantum
    );
  };

  const getAttacksByType = (type: string): SecurityAttack[] => {
    return attacks.filter(attack => attack.attack_type === type);
  };

  const getAttacksByTimeRange = (hours: number): SecurityAttack[] => {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    
    return attacks.filter(attack => 
      new Date(attack.detected_at) >= cutoff
    );
  };

  const getQuantumProtectedAttacks = (): SecurityAttack[] => {
    return attacks.filter(attack => attack.quantum_protected);
  };

  const getAttackStats = () => {
    const last24h = getAttacksByTimeRange(24);
    const quantum = getQuantumProtectedAttacks();
    
    return {
      total: totalAttacks,
      last24h: last24h.length,
      blocked: attacks.filter(a => a.blocked).length,
      quantumProtected: quantum.length,
      critical: attacks.filter(a => a.severity === 'critical').length
    };
  };

  return {
    attacks,
    loading,
    totalAttacks,
    logSecurityAttack,
    simulateAttacks,
    getAttacksByType,
    getAttacksByTimeRange,
    getQuantumProtectedAttacks,
    getAttackStats,
    fetchAttacks
  };
}