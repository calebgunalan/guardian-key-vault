import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface TrustScoreFactor {
  id: string;
  user_id: string;
  factor_name: string;
  factor_type: string;
  score: number;
  weight: number;
  details: Record<string, any>;
  calculated_at: string;
}

export interface LocationData {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  is_vpn: boolean;
}

export interface NetworkTrustData {
  location: LocationData;
  networkScore: number;
  locationScore: number;
}

export function useTrustScore() {
  const { user } = useAuth();
  const [trustFactors, setTrustFactors] = useState<TrustScoreFactor[]>([]);
  const [networkTrust, setNetworkTrust] = useState<NetworkTrustData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTrustFactors();
      calculateCurrentTrustScore();
    }
  }, [user]);

  const fetchTrustFactors = async () => {
    try {
      const { data, error } = await supabase
        .from('trust_score_factors')
        .select('*')
        .eq('user_id', user?.id)
        .order('calculated_at', { ascending: false });

      if (error) throw error;
      setTrustFactors((data || []).map(factor => ({
        ...factor,
        details: factor.details as Record<string, any>
      })));
    } catch (error) {
      console.error('Error fetching trust factors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Try to get location info from IP-based service
            const response = await fetch('https://ipapi.co/json/');
            const ipData = await response.json();
            
            resolve({
              country: ipData.country_name || 'Unknown',
              city: ipData.city || 'Unknown',
              latitude: latitude,
              longitude: longitude,
              is_vpn: ipData.org?.toLowerCase().includes('vpn') || false
            });
          } catch (error) {
            // Fallback if IP service fails
            resolve({
              country: 'Unknown',
              city: 'Unknown', 
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              is_vpn: false
            });
          }
        },
        (error) => {
          // If geolocation fails, try IP-based location only
          fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
              resolve({
                country: data.country_name || 'Unknown',
                city: data.city || 'Unknown',
                latitude: data.latitude || 0,
                longitude: data.longitude || 0,
                is_vpn: data.org?.toLowerCase().includes('vpn') || false
              });
            })
            .catch(() => {
              resolve({
                country: 'Unknown',
                city: 'Unknown',
                latitude: 0,
                longitude: 0,
                is_vpn: false
              });
            });
        },
        { timeout: 10000 }
      );
    });
  };

  const calculateNetworkTrust = async (location: LocationData): Promise<number> => {
    let score = 50; // Base score

    // Location trust factors
    if (location.country !== 'Unknown') score += 20;
    if (location.city !== 'Unknown') score += 10;
    
    // VPN detection
    if (location.is_vpn) {
      score -= 15; // VPN usage reduces trust slightly
    }

    // Check against threat intelligence
    const knownGoodCountries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'Japan'];
    const knownRiskyCountries = ['Unknown', 'Anonymous'];
    
    if (knownGoodCountries.includes(location.country)) {
      score += 15;
    } else if (knownRiskyCountries.includes(location.country)) {
      score -= 25;
    }

    return Math.max(0, Math.min(100, score));
  };

  const calculateLocationTrust = (location: LocationData): number => {
    let score = 30; // Base score for any location

    if (location.country !== 'Unknown') score += 30;
    if (location.city !== 'Unknown') score += 20;
    if (location.latitude !== 0 && location.longitude !== 0) score += 20;

    return Math.max(0, Math.min(100, score));
  };

  const calculateCurrentTrustScore = async () => {
    try {
      const location = await getUserLocation();
      const networkScore = await calculateNetworkTrust(location);
      const locationScore = calculateLocationTrust(location);

      setNetworkTrust({
        location,
        networkScore,
        locationScore
      });

      // Store trust factors in database
      const factors = [
        {
          user_id: user?.id,
          factor_name: 'Network Security',
          factor_type: 'network',
          score: networkScore,
          weight: 0.3,
          details: { 
            ip_location: location,
            network_type: location.is_vpn ? 'VPN' : 'Direct'
          }
        },
        {
          user_id: user?.id,
          factor_name: 'Location Trust',
          factor_type: 'location',
          score: locationScore,
          weight: 0.25,
          details: {
            country: location.country,
            city: location.city,
            coordinates: { lat: location.latitude, lng: location.longitude }
          }
        },
        {
          user_id: user?.id,
          factor_name: 'Device Trust',
          factor_type: 'device',
          score: 85, // Base device trust
          weight: 0.25,
          details: {
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            managed: false
          }
        },
        {
          user_id: user?.id,
          factor_name: 'Behavioral Analysis',
          factor_type: 'behavioral',
          score: 75, // Base behavioral score
          weight: 0.2,
          details: {
            login_pattern: 'normal',
            access_time: new Date().getHours()
          }
        }
      ];

      // Insert trust factors
      const { error } = await supabase
        .from('trust_score_factors')
        .insert(factors.map(factor => ({
          ...factor,
          details: factor.details as any
        })));

      if (error) throw error;
      
      await fetchTrustFactors();
    } catch (error) {
      console.error('Error calculating trust score:', error);
      // Set fallback data
      setNetworkTrust({
        location: {
          country: 'Unknown',
          city: 'Unknown',
          latitude: 0,
          longitude: 0,
          is_vpn: false
        },
        networkScore: 50,
        locationScore: 25
      });
    }
  };

  const getOverallTrustScore = (): number => {
    if (trustFactors.length === 0) return 0;

    const totalWeight = trustFactors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedScore = trustFactors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  };

  const getTrustScoreByType = (type: string): number => {
    const factor = trustFactors.find(f => f.factor_type === type);
    return factor ? Math.round(factor.score) : 0;
  };

  const refreshTrustScore = async () => {
    setLoading(true);
    await calculateCurrentTrustScore();
    setLoading(false);
  };

  return {
    trustFactors,
    networkTrust,
    loading,
    getOverallTrustScore,
    getTrustScoreByType,
    refreshTrustScore,
    calculateCurrentTrustScore
  };
}