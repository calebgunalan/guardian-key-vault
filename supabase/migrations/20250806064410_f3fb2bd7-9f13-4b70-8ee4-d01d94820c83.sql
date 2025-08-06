-- Phase 2: OAuth/SSO Integration & Workflow Systems

-- Create OAuth providers table
CREATE TABLE public.oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  client_id TEXT,
  client_secret TEXT,
  authorization_url TEXT,
  token_url TEXT,
  user_info_url TEXT,
  scope TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on OAuth providers
ALTER TABLE public.oauth_providers ENABLE ROW LEVEL SECURITY;

-- RLS policies for OAuth providers
CREATE POLICY "Admins can manage OAuth providers"
ON public.oauth_providers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Everyone can view enabled OAuth providers"
ON public.oauth_providers
FOR SELECT
TO authenticated
USING (is_enabled = true);

-- Create approval workflows table
CREATE TABLE public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL, -- 'user_role', 'permission', 'api_key', etc.
  approval_steps JSONB NOT NULL DEFAULT '[]', -- Array of approval step configs
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS on approval workflows
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

-- RLS policies for approval workflows
CREATE POLICY "Admins can manage approval workflows"
ON public.approval_workflows
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view active workflows"
ON public.approval_workflows
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create approval requests table
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  resource_type TEXT NOT NULL,
  resource_data JSONB NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approval_history JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on approval requests
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for approval requests
CREATE POLICY "Admins can view all approval requests"
ON public.approval_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view their own requests"
ON public.approval_requests
FOR SELECT
TO authenticated
USING (auth.uid() = requester_id);

CREATE POLICY "Users can create approval requests"
ON public.approval_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Admins and approvers can update requests"
ON public.approval_requests
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::system_role) OR
  EXISTS (
    SELECT 1 FROM public.approval_workflows aw
    WHERE aw.id = workflow_id
    AND (aw.approval_steps->current_step->>'approver_id')::uuid = auth.uid()
  )
);

-- Create SSO mappings table for automatic role assignment
CREATE TABLE public.sso_role_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_claim_key TEXT NOT NULL, -- e.g., 'email', 'domain', 'groups'
  provider_claim_value TEXT NOT NULL, -- e.g., '@company.com', 'admin-group'
  mapped_role system_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS on SSO role mappings
ALTER TABLE public.sso_role_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for SSO role mappings
CREATE POLICY "Admins can manage SSO role mappings"
ON public.sso_role_mappings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- Function to process approval workflow
CREATE OR REPLACE FUNCTION public.process_approval_request(
  _request_id UUID,
  _action TEXT, -- 'approve' or 'reject'
  _approver_id UUID,
  _comments TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  _request RECORD;
  _workflow RECORD;
  _step_config JSONB;
  _next_step INTEGER;
  _is_final_step BOOLEAN := false;
BEGIN
  -- Get request and workflow details
  SELECT ar.*, aw.approval_steps
  INTO _request, _workflow
  FROM public.approval_requests ar
  JOIN public.approval_workflows aw ON ar.workflow_id = aw.id
  WHERE ar.id = _request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval request not found';
  END IF;

  -- Check if request is still pending
  IF _request.status != 'pending' THEN
    RAISE EXCEPTION 'Request is no longer pending';
  END IF;

  -- Get current step configuration
  _step_config := _workflow.approval_steps->_request.current_step;
  
  -- Check if user is authorized to approve this step
  IF _step_config->>'approver_id' != _approver_id::text AND NOT has_role(_approver_id, 'admin'::system_role) THEN
    RAISE EXCEPTION 'User not authorized to approve this step';
  END IF;

  -- Update approval history
  UPDATE public.approval_requests
  SET 
    approval_history = approval_history || jsonb_build_object(
      'step', _request.current_step,
      'action', _action,
      'approver_id', _approver_id,
      'comments', _comments,
      'timestamp', now()
    ),
    updated_at = now()
  WHERE id = _request_id;

  -- Handle rejection
  IF _action = 'reject' THEN
    UPDATE public.approval_requests
    SET 
      status = 'rejected',
      completed_at = now()
    WHERE id = _request_id;
    RETURN true;
  END IF;

  -- Handle approval - check if this is the final step
  _next_step := _request.current_step + 1;
  _is_final_step := _next_step >= jsonb_array_length(_workflow.approval_steps);

  IF _is_final_step THEN
    -- Final approval - execute the request
    UPDATE public.approval_requests
    SET 
      status = 'approved',
      completed_at = now(),
      current_step = _next_step
    WHERE id = _request_id;

    -- Here you would implement the actual resource creation/modification
    -- For now, we'll just mark it as approved
    
  ELSE
    -- Move to next step
    UPDATE public.approval_requests
    SET 
      current_step = _next_step,
      updated_at = now()
    WHERE id = _request_id;
  END IF;

  RETURN true;
END;
$$;

-- Function to auto-assign roles based on SSO mappings
CREATE OR REPLACE FUNCTION public.process_sso_login(
  _user_id UUID,
  _provider TEXT,
  _user_metadata JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  _mapping RECORD;
  _claim_value TEXT;
BEGIN
  -- Check for existing role assignment
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) THEN
    RETURN; -- User already has a role assigned
  END IF;

  -- Process SSO role mappings
  FOR _mapping IN 
    SELECT * FROM public.sso_role_mappings 
    WHERE provider = _provider AND is_active = true
  LOOP
    -- Extract claim value from metadata
    _claim_value := _user_metadata->>_mapping.provider_claim_key;
    
    -- Check if claim matches mapping
    IF _claim_value IS NOT NULL THEN
      -- Handle different matching patterns
      CASE _mapping.provider_claim_key
        WHEN 'email' THEN
          -- For email domain matching
          IF _mapping.provider_claim_value LIKE '@%' AND _claim_value LIKE '%' || _mapping.provider_claim_value THEN
            INSERT INTO public.user_roles (user_id, role, assigned_by) 
            VALUES (_user_id, _mapping.mapped_role, _mapping.created_by);
            RETURN;
          ELSIF _claim_value = _mapping.provider_claim_value THEN
            INSERT INTO public.user_roles (user_id, role, assigned_by) 
            VALUES (_user_id, _mapping.mapped_role, _mapping.created_by);
            RETURN;
          END IF;
        ELSE
          -- Direct value matching for other claims
          IF _claim_value = _mapping.provider_claim_value THEN
            INSERT INTO public.user_roles (user_id, role, assigned_by) 
            VALUES (_user_id, _mapping.mapped_role, _mapping.created_by);
            RETURN;
          END IF;
      END CASE;
    END IF;
  END LOOP;

  -- If no mapping found, assign default user role
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (_user_id, 'user'::system_role);
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_oauth_providers_updated_at
  BEFORE UPDATE ON public.oauth_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sso_role_mappings_updated_at
  BEFORE UPDATE ON public.sso_role_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_oauth_providers_enabled ON public.oauth_providers(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_requests_requester ON public.approval_requests(requester_id);
CREATE INDEX idx_approval_requests_workflow ON public.approval_requests(workflow_id);
CREATE INDEX idx_sso_role_mappings_provider ON public.sso_role_mappings(provider, is_active) WHERE is_active = true;

-- Insert default OAuth providers
INSERT INTO public.oauth_providers (name, display_name, scope) VALUES
('google', 'Google', 'openid email profile'),
('github', 'GitHub', 'user:email'),
('microsoft', 'Microsoft', 'openid email profile'),
('linkedin_oidc', 'LinkedIn', 'openid email profile')
ON CONFLICT (name) DO NOTHING;