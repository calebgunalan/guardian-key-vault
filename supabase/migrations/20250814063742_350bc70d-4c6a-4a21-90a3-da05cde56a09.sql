-- Add comprehensive enterprise IAM features

-- Advanced Device Management and Trust Scoring
CREATE TABLE public.device_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  fingerprint_data JSONB NOT NULL DEFAULT '{}',
  trust_score NUMERIC NOT NULL DEFAULT 0.0,
  risk_factors JSONB NOT NULL DEFAULT '[]',
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  compliance_status TEXT NOT NULL DEFAULT 'unknown',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Identity Lifecycle Events
CREATE TABLE public.identity_lifecycle_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'joiner', 'mover', 'leaver', 'access_review', 'certification'
  event_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  triggered_by TEXT NOT NULL, -- 'manual', 'automated', 'scheduled', 'policy'
  workflow_data JSONB NOT NULL DEFAULT '{}',
  approver_id UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Advanced Threat Intelligence
CREATE TABLE public.threat_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  threat_type TEXT NOT NULL, -- 'credential_stuffing', 'account_takeover', 'insider_threat', 'apt'
  indicator_type TEXT NOT NULL, -- 'ip', 'user_agent', 'behavioral_pattern', 'device_fingerprint'
  indicator_value TEXT NOT NULL,
  threat_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  confidence_score NUMERIC NOT NULL DEFAULT 0.0,
  source TEXT NOT NULL, -- 'internal', 'external_feed', 'ml_detection', 'manual'
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Identity Federation and SSO Configuration
CREATE TABLE public.federation_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- 'saml', 'oidc', 'oauth2', 'ldap'
  configuration JSONB NOT NULL DEFAULT '{}',
  metadata_url TEXT,
  certificate TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_provisioning BOOLEAN NOT NULL DEFAULT false,
  attribute_mappings JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Advanced Biometric Templates (encrypted)
CREATE TABLE public.biometric_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_type TEXT NOT NULL, -- 'fingerprint', 'face', 'voice', 'iris', 'multimodal'
  template_data_encrypted TEXT NOT NULL,
  quality_metrics JSONB NOT NULL DEFAULT '{}',
  extraction_algorithm TEXT NOT NULL,
  matching_threshold NUMERIC NOT NULL DEFAULT 0.8,
  enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_matched TIMESTAMP WITH TIME ZONE,
  match_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Privileged Access Management (PAM)
CREATE TABLE public.privileged_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL, -- 'service', 'admin', 'emergency', 'shared'
  target_system TEXT NOT NULL,
  credentials_encrypted TEXT NOT NULL,
  access_policy JSONB NOT NULL DEFAULT '{}',
  checkout_duration INTERVAL NOT NULL DEFAULT '4 hours',
  auto_rotate BOOLEAN NOT NULL DEFAULT true,
  rotation_interval INTERVAL NOT NULL DEFAULT '30 days',
  last_rotation TIMESTAMP WITH TIME ZONE,
  next_rotation TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Privileged Access Sessions
CREATE TABLE public.privileged_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  privileged_account_id UUID NOT NULL REFERENCES public.privileged_accounts(id),
  user_id UUID NOT NULL,
  session_purpose TEXT NOT NULL,
  approval_request_id UUID,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  activities JSONB NOT NULL DEFAULT '[]',
  is_recorded BOOLEAN NOT NULL DEFAULT true,
  recording_path TEXT,
  risk_score NUMERIC NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Identity Governance Policies
CREATE TABLE public.governance_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_name TEXT NOT NULL,
  policy_type TEXT NOT NULL, -- 'segregation_of_duties', 'data_classification', 'retention', 'privacy'
  policy_rules JSONB NOT NULL DEFAULT '{}',
  compliance_frameworks TEXT[] NOT NULL DEFAULT '{}', -- 'SOX', 'GDPR', 'HIPAA', 'PCI-DSS'
  enforcement_level TEXT NOT NULL DEFAULT 'monitor', -- 'monitor', 'warn', 'block'
  scope_criteria JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Policy Violations
