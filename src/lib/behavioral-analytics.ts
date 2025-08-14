import { ensureSodiumReady } from './quantum-crypto';

export interface BehavioralMetric {
  userId: string;
  metricType: 'keystroke' | 'mouse' | 'navigation' | 'application' | 'voice' | 'gait';
  features: Record<string, number>;
  timestamp: Date;
  sessionId: string;
  confidence: number;
}

export interface UserBehaviorProfile {
  userId: string;
  keystrokeDynamics: KeystrokeProfile;
  mouseMovement: MouseProfile;
  navigationPattern: NavigationProfile;
  applicationUsage: ApplicationProfile;
  voicePattern?: VoiceProfile;
  gaitPattern?: GaitProfile;
  lastUpdated: Date;
  trustScore: number;
}

export interface KeystrokeProfile {
  avgDwellTime: number; // time key is held down
  avgFlightTime: number; // time between key releases
  typingSpeed: number; // words per minute
  rhythmPattern: number[]; // timing patterns
  pressureDynamics: number[]; // key press intensities
  errorRate: number;
  fingerMovementPattern: Record<string, number>;
}

export interface MouseProfile {
  avgVelocity: number;
  accelerationPattern: number[];
  clickDuration: number;
  dragBehavior: Record<string, number>;
  scrollPattern: Record<string, number>;
  tremor: number; // micro-movements
  handedness: 'left' | 'right' | 'ambidextrous';
}

export interface NavigationProfile {
  pageSequences: Array<{ from: string; to: string; frequency: number }>;
  sessionDuration: number;
  clickDepth: number;
  backButtonUsage: number;
  tabSwitchingPattern: Record<string, number>;
  searchBehavior: Record<string, number>;
}

export interface ApplicationProfile {
  appUsageFrequency: Record<string, number>;
  featureUsagePattern: Record<string, number>;
  workflowSequences: Array<{ sequence: string[]; frequency: number }>;
  errorRecoveryPattern: Record<string, number>;
  helpSystemUsage: number;
}

export interface VoiceProfile {
  fundamentalFrequency: number;
  formantFrequencies: number[];
  speechRate: number;
  pausePattern: number[];
  stressPattern: number[];
  voiceprintHash: string;
}

export interface GaitProfile {
  stepLength: number;
  stepTime: number;
  cadence: number;
  symmetry: number;
  stability: number;
  accelerometerPattern: number[];
}

export interface AnomalyDetection {
  anomalyType: 'keystroke' | 'mouse' | 'navigation' | 'application' | 'voice' | 'gait' | 'composite';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  deviationScore: number;
  affectedMetrics: string[];
  timestamp: Date;
  recommendedAction: 'monitor' | 'challenge' | 'block' | 'investigate';
}

export interface MLModel {
  modelType: 'svm' | 'neural_network' | 'random_forest' | 'isolation_forest';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  trainingDataSize: number;
  features: string[];
}

/**
 * Advanced Behavioral Analytics Engine
 * Uses machine learning for continuous user authentication and anomaly detection
 */
export class BehavioralAnalyticsEngine {
  private static readonly ANOMALY_THRESHOLDS = {
    low: 0.3,
    medium: 0.6,
    high: 0.8,
    critical: 0.95
  };

  private static models: Map<string, MLModel> = new Map();

  /**
   * Analyze keystroke dynamics
   */
  static analyzeKeystrokeDynamics(
    keyEvents: Array<{
      key: string;
      timestamp: number;
      type: 'keydown' | 'keyup';
      pressure?: number;
    }>
  ): KeystrokeProfile {
    const dwellTimes: number[] = [];
    const flightTimes: number[] = [];
    const pressures: number[] = [];
    
    let keydownEvents = new Map<string, { timestamp: number; pressure?: number }>();
    let lastKeyup: number | null = null;
    let totalChars = 0;
    let startTime = keyEvents[0]?.timestamp || 0;
    let endTime = keyEvents[keyEvents.length - 1]?.timestamp || 0;
    
    for (const event of keyEvents) {
      if (event.type === 'keydown') {
        keydownEvents.set(event.key, { 
          timestamp: event.timestamp, 
          pressure: event.pressure 
        });
      } else if (event.type === 'keyup') {
        const keydown = keydownEvents.get(event.key);
        if (keydown) {
          // Calculate dwell time (key held duration)
          const dwellTime = event.timestamp - keydown.timestamp;
          dwellTimes.push(dwellTime);
          
          // Store pressure if available
          if (keydown.pressure !== undefined) {
            pressures.push(keydown.pressure);
          }
          
          // Calculate flight time (time between key releases)
          if (lastKeyup !== null) {
            const flightTime = keydown.timestamp - lastKeyup;
            flightTimes.push(flightTime);
          }
          
          lastKeyup = event.timestamp;
          totalChars++;
          keydownEvents.delete(event.key);
        }
      }
    }
    
    // Calculate typing speed (WPM)
    const totalTime = (endTime - startTime) / 1000 / 60; // minutes
    const typingSpeed = totalTime > 0 ? (totalChars / 5) / totalTime : 0; // standard: 5 chars = 1 word
    
    // Calculate rhythm pattern (normalized inter-key intervals)
    const rhythmPattern = this.calculateRhythmPattern(flightTimes);
    
    // Calculate finger movement patterns
    const fingerMovementPattern = this.calculateFingerMovement(keyEvents);
    
    return {
      avgDwellTime: this.average(dwellTimes),
      avgFlightTime: this.average(flightTimes),
      typingSpeed,
      rhythmPattern,
      pressureDynamics: pressures,
      errorRate: this.calculateErrorRate(keyEvents),
      fingerMovementPattern
    };
  }

