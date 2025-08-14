import { ensureSodiumReady } from './quantum-crypto';
import * as sodium from 'libsodium-wrappers';

export interface BiometricTemplate {
  id: string;
  template_type: 'fingerprint' | 'face' | 'voice' | 'iris' | 'multimodal';
  template_data_encrypted: string;
  quality_metrics: {
    quality_score: number;
    feature_count: number;
    template_size: number;
    extraction_confidence: number;
  };
  extraction_algorithm: string;
  matching_threshold: number;
}

export interface BiometricMatchResult {
  matched: boolean;
  confidence: number;
  template_id?: string;
  match_quality: number;
  processing_time: number;
}

export class EnterpriseBiometrics {
  private static async encryptTemplate(templateData: Uint8Array, userKey: Uint8Array): Promise<string> {
    await ensureSodiumReady();
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = sodium.crypto_secretbox_easy(templateData, nonce, userKey);
    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce);
    combined.set(ciphertext, nonce.length);
    return sodium.to_base64(combined);
  }

  private static async decryptTemplate(encryptedData: string, userKey: Uint8Array): Promise<Uint8Array> {
    await ensureSodiumReady();
    const combined = sodium.from_base64(encryptedData);
    const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);
    return sodium.crypto_secretbox_open_easy(ciphertext, nonce, userKey);
  }

  static async extractFingerprintFeatures(fingerprintImage: Uint8Array): Promise<{
    template: Uint8Array;
    quality: number;
    featureCount: number;
  }> {
    await ensureSodiumReady();
    
    // Simulate fingerprint feature extraction
    // In a real implementation, this would use a proper biometric SDK
    const features = new Uint8Array(256); // Typical minutiae template size
        sodium.randombytes_buf(features.length); // Simulated feature extraction
        for (let i = 0; i < features.length; i++) {
          features[i] = Math.floor(Math.random() * 256);
        }
    
    const quality = Math.random() * 0.4 + 0.6; // Quality between 0.6-1.0
    const featureCount = Math.floor(Math.random() * 20) + 15; // 15-35 minutiae points
    
    return {
      template: features,
      quality,
      featureCount
    };
  }

  static async extractFaceFeatures(faceImage: Uint8Array): Promise<{
    template: Uint8Array;
    quality: number;
    landmarks: number;
  }> {
    await ensureSodiumReady();
    
    // Simulate face feature extraction
    const features = new Uint8Array(512); // Face embedding size
        for (let i = 0; i < features.length; i++) {
          features[i] = Math.floor(Math.random() * 256);
        }
    
    const quality = Math.random() * 0.3 + 0.7; // Quality between 0.7-1.0
    const landmarks = Math.floor(Math.random() * 20) + 68; // 68-88 facial landmarks
    
    return {
      template: features,
      quality,
      landmarks
    };
  }

  static async createMultimodalTemplate(templates: {
    fingerprint?: Uint8Array;
    face?: Uint8Array;
    voice?: Uint8Array;
    iris?: Uint8Array;
  }): Promise<{
    template: Uint8Array;
    weights: Record<string, number>;
    confidence: number;
  }> {
    await ensureSodiumReady();
    
    const availableModalities = Object.keys(templates).filter(key => templates[key as keyof typeof templates]);
    const weights: Record<string, number> = {};
    
    // Assign weights based on modality reliability
    availableModalities.forEach(modality => {
      switch (modality) {
        case 'fingerprint':
          weights[modality] = 0.35;
          break;
        case 'face':
          weights[modality] = 0.25;
          break;
        case 'iris':
          weights[modality] = 0.30;
          break;
        case 'voice':
          weights[modality] = 0.10;
          break;
      }
    });
    
    // Normalize weights
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(weights).forEach(key => {
      weights[key] = weights[key] / totalWeight;
    });
    
    // Create fused template
    const fusedTemplate = new Uint8Array(1024); // Larger template for multimodal
        for (let i = 0; i < fusedTemplate.length; i++) {
          fusedTemplate[i] = Math.floor(Math.random() * 256);
        }
    
    const confidence = Math.min(availableModalities.length * 0.2 + 0.4, 0.95);
    
    return {
      template: fusedTemplate,
      weights,
      confidence
    };
  }

  static async matchTemplates(
    template1: Uint8Array,
    template2: Uint8Array,
    threshold: number = 0.8,
    templateType: string = 'fingerprint'
  ): Promise<BiometricMatchResult> {
    const startTime = performance.now();
    
    // Simulate biometric matching algorithm
    // In practice, this would use proper biometric matching algorithms
    let similarityScore = 0;
    
    // Calculate Hamming distance simulation for demonstration
    const minLength = Math.min(template1.length, template2.length);
    let differences = 0;
    
    for (let i = 0; i < minLength; i++) {
      if (template1[i] !== template2[i]) {
        differences++;
      }
    }
    
    // Convert to similarity score (0-1)
    similarityScore = 1 - (differences / minLength);
    
    // Add some template-type specific adjustment
    switch (templateType) {
      case 'face':
        similarityScore = Math.min(similarityScore * 1.1, 1.0); // Face matching is generally more lenient
        break;
      case 'iris':
        similarityScore = Math.max(similarityScore * 0.9, 0.0); // Iris matching is more strict
        break;
      case 'multimodal':
        similarityScore = Math.min(similarityScore * 1.2, 1.0); // Multimodal is more reliable
        break;
    }
    
    const matched = similarityScore >= threshold;
    const processingTime = performance.now() - startTime;
    
    return {
      matched,
      confidence: similarityScore,
      match_quality: matched ? similarityScore : 0,
      processing_time: processingTime
    };
  }

  static async enrollBiometric(
    userId: string,
    biometricData: Uint8Array,
    templateType: BiometricTemplate['template_type'],
    userKey: Uint8Array
  ): Promise<{
    templateId: string;
    encryptedTemplate: string;
    qualityMetrics: BiometricTemplate['quality_metrics'];
  }> {
    let template: Uint8Array;
    let qualityMetrics: BiometricTemplate['quality_metrics'];
    
    switch (templateType) {
      case 'fingerprint': {
        const result = await this.extractFingerprintFeatures(biometricData);
        template = result.template;
        qualityMetrics = {
          quality_score: result.quality,
          feature_count: result.featureCount,
          template_size: template.length,
          extraction_confidence: result.quality
        };
        break;
      }
      case 'face': {
        const result = await this.extractFaceFeatures(biometricData);
        template = result.template;
        qualityMetrics = {
          quality_score: result.quality,
          feature_count: result.landmarks,
          template_size: template.length,
          extraction_confidence: result.quality
        };
        break;
      }
      default:
        throw new Error(`Unsupported template type: ${templateType}`);
    }
    
    const encryptedTemplate = await this.encryptTemplate(template, userKey);
    const templateId = sodium.to_hex(sodium.randombytes_buf(16));
    
    return {
      templateId,
      encryptedTemplate,
      qualityMetrics
    };
  }

  static async verifyBiometric(
    biometricData: Uint8Array,
    storedTemplate: BiometricTemplate,
    userKey: Uint8Array
  ): Promise<BiometricMatchResult> {
    try {
      // Extract features from new biometric data
      let newTemplate: Uint8Array;
      
      switch (storedTemplate.template_type) {
        case 'fingerprint': {
          const result = await this.extractFingerprintFeatures(biometricData);
          newTemplate = result.template;
          break;
        }
        case 'face': {
          const result = await this.extractFaceFeatures(biometricData);
          newTemplate = result.template;
          break;
        }
        default:
          throw new Error(`Unsupported template type: ${storedTemplate.template_type}`);
      }
      
      // Decrypt stored template
      const decryptedStoredTemplate = await this.decryptTemplate(
        storedTemplate.template_data_encrypted,
        userKey
      );
      
      // Perform matching
      return await this.matchTemplates(
        newTemplate,
        decryptedStoredTemplate,
        storedTemplate.matching_threshold,
        storedTemplate.template_type
      );
    } catch (error) {
      console.error('Biometric verification error:', error);
      return {
        matched: false,
        confidence: 0,
        match_quality: 0,
        processing_time: 0
      };
    }
  }

  static calculateBiometricEntropy(template: Uint8Array): number {
    // Calculate Shannon entropy of the biometric template
    const frequency: Record<number, number> = {};
    
    for (const byte of template) {
      frequency[byte] = (frequency[byte] || 0) + 1;
    }
    
    let entropy = 0;
    const length = template.length;
    
    for (const count of Object.values(frequency)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }
    
    return entropy;
  }

  static assessTemplateQuality(qualityMetrics: BiometricTemplate['quality_metrics']): {
    overallQuality: 'poor' | 'fair' | 'good' | 'excellent';
    score: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let score = qualityMetrics.quality_score;
    
    // Adjust score based on feature count
    if (qualityMetrics.feature_count < 10) {
      score *= 0.7;
      recommendations.push('Low feature count detected. Consider re-enrollment with better image quality.');
    }
    
    // Adjust score based on extraction confidence
    if (qualityMetrics.extraction_confidence < 0.7) {
      score *= 0.8;
      recommendations.push('Low extraction confidence. Ensure proper lighting and positioning.');
    }
    
    let overallQuality: 'poor' | 'fair' | 'good' | 'excellent';
    if (score >= 0.9) overallQuality = 'excellent';
    else if (score >= 0.7) overallQuality = 'good';
    else if (score >= 0.5) overallQuality = 'fair';
    else overallQuality = 'poor';
    
    if (overallQuality === 'poor') {
      recommendations.push('Template quality is poor. Re-enrollment strongly recommended.');
    }
    
    return {
      overallQuality,
      score,
      recommendations
    };
  }
}