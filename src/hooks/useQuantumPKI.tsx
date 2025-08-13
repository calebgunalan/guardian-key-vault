import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { QuantumCA, QuantumCertificate, CertificateRequest } from '@/lib/quantum-pki';
import { QuantumSignatures } from '@/lib/quantum-crypto';

export interface QuantumCertificateInfo {
  id: string;
  user_id: string;
  certificate_type: 'identity' | 'signing' | 'encryption' | 'authentication';
  certificate_data: string;
  public_key: string;
  serial_number: string;
  issuer: string;
  subject: string;
  valid_from: string;
  valid_until: string;
  is_revoked: boolean;
  revocation_reason?: string;
  revoked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PKIRootInfo {
  id: string;
  name: string;
  description?: string;
  root_certificate: string;
  algorithm: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  expires_at: string;
}

export function useQuantumPKI() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<QuantumCertificateInfo[]>([]);
  const [pkiRoots, setPkiRoots] = useState<PKIRootInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCertificates();
      fetchPKIRoots();
    }
  }, [user]);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('quantum_certificates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertificates((data || []).map(cert => ({
        ...cert,
        certificate_type: cert.certificate_type as 'identity' | 'signing' | 'encryption' | 'authentication'
      })));
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPKIRoots = async () => {
    try {
      const { data, error } = await supabase
        .from('quantum_pki_roots')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPkiRoots(data || []);
    } catch (error) {
      console.error('Error fetching PKI roots:', error);
    }
  };

  const requestCertificate = async (
    certificateType: 'identity' | 'signing' | 'encryption' | 'authentication',
    subject: string,
    validityDays: number = 365
  ): Promise<QuantumCertificateInfo> => {
    try {
      // Generate key pair for the certificate
      const keyPair = await QuantumSignatures.generateKeyPair();
      
      // Create certificate request
      const request: CertificateRequest = {
        subject,
        publicKey: keyPair.publicKey,
        keyUsage: [certificateType === 'signing' ? 'digitalSignature' : 'keyEncipherment'],
        validityDays
      };

      // For demo purposes, create a self-signed certificate
      // In production, this would go through a proper CA
      const { ca, rootCert } = await QuantumCA.createRootCA('Demo CA', 3650);
      const certificate = await ca.issueCertificate(request);

      // Store certificate in database
      const { data, error } = await supabase
        .from('quantum_certificates')
        .insert({
          user_id: user?.id,
          certificate_type: certificateType,
          certificate_data: certificate.certificateData,
          public_key: Array.from(certificate.publicKey).join(','),
          serial_number: certificate.serialNumber,
          issuer: certificate.issuer,
          subject: certificate.subject,
          valid_from: certificate.validFrom.toISOString(),
          valid_until: certificate.validUntil.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Store private key securely (in production, use HSM or secure enclave)
      localStorage.setItem(
        `quantum_cert_key_${data.id}`, 
        Array.from(keyPair.privateKey).join(',')
      );

      await fetchCertificates();
      return {
        ...data,
        certificate_type: data.certificate_type as 'identity' | 'signing' | 'encryption' | 'authentication'
      };
    } catch (error) {
      console.error('Error requesting certificate:', error);
      throw error;
    }
  };

  const revokeCertificate = async (certificateId: string, reason: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('quantum_certificates')
        .update({
          is_revoked: true,
          revocation_reason: reason,
          revoked_at: new Date().toISOString()
        })
        .eq('id', certificateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Log the revocation
      await supabase.rpc('log_audit_event', {
        _action: 'CERTIFICATE_REVOKED',
        _resource: 'quantum_certificates',
        _resource_id: certificateId,
        _details: { reason }
      });

      await fetchCertificates();
    } catch (error) {
      console.error('Error revoking certificate:', error);
      throw error;
    }
  };

  const verifyCertificate = async (certificateId: string): Promise<boolean> => {
    try {
      const certificate = certificates.find(c => c.id === certificateId);
      if (!certificate) return false;

      // Check validity period
      const now = new Date();
      const validFrom = new Date(certificate.valid_from);
      const validUntil = new Date(certificate.valid_until);
      
      if (now < validFrom || now > validUntil) return false;
      if (certificate.is_revoked) return false;

      // In a full implementation, verify the certificate signature
      // against the issuing CA's public key
      return true;
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return false;
    }
  };

  const signWithCertificate = async (
    certificateId: string, 
    message: string
  ): Promise<{ signature: string; certificateChain: string[] }> => {
    try {
      const certificate = certificates.find(c => c.id === certificateId);
      if (!certificate) throw new Error('Certificate not found');

      // Retrieve private key
      const privateKeyData = localStorage.getItem(`quantum_cert_key_${certificateId}`);
      if (!privateKeyData) throw new Error('Private key not found');

      const privateKey = new Uint8Array(privateKeyData.split(',').map(Number));
      const messageBytes = new TextEncoder().encode(message);

      // Sign with quantum-resistant algorithm
      const signature = await QuantumSignatures.sign(messageBytes, privateKey);

      return {
        signature: Array.from(signature).join(','),
        certificateChain: [certificate.certificate_data]
      };
    } catch (error) {
      console.error('Error signing with certificate:', error);
      throw error;
    }
  };

  const exportCertificate = (certificateId: string, format: 'pem' | 'der' | 'json' = 'json'): string => {
    const certificate = certificates.find(c => c.id === certificateId);
    if (!certificate) throw new Error('Certificate not found');

    switch (format) {
      case 'json':
        return JSON.stringify(certificate, null, 2);
      case 'pem':
        // Convert to PEM format (base64 with headers)
        const certData = btoa(certificate.certificate_data);
        return `-----BEGIN QUANTUM CERTIFICATE-----\n${certData}\n-----END QUANTUM CERTIFICATE-----`;
      case 'der':
        // Return as binary DER format (simplified)
        return certificate.certificate_data;
      default:
        throw new Error('Unsupported format');
    }
  };

  const importCertificate = async (certificateData: string, format: 'pem' | 'der' | 'json' = 'json'): Promise<void> => {
    try {
      let parsedCert: any;

      switch (format) {
        case 'json':
          parsedCert = JSON.parse(certificateData);
          break;
        case 'pem':
          // Extract certificate data from PEM format
          const pemData = certificateData
            .replace('-----BEGIN QUANTUM CERTIFICATE-----', '')
            .replace('-----END QUANTUM CERTIFICATE-----', '')
            .replace(/\s/g, '');
          parsedCert = JSON.parse(atob(pemData));
          break;
        case 'der':
          parsedCert = JSON.parse(certificateData);
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Store imported certificate
      const { error } = await supabase
        .from('quantum_certificates')
        .insert({
          user_id: user?.id,
          certificate_type: parsedCert.certificate_type || 'identity',
          certificate_data: parsedCert.certificate_data,
          public_key: parsedCert.public_key,
          serial_number: parsedCert.serial_number,
          issuer: parsedCert.issuer,
          subject: parsedCert.subject,
          valid_from: parsedCert.valid_from,
          valid_until: parsedCert.valid_until
        });

      if (error) throw error;
      await fetchCertificates();
    } catch (error) {
      console.error('Error importing certificate:', error);
      throw error;
    }
  };

  const getCertificateInfo = (certificateId: string) => {
    const certificate = certificates.find(c => c.id === certificateId);
    if (!certificate) return null;

    const now = new Date();
    const validUntil = new Date(certificate.valid_until);
    const daysUntilExpiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...certificate,
      isExpired: now > validUntil,
      daysUntilExpiry,
      isNearExpiry: daysUntilExpiry <= 30 && daysUntilExpiry > 0
    };
  };

  return {
    certificates,
    pkiRoots,
    loading,
    requestCertificate,
    revokeCertificate,
    verifyCertificate,
    signWithCertificate,
    exportCertificate,
    importCertificate,
    getCertificateInfo,
    fetchCertificates
  };
}