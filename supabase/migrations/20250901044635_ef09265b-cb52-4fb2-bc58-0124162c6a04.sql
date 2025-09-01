-- Fixed comprehensive IAM system database migration

-- MFA settings table (drop existing policies first)
DROP POLICY IF EXISTS "Users can manage their own MFA settings" ON public.user_mfa_settings;

-- Recreate MFA policies
CREATE POLICY "Users can manage their own MFA settings"
ON public.user_mfa_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix profiles policies for admin creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins can insert profiles" ON public.profiles;

CREATE POLICY "Users and admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::system_role));

-- Enhanced VPN detection function (fixed)
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
  
  -- Check for private/local networks first
  IF ip_text LIKE '10.%' OR 
     ip_text LIKE '172.16.%' OR ip_text LIKE '172.17.%' OR ip_text LIKE '172.18.%' OR 
     ip_text LIKE '172.19.%' OR ip_text LIKE '172.20.%' OR ip_text LIKE '172.21.%' OR 
     ip_text LIKE '172.22.%' OR ip_text LIKE '172.23.%' OR ip_text LIKE '172.24.%' OR 
     ip_text LIKE '172.25.%' OR ip_text LIKE '172.26.%' OR ip_text LIKE '172.27.%' OR 
     ip_text LIKE '172.28.%' OR ip_text LIKE '172.29.%' OR ip_text LIKE '172.30.%' OR 
     ip_text LIKE '172.31.%' OR ip_text LIKE '192.168.%' THEN
    country_code := 'Local Network';
    city_name := 'Private Network';
    is_vpn_detected := false;
  ELSE
    -- Enhanced VPN/proxy detection patterns
    IF ip_text ~ '^(46\.29\.|185\.220\.|199\.87\.|198\.98\.|107\.189\.|192\.42\.116\.)' OR
       ip_text ~ '^(5\.135\.|51\.89\.|51\.210\.|163\.172\.|195\.154\.|212\.129\.)' OR
       ip_text ~ '^(104\.28\.|172\.67\.|104\.21\.|162\.158\.|1\.1\.1\.)' OR -- Cloudflare
       ip_text ~ '^(31\.13\.|69\.63\.|173\.252\.)' OR -- Meta/Facebook ranges often used by VPNs
       ip_text ~ '^(185\.|94\.|95\.|46\.|78\.|188\.)' OR -- European VPN ranges
       ip_text ~ '^(91\.|92\.|93\.|109\.|176\.|178\.)' OR -- More European VPN ranges
       ip_text ~ '^(198\.18\.|198\.19\.|203\.0\.113\.|192\.0\.2\.|198\.51\.100\.)' THEN -- Test ranges
      is_vpn_detected := true;
      country_code := 'VPN/Proxy';
      city_name := 'VPN Service';
    ELSE
      -- Basic geographic classification
      CASE 
        WHEN ip_text ~ '^(8\.|4\.|23\.|24\.|50\.|63\.|64\.|65\.|66\.|67\.|68\.|69\.)' THEN 
          country_code := 'US';
          city_name := 'United States';
        WHEN ip_text ~ '^(80\.|81\.|82\.|83\.|84\.|85\.|86\.|87\.|88\.|89\.|90\.)' THEN
          country_code := 'EU';
          city_name := 'Europe';
        WHEN ip_text ~ '^(1\.|14\.|27\.|36\.|42\.|43\.|49\.|58\.|59\.|60\.|61\.)' THEN
          country_code := 'AS';
          city_name := 'Asia-Pacific';
        ELSE 
          country_code := 'Unknown';
          city_name := 'Unknown Region';
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