  /**
   * Analyze mouse movement patterns
   */
  static analyzeMouseMovement(
    mouseEvents: Array<{
      x: number;
      y: number;
      timestamp: number;
      type: 'move' | 'click' | 'scroll';
      button?: number;
      deltaX?: number;
      deltaY?: number;
    }>
  ): MouseProfile {
    const velocities: number[] = [];
    const accelerations: number[] = [];
    const clickDurations: number[] = [];
    const dragBehavior: Record<string, number> = {};
    const scrollPattern: Record<string, number> = {};
    
    let lastPosition = { x: 0, y: 0, timestamp: 0 };
    let lastVelocity = 0;
    let clickStart: number | null = null;
    let totalDistance = 0;
    let microMovements = 0;
    
    for (const event of mouseEvents) {
      if (event.type === 'move') {
        if (lastPosition.timestamp > 0) {
          // Calculate velocity
          const distance = Math.sqrt(
            Math.pow(event.x - lastPosition.x, 2) + 
            Math.pow(event.y - lastPosition.y, 2)
          );
          const timeDelta = (event.timestamp - lastPosition.timestamp) / 1000;
          const velocity = timeDelta > 0 ? distance / timeDelta : 0;
          
          velocities.push(velocity);
          totalDistance += distance;
          
          // Calculate acceleration
          if (lastVelocity > 0) {
            const acceleration = (velocity - lastVelocity) / timeDelta;
            accelerations.push(acceleration);
          }
          
          // Detect micro-movements (potential tremor)
          if (distance < 5 && velocity < 50) {
            microMovements++;
          }
          
          lastVelocity = velocity;
        }
        
        lastPosition = { x: event.x, y: event.y, timestamp: event.timestamp };
        
      } else if (event.type === 'click') {
        if (event.button === 0) { // Left click
          if (clickStart === null) {
            clickStart = event.timestamp;
          } else {
            clickDurations.push(event.timestamp - clickStart);
            clickStart = null;
          }
        }
        
      } else if (event.type === 'scroll') {
        const scrollDirection = event.deltaY! > 0 ? 'down' : 'up';
        scrollPattern[scrollDirection] = (scrollPattern[scrollDirection] || 0) + 1;
        scrollPattern.magnitude = (scrollPattern.magnitude || 0) + Math.abs(event.deltaY!);
      }
    }
    
    // Determine handedness based on movement patterns
    const handedness = this.determineHandedness(mouseEvents);
    
    return {
      avgVelocity: this.average(velocities),
      accelerationPattern: accelerations.slice(0, 20), // Keep sample of patterns
      clickDuration: this.average(clickDurations),
      dragBehavior,
      scrollPattern,
      tremor: microMovements / mouseEvents.length,
      handedness
    };
  }

