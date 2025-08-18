-- Fix function security warnings by adding SET search_path
CREATE OR REPLACE FUNCTION get_location_from_ip(ip_address INET)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION calculate_network_trust(user_ip INET)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  trust_score INTEGER := 50; -- Base score
  location_data JSONB;
BEGIN
  location_data := public.get_location_from_ip(user_ip);
  
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