-- Create AI-powered risk calculation function
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
    'avg_session_duration', COALESCE(avg(EXTRACT(EPOCH FROM (COALESCE(expires_at, now()) - created_at))/3600), 0)
  ) INTO session_data
  FROM public.user_sessions
  WHERE user_id = _user_id
    AND created_at > now() - INTERVAL '30 days';

  -- Analyze device fingerprints
  SELECT jsonb_build_object(
    'trusted_devices', count(*) FILTER (WHERE is_trusted = true),
    'total_devices', count(*),
    'avg_trust_score', COALESCE(avg(trust_score), 50)
  ) INTO device_data
  FROM public.device_fingerprints
  WHERE user_id = _user_id;

  -- Calculate base risk score using AI-like factors
  risk_score := 0;

  -- Factor 1: VPN/Proxy detection (30% weight)
  IF (_current_context->>'is_vpn')::boolean = true THEN
    risk_score := risk_score + 25;
    risk_factors := risk_factors || jsonb_build_array(jsonb_build_object(
      'type', 'vpn_detected',
      'severity', 'medium',
      'description', 'VPN or proxy usage detected - increased anonymity risk',
      'score', 25,
      'confidence', 0.85
    ));
  END IF;

  -- Factor 2: Unusual time access (20% weight)
  IF EXTRACT(HOUR FROM now()) NOT BETWEEN 6 AND 22 THEN
    risk_score := risk_score + 15;
    risk_factors := risk_factors || jsonb_build_array(jsonb_build_object(
      'type', 'unusual_time',
      'severity', 'low',
      'description', 'Login outside normal business hours',
      'score', 15,
      'confidence', 0.65
    ));
  END IF;

  -- Factor 3: Device trust analysis (25% weight)
  IF COALESCE((device_data->>'avg_trust_score')::numeric, 50) < 50 THEN
    risk_score := risk_score + 20;
    risk_factors := risk_factors || jsonb_build_array(jsonb_build_object(
      'type', 'untrusted_device',
      'severity', 'medium',
      'description', 'Login from device with low trust score',
      'score', 20,
      'confidence', 0.78
    ));
  END IF;

  -- Factor 4: Multiple IP anomaly (25% weight)
  IF COALESCE((session_data->>'unique_ips')::integer, 0) > 5 THEN
    risk_score := risk_score + 30;
    risk_factors := risk_factors || jsonb_build_array(jsonb_build_object(
      'type', 'multiple_ips',
      'severity', 'high',
      'description', 'Multiple unique IP addresses in recent sessions',
      'score', 30,
      'confidence', 0.92
    ));
  END IF;

  -- Factor 5: Rapid session creation
  IF COALESCE((session_data->>'recent_sessions')::integer, 0) > 10 THEN
    risk_score := risk_score + 15;
    risk_factors := risk_factors || jsonb_build_array(jsonb_build_object(
      'type', 'rapid_sessions',
      'severity', 'medium',
      'description', 'Unusually high number of recent sessions',
      'score', 15,
      'confidence', 0.71
    ));
  END IF;

  -- Ensure score bounds
  risk_score := GREATEST(0, LEAST(100, risk_score));

  -- Build comprehensive AI assessment
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
      'behavioral_confidence', COALESCE((behavior_patterns->0->>'confidence')::numeric, 0.5),
      'session_anomaly_score', CASE 
        WHEN COALESCE((session_data->>'unique_ips')::integer, 0) > 3 THEN 'high' 
        WHEN COALESCE((session_data->>'unique_ips')::integer, 0) > 1 THEN 'medium'
        ELSE 'normal' 
      END,
      'device_trust_level', CASE 
        WHEN COALESCE((device_data->>'avg_trust_score')::numeric, 50) > 70 THEN 'high' 
        WHEN COALESCE((device_data->>'avg_trust_score')::numeric, 50) > 40 THEN 'medium'
        ELSE 'low' 
      END,
      'ml_confidence', 0.84,
      'threat_indicators', jsonb_array_length(risk_factors),
      'network_type', CASE
        WHEN (_current_context->>'is_vpn')::boolean = true THEN 'vpn'
        WHEN (_current_context->>'country')::text = 'Local Network' THEN 'local'
        ELSE 'direct'
      END
    ),
    'recommendations', CASE
      WHEN risk_score >= 70 THEN jsonb_build_array('Immediate security review', 'Suspend account temporarily', 'Require admin verification')
      WHEN risk_score >= 40 THEN jsonb_build_array('Enable additional MFA', 'Monitor closely', 'Verify recent activities')
      WHEN risk_score >= 20 THEN jsonb_build_array('Consider enabling 2FA', 'Review login history')
      ELSE jsonb_build_array('Normal monitoring')
    END,
    'calculated_at', now(),
    'expires_at', now() + INTERVAL '4 hours'
  );

  RETURN final_assessment;
END;
$$;

-- Update system security config for shorter key rotation
INSERT INTO public.system_security_config (config_key, config_value, description)
VALUES 
  ('quantum_key_rotation', jsonb_build_object('rotation_interval_days', 7), 'Quantum key rotation interval - reduced for enhanced security')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = jsonb_build_object('rotation_interval_days', 7),
  description = 'Quantum key rotation interval - reduced for enhanced security';

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

-- Create comprehensive audit view including security attacks
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

-- Grant access to comprehensive audit logs
GRANT SELECT ON public.comprehensive_audit_logs TO authenticated;

-- Insert default permissions and workflows only if they don't exist
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('View Dashboard', 'Access main dashboard', 'dashboard', 'read'),
  ('Manage Users', 'Create, edit, delete users', 'users', 'manage'),
  ('View Audit Logs', 'Access audit log data', 'audit_logs', 'read'),
  ('Export Data', 'Export system data', 'data', 'export'),
  ('Manage API Keys', 'Create and manage API keys', 'api_keys', 'manage'),
  ('Quantum Security', 'Access quantum security features', 'quantum', 'access'),
  ('Approval Management', 'Manage approval workflows', 'approvals', 'manage'),
  ('Risk Assessment', 'Access AI-powered risk analysis', 'risk', 'analyze'),
  ('Certificate Management', 'Manage quantum certificates', 'certificates', 'manage')
ON CONFLICT (name) DO NOTHING;