import { ensureSodiumReady } from './quantum-crypto';

export interface ZeroTrustPolicy {
  id: string;
  name: string;
  policyType: 'device' | 'network' | 'identity' | 'application' | 'data' | 'location';
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in_range' | 'regex';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface PolicyAction {
  type: 'allow' | 'deny' | 'require_mfa' | 'require_approval' | 'limit_access' | 'monitor' | 'step_up_auth';
  parameters?: Record<string, any>;
}

export interface ZeroTrustContext {
  user: {
    id: string;
    role: string;
    groups: string[];
    riskScore: number;
    lastLogin: Date;
    mfaEnabled: boolean;
  };
  device: {
    id: string;
    type: string;
    os: string;
    isManaged: boolean;
    isCompliant: boolean;
    trustScore: number;
    lastSeen: Date;
  };
  network: {
    ipAddress: string;
    location: string;
    isVPN: boolean;
    isCorporate: boolean;
    threatLevel: number;
  };
  application: {
    id: string;
    name: string;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    requiresApproval: boolean;
  };
  session: {
    id: string;
    startTime: Date;
    lastActivity: Date;
    isElevated: boolean;
    mfaVerified: boolean;
  };
  request: {
    resource: string;
    action: string;
    timestamp: Date;
    riskScore: number;
  };
}

export interface AccessDecision {
  decision: 'allow' | 'deny' | 'conditional';
  confidence: number;
  appliedPolicies: string[];
  requiredActions: PolicyAction[];
  reasoning: string[];
  expiresAt?: Date;
  conditions?: string[];
}

export interface TrustScore {
  overall: number;
  user: number;
  device: number;
  network: number;
  context: number;
  lastUpdated: Date;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    reason: string;
  }>;
}

/**
 * Zero Trust Architecture Engine
 * Implements "Never Trust, Always Verify" principles with continuous verification
 */
export class ZeroTrustEngine {
  private static readonly TRUST_THRESHOLDS = {
    deny: 0.3,
    conditional: 0.6,
    allow: 0.8
  };

