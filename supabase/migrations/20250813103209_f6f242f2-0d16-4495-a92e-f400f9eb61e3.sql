-- Create quantum security tables for post-quantum cryptography

-- Table for storing quantum-resistant keys
CREATE TABLE public.quantum_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('kem', 'signature')),
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Table for user quantum security settings
CREATE TABLE public.user_quantum_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  quantum_enabled BOOLEAN NOT NULL DEFAULT false,
  kem_private_key_encrypted TEXT,
  signature_private_key_encrypted TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for quantum-verified sessions
CREATE TABLE public.quantum_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token_hash TEXT NOT NULL,
  quantum_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_quantum_verified BOOLEAN NOT NULL DEFAULT false
);

-- Add quantum-safe flag to existing API keys table
ALTER TABLE public.user_api_keys 
ADD COLUMN is_quantum_safe BOOLEAN DEFAULT false;

-- Add quantum-safe flag to existing MFA settings table  
ALTER TABLE public.user_mfa_settings 
ADD COLUMN is_quantum_safe BOOLEAN DEFAULT false;

-- Enable RLS on quantum tables
ALTER TABLE public.quantum_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quantum_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for quantum_keys
CREATE POLICY "Users can manage their own quantum keys" 
ON public.quantum_keys 
FOR ALL 
USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can view all quantum keys" 
ON public.quantum_keys 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::system_role));

-- RLS policies for user_quantum_settings
CREATE POLICY "Users can manage their own quantum settings" 
ON public.user_quantum_settings 
FOR ALL 
USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can view all quantum settings" 
ON public.user_quantum_settings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::system_role));

-- RLS policies for quantum_sessions
CREATE POLICY "Users can manage their own quantum sessions" 
ON public.quantum_sessions 
FOR ALL 
USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can view all quantum sessions" 
ON public.quantum_sessions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::system_role));

-- Add foreign key constraints
ALTER TABLE public.quantum_keys 
ADD CONSTRAINT quantum_keys_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.user_quantum_settings 
ADD CONSTRAINT user_quantum_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.quantum_sessions 
ADD CONSTRAINT quantum_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_quantum_keys_user_id ON public.quantum_keys(user_id);
CREATE INDEX idx_quantum_keys_type_active ON public.quantum_keys(key_type, is_active);
CREATE INDEX idx_quantum_sessions_user_id ON public.quantum_sessions(user_id);
CREATE INDEX idx_quantum_sessions_expires ON public.quantum_sessions(expires_at);

-- Add trigger for automatic updated_at timestamp
CREATE TRIGGER update_user_quantum_settings_updated_at
BEFORE UPDATE ON public.user_quantum_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();