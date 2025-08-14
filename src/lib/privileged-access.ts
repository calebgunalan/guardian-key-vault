import { ensureSodiumReady } from './quantum-crypto';
import * as sodium from 'libsodium-wrappers';

export interface PrivilegedAccount {
  id: string;
  account_name: string;
  account_type: 'service' | 'admin' | 'emergency' | 'shared';
  target_system: string;
  credentials_encrypted: string;
  access_policy: {
    allowed_hours?: string[];
    allowed_days?: number[];
    ip_restrictions?: string[];
    approval_required: boolean;
    max_session_duration?: number;
    concurrent_sessions?: number;
  };
  checkout_duration: string; // ISO duration
  auto_rotate: boolean;
  rotation_interval: string; // ISO duration
  last_rotation?: string;
  next_rotation?: string;
  is_active: boolean;
}

export interface PrivilegedSession {
  id: string;
  privileged_account_id: string;
  user_id: string;
  session_purpose: string;
  approval_request_id?: string;
  session_start: string;
  session_end?: string;
  activities: SessionActivity[];
  is_recorded: boolean;
  recording_path?: string;
  risk_score: number;
}

export interface SessionActivity {
  timestamp: string;
  activity_type: 'login' | 'command' | 'file_access' | 'network_access' | 'privilege_escalation';
  description: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface PAMCheckoutRequest {
  account_id: string;
  purpose: string;
  duration?: number; // minutes
  justification: string;
  ip_address?: string;
}

export interface PAMCheckoutResult {
  success: boolean;
  session_id?: string;
  credentials?: {
    username: string;
    password: string;
    additional?: Record<string, string>;
  };
  session_expires_at?: string;
  restrictions?: {
    allowed_commands?: string[];
    forbidden_commands?: string[];
    network_restrictions?: string[];
  };
  error?: string;
}

export class PrivilegedAccessManager {
  private static async encryptCredentials(credentials: Record<string, string>, masterKey: Uint8Array): Promise<string> {
    await ensureSodiumReady();
    const credentialsJson = JSON.stringify(credentials);
    const credentialsBytes = sodium.from_string(credentialsJson);
    
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = sodium.crypto_secretbox_easy(credentialsBytes, nonce, masterKey);
    
    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce);
    combined.set(ciphertext, nonce.length);
    
    return sodium.to_base64(combined);
  }

  private static async decryptCredentials(encryptedCredentials: string, masterKey: Uint8Array): Promise<Record<string, string>> {
    await ensureSodiumReady();
    const combined = sodium.from_base64(encryptedCredentials);
    const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);
    