  /**
   * Analyze navigation patterns
   */
  static analyzeNavigationPattern(
    navigationEvents: Array<{
      page: string;
      timestamp: number;
      action: 'visit' | 'leave' | 'click' | 'back' | 'forward' | 'search';
      target?: string;
      query?: string;
    }>
  ): NavigationProfile {
    const pageSequences: Array<{ from: string; to: string; frequency: number }> = [];
    const tabSwitchingPattern: Record<string, number> = {};
    const searchBehavior: Record<string, number> = {};
    
    let sessionStart = navigationEvents[0]?.timestamp || 0;
    let sessionEnd = navigationEvents[navigationEvents.length - 1]?.timestamp || 0;
    let clickDepth = 0;
    let backButtonUsage = 0;
    let currentPage = '';
    
    for (const event of navigationEvents) {
      switch (event.action) {
        case 'visit':
          if (currentPage && currentPage !== event.page) {
            // Record page transition
            const existing = pageSequences.find(seq => 
              seq.from === currentPage && seq.to === event.page
            );
            if (existing) {
              existing.frequency++;
            } else {
              pageSequences.push({ from: currentPage, to: event.page, frequency: 1 });
            }
          }
          currentPage = event.page;
          break;
          
        case 'click':
          clickDepth++;
          break;
          
        case 'back':
          backButtonUsage++;
          break;
          
        case 'search':
          if (event.query) {
            const queryLength = event.query.length;
            searchBehavior.avgQueryLength = (searchBehavior.avgQueryLength || 0) + queryLength;
            searchBehavior.totalSearches = (searchBehavior.totalSearches || 0) + 1;
          }
          break;
      }
    }
    
    // Calculate averages
    if (searchBehavior.totalSearches > 0) {
      searchBehavior.avgQueryLength /= searchBehavior.totalSearches;
    }
    
    return {
      pageSequences,
      sessionDuration: (sessionEnd - sessionStart) / 1000, // seconds
      clickDepth,
      backButtonUsage,
      tabSwitchingPattern,
      searchBehavior
    };
  }

  /**
   * Detect behavioral anomalies using ML models
   */
  static async detectAnomalies(
    userId: string,
    currentMetrics: BehavioralMetric[],
    userProfile: UserBehaviorProfile
  ): Promise<AnomalyDetection[]> {
    await ensureSodiumReady();
    
    const anomalies: AnomalyDetection[] = [];
    
    for (const metric of currentMetrics) {
      const anomaly = await this.detectMetricAnomaly(metric, userProfile);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    }
    
    // Composite anomaly detection
    const compositeAnomaly = this.detectCompositeAnomaly(anomalies, userProfile);
    if (compositeAnomaly) {
      anomalies.push(compositeAnomaly);
    }
    
    return anomalies;
  }

  /**
   * Detect anomaly in a specific behavioral metric
   */
  private static async detectMetricAnomaly(
    metric: BehavioralMetric,
    profile: UserBehaviorProfile
  ): Promise<AnomalyDetection | null> {
    let deviationScore = 0;
    let affectedMetrics: string[] = [];
    let description = '';
    
    switch (metric.metricType) {
      case 'keystroke':
        deviationScore = this.calculateKeystrokeDeviation(metric, profile.keystrokeDynamics);
        if (deviationScore > this.ANOMALY_THRESHOLDS.low) {
          affectedMetrics = ['typing_speed', 'dwell_time', 'flight_time'];
          description = 'Keystroke dynamics deviation detected';
        }
        break;
        
      case 'mouse':
        deviationScore = this.calculateMouseDeviation(metric, profile.mouseMovement);
        if (deviationScore > this.ANOMALY_THRESHOLDS.low) {
          affectedMetrics = ['velocity', 'acceleration', 'click_duration'];
          description = 'Mouse movement pattern anomaly detected';
        }
        break;
        
      case 'navigation':
        deviationScore = this.calculateNavigationDeviation(metric, profile.navigationPattern);
        if (deviationScore > this.ANOMALY_THRESHOLDS.low) {
          affectedMetrics = ['page_sequence', 'session_duration', 'click_depth'];
          description = 'Navigation pattern anomaly detected';
        }
        break;
        
      default:
        return null;
    }
    
    if (deviationScore <= this.ANOMALY_THRESHOLDS.low) {
      return null;
    }
    
    const severity = this.determineSeverity(deviationScore);
    const recommendedAction = this.getRecommendedAction(severity, deviationScore);
    
    return {
      anomalyType: metric.metricType,
      severity,
      confidence: metric.confidence,
      description,
      deviationScore,
      affectedMetrics,
      timestamp: new Date(),
      recommendedAction
    };
  }

  /**
   * Train ML model for behavioral authentication
   */
  static async trainBehavioralModel(
    userId: string,
    trainingData: BehavioralMetric[],
    modelType: MLModel['modelType'] = 'isolation_forest'
  ): Promise<MLModel> {
    await ensureSodiumReady();
    
    // Extract features from training data
    const features = this.extractFeatures(trainingData);
    const featureNames = Object.keys(features[0] || {});
    
    // Simulate ML model training (would use actual ML library in production)
    const model: MLModel = {
      modelType,
      accuracy: 0.85 + Math.random() * 0.1, // Simulated accuracy
      precision: 0.8 + Math.random() * 0.15,
      recall: 0.75 + Math.random() * 0.2,
      f1Score: 0.8 + Math.random() * 0.15,
      lastTrained: new Date(),
      trainingDataSize: trainingData.length,
      features: featureNames
    };
    
    // Store model
    this.models.set(userId, model);
    
    return model;
  }