  private static readonly DEFAULT_POLICIES: ZeroTrustPolicy[] = [
    {
      id: 'admin-mfa-required',
      name: 'Admin MFA Requirement',
      policyType: 'identity',
      conditions: [
        { field: 'user.role', operator: 'equals', value: 'admin' }
      ],
      actions: [
        { type: 'require_mfa', parameters: { methods: ['totp', 'biometric'] } }
      ],
      priority: 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'unmanaged-device-restriction',
      name: 'Unmanaged Device Restrictions',
      policyType: 'device',
      conditions: [
        { field: 'device.isManaged', operator: 'equals', value: false }
      ],
      actions: [
        { type: 'limit_access', parameters: { permissions: ['read-only'] } },
        { type: 'require_approval', parameters: { approvers: ['security-team'] } }
      ],
      priority: 90,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'high-risk-network-block',
      name: 'High Risk Network Block',
      policyType: 'network',
      conditions: [
        { field: 'network.threatLevel', operator: 'greater_than', value: 0.8 }
      ],
      actions: [
        { type: 'deny' }
      ],
      priority: 95,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'confidential-data-access',
      name: 'Confidential Data Access Control',
      policyType: 'data',
      conditions: [
        { field: 'application.dataClassification', operator: 'equals', value: 'confidential' }
      ],
      actions: [
        { type: 'require_mfa' },
        { type: 'step_up_auth', parameters: { methods: ['biometric'] } },
        { type: 'monitor', parameters: { level: 'high' } }
      ],
      priority: 85,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  /**
   * Evaluate access request against Zero Trust policies
   */
  static async evaluateAccess(
    context: ZeroTrustContext,
    policies: ZeroTrustPolicy[] = this.DEFAULT_POLICIES
  ): Promise<AccessDecision> {
    await ensureSodiumReady();
    
    // Calculate comprehensive trust score
    const trustScore = await this.calculateTrustScore(context);
    
    // Filter and sort applicable policies
    const applicablePolicies = policies
      .filter(policy => policy.isActive)
      .filter(policy => this.isPolicyApplicable(policy, context))
      .sort((a, b) => b.priority - a.priority);
    
    const appliedPolicies: string[] = [];
    const requiredActions: PolicyAction[] = [];
    const reasoning: string[] = [];
    let finalDecision: 'allow' | 'deny' | 'conditional' = 'allow';
    
    // Evaluate each applicable policy
    for (const policy of applicablePolicies) {
      const policyResult = this.evaluatePolicy(policy, context);
      
      if (policyResult.applies) {
        appliedPolicies.push(policy.id);
        reasoning.push(`Policy '${policy.name}': ${policyResult.reason}`);
        
        // Merge actions
        requiredActions.push(...policy.actions);
        
        // Determine most restrictive decision
        if (policy.actions.some(action => action.type === 'deny')) {
          finalDecision = 'deny';
          break;
        } else if (policy.actions.some(action => 
          ['require_mfa', 'require_approval', 'step_up_auth'].includes(action.type)
        )) {
          finalDecision = 'conditional';
        }
      }
    }
    
    // Apply trust score based decision
    if (finalDecision === 'allow') {
      if (trustScore.overall < this.TRUST_THRESHOLDS.deny) {
        finalDecision = 'deny';
        reasoning.push(`Trust score too low: ${trustScore.overall.toFixed(2)}`);
      } else if (trustScore.overall < this.TRUST_THRESHOLDS.conditional) {
        finalDecision = 'conditional';
        reasoning.push(`Trust score requires additional verification: ${trustScore.overall.toFixed(2)}`);
        requiredActions.push({
          type: 'require_mfa',
          parameters: { reason: 'low_trust_score' }
        });
      }
    }
    
    // Calculate confidence based on policy coverage and trust score certainty
    const confidence = Math.min(
      0.5 + (applicablePolicies.length * 0.1),
      0.9
    );
    
    return {
      decision: finalDecision,
      confidence,
      appliedPolicies,
      requiredActions: this.deduplicateActions(requiredActions),
      reasoning,
      expiresAt: new Date(Date.now() + (15 * 60 * 1000)), // 15 minutes
      conditions: finalDecision === 'conditional' 
        ? this.extractConditions(requiredActions)
        : undefined
    };
  }

  /**
   * Calculate comprehensive trust score for the context
   */
  static async calculateTrustScore(context: ZeroTrustContext): Promise<TrustScore> {
    const factors = [];
    
    // User trust factors
    const userScore = this.calculateUserTrust(context.user);
    factors.push({
      name: 'User Identity',
      score: userScore,
      weight: 0.25,
      reason: `Based on role, MFA status, and risk score`
    });
    
    // Device trust factors
    const deviceScore = this.calculateDeviceTrust(context.device);
    factors.push({
      name: 'Device Trust',
      score: deviceScore,
      weight: 0.3,
      reason: `Based on management status, compliance, and trust score`
    });
    
    // Network trust factors
    const networkScore = this.calculateNetworkTrust(context.network);
    factors.push({
      name: 'Network Security',
      score: networkScore,
      weight: 0.25,
      reason: `Based on location, VPN status, and threat level`
    });
    
    // Context trust factors
    const contextScore = this.calculateContextualTrust(context);
    factors.push({
      name: 'Contextual Factors',
      score: contextScore,
      weight: 0.2,
      reason: `Based on session, timing, and request patterns`
    });
    
    // Calculate weighted overall score
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const overall = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    ) / totalWeight;
    
    return {
      overall,
      user: userScore,
      device: deviceScore,
      network: networkScore,
      context: contextScore,
      lastUpdated: new Date(),
      factors
    };
  }

  /**
   * Calculate user-specific trust score
   */
  private static calculateUserTrust(user: any): number {
    let score = 0.5; // Base score
    
    // Role-based adjustments
    if (user.role === 'admin') score += 0.1;
    if (user.role === 'user') score += 0.2;
    
    // MFA enabled
    if (user.mfaEnabled) score += 0.2;
    
    // Risk score (inverse relationship)
    score += (1 - user.riskScore) * 0.3;
    
    // Recent activity
    const daysSinceLogin = (Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLogin < 1) score += 0.1;
    else if (daysSinceLogin > 30) score -= 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate device-specific trust score
   */
  private static calculateDeviceTrust(device: any): number {
    let score = 0.3; // Base score for unknown devices
    
    if (device.isManaged) score += 0.4;
    if (device.isCompliant) score += 0.3;
    
    // Existing trust score
    score = (score + device.trustScore) / 2;
    
    // Device age (recently seen devices are more trusted)
    const hoursSinceLastSeen = (Date.now() - device.lastSeen.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastSeen < 24) score += 0.1;
    else if (hoursSinceLastSeen > 168) score -= 0.1; // 1 week
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate network-specific trust score
   */
  private static calculateNetworkTrust(network: any): number {
    let score = 0.5; // Base score
    
    if (network.isCorporate) score += 0.3;
    if (network.isVPN && network.isCorporate) score += 0.1;
    if (network.isVPN && !network.isCorporate) score -= 0.2;
    
    // Threat level (inverse relationship)
    score -= network.threatLevel * 0.4;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate contextual trust factors
   */
  private static calculateContextualTrust(context: ZeroTrustContext): number {
    let score = 0.5; // Base score
    
    // Session factors
    if (context.session.mfaVerified) score += 0.2;
    if (context.session.isElevated) score += 0.1;
    
    // Request timing patterns
    const hour = context.request.timestamp.getHours();
    if (hour >= 9 && hour <= 17) score += 0.1; // Business hours
    
    // Application sensitivity
    const appClassification = context.application.dataClassification;
    if (appClassification === 'public') score += 0.1;
    else if (appClassification === 'restricted') score -= 0.1;
    
    // Request risk score
    score -= context.request.riskScore * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Check if a policy is applicable to the current context
   */
  private static isPolicyApplicable(policy: ZeroTrustPolicy, context: ZeroTrustContext): boolean {
    return policy.conditions.every(condition => 
      this.evaluateCondition(condition, context)
    );
  }

  /**
   * Evaluate a single policy condition
   */
  private static evaluateCondition(condition: PolicyCondition, context: any): boolean {
    const value = this.getValueFromPath(context, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'in_range':
        const [min, max] = condition.value;
        return Number(value) >= min && Number(value) <= max;
      case 'regex':
        return new RegExp(condition.value).test(String(value));
      default:
        return false;
    }
  }

  /**
   * Evaluate a complete policy against context
   */
  private static evaluatePolicy(
    policy: ZeroTrustPolicy, 
    context: ZeroTrustContext
  ): { applies: boolean; reason: string } {
    const conditionResults = policy.conditions.map(condition => ({
      condition,
      result: this.evaluateCondition(condition, context)
    }));
    
    // For now, all conditions must be true (AND logic)
    const applies = conditionResults.every(cr => cr.result);
    
    const reason = applies 
      ? `All conditions met for ${policy.policyType} policy`
      : `Conditions not met: ${conditionResults
          .filter(cr => !cr.result)
          .map(cr => cr.condition.field)
          .join(', ')}`;
    
    return { applies, reason };
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getValueFromPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Remove duplicate actions from array
   */
  private static deduplicateActions(actions: PolicyAction[]): PolicyAction[] {
    const seen = new Set();
    return actions.filter(action => {
      const key = `${action.type}-${JSON.stringify(action.parameters || {})}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Extract human-readable conditions from required actions
   */
  private static extractConditions(actions: PolicyAction[]): string[] {
    return actions.map(action => {
      switch (action.type) {
        case 'require_mfa':
          return 'Multi-factor authentication required';
        case 'require_approval':
          return 'Manager approval required';
        case 'step_up_auth':
          return 'Additional authentication required';
        case 'limit_access':
          return 'Limited access permissions';
        case 'monitor':
          return 'Enhanced monitoring enabled';
        default:
          return `${action.type} required`;
      }
    });
  }

  /**
   * Create a new Zero Trust policy
   */
  static createPolicy(
    name: string,
    policyType: ZeroTrustPolicy['policyType'],
    conditions: PolicyCondition[],
    actions: PolicyAction[],
    priority: number = 50
  ): ZeroTrustPolicy {
    return {
      id: `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      policyType,
      conditions,
      actions,
      priority,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Continuous compliance checking
   */
  static async performContinuousCompliance(
    context: ZeroTrustContext,
    policies: ZeroTrustPolicy[]
  ): Promise<{
    compliant: boolean;
    violations: Array<{ policy: string; reason: string }>;
    recommendedActions: PolicyAction[];
  }> {
    const violations = [];
    const recommendedActions = [];
    
    for (const policy of policies.filter(p => p.isActive)) {
      const evaluation = this.evaluatePolicy(policy, context);
      
      if (evaluation.applies) {
        // Check if required actions from policy are being enforced
        const requiredMFA = policy.actions.some(a => a.type === 'require_mfa');
        const hasMFA = context.session.mfaVerified;
        
        if (requiredMFA && !hasMFA) {
          violations.push({
            policy: policy.name,
            reason: 'MFA required but not verified'
          });
          recommendedActions.push({
            type: 'require_mfa',
            parameters: { immediate: true }
          });
        }
      }
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      recommendedActions: this.deduplicateActions(recommendedActions)
    };
  }
}
