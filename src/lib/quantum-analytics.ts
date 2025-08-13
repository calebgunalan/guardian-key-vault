import * as sodium from 'libsodium-wrappers';

/**
 * Quantum-Safe Behavioral Analytics and Risk Assessment
 * Analyzes user behavior patterns to detect anomalies and assess risk
 */

let sodiumReady = false;

async function ensureSodiumReady() {
  if (!sodiumReady) {
    await sodium.ready;
    sodiumReady = true;
  }
}

export interface BehavioralPattern {
  userId: string;
  patternType: 'login_times' | 'ip_locations' | 'device_usage' | 'access_patterns' | 'typing_patterns';
  patternData: Record<string, any>;
  confidenceScore: number;
  lastUpdated: Date;
}

export interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface RiskAssessment {
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: RiskFactor[];
  calculatedAt: Date;
  expiresAt: Date;
}

/**
 * Behavioral Pattern Analyzer
 * Uses machine learning techniques to identify user behavior patterns
 */
export class BehavioralAnalyzer {
  static analyzeLoginTimes(loginHistory: Date[]): BehavioralPattern {
    const hourCounts = new Array(24).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);

    loginHistory.forEach(date => {
      hourCounts[date.getHours()]++;
      dayOfWeekCounts[date.getDay()]++;
    });

