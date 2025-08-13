-- Add missing foreign key constraints for proper table relations

-- Add foreign key from compliance_reports to profiles
ALTER TABLE public.compliance_reports 
ADD CONSTRAINT compliance_reports_generated_by_fkey 
FOREIGN KEY (generated_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign keys from emergency_access_tokens to profiles
ALTER TABLE public.emergency_access_tokens 
ADD CONSTRAINT emergency_access_tokens_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.emergency_access_tokens 
ADD CONSTRAINT emergency_access_tokens_used_by_fkey 
FOREIGN KEY (used_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Add foreign key from user_group_memberships to user_groups
ALTER TABLE public.user_group_memberships 
ADD CONSTRAINT user_group_memberships_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.user_groups(id) ON DELETE CASCADE;

-- Add foreign key from user_group_memberships to profiles
ALTER TABLE public.user_group_memberships 
ADD CONSTRAINT user_group_memberships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from user_group_memberships assigned_by to profiles
ALTER TABLE public.user_group_memberships 
ADD CONSTRAINT user_group_memberships_assigned_by_fkey 
FOREIGN KEY (assigned_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from user_groups to profiles
ALTER TABLE public.user_groups 
ADD CONSTRAINT user_groups_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from group_permissions to user_groups
ALTER TABLE public.group_permissions 
ADD CONSTRAINT group_permissions_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.user_groups(id) ON DELETE CASCADE;

-- Add foreign key from group_permissions to permissions
ALTER TABLE public.group_permissions 
ADD CONSTRAINT group_permissions_permission_id_fkey 
FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;

-- Add foreign key from group_permissions to profiles
ALTER TABLE public.group_permissions 
ADD CONSTRAINT group_permissions_assigned_by_fkey 
FOREIGN KEY (assigned_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;