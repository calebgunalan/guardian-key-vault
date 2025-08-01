-- Create audit_logs table for tracking all system activities
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource);

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _resource text,
  _resource_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL,
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    _action,
    _resource,
    _resource_id,
    _details,
    _ip_address,
    _user_agent
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Add some default permissions
INSERT INTO public.permissions (name, action, resource, description) VALUES
  ('manage_users', 'MANAGE', 'users', 'Manage user accounts and profiles'),
  ('manage_roles', 'MANAGE', 'roles', 'Manage user roles and assignments'),
  ('view_audit_logs', 'VIEW', 'audit_logs', 'View system audit logs'),
  ('manage_permissions', 'MANAGE', 'permissions', 'Manage system permissions'),
  ('view_dashboard', 'VIEW', 'dashboard', 'Access administrative dashboard')
ON CONFLICT (name) DO NOTHING;

-- Assign admin permissions to admin role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::system_role, p.id 
FROM public.permissions p
WHERE p.name IN ('manage_users', 'manage_roles', 'view_audit_logs', 'manage_permissions', 'view_dashboard')
ON CONFLICT DO NOTHING;

-- Assign limited permissions to moderator role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'moderator'::system_role, p.id 
FROM public.permissions p
WHERE p.name IN ('manage_users', 'view_dashboard')
ON CONFLICT DO NOTHING;