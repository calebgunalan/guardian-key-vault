-- Comprehensive IAM System Database Fixes and Enhancements

-- Fix MFA settings table
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  secret TEXT,
  backup_codes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on MFA settings
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- MFA policies
CREATE POLICY "Users can manage their own MFA settings"
ON public.user_mfa_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix user_api_keys table
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  is_quantum_safe BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on API keys
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- API keys policies
CREATE POLICY "Users can manage their own API keys"
ON public.user_api_keys
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all API keys"
ON public.user_api_keys
FOR SELECT
USING (has_role(auth.uid(), 'admin'::system_role));

-- Fix profiles table issues for user management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update profiles RLS to allow admin creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users and admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::system_role));

-- Fix role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role system_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view role permissions"
ON public.role_permissions
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- Group permissions table
CREATE TABLE IF NOT EXISTS public.group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID NOT NULL,
  UNIQUE(group_id, permission_id)
);

ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage group permissions"
ON public.group_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- Hardware tokens table
CREATE TABLE IF NOT EXISTS public.hardware_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_serial TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL DEFAULT 'yubikey',
  is_active BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  public_key TEXT,
  counter BIGINT DEFAULT 0
);

ALTER TABLE public.hardware_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own hardware tokens"
ON public.hardware_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Quantum sessions table
CREATE TABLE IF NOT EXISTS public.quantum_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_key TEXT NOT NULL,
  quantum_signature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '8 hours'),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.quantum_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quantum sessions"
ON public.quantum_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- SSO sessions table
CREATE TABLE IF NOT EXISTS public.quantum_sso_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.federation_providers(id),
  session_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.quantum_sso_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SSO sessions"
ON public.quantum_sso_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Biometric templates table
CREATE TABLE IF NOT EXISTS public.biometric_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_type TEXT NOT NULL,
  encrypted_template TEXT NOT NULL,
  template_version INTEGER DEFAULT 1,
  quality_score DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.biometric_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own biometric templates"
ON public.biometric_templates
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Directory integrations table
CREATE TABLE IF NOT EXISTS public.directory_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  directory_type TEXT NOT NULL, -- 'ldap', 'active_directory', 'google_workspace'
  configuration JSONB NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  sync_interval INTEGER DEFAULT 3600, -- seconds
  last_sync_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.directory_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage directory integrations"
ON public.directory_integrations
FOR ALL
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- Identity lifecycle events table
CREATE TABLE IF NOT EXISTS public.identity_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL, -- 'user_created', 'role_changed', 'account_locked', etc.
  event_data JSONB NOT NULL,
  triggered_by UUID,
  automated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.identity_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all lifecycle events"
ON public.identity_lifecycle_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view their own lifecycle events"
ON public.identity_lifecycle_events
FOR SELECT
USING (auth.uid() = user_id);

-- Enhanced VPN detection function
CREATE OR REPLACE FUNCTION public.get_location_from_ip(ip_address inet)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  ip_text text;
  is_vpn_detected boolean := false;
  country_code text := 'Unknown';
  city_name text := 'Unknown';
BEGIN
  ip_text := host(ip_address);
  
  -- Enhanced VPN detection logic
  IF ip_text LIKE '10.%' OR 
     ip_text LIKE '172.16.%' OR ip_text LIKE '172.17.%' OR ip_text LIKE '172.18.%' OR 
     ip_text LIKE '172.19.%' OR ip_text LIKE '172.20.%' OR ip_text LIKE '172.21.%' OR 
     ip_text LIKE '172.22.%' OR ip_text LIKE '172.23.%' OR ip_text LIKE '172.24.%' OR 
     ip_text LIKE '172.25.%' OR ip_text LIKE '172.26.%' OR ip_text LIKE '172.27.%' OR 
     ip_text LIKE '172.28.%' OR ip_text LIKE '172.29.%' OR ip_text LIKE '172.30.%' OR 
     ip_text LIKE '172.31.%' OR ip_text LIKE '192.168.%' THEN
    country_code := 'Local Network';
    is_vpn_detected := false;
  ELSE
    -- Enhanced VPN detection patterns
    IF ip_text ~ '^(46\.29\.|185\.220\.|199\.87\.|198\.98\.|107\.189\.|192\.42\.116\.)' OR
       ip_text ~ '^(5\.135\.|51\.89\.|51\.210\.|163\.172\.|195\.154\.|212\.129\.)' OR
       ip_text ~ '^(104\.28\.|172\.67\.|104\.21\.|162\.158\.)' OR -- Cloudflare
       ip_text ~ '^(8\.8\.|1\.1\.1\.|9\.9\.9\.)' OR -- Public DNS (often VPN)
       ip_text ~ '^(198\.18\.|198\.19\.)' OR -- RFC 2544 test ranges
       ip_text ~ '^(203\.0\.113\.|192\.0\.2\.|198\.51\.100\.)' OR -- Documentation IPs
       ip_text ~ '^(31\.13\.|69\.63\.|173\.252\.)' OR -- Common VPN providers
       ip_text ~ '^(185\.|94\.|95\.|46\.|78\.|188\.)' THEN -- European VPN ranges
      is_vpn_detected := true;
      country_code := 'VPN/Proxy Detected';
    ELSE
      -- Geographic IP detection (simplified)
      CASE 
        WHEN ip_text ~ '^(8\.|4\.|23\.|24\.|50\.|63\.|64\.|65\.|66\.|67\.)' THEN 
          country_code := 'US';
          city_name := 'United States';
        WHEN ip_text ~ '^(80\.|81\.|82\.|83\.|84\.|85\.|86\.|87\.|88\.|89\.)' THEN
          country_code := 'EU';
          city_name := 'Europe';
        WHEN ip_text ~ '^(1\.|14\.|27\.|36\.|42\.|43\.|49\.|58\.|59\.)' THEN
          country_code := 'AS';
          city_name := 'Asia-Pacific';
        ELSE 
          country_code := 'Unknown';
          city_name := 'Unknown';
      END CASE;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'country', country_code,
    'city', city_name,
    'latitude', 0,
    'longitude', 0,
    'is_vpn', is_vpn_detected
  );