    const decryptedBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, masterKey);
    const credentialsJson = sodium.to_string(decryptedBytes);
    
    return JSON.parse(credentialsJson);
  }

  static async createPrivilegedAccount(
    accountData: Omit<PrivilegedAccount, 'id' | 'credentials_encrypted' | 'last_rotation' | 'next_rotation'>,
    credentials: Record<string, string>,
    masterKey: Uint8Array
  ): Promise<PrivilegedAccount> {
    const encryptedCredentials = await this.encryptCredentials(credentials, masterKey);
    
    const account: PrivilegedAccount = {
      ...accountData,
      id: sodium.to_hex(sodium.randombytes_buf(16)),
      credentials_encrypted: encryptedCredentials,
      last_rotation: new Date().toISOString(),
      next_rotation: this.calculateNextRotation(accountData.rotation_interval)
    };
    
    return account;
  }

  static calculateNextRotation(rotationInterval: string): string {
    // Parse ISO duration (e.g., "P30D" for 30 days)
    const match = rotationInterval.match(/P(\d+)D/);
    const days = match ? parseInt(match[1]) : 30;
    
    const nextRotation = new Date();
    nextRotation.setDate(nextRotation.getDate() + days);
    
    return nextRotation.toISOString();
  }

  static async rotateCredentials(
    account: PrivilegedAccount,
    newCredentials: Record<string, string>,
    masterKey: Uint8Array
  ): Promise<PrivilegedAccount> {
    const encryptedCredentials = await this.encryptCredentials(newCredentials, masterKey);
    
    return {
      ...account,
      credentials_encrypted: encryptedCredentials,
      last_rotation: new Date().toISOString(),
      next_rotation: this.calculateNextRotation(account.rotation_interval)
    };
  }

  static async checkoutCredentials(
    account: PrivilegedAccount,
    request: PAMCheckoutRequest,
    masterKey: Uint8Array,
    userId: string
  ): Promise<PAMCheckoutResult> {
    try {
      // Validate access policy
      const validationResult = this.validateAccessPolicy(account, request);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.reason
        };
      }

      // Decrypt credentials
      const credentials = await this.decryptCredentials(account.credentials_encrypted, masterKey);
      
      // Calculate session expiration
      const duration = request.duration || this.parseDuration(account.checkout_duration);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + duration);
      
      // Generate session ID
      const sessionId = sodium.to_hex(sodium.randombytes_buf(16));
      
      // Create session restrictions based on account policy
      const restrictions = this.generateSessionRestrictions(account);
      
      return {
        success: true,
        session_id: sessionId,
        credentials: {
          username: credentials.username || '',
          password: credentials.password || '',
          additional: Object.fromEntries(
            Object.entries(credentials).filter(([key]) => !['username', 'password'].includes(key))
          )
        },
        session_expires_at: expiresAt.toISOString(),
        restrictions
      };
    } catch (error) {
      console.error('Credential checkout error:', error);
      return {
        success: false,
        error: 'Failed to checkout credentials'
      };
    }
  }

  private static validateAccessPolicy(account: PrivilegedAccount, request: PAMCheckoutRequest): {
    valid: boolean;
    reason?: string;
  } {
    const policy = account.access_policy;
    const now = new Date();
    
    // Check if account is active
    if (!account.is_active) {
      return { valid: false, reason: 'Account is inactive' };
    }
    
    // Check allowed hours
    if (policy.allowed_hours && policy.allowed_hours.length > 0) {
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentTime = `${currentHour}:00`;
      
      const isWithinAllowedHours = policy.allowed_hours.some(timeRange => {
        const [start, end] = timeRange.split('-');
        return currentTime >= start && currentTime < end;
      });
      
      if (!isWithinAllowedHours) {
        return { valid: false, reason: 'Access not allowed at current time' };
      }
    }
    
    // Check allowed days (0 = Sunday, 6 = Saturday)
    if (policy.allowed_days && policy.allowed_days.length > 0) {
      const currentDay = now.getDay();
      if (!policy.allowed_days.includes(currentDay)) {
        return { valid: false, reason: 'Access not allowed on current day' };
      }
    }
    
    // Check IP restrictions
    if (policy.ip_restrictions && policy.ip_restrictions.length > 0 && request.ip_address) {
      const isAllowedIp = policy.ip_restrictions.some(allowedIp => {
        // Simple IP matching - in production, use proper CIDR matching
        return request.ip_address?.startsWith(allowedIp.replace('*', ''));
      });
      
      if (!isAllowedIp) {
        return { valid: false, reason: 'Access not allowed from current IP address' };
      }
    }
    
    return { valid: true };
  }

  private static parseDuration(duration: string): number {
    // Parse ISO duration to minutes
    const match = duration.match(/PT(\d+)H/) || duration.match(/P(\d+)D/);
    if (match) {
      const value = parseInt(match[1]);
      return duration.includes('H') ? value * 60 : value * 24 * 60;
    }
    return 240; // Default 4 hours
  }

  private static generateSessionRestrictions(account: PrivilegedAccount): {
    allowed_commands?: string[];
    forbidden_commands?: string[];
    network_restrictions?: string[];
  } {
    // Generate restrictions based on account type and policy
    const restrictions: any = {};
    
    switch (account.account_type) {
      case 'service':
        restrictions.forbidden_commands = [
          'rm -rf', 'format', 'fdisk', 'dd if=', 'mkfs'
        ];
        break;
      case 'emergency':
        restrictions.allowed_commands = [
          'ps', 'top', 'netstat', 'tail', 'grep', 'systemctl status'
        ];
        break;
      case 'admin':
        restrictions.forbidden_commands = [
          'history -c', 'shred', 'wipe'
        ];
        break;
    }
    
    // Add network restrictions if specified in policy
    if (account.access_policy.ip_restrictions) {
      restrictions.network_restrictions = account.access_policy.ip_restrictions;
    }
    
    return restrictions;
  }

  static recordSessionActivity(
    sessionId: string,
    activity: Omit<SessionActivity, 'timestamp'>
  ): SessionActivity {
    return {
      ...activity,
      timestamp: new Date().toISOString()
    };
  }

  static calculateSessionRiskScore(activities: SessionActivity[]): number {
    let riskScore = 0;
    const riskWeights = {
      low: 1,
      medium: 3,
      high: 7,
      critical: 15
    };
    
    activities.forEach(activity => {
      riskScore += riskWeights[activity.risk_level];
      
      // Additional risk factors
      if (activity.activity_type === 'privilege_escalation') {
        riskScore += 10;
      }
      if (activity.description.includes('sudo') || activity.description.includes('su ')) {
        riskScore += 5;
      }
    });
    
    // Normalize to 0-100 scale
    return Math.min(riskScore, 100);
  }

  static async endSession(session: PrivilegedSession, reason: string = 'normal'): Promise<{
    session_summary: {
      duration_minutes: number;
      total_activities: number;
      risk_score: number;
      high_risk_activities: number;
    };
    requires_review: boolean;
  }> {
    const sessionEnd = new Date();
    const sessionStart = new Date(session.session_start);
    const durationMinutes = Math.floor((sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60));
    
    const highRiskActivities = session.activities.filter(
      activity => activity.risk_level === 'high' || activity.risk_level === 'critical'
    ).length;
    
    const finalRiskScore = this.calculateSessionRiskScore(session.activities);
    
    const summary = {
      duration_minutes: durationMinutes,
      total_activities: session.activities.length,
      risk_score: finalRiskScore,
      high_risk_activities: highRiskActivities
    };
    
    // Determine if session requires manual review
    const requiresReview = (
      finalRiskScore > 50 ||
      highRiskActivities > 0 ||
      reason === 'suspicious' ||
      durationMinutes > 480 // More than 8 hours
    );
    
    return {
      session_summary: summary,
      requires_review: requiresReview
    };
  }

  static generateRotationSchedule(accounts: PrivilegedAccount[]): {
    account_id: string;
    account_name: string;
    next_rotation: string;
    days_until_rotation: number;
    rotation_priority: 'low' | 'medium' | 'high' | 'critical';
  }[] {
    const now = new Date();
    
    return accounts
      .filter(account => account.auto_rotate && account.is_active)
      .map(account => {
        const nextRotation = new Date(account.next_rotation || now);
        const daysUntil = Math.ceil((nextRotation.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let priority: 'low' | 'medium' | 'high' | 'critical';
        if (daysUntil < 0) priority = 'critical';
        else if (daysUntil <= 3) priority = 'high';
        else if (daysUntil <= 7) priority = 'medium';
        else priority = 'low';
        
        return {
          account_id: account.id,
          account_name: account.account_name,
          next_rotation: account.next_rotation || now.toISOString(),
          days_until_rotation: daysUntil,
          rotation_priority: priority
        };
      })
      .sort((a, b) => a.days_until_rotation - b.days_until_rotation);
  }
}