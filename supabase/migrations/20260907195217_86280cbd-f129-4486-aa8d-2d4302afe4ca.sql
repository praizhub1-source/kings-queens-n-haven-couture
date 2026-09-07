-- 1. Drop policies that depend on has_role(uuid, app_role)
DROP POLICY IF EXISTS "categories admin write" ON public.categories;
DROP POLICY IF EXISTS "products admin write" ON public.products;
DROP POLICY IF EXISTS "settings admin write" ON public.store_settings;
DROP POLICY IF EXISTS "products authed read" ON public.products;
DROP POLICY IF EXISTS "store media admin write" ON storage.objects;

-- 2. Replace the role enum with owner/admin/staff
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'staff');
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;
DROP TYPE public.app_role_old;

-- 3. Role helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'owner')
$$;

-- 4. Team profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  display_name text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- staff check depends on profiles.status
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    LEFT JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role IN ('owner', 'admin', 'staff')
      AND COALESCE(p.status, 'active') = 'active'
  )
$$;

CREATE POLICY "profiles read own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles staff read" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "profiles update own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles owner write" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));

-- 5. user_roles management
CREATE POLICY "roles staff read" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "roles owner write" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));

-- 6. Invitations (server-side only)
CREATE TABLE public.staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'staff',
  invited_by uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.staff_invites TO service_role;
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER staff_invites_updated BEFORE UPDATE ON public.staff_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Ownership transfers (server-side only)
CREATE TABLE public.ownership_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL,
  to_email text NOT NULL,
  to_user uuid,
  status text NOT NULL DEFAULT 'pending',
  previous_owner_action text NOT NULL DEFAULT 'demote',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ownership_transfers TO service_role;
ALTER TABLE public.ownership_transfers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER ownership_transfers_updated BEFORE UPDATE ON public.ownership_transfers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Store write policies for active team members
CREATE POLICY "products staff write" ON public.products
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "products authed read" ON public.products
  FOR SELECT TO authenticated USING (published = true OR public.is_staff(auth.uid()));
CREATE POLICY "categories staff write" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "settings staff write" ON public.store_settings
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 9. Never leave the store without an owner
CREATE OR REPLACE FUNCTION public.guard_last_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role = 'owner')
     OR (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role <> 'owner') THEN
    IF (SELECT count(*) FROM public.user_roles WHERE role = 'owner') <= 1 THEN
      RAISE EXCEPTION 'The store must always have an owner';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER user_roles_guard_owner
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_last_owner();

-- 10. Media bucket management for active team members
CREATE POLICY "store media staff write" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'store-media' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'store-media' AND public.is_staff(auth.uid()));