END;
$$;

-- Update key rotation interval
UPDATE public.system_security_config 
SET config_value = jsonb_build_object('rotation_interval_days', 7)
WHERE config_key = 'quantum_key_rotation';

INSERT INTO public.system_security_config (config_key, config_value, description)
VALUES 
  ('quantum_key_rotation', jsonb_build_object('rotation_interval_days', 7), 'Quantum key rotation interval')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = jsonb_build_object('rotation_interval_days', 7);

-- Create AI behavioral analysis function
CREATE OR REPLACE FUNCTION public.calculate_ai_risk_score(
  _user_id uuid,
  _current_context jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  risk_score integer := 0;
  risk_factors jsonb := '[]'::jsonb;
  behavior_patterns jsonb;
  session_data jsonb;
  device_data jsonb;
  final_assessment jsonb;
BEGIN
  -- Analyze behavioral patterns
  SELECT jsonb_agg(
    jsonb_build_object(
      'pattern_type', pattern_type,
      'confidence', confidence_score,
      'data', pattern_data
    )
  ) INTO behavior_patterns
  FROM public.user_behavioral_patterns
  WHERE user_id = _user_id;

  -- Analyze session patterns
  SELECT jsonb_build_object(
    'recent_sessions', count(*),
    'unique_ips', count(DISTINCT ip_address),
    'avg_session_duration', avg(EXTRACT(EPOCH FROM (COALESCE(expires_at, now()) - created_at))/3600)
  ) INTO session_data
  FROM public.user_sessions
  WHERE user_id = _user_id
    AND created_at > now() - INTERVAL '30 days';

  -- Analyze device fingerprints
  SELECT jsonb_build_object(
    'trusted_devices', count(*) FILTER (WHERE is_trusted = true),
    'total_devices', count(*),
    'avg_trust_score', avg(trust_score)
  ) INTO device_data
  FROM public.device_fingerprints
  WHERE user_id = _user_id;

  -- Calculate base risk score
  risk_score := 0;

  -- Factor 1: Unusual location access (30% weight)
  IF (_current_context->>'is_vpn')::boolean = true THEN
    risk_score := risk_score + 25;
    risk_factors := risk_factors || jsonb_build_object(
      'type', 'vpn_detected',
      'severity', 'medium',
      'description', 'VPN or proxy usage detected',
      'score', 25
    );
  END IF;

  -- Factor 2: Time-based anomalies (20% weight)
  IF EXTRACT(HOUR FROM now()) NOT BETWEEN 6 AND 22 THEN
    risk_score := risk_score + 15;
    risk_factors := risk_factors || jsonb_build_object(
      'type', 'unusual_time',
      'severity', 'low',
      'description', 'Login outside normal hours',
      'score', 15
    );
  END IF;

  -- Factor 3: Device trust (25% weight)
  IF (device_data->>'avg_trust_score')::numeric < 50 THEN
    risk_score := risk_score + 20;
    risk_factors := risk_factors || jsonb_build_object(
      'type', 'untrusted_device',
      'severity', 'medium',
      'description', 'Login from untrusted device',
      'score', 20
    );
  END IF;

  -- Factor 4: Session anomalies (25% weight)
  IF (session_data->>'unique_ips')::integer > 5 THEN
    risk_score := risk_score + 30;
    risk_factors := risk_factors || jsonb_build_object(
      'type', 'multiple_ips',
      'severity', 'high',
      'description', 'Multiple IP addresses in recent sessions',
      'score', 30
    );
  END IF;

  -- Ensure score is within bounds
  risk_score := GREATEST(0, LEAST(100, risk_score));

  -- Build final assessment
  final_assessment := jsonb_build_object(
    'risk_score', risk_score,
    'risk_level', CASE 
      WHEN risk_score >= 70 THEN 'critical'
      WHEN risk_score >= 40 THEN 'high'
      WHEN risk_score >= 20 THEN 'medium'
      ELSE 'low'
    END,
    'risk_factors', risk_factors,
    'ai_analysis', jsonb_build_object(
      'behavioral_confidence', COALESCE((behavior_patterns->0->>'confidence')::numeric, 0),
      'session_anomaly_score', CASE WHEN (session_data->>'unique_ips')::integer > 3 THEN 'high' ELSE 'normal' END,
      'device_trust_level', CASE WHEN (device_data->>'avg_trust_score')::numeric > 70 THEN 'high' ELSE 'medium' END
    ),
    'calculated_at', now(),
    'expires_at', now() + INTERVAL '4 hours'
  );

  RETURN final_assessment;
END;
$$;

-- Create default permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('View Dashboard', 'Access main dashboard', 'dashboard', 'read'),
  ('Manage Users', 'Create, edit, delete users', 'users', 'manage'),
  ('View Audit Logs', 'Access audit log data', 'audit_logs', 'read'),
  ('Export Data', 'Export system data', 'data', 'export'),
  ('Manage API Keys', 'Create and manage API keys', 'api_keys', 'manage'),
  ('Quantum Security', 'Access quantum security features', 'quantum', 'access'),
  ('Approval Management', 'Manage approval workflows', 'approvals', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
WITH role_permission_assignments AS (
  SELECT 
    'admin'::system_role as role,
    p.id as permission_id
  FROM public.permissions p
  UNION ALL
  SELECT 
    'moderator'::system_role,
    p.id
  FROM public.permissions p
  WHERE p.action IN ('read', 'access')
  UNION ALL
  SELECT
    'user'::system_role,
    p.id
  FROM public.permissions p
  WHERE p.resource IN ('dashboard', 'api_keys') AND p.action IN ('read', 'manage')
)
INSERT INTO public.role_permissions (role, permission_id)
SELECT role, permission_id FROM role_permission_assignments
ON CONFLICT (role, permission_id) DO NOTHING;

-- Create default approval workflows
INSERT INTO public.approval_workflows (name, description, resource_type, approval_steps, created_by) 
VALUES 
  ('User Role Change', 'Approval required for user role changes', 'user_role', 
   '[{"step": 0, "approver_id": null, "required": true, "description": "Admin approval required"}]'::jsonb,
   (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1)),
  ('API Key Creation', 'Approval for high-privilege API keys', 'api_key',
   '[{"step": 0, "approver_id": null, "required": true, "description": "Security team approval"}]'::jsonb,
   (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Create audit log export function
CREATE OR REPLACE FUNCTION public.export_audit_logs(
  _start_date timestamptz DEFAULT now() - INTERVAL '30 days',
  _end_date timestamptz DEFAULT now(),
  _format text DEFAULT 'csv'
) RETURNS TABLE (
  id uuid,
  user_id uuid,
  action text,
  resource text,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    al.id,
    al.user_id,
    al.action,
    al.resource,
    al.resource_id,
    al.details,
    al.ip_address,
    al.user_agent,
    al.created_at
  FROM public.audit_logs al
  WHERE al.created_at BETWEEN _start_date AND _end_date
  ORDER BY al.created_at DESC;
$$;

-- Make attack logs visible in audit logs by creating a view
CREATE OR REPLACE VIEW public.comprehensive_audit_logs AS
SELECT 
  al.id,
  al.user_id,
  al.action,
  al.resource,
  al.resource_id,
  al.details,
  al.ip_address,
  al.user_agent,
  al.created_at,
  'audit' as log_type
FROM public.audit_logs al
UNION ALL
SELECT
  sa.id,
  null as user_id,
  'SECURITY_ATTACK' as action,
  sa.target_resource as resource,
  null as resource_id,
  jsonb_build_object(
    'attack_type', sa.attack_type,
    'severity', sa.severity,
    'blocked', sa.blocked,
    'quantum_protected', sa.quantum_protected,
    'attack_data', sa.attack_data
  ) as details,
  sa.source_ip as ip_address,
  null as user_agent,
  sa.detected_at as created_at,
  'security_attack' as log_type
FROM public.security_attacks sa
UNION ALL
SELECT
  qal.id,
  qal.target_user_id as user_id,
  'QUANTUM_ATTACK' as action,
  qal.target_resource as resource,
  null as resource_id,
  jsonb_build_object(
    'attack_type', qal.attack_type,
    'severity', qal.severity,
    'detection_method', qal.detection_method,
    'attack_signature', qal.attack_signature,
    'is_blocked', qal.is_blocked,
    'metadata', qal.metadata
  ) as details,
  qal.source_ip as ip_address,
  null as user_agent,
  qal.detected_at as created_at,
  'quantum_attack' as log_type
FROM public.quantum_attack_logs qal;

-- Grant access to the comprehensive audit logs view
GRANT SELECT ON public.comprehensive_audit_logs TO authenticated;

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
DROP TRIGGER IF EXISTS update_user_mfa_settings_updated_at ON public.user_mfa_settings;
CREATE TRIGGER update_user_mfa_settings_updated_at
  BEFORE UPDATE ON public.user_mfa_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON public.user_api_keys;
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();