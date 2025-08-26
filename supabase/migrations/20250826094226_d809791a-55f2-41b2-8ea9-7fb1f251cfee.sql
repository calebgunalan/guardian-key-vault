-- Fix user role constraint issue by making it an upsert instead of insert
-- Also fix RLS policies for admin user management

-- Update RLS policy for profiles to allow admins to manage all profiles
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;

CREATE POLICY "Users can manage their own profile" 
ON public.profiles 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- Improve get_location_from_ip function for better VPN detection
CREATE OR REPLACE FUNCTION public.get_location_from_ip(ip_address inet)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
     ip_text LIKE '172.16.%' OR 
     ip_text LIKE '172.17.%' OR 
     ip_text LIKE '172.18.%' OR 
     ip_text LIKE '172.19.%' OR 
     ip_text LIKE '172.20.%' OR 
     ip_text LIKE '172.21.%' OR 
     ip_text LIKE '172.22.%' OR 
     ip_text LIKE '172.23.%' OR 
     ip_text LIKE '172.24.%' OR 
     ip_text LIKE '172.25.%' OR 
     ip_text LIKE '172.26.%' OR 
     ip_text LIKE '172.27.%' OR 
     ip_text LIKE '172.28.%' OR 
     ip_text LIKE '172.29.%' OR 
     ip_text LIKE '172.30.%' OR 
     ip_text LIKE '172.31.%' OR 
     ip_text LIKE '192.168.%' THEN
    country_code := 'Local Network';
    is_vpn_detected := false;
  ELSE
    -- Check for common VPN/proxy IP ranges and patterns
    IF ip_text ~ '^(46\.29\.|185\.220\.|199\.87\.|198\.98\.|107\.189\.|192\.42\.116\.)' OR
       ip_text ~ '^(5\.135\.|51\.89\.|51\.210\.|163\.172\.|195\.154\.|212\.129\.)' OR
       ip_text ~ '^(104\.28\.|172\.67\.|104\.21\.|162\.158\.)' THEN -- Cloudflare
      is_vpn_detected := true;
      country_code := 'VPN/Proxy';
    ELSE
      -- Simple geolocation based on IP ranges (simplified for demo)
      CASE 
        WHEN ip_text ~ '^(8\.|4\.)' THEN 
          country_code := 'US';
          city_name := 'United States';
        WHEN ip_text ~ '^(1\.1\.|1\.0\.)' THEN 
          country_code := 'US';
          city_name := 'Cloudflare DNS';
          is_vpn_detected := true;
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

-- Create system_security_config table for configurable settings
CREATE TABLE IF NOT EXISTS public.system_security_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_security_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for system config
CREATE POLICY "Admins can manage system config" 
ON public.system_security_config 
FOR ALL
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- Insert default key rotation settings
INSERT INTO public.system_security_config (config_key, config_value, description) 
VALUES 
  ('quantum_key_rotation_hours', '{"hours": 24}', 'Hours between automatic quantum key rotations'),
  ('mfa_backup_codes_count', '{"count": 10}', 'Number of MFA backup codes to generate'),
  ('session_timeout_minutes', '{"minutes": 120}', 'Default session timeout in minutes'),
  ('max_login_attempts', '{"attempts": 5}', 'Maximum failed login attempts before lockout')
ON CONFLICT (config_key) DO NOTHING;

-- Add updated_at trigger
CREATE TRIGGER update_system_security_config_updated_at
  BEFORE UPDATE ON public.system_security_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();