CREATE TABLE public.policy_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.governance_policies(id),
  user_id UUID,
  violation_type TEXT NOT NULL,
  severity_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  violation_data JSONB NOT NULL DEFAULT '{}',
  detection_method TEXT NOT NULL, -- 'automated', 'manual', 'audit'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
  assigned_to UUID,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quantum Communication Channels (enhanced)
CREATE TABLE public.quantum_comm_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.quantum_comm_channels(id),
  sender_id UUID NOT NULL,
  recipient_ids UUID[] NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'file', 'key_exchange', 'heartbeat'
  encrypted_content TEXT NOT NULL,
  quantum_signature TEXT NOT NULL,
  integrity_hash TEXT NOT NULL,
  delivery_status JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Advanced Analytics and ML Models
CREATE TABLE public.ml_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'behavioral_anomaly', 'risk_scoring', 'threat_detection', 'biometric_fusion'
  model_version TEXT NOT NULL,
  training_data_summary JSONB NOT NULL DEFAULT '{}',
  hyperparameters JSONB NOT NULL DEFAULT '{}',
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  deployment_date TIMESTAMP WITH TIME ZONE,
  last_retrained TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.federation_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privileged_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privileged_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_comm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Device Fingerprints
CREATE POLICY "Users can manage their own device fingerprints" 
ON public.device_fingerprints 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all device fingerprints" 
ON public.device_fingerprints 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::system_role));

-- RLS Policies for Identity Lifecycle Events
CREATE POLICY "Admins can manage lifecycle events" 
ON public.identity_lifecycle_events 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view their own lifecycle events" 
ON public.identity_lifecycle_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for Threat Intelligence
CREATE POLICY "Admins can manage threat intelligence" 
ON public.threat_intelligence 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Security analysts can view threat intelligence" 
ON public.threat_intelligence 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::system_role) OR has_role(auth.uid(), 'moderator'::system_role));

-- RLS Policies for Federation Providers
CREATE POLICY "Admins can manage federation providers" 
ON public.federation_providers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- RLS Policies for Biometric Templates
CREATE POLICY "Users can manage their own biometric templates" 
ON public.biometric_templates 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Privileged Accounts
CREATE POLICY "Admins can manage privileged accounts" 
ON public.privileged_accounts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::system_role));

-- RLS Policies for Privileged Sessions
CREATE POLICY "Admins can view all privileged sessions" 
ON public.privileged_sessions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view their own privileged sessions" 
ON public.privileged_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create privileged sessions" 
ON public.privileged_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Governance Policies
CREATE POLICY "Admins can manage governance policies" 
ON public.governance_policies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view active policies" 
ON public.governance_policies 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for Policy Violations
CREATE POLICY "Admins can manage policy violations" 
ON public.policy_violations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view violations related to them" 
ON public.policy_violations 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = assigned_to);

-- RLS Policies for Quantum Communication Messages
CREATE POLICY "Users can manage messages in their channels" 
ON public.quantum_comm_messages 
FOR ALL 
USING (
  auth.uid() = sender_id OR 
  (auth.uid())::text = ANY(SELECT jsonb_array_elements_text(
    (SELECT participants FROM public.quantum_comm_channels WHERE id = channel_id)
  ))
);

-- RLS Policies for ML Models
CREATE POLICY "Admins can manage ML models" 
ON public.ml_models 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::system_role));

-- Add update triggers for updated_at columns
CREATE TRIGGER update_device_fingerprints_updated_at
BEFORE UPDATE ON public.device_fingerprints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_identity_lifecycle_events_updated_at
BEFORE UPDATE ON public.identity_lifecycle_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_federation_providers_updated_at
BEFORE UPDATE ON public.federation_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_privileged_accounts_updated_at
BEFORE UPDATE ON public.privileged_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_governance_policies_updated_at
BEFORE UPDATE ON public.governance_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();