    const preferredHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    const preferredDays = dayOfWeekCounts
      .map((count, day) => ({ day, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.day);

    const confidenceScore = Math.min(loginHistory.length / 50, 1.0);

    return {
      userId: '',
      patternType: 'login_times',
      patternData: {
        preferredHours,
        preferredDays,
        totalLogins: loginHistory.length,
        hourDistribution: hourCounts,
        dayDistribution: dayOfWeekCounts
      },
      confidenceScore,
      lastUpdated: new Date()
    };
  }

  static analyzeIPLocations(ipHistory: Array<{ ip: string; location: string; timestamp: Date }>): BehavioralPattern {
    const locationCounts = new Map<string, number>();
    const recentIPs = new Set<string>();

    ipHistory.forEach(entry => {
      locationCounts.set(entry.location, (locationCounts.get(entry.location) || 0) + 1);
      
      // Consider IPs from last 30 days as recent
      if (entry.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        recentIPs.add(entry.ip);
      }
    });

    const commonLocations = Array.from(locationCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    const confidenceScore = Math.min(ipHistory.length / 100, 1.0);

    return {
      userId: '',
      patternType: 'ip_locations',
      patternData: {
        commonLocations,
        recentIPCount: recentIPs.size,
        totalLocations: locationCounts.size,
        totalAccesses: ipHistory.length
      },
      confidenceScore,
      lastUpdated: new Date()
    };
  }

  static analyzeDeviceUsage(deviceHistory: Array<{ deviceId: string; userAgent: string; lastUsed: Date }>): BehavioralPattern {
    const deviceTypes = new Map<string, number>();
    const browsers = new Map<string, number>();
    const activeDays = new Map<string, Set<string>>();

    deviceHistory.forEach(device => {
      // Extract device type from user agent
      const deviceType = this.extractDeviceType(device.userAgent);
      const browser = this.extractBrowser(device.userAgent);
      
      deviceTypes.set(deviceType, (deviceTypes.get(deviceType) || 0) + 1);
      browsers.set(browser, (browsers.get(browser) || 0) + 1);
      
      const dateKey = device.lastUsed.toDateString();
      if (!activeDays.has(device.deviceId)) {
        activeDays.set(device.deviceId, new Set());
      }
      activeDays.get(device.deviceId)!.add(dateKey);
    });

    const mostUsedDevices = Array.from(activeDays.entries())
      .map(([deviceId, days]) => ({ deviceId, activeDays: days.size }))
      .sort((a, b) => b.activeDays - a.activeDays)
      .slice(0, 3);

    return {
      userId: '',
      patternType: 'device_usage',
      patternData: {
        deviceTypes: Object.fromEntries(deviceTypes),
        browsers: Object.fromEntries(browsers),
        mostUsedDevices,
        totalDevices: deviceHistory.length
      },
      confidenceScore: Math.min(deviceHistory.length / 20, 1.0),
      lastUpdated: new Date()
    };
  }

  private static extractDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
    if (/Tablet/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private static extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }
}

/**
 * Risk Assessment Engine
 * Calculates user risk scores based on behavioral patterns and external factors
 */
export class RiskAssessmentEngine {
  static async calculateRiskScore(
    userId: string,
    patterns: BehavioralPattern[],
    contextualFactors: Record<string, any>
  ): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];
    let totalScore = 0;

    // Analyze login time anomalies
    const loginPattern = patterns.find(p => p.patternType === 'login_times');
    if (loginPattern && contextualFactors.currentLoginHour !== undefined) {
      const currentHour = contextualFactors.currentLoginHour;
      const preferredHours = loginPattern.patternData.preferredHours || [];
      
      if (!preferredHours.includes(currentHour) && loginPattern.confidenceScore > 0.5) {
        riskFactors.push({
          type: 'unusual_login_time',
          severity: 'medium',
          description: `Login at unusual hour: ${currentHour}:00`,
          score: 25,
          metadata: { currentHour, preferredHours }
        });
        totalScore += 25;
      }
    }

    // Analyze location anomalies
    const locationPattern = patterns.find(p => p.patternType === 'ip_locations');
    if (locationPattern && contextualFactors.currentLocation) {
      const currentLocation = contextualFactors.currentLocation;
      const commonLocations = locationPattern.patternData.commonLocations || [];
      const isKnownLocation = commonLocations.some(loc => loc.location === currentLocation);
      
      if (!isKnownLocation && locationPattern.confidenceScore > 0.3) {
        riskFactors.push({
          type: 'new_location',
          severity: 'high',
          description: `Login from new location: ${currentLocation}`,
          score: 40,
          metadata: { currentLocation, commonLocations }
        });
        totalScore += 40;
      }
    }

    // Analyze device anomalies
    const devicePattern = patterns.find(p => p.patternType === 'device_usage');
    if (devicePattern && contextualFactors.deviceFingerprint) {
      const knownDevices = devicePattern.patternData.mostUsedDevices || [];
      const isKnownDevice = knownDevices.some(d => d.deviceId === contextualFactors.deviceFingerprint);
      
      if (!isKnownDevice) {
        riskFactors.push({
          type: 'new_device',
          severity: 'high',
          description: 'Login from unrecognized device',
          score: 35,
          metadata: { deviceFingerprint: contextualFactors.deviceFingerprint }
        });
        totalScore += 35;
      }
    }

    // Check for rapid successive logins
    if (contextualFactors.recentLoginAttempts > 5) {
      riskFactors.push({
        type: 'rapid_login_attempts',
        severity: 'critical',
        description: `${contextualFactors.recentLoginAttempts} login attempts in short period`,
        score: 50,
        metadata: { attempts: contextualFactors.recentLoginAttempts }
      });
      totalScore += 50;
    }

    // Check for failed authentication attempts
    if (contextualFactors.failedAttempts > 3) {
      riskFactors.push({
        type: 'multiple_failed_attempts',
        severity: 'high',
        description: `${contextualFactors.failedAttempts} failed authentication attempts`,
        score: 30,
        metadata: { failedAttempts: contextualFactors.failedAttempts }
      });
      totalScore += 30;
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (totalScore >= 80) riskLevel = 'critical';
    else if (totalScore >= 50) riskLevel = 'high';
    else if (totalScore >= 25) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      userId,
      riskLevel,
      riskScore: Math.min(totalScore, 100),
      riskFactors,
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  static shouldRequireAdditionalAuth(riskAssessment: RiskAssessment): boolean {
    return riskAssessment.riskScore >= 30 || riskAssessment.riskLevel === 'high' || riskAssessment.riskLevel === 'critical';
  }

  static shouldBlockAccess(riskAssessment: RiskAssessment): boolean {
    return riskAssessment.riskScore >= 80 || riskAssessment.riskLevel === 'critical';
  }
}

/**
 * Quantum Attack Detection System
 * Monitors for potential quantum computing attacks
 */
export class QuantumAttackDetector {
  static async detectShorAlgorithmAttack(
    publicKeyOperations: Array<{ timestamp: Date; keySize: number; operation: string }>
  ): Promise<{ detected: boolean; confidence: number; evidence: string[] }> {
    await ensureSodiumReady();
    
    const evidence: string[] = [];
    let confidence = 0;

    // Look for patterns indicating Shor's algorithm usage
    const recentOps = publicKeyOperations.filter(
      op => op.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    // Unusual frequency of public key operations
    if (recentOps.length > 100) {
      evidence.push(`High frequency of public key operations: ${recentOps.length} in last hour`);
      confidence += 0.3;
    }

    // Pattern of increasing key sizes (factorization attempts)
    const keySizes = recentOps.map(op => op.keySize).sort((a, b) => a - b);
    if (keySizes.length > 10) {
      const isIncreasing = keySizes.every((size, i) => i === 0 || size >= keySizes[i - 1]);
      if (isIncreasing) {
        evidence.push('Systematic testing of increasing key sizes detected');
        confidence += 0.4;
      }
    }

    // Rapid RSA key generation (preparation for factorization)
    const rsaOps = recentOps.filter(op => op.operation.includes('RSA'));
    if (rsaOps.length > 50) {
      evidence.push(`Excessive RSA operations: ${rsaOps.length}`);
      confidence += 0.3;
    }

    return {
      detected: confidence >= 0.5,
      confidence,
      evidence
    };
  }

  static async detectGroverAttack(
    symmetricKeyOperations: Array<{ timestamp: Date; keyLength: number; attempts: number }>
  ): Promise<{ detected: boolean; confidence: number; evidence: string[] }> {
    const evidence: string[] = [];
    let confidence = 0;

    const recentOps = symmetricKeyOperations.filter(
      op => op.timestamp > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
    );

    // Massive number of brute force attempts (Grover's algorithm pattern)
    const totalAttempts = recentOps.reduce((sum, op) => sum + op.attempts, 0);
    if (totalAttempts > 10000) {
      evidence.push(`Massive brute force attempts: ${totalAttempts}`);
      confidence += 0.4;
    }

    // Systematic search pattern (square root speedup indicator)
    if (recentOps.length > 20) {
      const attemptPattern = recentOps.map(op => op.attempts);
      const avgAttempts = attemptPattern.reduce((a, b) => a + b) / attemptPattern.length;
      const variance = attemptPattern.reduce((sum, attempts) => sum + Math.pow(attempts - avgAttempts, 2), 0) / attemptPattern.length;
      
      // Low variance in attempt counts suggests systematic approach
      if (variance < avgAttempts * 0.1) {
        evidence.push('Systematic search pattern detected (low variance in attempts)');
        confidence += 0.3;
      }
    }

    return {
      detected: confidence >= 0.5,
      confidence,
      evidence
    };
  }

  static async detectPostQuantumDowngradeAttack(
    negotiationHistory: Array<{ timestamp: Date; proposedAlgorithms: string[]; selectedAlgorithm: string }>
  ): Promise<{ detected: boolean; confidence: number; evidence: string[] }> {
    const evidence: string[] = [];
    let confidence = 0;

    const recentNegotiations = negotiationHistory.filter(
      neg => neg.timestamp > new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
    );

    // Check for attempts to downgrade to classical algorithms
    const classicalAlgorithms = ['RSA', 'ECDSA', 'DH', 'ECDH'];
    const downgradeAttempts = recentNegotiations.filter(neg =>
      neg.proposedAlgorithms.some(alg => classicalAlgorithms.includes(alg)) &&
      !neg.proposedAlgorithms.some(alg => alg.startsWith('ML-') || alg.includes('Kyber') || alg.includes('Dilithium'))
    );

    if (downgradeAttempts.length > 5) {
      evidence.push(`Multiple downgrade attempts to classical algorithms: ${downgradeAttempts.length}`);
      confidence += 0.5;
    }

    // Check for forced selection of weak algorithms
    const weakSelections = recentNegotiations.filter(neg =>
      classicalAlgorithms.includes(neg.selectedAlgorithm)
    );

    if (weakSelections.length > 3) {
      evidence.push(`Forced selection of classical algorithms: ${weakSelections.length} times`);
      confidence += 0.4;
    }

    return {
      detected: confidence >= 0.6,
      confidence,
      evidence
    };
  }
}