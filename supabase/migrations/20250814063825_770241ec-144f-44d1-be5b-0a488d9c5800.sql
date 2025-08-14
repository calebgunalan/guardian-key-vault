-- Enable leaked password protection for enhanced security
-- This is a Supabase auth configuration that needs to be enabled at the project level
-- Since we can't directly modify auth.config through SQL, we'll create a reminder in the database

-- Create a system configuration table to track security settings
CREATE TABLE IF NOT EXISTS public.system_security_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  is_applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_security_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage system security config
CREATE POLICY "Admins can manage system security config" 
ON public.system_security_config 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::system_role))
WITH CHECK (has_role(auth.uid(), 'admin'::system_role));

-- Insert the leaked password protection reminder
INSERT INTO public.system_security_config (config_key, config_value, description, is_applied)
VALUES (
  'leaked_password_protection',
  '{"enabled": true, "breach_databases": ["haveibeenpwned"], "action": "block"}',
  'Enable leaked password protection to prevent users from using compromised passwords',
  false
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = now();