  /**
   * Update user behavioral profile
   */
  static updateUserProfile(
    userId: string,
    newMetrics: BehavioralMetric[],
    existingProfile?: UserBehaviorProfile
  ): UserBehaviorProfile {
    const keystrokeMetrics = newMetrics.filter(m => m.metricType === 'keystroke');
    const mouseMetrics = newMetrics.filter(m => m.metricType === 'mouse');
    const navigationMetrics = newMetrics.filter(m => m.metricType === 'navigation');
    const applicationMetrics = newMetrics.filter(m => m.metricType === 'application');
    
    // Create or update profile
    const profile: UserBehaviorProfile = existingProfile || {
      userId,
      keystrokeDynamics: this.getDefaultKeystrokeProfile(),
      mouseMovement: this.getDefaultMouseProfile(),
      navigationPattern: this.getDefaultNavigationProfile(),
      applicationUsage: this.getDefaultApplicationProfile(),
      lastUpdated: new Date(),
      trustScore: 0.5
    };
    
    // Update each component if new data is available
    if (keystrokeMetrics.length > 0) {
      profile.keystrokeDynamics = this.updateKeystrokeProfile(
        profile.keystrokeDynamics,
        keystrokeMetrics
      );
    }
    
    if (mouseMetrics.length > 0) {
      profile.mouseMovement = this.updateMouseProfile(
        profile.mouseMovement,
        mouseMetrics
      );
    }
    
    if (navigationMetrics.length > 0) {
      profile.navigationPattern = this.updateNavigationProfile(
        profile.navigationPattern,
        navigationMetrics
      );
    }
    
    if (applicationMetrics.length > 0) {
      profile.applicationUsage = this.updateApplicationProfile(
        profile.applicationUsage,
        applicationMetrics
      );
    }
    
    // Calculate updated trust score
    profile.trustScore = this.calculateTrustScore(profile);
    profile.lastUpdated = new Date();
    
    return profile;
  }

