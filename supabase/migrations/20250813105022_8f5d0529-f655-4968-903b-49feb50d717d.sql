-- Create quantum certificate management tables
CREATE TABLE public.quantum_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('identity', 'signing', 'encryption', 'authentication')),
  certificate_data TEXT NOT NULL,
  public_key TEXT NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revocation_reason TEXT,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quantum PKI root authorities
CREATE TABLE public.quantum_pki_roots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  root_certificate TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'ML-DSA-65',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create behavioral analytics table
CREATE TABLE public.user_behavioral_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('login_times', 'ip_locations', 'device_usage', 'access_patterns', 'typing_patterns')),
  pattern_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create risk scoring table
CREATE TABLE public.user_risk_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Create biometric authentication table
CREATE TABLE public.user_biometric_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  biometric_type TEXT NOT NULL CHECK (biometric_type IN ('fingerprint', 'face', 'voice', 'iris', 'palm')),
  template_hash TEXT NOT NULL, -- Quantum-encrypted biometric template
  encryption_key_id UUID NOT NULL,
  quality_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create zero-trust policies table
CREATE TABLE public.zero_trust_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('device', 'network', 'behavioral', 'location', 'time_based')),
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quantum attack detection logs
CREATE TABLE public.quantum_attack_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attack_type TEXT NOT NULL CHECK (attack_type IN ('shor_algorithm', 'grover_search', 'quantum_key_recovery', 'post_quantum_downgrade')),
  source_ip INET,
  target_user_id UUID,
  target_resource TEXT,
  attack_signature TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  detection_method TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create directory integration settings
CREATE TABLE public.directory_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  directory_type TEXT NOT NULL CHECK (directory_type IN ('ldap', 'active_directory', 'azure_ad', 'google_workspace')),
  connection_string TEXT NOT NULL,
  bind_credentials_encrypted TEXT NOT NULL,
  sync_enabled BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_interval_hours INTEGER NOT NULL DEFAULT 24,
  attribute_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SSO quantum integration
CREATE TABLE public.quantum_sso_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  session_id TEXT NOT NULL,
  quantum_signature TEXT NOT NULL,
  saml_response_hash TEXT,
  jwt_claims_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create quantum communication channels
CREATE TABLE public.quantum_comm_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_name TEXT NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('peer_to_peer', 'multicast', 'broadcast')),
  encryption_algorithm TEXT NOT NULL DEFAULT 'XChaCha20-Poly1305',
  key_exchange_method TEXT NOT NULL DEFAULT 'ML-KEM-768',
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hardware token management
CREATE TABLE public.hardware_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('yubikey', 'fido2', 'smart_card', 'hsm')),
  serial_number TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  certificate_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quantum key rotation policies
CREATE TABLE public.quantum_key_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_name TEXT NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('kem', 'signature', 'symmetric', 'certificate')),
  rotation_interval_days INTEGER NOT NULL DEFAULT 365,
  auto_rotation_enabled BOOLEAN NOT NULL DEFAULT true,
  backup_required BOOLEAN NOT NULL DEFAULT true,
  escrow_required BOOLEAN NOT NULL DEFAULT false,
  compliance_framework TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.quantum_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_pki_roots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavioral_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_biometric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zero_trust_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_attack_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_comm_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_key_policies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Quantum certificates
CREATE POLICY "Users can manage their own certificates" ON public.quantum_certificates
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificates" ON public.quantum_certificates
FOR SELECT USING (has_role(auth.uid(), 'admin'::system_role));

-- PKI roots (admin only)
CREATE POLICY "Admins can manage PKI roots" ON public.quantum_pki_roots
FOR ALL USING (has_role(auth.uid(), 'admin'::system_role)) 
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- Behavioral patterns
CREATE POLICY "Users can view their own patterns" ON public.user_behavioral_patterns
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert behavioral data" ON public.user_behavioral_patterns
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all patterns" ON public.user_behavioral_patterns
FOR SELECT USING (has_role(auth.uid(), 'admin'::system_role));

