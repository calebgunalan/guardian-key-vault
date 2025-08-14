import { ensureSodiumReady } from './quantum-crypto';
import * as sodium from 'libsodium-wrappers';

export interface ThreatIndicator {
  id: string;
  threat_type: 'credential_stuffing' | 'account_takeover' | 'insider_threat' | 'apt' | 'brute_force' | 'lateral_movement';
  indicator_type: 'ip' | 'user_agent' | 'behavioral_pattern' | 'device_fingerprint' | 'timing_pattern';
  indicator_value: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number; // 0-1
  source: 'internal' | 'external_feed' | 'ml_detection' | 'manual' | 'honeypot';
  first_seen: string;
  last_seen: string;
  metadata: Record<string, any>;
  is_active: boolean;
}

export interface ThreatAnalysisResult {
  overall_risk: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number; // 0-100
  detected_threats: ThreatMatch[];
  behavioral_anomalies: BehavioralAnomaly[];
  recommendations: ThreatRecommendation[];
  requires_immediate_action: boolean;
}

export interface ThreatMatch {
  indicator: ThreatIndicator;
  match_confidence: number;
  context: Record<string, any>;
  severity_adjusted: 'low' | 'medium' | 'high' | 'critical';
}

export interface BehavioralAnomaly {
  anomaly_type: 'login_time' | 'location' | 'device' | 'access_pattern' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  baseline_data: Record<string, any>;
  current_data: Record<string, any>;
  deviation_score: number;
}

export interface ThreatRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  action_type: 'monitor' | 'investigate' | 'block' | 'escalate' | 'quarantine';
  description: string;
  automated_response?: string;
  estimated_impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface AttackPattern {
  pattern_id: string;
  name: string;
  description: string;
  tactics: string[]; // MITRE ATT&CK tactics
  techniques: string[]; // MITRE ATT&CK techniques
  indicators: string[];
  detection_rules: DetectionRule[];
}

export interface DetectionRule {
  rule_id: string;
  name: string;
  logic: string; // Detection logic expression
  severity: 'low' | 'medium' | 'high' | 'critical';
  false_positive_rate: number;
  effectiveness_score: number;
}

export class ThreatIntelligenceEngine {
  private static commonAttackPatterns: AttackPattern[] = [
    {
      pattern_id: 'credential_stuffing',
      name: 'Credential Stuffing Attack',
      description: 'Automated injection of breached username/password pairs',
      tactics: ['Initial Access'],
      techniques: ['T1110.004'],
      indicators: ['high_velocity_login_attempts', 'multiple_user_agents', 'distributed_ips'],
      detection_rules: [
        {
          rule_id: 'cs_001',
          name: 'High velocity login attempts',
          logic: 'login_attempts > 100 AND time_window < 300',
          severity: 'high',
          false_positive_rate: 0.05,
          effectiveness_score: 0.85
        }
      ]
    },
    {
      pattern_id: 'account_takeover',
      name: 'Account Takeover',
      description: 'Successful compromise of user account credentials',
      tactics: ['Initial Access', 'Persistence'],
      techniques: ['T1110', 'T1078'],
      indicators: ['location_anomaly', 'device_anomaly', 'privilege_escalation'],
      detection_rules: [
        {
          rule_id: 'ato_001',
          name: 'Impossible travel detection',
          logic: 'time_between_logins < travel_time AND distance > 500km',
          severity: 'critical',
          false_positive_rate: 0.02,
          effectiveness_score: 0.95
        }
      ]
    }
  ];

  static async analyzeLoginAttempt(loginData: {
    userId?: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
    location?: { country: string; city: string; lat: number; lng: number };
    deviceFingerprint?: string;
    success: boolean;
  }): Promise<ThreatAnalysisResult> {
    const detectedThreats: ThreatMatch[] = [];
    const behavioralAnomalies: BehavioralAnomaly[] = [];
    const recommendations: ThreatRecommendation[] = [];

    // Analyze IP reputation
    const ipThreat = await this.analyzeIPAddress(loginData.ipAddress);
    if (ipThreat) {
      detectedThreats.push(ipThreat);
    }

    // Analyze user agent patterns
    const uaThreat = await this.analyzeUserAgent(loginData.userAgent);
    if (uaThreat) {
      detectedThreats.push(uaThreat);
    }

    // Analyze location anomalies
    if (loginData.location && loginData.userId) {
      const locationAnomaly = await this.detectLocationAnomaly(loginData.userId, loginData.location, loginData.timestamp);
      if (locationAnomaly) {
        behavioralAnomalies.push(locationAnomaly);
      }
    }

    // Analyze timing patterns
    const timingAnomaly = await this.detectTimingAnomaly(loginData.userId, loginData.timestamp);
    if (timingAnomaly) {
      behavioralAnomalies.push(timingAnomaly);
    }

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(detectedThreats, behavioralAnomalies);
    const overallRisk = this.categorizeRisk(riskScore);

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(detectedThreats, behavioralAnomalies, overallRisk));

