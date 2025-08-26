-- Create missing user_mfa_settings table
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  secret TEXT,
  backup_codes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for MFA settings
CREATE POLICY "Users can manage their own MFA settings"
ON public.user_mfa_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all MFA settings"
ON public.user_mfa_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role));

-- Create missing tables for comprehensive IAM functionality

-- API Keys table
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  rate_limit INTEGER NOT NULL DEFAULT 1000,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys"
ON public.user_api_keys
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all API keys"
ON public.user_api_keys
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role));

-- Role permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role system_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- Group permissions table
CREATE TABLE IF NOT EXISTS public.group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, permission_id)
);

ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage group permissions"
ON public.group_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view group permissions for their groups"
ON public.group_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_group_memberships ugm
    WHERE ugm.group_id = group_permissions.group_id
    AND ugm.user_id = auth.uid()
  )
);

-- User session settings table
CREATE TABLE IF NOT EXISTS public.user_session_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 30,
  max_concurrent_sessions INTEGER NOT NULL DEFAULT 5,
  require_mfa_for_sensitive_ops BOOLEAN NOT NULL DEFAULT true,
  allowed_ip_ranges CIDR[],
  block_concurrent_sessions BOOLEAN NOT NULL DEFAULT false,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_session_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own session settings"
ON public.user_session_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all session settings"
ON public.user_session_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role));

-- OAuth providers table
CREATE TABLE IF NOT EXISTS public.oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  configuration JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.oauth_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage OAuth providers"
ON public.oauth_providers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view enabled OAuth providers"
ON public.oauth_providers
FOR SELECT
TO authenticated
USING (is_enabled = true);

-- Hardware tokens table
CREATE TABLE IF NOT EXISTS public.hardware_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_serial TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL DEFAULT 'yubikey',
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hardware_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own hardware tokens"
ON public.hardware_tokens
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all hardware tokens"
ON public.hardware_tokens
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role));

-- Quantum sessions table
CREATE TABLE IF NOT EXISTS public.quantum_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_key TEXT NOT NULL,
  quantum_state JSONB NOT NULL DEFAULT '{}',
  entanglement_partner UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quantum_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quantum sessions"
ON public.quantum_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = entanglement_partner)
WITH CHECK (auth.uid() = user_id OR auth.uid() = entanglement_partner);

CREATE POLICY "Admins can view all quantum sessions"
ON public.quantum_sessions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role));

-- Quantum SSO sessions table
CREATE TABLE IF NOT EXISTS public.quantum_sso_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.oauth_providers(id),
  quantum_signature TEXT NOT NULL,
  session_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '8 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quantum_sso_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quantum SSO sessions"
ON public.quantum_sso_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quantum SSO sessions"
ON public.quantum_sso_sessions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role));

-- Directory integrations table
CREATE TABLE IF NOT EXISTS public.directory_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  integration_type TEXT NOT NULL, -- 'ldap', 'ad', 'azure_ad', 'okta'
  connection_config JSONB NOT NULL DEFAULT '{}',
  sync_enabled BOOLEAN NOT NULL DEFAULT false,
  sync_frequency_hours INTEGER NOT NULL DEFAULT 24,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'error'
  sync_errors JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.directory_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage directory integrations"
ON public.directory_integrations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- Biometric templates table
CREATE TABLE IF NOT EXISTS public.biometric_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  biometric_type TEXT NOT NULL, -- 'fingerprint', 'face', 'iris', 'voice'
  template_data TEXT NOT NULL, -- Encrypted biometric template
  quality_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  enrollment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.biometric_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own biometric templates"
ON public.biometric_templates
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view biometric template metadata"
ON public.biometric_templates
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role));

-- Identity lifecycle events table
CREATE TABLE IF NOT EXISTS public.identity_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'activated', 'suspended', 'deleted', 'role_changed'
  event_data JSONB NOT NULL DEFAULT '{}',
  triggered_by UUID REFERENCES auth.users(id),
  automated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.identity_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all lifecycle events"