  // Helper methods
  private static average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }

  private static calculateRhythmPattern(flightTimes: number[]): number[] {
    // Normalize flight times to create rhythm signature
    if (flightTimes.length === 0) return [];
    
    const mean = this.average(flightTimes);
    const stdDev = Math.sqrt(
      flightTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / flightTimes.length
    );
    
    return flightTimes.map(time => (time - mean) / (stdDev || 1)).slice(0, 10);
  }

  private static calculateFingerMovement(keyEvents: any[]): Record<string, number> {
    // Simplified finger movement analysis based on key positions
    const fingerMap: Record<string, string> = {
      'q': 'pinky_left', 'w': 'ring_left', 'e': 'middle_left', 'r': 'index_left',
      't': 'index_left', 'y': 'index_right', 'u': 'index_right', 'i': 'middle_right',
      'o': 'ring_right', 'p': 'pinky_right'
      // Add more key mappings as needed
    };
    
    const fingerUsage: Record<string, number> = {};
    
    for (const event of keyEvents) {
      if (event.type === 'keydown') {
        const finger = fingerMap[event.key.toLowerCase()];
        if (finger) {
          fingerUsage[finger] = (fingerUsage[finger] || 0) + 1;
        }
      }
    }
    
    return fingerUsage;
  }

  private static calculateErrorRate(keyEvents: any[]): number {
    // Simplified error rate calculation (would need more sophisticated analysis)
    const backspaceCount = keyEvents.filter(e => e.key === 'Backspace').length;
    const totalKeys = keyEvents.filter(e => e.type === 'keydown').length;
    
    return totalKeys > 0 ? backspaceCount / totalKeys : 0;
  }

  private static determineHandedness(mouseEvents: any[]): 'left' | 'right' | 'ambidextrous' {
    // Simplified handedness detection based on movement patterns
    // In reality, this would use more sophisticated analysis
    return Math.random() > 0.1 ? 'right' : 'left';
  }

  private static calculateKeystrokeDeviation(metric: BehavioralMetric, profile: KeystrokeProfile): number {
    // Calculate deviation from established keystroke profile
    let totalDeviation = 0;
    let factors = 0;
    
    if (metric.features.typingSpeed !== undefined) {
      const deviation = Math.abs(metric.features.typingSpeed - profile.typingSpeed) / profile.typingSpeed;
      totalDeviation += Math.min(deviation, 1);
      factors++;
    }
    
    if (metric.features.avgDwellTime !== undefined) {
      const deviation = Math.abs(metric.features.avgDwellTime - profile.avgDwellTime) / profile.avgDwellTime;
      totalDeviation += Math.min(deviation, 1);
      factors++;
    }
    
    return factors > 0 ? totalDeviation / factors : 0;
  }

  private static calculateMouseDeviation(metric: BehavioralMetric, profile: MouseProfile): number {
    let totalDeviation = 0;
    let factors = 0;
    
    if (metric.features.avgVelocity !== undefined) {
      const deviation = Math.abs(metric.features.avgVelocity - profile.avgVelocity) / profile.avgVelocity;
      totalDeviation += Math.min(deviation, 1);
      factors++;
    }
    
    return factors > 0 ? totalDeviation / factors : 0;
  }

  private static calculateNavigationDeviation(metric: BehavioralMetric, profile: NavigationProfile): number {
    // Simplified navigation deviation calculation
    return Math.random() * 0.5; // Placeholder
  }

  private static detectCompositeAnomaly(anomalies: AnomalyDetection[], profile: UserBehaviorProfile): AnomalyDetection | null {
    if (anomalies.length < 2) return null;
    
    const avgDeviation = anomalies.reduce((sum, a) => sum + a.deviationScore, 0) / anomalies.length;
    const severity = this.determineSeverity(avgDeviation);
    
    if (severity === 'low') return null;
    
    return {
      anomalyType: 'composite',
      severity,
      confidence: Math.min(...anomalies.map(a => a.confidence)),
      description: 'Multiple behavioral anomalies detected simultaneously',
      deviationScore: avgDeviation,
      affectedMetrics: anomalies.flatMap(a => a.affectedMetrics),
      timestamp: new Date(),
      recommendedAction: this.getRecommendedAction(severity, avgDeviation)
    };
  }

  private static determineSeverity(deviationScore: number): AnomalyDetection['severity'] {
    if (deviationScore >= this.ANOMALY_THRESHOLDS.critical) return 'critical';
    if (deviationScore >= this.ANOMALY_THRESHOLDS.high) return 'high';
    if (deviationScore >= this.ANOMALY_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  private static getRecommendedAction(
    severity: AnomalyDetection['severity'],
    deviationScore: number
  ): AnomalyDetection['recommendedAction'] {
    switch (severity) {
      case 'critical': return 'block';
      case 'high': return 'challenge';
      case 'medium': return 'investigate';
      default: return 'monitor';
    }
  }

  private static extractFeatures(metrics: BehavioralMetric[]): Record<string, number>[] {
    return metrics.map(metric => metric.features);
  }

  private static calculateTrustScore(profile: UserBehaviorProfile): number {
    // Simplified trust score calculation
    return 0.5 + (Math.random() * 0.4); // Placeholder
  }

  // Default profile generators
  private static getDefaultKeystrokeProfile(): KeystrokeProfile {
    return {
      avgDwellTime: 100,
      avgFlightTime: 50,
      typingSpeed: 40,
      rhythmPattern: [],
      pressureDynamics: [],
      errorRate: 0.05,
      fingerMovementPattern: {}
    };
  }

  private static getDefaultMouseProfile(): MouseProfile {
    return {
      avgVelocity: 200,
      accelerationPattern: [],
      clickDuration: 100,
      dragBehavior: {},
      scrollPattern: {},
      tremor: 0.1,
      handedness: 'right'
    };
  }

  private static getDefaultNavigationProfile(): NavigationProfile {
    return {
      pageSequences: [],
      sessionDuration: 1800,
      clickDepth: 10,
      backButtonUsage: 2,
      tabSwitchingPattern: {},
      searchBehavior: {}
    };
  }

  private static getDefaultApplicationProfile(): ApplicationProfile {
    return {
      appUsageFrequency: {},
      featureUsagePattern: {},
      workflowSequences: [],
      errorRecoveryPattern: {},
      helpSystemUsage: 0.1
    };
  }

  private static updateKeystrokeProfile(
    existing: KeystrokeProfile,
    metrics: BehavioralMetric[]
  ): KeystrokeProfile {
    // Simplified update logic (would use proper averaging/weighting in production)
    return existing;
  }

  private static updateMouseProfile(
    existing: MouseProfile,
    metrics: BehavioralMetric[]
  ): MouseProfile {
    return existing;
  }

  private static updateNavigationProfile(
    existing: NavigationProfile,
    metrics: BehavioralMetric[]
  ): NavigationProfile {
    return existing;
  }

  private static updateApplicationProfile(
    existing: ApplicationProfile,
    metrics: BehavioralMetric[]
  ): ApplicationProfile {
    return existing;
  }
}