    const requiresImmediateAction = (
      overallRisk === 'critical' ||
      detectedThreats.some(t => t.severity_adjusted === 'critical') ||
      behavioralAnomalies.some(a => a.severity === 'critical')
    );

    return {
      overall_risk: overallRisk,
      risk_score: riskScore,
      detected_threats: detectedThreats,
      behavioral_anomalies: behavioralAnomalies,
      recommendations,
      requires_immediate_action: requiresImmediateAction
    };
  }

  private static async analyzeIPAddress(ipAddress: string): Promise<ThreatMatch | null> {
    // Simulate IP reputation analysis
    // In production, this would query threat intelligence feeds
    
    const suspiciousIPs = [
      '192.168.1.100', // Example suspicious IP
      '10.0.0.50'
    ];
    
    const maliciousRanges = [
      '185.220.', // Tor exit nodes example
      '91.134.'   // VPN/proxy range example
    ];
    
    // Check direct IP matches
    if (suspiciousIPs.includes(ipAddress)) {
      return {
        indicator: {
          id: `ip_${ipAddress}`,
          threat_type: 'credential_stuffing',
          indicator_type: 'ip',
          indicator_value: ipAddress,
          threat_level: 'high',
          confidence_score: 0.9,
          source: 'external_feed',
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          metadata: { reputation: 'malicious', category: 'botnet' },
          is_active: true
        },
        match_confidence: 0.9,
        context: { source: 'known_bad_ip_list' },
        severity_adjusted: 'high'
      };
    }
    
    // Check IP ranges
    const isSuspiciousRange = maliciousRanges.some(range => ipAddress.startsWith(range));
    if (isSuspiciousRange) {
      return {
        indicator: {
          id: `ip_range_${ipAddress}`,
          threat_type: 'account_takeover',
          indicator_type: 'ip',
          indicator_value: ipAddress,
          threat_level: 'medium',
          confidence_score: 0.6,
          source: 'external_feed',
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          metadata: { reputation: 'suspicious', category: 'proxy' },
          is_active: true
        },
        match_confidence: 0.6,
        context: { source: 'suspicious_ip_range' },
        severity_adjusted: 'medium'
      };
    }
    
    return null;
  }

  private static async analyzeUserAgent(userAgent: string): Promise<ThreatMatch | null> {
    // Detect automated/suspicious user agents
    const suspiciousPatterns = [
      /curl\/\d+\.\d+/i,
      /wget\/\d+\.\d+/i,
      /python-requests/i,
      /bot|crawler|spider/i,
      /^$/  // Empty user agent
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious) {
      return {
        indicator: {
          id: `ua_${Buffer.from(userAgent).toString('base64')}`,
          threat_type: 'credential_stuffing',
          indicator_type: 'user_agent',
          indicator_value: userAgent,
          threat_level: 'medium',
          confidence_score: 0.7,
          source: 'ml_detection',
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          metadata: { category: 'automated_tool' },
          is_active: true
        },
        match_confidence: 0.7,
        context: { pattern_matched: suspiciousPatterns.find(p => p.test(userAgent))?.toString() },
        severity_adjusted: 'medium'
      };
    }
    
    return null;
  }

  private static async detectLocationAnomaly(
    userId: string, 
    currentLocation: { country: string; city: string; lat: number; lng: number },
    timestamp: string
  ): Promise<BehavioralAnomaly | null> {
    // Simulate historical location data
    const historicalLocations = [
      { country: 'US', city: 'New York', lat: 40.7128, lng: -74.0060, timestamp: '2024-01-10T10:00:00Z' },
      { country: 'US', city: 'San Francisco', lat: 37.7749, lng: -122.4194, timestamp: '2024-01-11T14:00:00Z' }
    ];
    
    if (historicalLocations.length === 0) {
      return null; // No baseline to compare against
    }
    
    // Find the most recent location
    const lastLocation = historicalLocations.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    
    // Calculate distance between locations
    const distance = this.calculateDistance(
      lastLocation.lat, lastLocation.lng,
      currentLocation.lat, currentLocation.lng
    );
    
    // Calculate time difference
    const timeDiff = new Date(timestamp).getTime() - new Date(lastLocation.timestamp).getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // Check for impossible travel (distance > what's possible in time)
    const maxSpeed = 1000; // km/h (commercial aircraft speed)
    const possibleDistance = maxSpeed * hoursDiff;
    
    if (distance > possibleDistance && hoursDiff < 24) {
      const severity: 'low' | 'medium' | 'high' | 'critical' = distance > possibleDistance * 2 ? 'critical' : 'high';
      
      return {
        anomaly_type: 'location',
        severity,
        description: `Impossible travel detected: ${distance.toFixed(0)}km in ${hoursDiff.toFixed(1)} hours`,
        confidence: Math.min(distance / possibleDistance, 1.0),
        baseline_data: {
          last_location: lastLocation,
          typical_locations: historicalLocations.slice(0, 5)
        },
        current_data: {
          location: currentLocation,
          distance_km: distance,
          time_hours: hoursDiff
        },
        deviation_score: distance / possibleDistance
      };
    }
    
    return null;
  }

  private static async detectTimingAnomaly(userId: string | undefined, timestamp: string): Promise<BehavioralAnomaly | null> {
    if (!userId) return null;
    
    // Simulate historical login times
    const historicalLogins = [
      '2024-01-10T09:15:00Z',
      '2024-01-11T08:45:00Z',
      '2024-01-12T09:30:00Z'
    ];
    
    if (historicalLogins.length < 3) {
      return null; // Need sufficient history
    }
    
    // Calculate typical login hours
    const loginHours = historicalLogins.map(login => new Date(login).getHours());
    const avgHour = loginHours.reduce((sum, hour) => sum + hour, 0) / loginHours.length;
    const currentHour = new Date(timestamp).getHours();
    
    const hourDifference = Math.abs(currentHour - avgHour);
    const minDifference = Math.min(hourDifference, 24 - hourDifference); // Account for day wrap-around
    
    if (minDifference > 6) { // More than 6 hours from typical time
      const severity: 'low' | 'medium' | 'high' | 'critical' = minDifference > 12 ? 'high' : 'medium';
      
      return {
        anomaly_type: 'login_time',
        severity,
        description: `Login at unusual time: ${currentHour}:00 (typical: ${avgHour.toFixed(0)}:00)`,
        confidence: Math.min(minDifference / 12, 1.0),
        baseline_data: {
          typical_hours: loginHours,
          average_hour: avgHour
        },
        current_data: {
          login_hour: currentHour,
          hour_deviation: minDifference
        },
        deviation_score: minDifference / 12
      };
    }
    
    return null;
  }

  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static calculateRiskScore(threats: ThreatMatch[], anomalies: BehavioralAnomaly[]): number {
    let score = 0;
    
    // Score from threats
    threats.forEach(threat => {
      const baseScore = {
        low: 10,
        medium: 25,
        high: 50,
        critical: 80
      }[threat.severity_adjusted];
      
      score += baseScore * threat.match_confidence;
    });
    
    // Score from behavioral anomalies
    anomalies.forEach(anomaly => {
      const baseScore = {
        low: 5,
        medium: 15,
        high: 35,
        critical: 60
      }[anomaly.severity];
      
      score += baseScore * anomaly.confidence;
    });
    
    return Math.min(score, 100);
  }

  private static categorizeRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  private static generateRecommendations(
    threats: ThreatMatch[], 
    anomalies: BehavioralAnomaly[], 
    overallRisk: 'low' | 'medium' | 'high' | 'critical'
  ): ThreatRecommendation[] {
    const recommendations: ThreatRecommendation[] = [];
    
    // Recommendations based on overall risk
    switch (overallRisk) {
      case 'critical':
        recommendations.push({
          priority: 'critical',
          action_type: 'block',
          description: 'Block access immediately and require admin review',
          automated_response: 'block_user_session',
          estimated_impact: 'high'
        });
        break;
      case 'high':
        recommendations.push({
          priority: 'high',
          action_type: 'escalate',
          description: 'Require additional authentication and notify security team',
          automated_response: 'require_mfa',
          estimated_impact: 'medium'
        });
        break;
      case 'medium':
        recommendations.push({
          priority: 'medium',
          action_type: 'monitor',
          description: 'Enhanced monitoring and logging for this user',
          automated_response: 'increase_monitoring',
          estimated_impact: 'low'
        });
        break;
    }
    
    // Specific recommendations for threats
    threats.forEach(threat => {
      if (threat.indicator.threat_type === 'credential_stuffing') {
        recommendations.push({
          priority: 'high',
          action_type: 'investigate',
          description: 'Investigate potential credential stuffing attack',
          estimated_impact: 'medium'
        });
      }
    });
    
    // Specific recommendations for anomalies
    anomalies.forEach(anomaly => {
      if (anomaly.anomaly_type === 'location' && anomaly.severity === 'critical') {
        recommendations.push({
          priority: 'critical',
          action_type: 'quarantine',
          description: 'Quarantine session due to impossible travel detection',
          automated_response: 'quarantine_session',
          estimated_impact: 'high'
        });
      }
    });
    
    return recommendations;
  }

  static async enrichThreatIndicator(indicator: ThreatIndicator): Promise<ThreatIndicator> {
    // Simulate threat intelligence enrichment
    const enrichedMetadata = { ...indicator.metadata };
    
    switch (indicator.indicator_type) {
      case 'ip':
        // Enrich with geolocation, ASN, etc.
        enrichedMetadata.geolocation = {
          country: 'Unknown',
          region: 'Unknown',
          city: 'Unknown'
        };
        enrichedMetadata.asn = {
          number: 'AS0000',
          name: 'Unknown ASN'
        };
        break;
      case 'user_agent':
        // Parse user agent details
        enrichedMetadata.parsed = {
          browser: 'Unknown',
          os: 'Unknown',
          device: 'Unknown'
        };
        break;
    }
    
    return {
      ...indicator,
      metadata: enrichedMetadata
    };
  }
}