ON public.identity_lifecycle_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view their own lifecycle events"
ON public.identity_lifecycle_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert lifecycle events"
ON public.identity_lifecycle_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- System security configuration table
CREATE TABLE IF NOT EXISTS public.system_security_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  last_modified_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_security_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system security config"
ON public.system_security_config
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- Insert default security configurations
INSERT INTO public.system_security_config (config_key, config_value, description, last_modified_by) VALUES
('quantum_key_rotation_days', '30', 'Automatic quantum key rotation interval in days', '00000000-0000-0000-0000-000000000000'),
('attack_detection_sensitivity', '{"high": true, "block_suspicious": true, "rate_limit_threshold": 100}', 'Attack detection and response configuration', '00000000-0000-0000-0000-000000000000'),
('vpn_detection_enabled', 'true', 'Enable VPN detection for network analysis', '00000000-0000-0000-0000-000000000000'),
('audit_log_retention_days', '365', 'Audit log retention period in days', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (config_key) DO NOTHING;

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables with updated_at
CREATE TRIGGER update_user_mfa_settings_updated_at
  BEFORE UPDATE ON public.user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_session_settings_updated_at
  BEFORE UPDATE ON public.user_session_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oauth_providers_updated_at
  BEFORE UPDATE ON public.oauth_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hardware_tokens_updated_at
  BEFORE UPDATE ON public.hardware_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_directory_integrations_updated_at
  BEFORE UPDATE ON public.directory_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_biometric_templates_updated_at
  BEFORE UPDATE ON public.biometric_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_security_config_updated_at
  BEFORE UPDATE ON public.system_security_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced VPN detection function with IP geolocation
CREATE OR REPLACE FUNCTION public.get_location_from_ip(ip_address inet)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Enhanced IP geolocation with VPN detection
  -- This would integrate with real geolocation services in production
  RETURN jsonb_build_object(
    'country', CASE 
      WHEN host(ip_address) LIKE '192.168.%' OR host(ip_address) LIKE '10.%' OR host(ip_address) LIKE '172.%' 
      THEN 'Local Network'
      WHEN host(ip_address) LIKE '203.%' OR host(ip_address) LIKE '202.%'
      THEN 'Australia'
      WHEN host(ip_address) LIKE '8.8.%' OR host(ip_address) LIKE '1.1.%'
      THEN 'United States'
      ELSE 'Unknown'
    END,
    'city', CASE 
      WHEN host(ip_address) LIKE '192.168.%' OR host(ip_address) LIKE '10.%' OR host(ip_address) LIKE '172.%' 
      THEN 'Local Network'
      WHEN host(ip_address) LIKE '203.%' OR host(ip_address) LIKE '202.%'
      THEN 'Sydney'
      WHEN host(ip_address) LIKE '8.8.%' OR host(ip_address) LIKE '1.1.%'
      THEN 'Mountain View'
      ELSE 'Unknown'
    END,
    'latitude', CASE 
      WHEN host(ip_address) LIKE '203.%' OR host(ip_address) LIKE '202.%'
      THEN -33.8688
      WHEN host(ip_address) LIKE '8.8.%' OR host(ip_address) LIKE '1.1.%'
      THEN 37.4419
      ELSE 0
    END,
    'longitude', CASE 
      WHEN host(ip_address) LIKE '203.%' OR host(ip_address) LIKE '202.%'
      THEN 151.2093
      WHEN host(ip_address) LIKE '8.8.%' OR host(ip_address) LIKE '1.1.%'
      THEN -122.1430
      ELSE 0
    END,
    'is_vpn', CASE 
      -- Common VPN IP ranges and known VPN providers
      WHEN host(ip_address) LIKE '185.%' OR host(ip_address) LIKE '45.%' OR host(ip_address) LIKE '104.%'
      THEN true
      WHEN host(ip_address) LIKE '10.%' 
      THEN false
      ELSE false 
    END,
    'isp', CASE 
      WHEN host(ip_address) LIKE '8.8.%'
      THEN 'Google LLC'
      WHEN host(ip_address) LIKE '1.1.%'
      THEN 'Cloudflare'
      WHEN host(ip_address) LIKE '185.%'
      THEN 'VPN Provider'
      ELSE 'Unknown ISP'
    END
  );
END;
$$;