-- Risk scores
CREATE POLICY "Users can view their own risk scores" ON public.user_risk_scores
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage risk scores" ON public.user_risk_scores
FOR ALL WITH CHECK (true);

CREATE POLICY "Admins can view all risk scores" ON public.user_risk_scores
FOR SELECT USING (has_role(auth.uid(), 'admin'::system_role));

-- Biometric data
CREATE POLICY "Users can manage their own biometric data" ON public.user_biometric_data
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Zero-trust policies (admin only)
CREATE POLICY "Admins can manage zero-trust policies" ON public.zero_trust_policies
FOR ALL USING (has_role(auth.uid(), 'admin'::system_role)) 
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view active policies" ON public.zero_trust_policies
FOR SELECT USING (is_active = true);

-- Quantum attack logs (admin only)
CREATE POLICY "Admins can view attack logs" ON public.quantum_attack_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "System can insert attack logs" ON public.quantum_attack_logs
FOR INSERT WITH CHECK (true);

-- Directory integrations (admin only)
CREATE POLICY "Admins can manage directory integrations" ON public.directory_integrations
FOR ALL USING (has_role(auth.uid(), 'admin'::system_role)) 
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- SSO sessions
CREATE POLICY "Users can manage their own SSO sessions" ON public.quantum_sso_sessions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all SSO sessions" ON public.quantum_sso_sessions
FOR SELECT USING (has_role(auth.uid(), 'admin'::system_role));

-- Communication channels
CREATE POLICY "Users can view channels they participate in" ON public.quantum_comm_channels
FOR SELECT USING (auth.uid()::text = ANY(SELECT jsonb_array_elements_text(participants)));

CREATE POLICY "Admins can manage all channels" ON public.quantum_comm_channels
FOR ALL USING (has_role(auth.uid(), 'admin'::system_role)) 
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- Hardware tokens
CREATE POLICY "Users can manage their own tokens" ON public.hardware_tokens
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tokens" ON public.hardware_tokens
FOR SELECT USING (has_role(auth.uid(), 'admin'::system_role));

-- Key policies (admin only)
CREATE POLICY "Admins can manage key policies" ON public.quantum_key_policies
FOR ALL USING (has_role(auth.uid(), 'admin'::system_role)) 
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view active policies" ON public.quantum_key_policies
FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_quantum_certificates_user_id ON public.quantum_certificates(user_id);
CREATE INDEX idx_quantum_certificates_type ON public.quantum_certificates(certificate_type);
CREATE INDEX idx_quantum_certificates_expires ON public.quantum_certificates(valid_until);

CREATE INDEX idx_behavioral_patterns_user_id ON public.user_behavioral_patterns(user_id);
CREATE INDEX idx_behavioral_patterns_type ON public.user_behavioral_patterns(pattern_type);

CREATE INDEX idx_risk_scores_user_id ON public.user_risk_scores(user_id);
CREATE INDEX idx_risk_scores_expires ON public.user_risk_scores(expires_at);

CREATE INDEX idx_biometric_data_user_id ON public.user_biometric_data(user_id);
CREATE INDEX idx_biometric_data_type ON public.user_biometric_data(biometric_type);

CREATE INDEX idx_attack_logs_detected_at ON public.quantum_attack_logs(detected_at);
CREATE INDEX idx_attack_logs_severity ON public.quantum_attack_logs(severity);

CREATE INDEX idx_hardware_tokens_user_id ON public.hardware_tokens(user_id);
CREATE INDEX idx_hardware_tokens_serial ON public.hardware_tokens(serial_number);

-- Create triggers for updated_at
CREATE TRIGGER update_quantum_certificates_updated_at
  BEFORE UPDATE ON public.quantum_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quantum_pki_roots_updated_at
  BEFORE UPDATE ON public.quantum_pki_roots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_biometric_data_updated_at
  BEFORE UPDATE ON public.user_biometric_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zero_trust_policies_updated_at
  BEFORE UPDATE ON public.zero_trust_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_directory_integrations_updated_at
  BEFORE UPDATE ON public.directory_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quantum_key_policies_updated_at
  BEFORE UPDATE ON public.quantum_key_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();