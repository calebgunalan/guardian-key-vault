-- Phase 1B: Time-Based Access Control & Enhanced Rate Limiting

-- Create time-based permission assignments table
CREATE TABLE public.time_based_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=Monday, 7=Sunday
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS on time-based permissions
ALTER TABLE public.time_based_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for time-based permissions
CREATE POLICY "Admins can manage time-based permissions"
ON public.time_based_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view their own time-based permissions"
ON public.time_based_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create API rate limiting logs table
CREATE TABLE public.api_rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.user_api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rate limit logs
ALTER TABLE public.api_rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for rate limit logs
CREATE POLICY "Admins can view all rate limit logs"
ON public.api_rate_limit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view their own rate limit logs"
ON public.api_rate_limit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert rate limit logs"
ON public.api_rate_limit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create session timeout settings table
CREATE TABLE public.user_session_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  max_session_duration INTERVAL NOT NULL DEFAULT '24 hours',
  idle_timeout INTERVAL NOT NULL DEFAULT '2 hours',
  max_concurrent_sessions INTEGER NOT NULL DEFAULT 5,
  require_reauth_for_sensitive BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on session settings
ALTER TABLE public.user_session_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for session settings
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

-- Function to check if user has permission at current time
CREATE OR REPLACE FUNCTION public.has_time_based_permission(
  _user_id UUID,
  _permission_action TEXT,
  _permission_resource TEXT,
  _check_time TIMESTAMPTZ DEFAULT now()
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  _day_of_week INTEGER;
  _current_time TIME;
  _user_timezone TEXT;
BEGIN
  -- Get user's timezone from session settings or default to UTC
  SELECT COALESCE(
    (SELECT 'UTC' FROM public.user_session_settings WHERE user_id = _user_id LIMIT 1),
    'UTC'
  ) INTO _user_timezone;
  
  -- Convert check time to user's timezone
  _current_time := (_check_time AT TIME ZONE _user_timezone)::TIME;
  _day_of_week := EXTRACT(DOW FROM (_check_time AT TIME ZONE _user_timezone));
  
  -- Convert Sunday from 0 to 7 for consistency
  IF _day_of_week = 0 THEN
    _day_of_week := 7;
  END IF;
  
  -- Check if user has time-based permission
  RETURN EXISTS (
    SELECT 1
    FROM public.time_based_permissions tbp
    JOIN public.permissions p ON tbp.permission_id = p.id
    WHERE tbp.user_id = _user_id
      AND p.action = _permission_action
      AND p.resource = _permission_resource
      AND tbp.is_active = true
      AND _day_of_week = ANY(tbp.days_of_week)
      AND _current_time BETWEEN tbp.start_time AND tbp.end_time
  );
END;
$$;

-- Enhanced function to check permissions including time-based
CREATE OR REPLACE FUNCTION public.has_enhanced_permission(
  _user_id UUID,
  _action TEXT,
  _resource TEXT
) RETURNS BOOLEAN
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
  
  -- Check time-based permissions
  RETURN has_time_based_permission(_user_id, _action, _resource);
END;
$$;

-- Function to log API rate limit usage
CREATE OR REPLACE FUNCTION public.log_api_rate_limit(
  _api_key_id UUID,
  _user_id UUID,
  _endpoint TEXT,
  _window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  _window_start TIMESTAMPTZ;
  _window_end TIMESTAMPTZ;
  _current_count INTEGER;
  _rate_limit INTEGER;
BEGIN
  -- Calculate current window
  _window_start := date_trunc('minute', now()) - (_window_minutes || ' minutes')::INTERVAL;
  _window_end := date_trunc('minute', now()) + INTERVAL '1 minute';
  
  -- Get rate limit for this API key
  SELECT rate_limit INTO _rate_limit
  FROM public.user_api_keys
  WHERE id = _api_key_id;
  
  -- Get current usage in this window
  SELECT COALESCE(SUM(request_count), 0) INTO _current_count
  FROM public.api_rate_limit_logs
  WHERE api_key_id = _api_key_id
    AND endpoint = _endpoint
    AND window_start >= _window_start;
  
  -- Check if rate limit exceeded
  IF _current_count >= _rate_limit THEN
    RETURN false;
  END IF;
  
  -- Log this request
  INSERT INTO public.api_rate_limit_logs (
    api_key_id,
    user_id,
    endpoint,
    request_count,
    window_start,
    window_end
  ) VALUES (
    _api_key_id,
    _user_id,
    _endpoint,
    1,
    _window_start,
    _window_end
  ) ON CONFLICT (api_key_id, endpoint, window_start) DO UPDATE SET
    request_count = api_rate_limit_logs.request_count + 1;
  
  RETURN true;
END;
$$;

-- Add updated_at trigger for time_based_permissions
CREATE TRIGGER update_time_based_permissions_updated_at
  BEFORE UPDATE ON public.time_based_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for user_session_settings
CREATE TRIGGER update_user_session_settings_updated_at
  BEFORE UPDATE ON public.user_session_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_time_based_permissions_user_id ON public.time_based_permissions(user_id);
CREATE INDEX idx_time_based_permissions_active ON public.time_based_permissions(is_active) WHERE is_active = true;
CREATE INDEX idx_api_rate_limit_logs_api_key_endpoint ON public.api_rate_limit_logs(api_key_id, endpoint);
CREATE INDEX idx_api_rate_limit_logs_window ON public.api_rate_limit_logs(window_start, window_end);
CREATE INDEX idx_user_session_settings_user_id ON public.user_session_settings(user_id);