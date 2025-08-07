-- Enterprise IAM Features Migration

-- 1. User Groups for easier permission management
CREATE TABLE public.user_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

CREATE TABLE public.user_group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL,
  UNIQUE(user_id, group_id)
);

CREATE TABLE public.group_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL,
  UNIQUE(group_id, permission_id)
);

-- 2. Password Policies
CREATE TABLE public.password_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_length INTEGER NOT NULL DEFAULT 8,
  require_uppercase BOOLEAN NOT NULL DEFAULT true,
  require_lowercase BOOLEAN NOT NULL DEFAULT true,
  require_numbers BOOLEAN NOT NULL DEFAULT true,
  require_special_chars BOOLEAN NOT NULL DEFAULT true,
  password_expiry_days INTEGER DEFAULT 90,
  password_history_count INTEGER DEFAULT 5,
  max_login_attempts INTEGER NOT NULL DEFAULT 5,
  lockout_duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. IP Access Controls
CREATE TABLE public.ip_access_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ip_address INET,
  ip_range CIDR,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('allow', 'deny')),
  applies_to TEXT NOT NULL CHECK (applies_to IN ('all', 'admin', 'specific_users', 'specific_groups')),
  target_user_ids UUID[],
  target_group_ids UUID[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Emergency Access (Break-glass)
CREATE TABLE public.emergency_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  used_by UUID,
  reason TEXT NOT NULL,
  granted_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Device Management
CREATE TABLE public.trusted_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  user_agent TEXT,
  ip_address INET,
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, device_fingerprint)
);

-- 6. Compliance Reports
CREATE TABLE public.compliance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('access_review', 'permission_audit', 'login_activity', 'failed_logins', 'privileged_access')),
  report_data JSONB NOT NULL,
  generated_by UUID NOT NULL,
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- User Groups
CREATE POLICY "Admins can manage user groups" ON public.user_groups
  FOR ALL USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view groups they belong to" ON public.user_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_group_memberships 
      WHERE group_id = user_groups.id AND user_id = auth.uid()
    )
  );

-- Group Memberships
CREATE POLICY "Admins can manage group memberships" ON public.user_group_memberships
  FOR ALL USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view their own memberships" ON public.user_group_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Group Permissions
CREATE POLICY "Admins can manage group permissions" ON public.group_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view group permissions for their groups" ON public.group_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_group_memberships 
      WHERE group_id = group_permissions.group_id AND user_id = auth.uid()
    )
  );

-- Password Policies
CREATE POLICY "Admins can manage password policies" ON public.password_policies
  FOR ALL USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view active password policies" ON public.password_policies
  FOR SELECT USING (is_active = true);

-- IP Access Rules
CREATE POLICY "Admins can manage IP access rules" ON public.ip_access_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'::system_role));

-- Emergency Access
CREATE POLICY "Admins can manage emergency access" ON public.emergency_access_tokens
  FOR ALL USING (has_role(auth.uid(), 'admin'::system_role));

-- Trusted Devices
CREATE POLICY "Users can manage their own devices" ON public.trusted_devices
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all devices" ON public.trusted_devices
  FOR SELECT USING (has_role(auth.uid(), 'admin'::system_role));

-- Compliance Reports
CREATE POLICY "Admins can manage compliance reports" ON public.compliance_reports
  FOR ALL USING (has_role(auth.uid(), 'admin'::system_role));

-- Functions
CREATE OR REPLACE FUNCTION public.check_user_group_permissions(_user_id UUID, _action TEXT, _resource TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if user has permission through group membership
  RETURN EXISTS (
    SELECT 1
    FROM public.user_group_memberships ugm
    JOIN public.group_permissions gp ON ugm.group_id = gp.group_id
    JOIN public.permissions p ON gp.permission_id = p.id
    WHERE ugm.user_id = _user_id
      AND p.action = _action
      AND p.resource = _resource
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_enhanced_permission_v2(_user_id UUID, _action TEXT, _resource TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Admin users have all permissions
  IF has_role(_user_id, 'admin'::system_role) THEN
    RETURN true;
  END IF;
  
  -- Check regular role-based permissions
  IF EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.permissions p ON rp.permission_id = p.id
    JOIN public.user_roles ur ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND p.action = _action
      AND p.resource = _resource
  ) THEN
    RETURN true;
  END IF;
  
  -- Check group-based permissions
  IF check_user_group_permissions(_user_id, _action, _resource) THEN
    RETURN true;
  END IF;
  
  -- Check time-based permissions
  RETURN has_time_based_permission(_user_id, _action, _resource);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_emergency_token(_reason TEXT, _permissions JSONB, _expires_in_hours INTEGER DEFAULT 4)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  _token TEXT;
  _token_hash TEXT;
BEGIN
  -- Generate random token
  _token := encode(gen_random_bytes(32), 'base64');
  _token_hash := encode(digest(_token, 'sha256'), 'hex');
  
  -- Store token
  INSERT INTO public.emergency_access_tokens (
    token_hash,
    created_by,
    reason,
    granted_permissions,
    expires_at
  ) VALUES (
    _token_hash,
    auth.uid(),
    _reason,
    _permissions,
    now() + (_expires_in_hours || ' hours')::INTERVAL
  );
  
  RETURN _token;
END;
$$;

-- Triggers
CREATE TRIGGER update_user_groups_updated_at
  BEFORE UPDATE ON public.user_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_password_policies_updated_at
  BEFORE UPDATE ON public.password_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ip_access_rules_updated_at
  BEFORE UPDATE ON public.ip_access_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default password policy
INSERT INTO public.password_policies (
  min_length,
  require_uppercase,
  require_lowercase,
  require_numbers,
  require_special_chars,
  password_expiry_days,
  password_history_count,
  max_login_attempts,
  lockout_duration_minutes
) VALUES (
  12, true, true, true, true, 90, 5, 3, 15
);

-- Create indexes for performance
CREATE INDEX idx_user_group_memberships_user_id ON public.user_group_memberships(user_id);
CREATE INDEX idx_user_group_memberships_group_id ON public.user_group_memberships(group_id);
CREATE INDEX idx_group_permissions_group_id ON public.group_permissions(group_id);
CREATE INDEX idx_group_permissions_permission_id ON public.group_permissions(permission_id);
CREATE INDEX idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON public.trusted_devices(device_fingerprint);
CREATE INDEX idx_ip_access_rules_active ON public.ip_access_rules(is_active) WHERE is_active = true;