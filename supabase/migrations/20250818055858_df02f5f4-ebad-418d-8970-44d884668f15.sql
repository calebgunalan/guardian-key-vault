-- Create table for storing real attack logs
CREATE TABLE IF NOT EXISTS public.security_attacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attack_type TEXT NOT NULL,
  source_ip INET,
  target_resource TEXT,
  blocked BOOLEAN NOT NULL DEFAULT false,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  attack_data JSONB DEFAULT '{}',
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quantum_protected BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.security_attacks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all attacks" 
ON public.security_attacks 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "System can insert attacks" 
ON public.security_attacks 
FOR INSERT 
WITH CHECK (true);

-- Create table for trust score factors
CREATE TABLE IF NOT EXISTS public.trust_score_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  factor_type TEXT NOT NULL,
  factor_name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  weight NUMERIC NOT NULL DEFAULT 1.0,
  details JSONB DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trust_score_factors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their trust factors" 
ON public.trust_score_factors 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trust factors" 
ON public.trust_score_factors 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "System can manage trust factors" 
ON public.trust_score_factors 
FOR ALL 
WITH CHECK (true);

-- Create function to get user location from IP
CREATE OR REPLACE FUNCTION get_location_from_ip(ip_address INET)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a simplified location detection
  -- In production, you'd use a GeoIP service
  RETURN jsonb_build_object(
    'country', CASE 
      WHEN host(ip_address) LIKE '192.168.%' OR host(ip_address) LIKE '10.%' OR host(ip_address) LIKE '172.%' 
      THEN 'Local Network'
      ELSE 'Unknown'
    END,
    'city', 'Unknown',
    'latitude', 0,
    'longitude', 0,
    'is_vpn', CASE 
      WHEN host(ip_address) LIKE '10.%' 
      THEN true 
      ELSE false 
    END
  );
END;
$$;

-- Create function to calculate network trust
CREATE OR REPLACE FUNCTION calculate_network_trust(user_ip INET)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trust_score INTEGER := 50; -- Base score
  location_data JSONB;
BEGIN
  location_data := get_location_from_ip(user_ip);
  
  -- Adjust score based on network type
  IF host(user_ip) LIKE '192.168.%' OR host(user_ip) LIKE '10.%' THEN
    trust_score := trust_score + 30; -- Private network bonus
  END IF;
  
  -- Reduce score for VPN usage
  IF (location_data->>'is_vpn')::boolean THEN
    trust_score := trust_score - 20;
  END IF;
  
  -- Ensure score is within bounds
  trust_score := GREATEST(0, LEAST(100, trust_score));
  
  RETURN trust_score;
END;
$$;

-- Insert some sample attack data for demonstration
INSERT INTO public.security_attacks (attack_type, source_ip, target_resource, blocked, severity, quantum_protected, attack_data) VALUES
('brute_force', '192.168.1.100', '/auth/login', true, 'medium', true, '{"attempts": 15, "blocked_by": "quantum_defense"}'),
('sql_injection', '10.0.0.5', '/api/users', true, 'high', true, '{"payload": "SELECT * FROM users", "blocked_by": "quantum_firewall"}'),
('xss_attempt', '172.16.0.10', '/dashboard', false, 'low', false, '{"script": "<script>alert(1)</script>"}'),
('ddos_attempt', '203.0.113.1', '/', true, 'critical', true, '{"requests_per_second": 1000, "blocked_by": "quantum_rate_limiter"}')