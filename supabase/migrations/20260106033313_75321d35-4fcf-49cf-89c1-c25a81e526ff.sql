-- Create enum types
CREATE TYPE public.access_tier AS ENUM ('standard', 'premium');
CREATE TYPE public.access_duration AS ENUM ('hourly', 'daily', 'weekly', 'monthly', 'unlimited');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Scripts table
CREATE TABLE public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  script_content TEXT NOT NULL,
  access_tier access_tier NOT NULL DEFAULT 'standard',
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_executions BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scripts"
ON public.scripts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scripts"
ON public.scripts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts"
ON public.scripts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts"
ON public.scripts FOR DELETE
USING (auth.uid() = user_id);

-- Whitelist entries table
CREATE TABLE public.whitelist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  discord_id TEXT,
  roblox_id TEXT,
  access_tier access_tier NOT NULL DEFAULT 'standard',
  duration_type access_duration NOT NULL DEFAULT 'unlimited',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT require_identifier CHECK (discord_id IS NOT NULL OR roblox_id IS NOT NULL)
);

ALTER TABLE public.whitelist_entries ENABLE ROW LEVEL SECURITY;

-- Function to check script ownership
CREATE OR REPLACE FUNCTION public.owns_script(_script_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.scripts
    WHERE id = _script_id AND user_id = auth.uid()
  )
$$;

CREATE POLICY "Users can view whitelist for their scripts"
ON public.whitelist_entries FOR SELECT
USING (public.owns_script(script_id));

CREATE POLICY "Users can create whitelist for their scripts"
ON public.whitelist_entries FOR INSERT
WITH CHECK (public.owns_script(script_id));

CREATE POLICY "Users can update whitelist for their scripts"
ON public.whitelist_entries FOR UPDATE
USING (public.owns_script(script_id));

CREATE POLICY "Users can delete whitelist for their scripts"
ON public.whitelist_entries FOR DELETE
USING (public.owns_script(script_id));

-- Execution logs table
CREATE TABLE public.execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  whitelist_entry_id UUID REFERENCES public.whitelist_entries(id) ON DELETE SET NULL,
  roblox_player_id TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT
);

ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their scripts"
ON public.execution_logs FOR SELECT
USING (public.owns_script(script_id));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scripts_updated_at
BEFORE UPDATE ON public.scripts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whitelist_entries_updated_at
BEFORE UPDATE ON public.whitelist_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile and default role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();