/*
# Trial 7 days, Custom RBAC Roles, Sales Codes, Founder Protection

## Summary
1. Schools: add sales_code_id, trial_started_at columns
2. Sales codes table — commercial tracking codes for school onboarding
3. Custom RBAC roles + permissions — Super Admin creates roles (comptable, commercial, etc.)
4. Profiles: link to custom_role_id
5. Founder Super Admin email protection — 3 founder emails can never be deleted
6. Trial helper functions: school_trial_days_left, school_trial_expired
7. Audit log columns
8. Sales code performance function

## Security
- RLS on all new tables: Super Admin only for sales_codes, custom_roles, custom_role_permissions
- BEFORE DELETE trigger on super_admin_emails blocks founder email deletion
*/

-- ─── 1. Schools: add sales code + trial start ──────────────
ALTER TABLE schools ADD COLUMN IF NOT EXISTS sales_code_id uuid;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now();

-- ─── 2. Sales codes table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  agent_name text NOT NULL,
  agent_email text,
  commission_rate numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sa_select_sales_codes" ON sales_codes;
CREATE POLICY "sa_select_sales_codes" ON sales_codes FOR SELECT TO authenticated USING (public.is_super_admin());
DROP POLICY IF EXISTS "sa_insert_sales_codes" ON sales_codes;
CREATE POLICY "sa_insert_sales_codes" ON sales_codes FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "sa_update_sales_codes" ON sales_codes;
CREATE POLICY "sa_update_sales_codes" ON sales_codes FOR UPDATE TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "sa_delete_sales_codes" ON sales_codes;
CREATE POLICY "sa_delete_sales_codes" ON sales_codes FOR DELETE TO authenticated USING (public.is_super_admin());

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schools_sales_code_id_fkey') THEN
    ALTER TABLE schools ADD CONSTRAINT schools_sales_code_id_fkey FOREIGN KEY (sales_code_id) REFERENCES sales_codes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 3. Custom RBAC roles ─────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sa_select_custom_roles" ON custom_roles;
CREATE POLICY "sa_select_custom_roles" ON custom_roles FOR SELECT TO authenticated USING (public.is_super_admin() OR is_active = true);
DROP POLICY IF EXISTS "sa_insert_custom_roles" ON custom_roles;
CREATE POLICY "sa_insert_custom_roles" ON custom_roles FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "sa_update_custom_roles" ON custom_roles;
CREATE POLICY "sa_update_custom_roles" ON custom_roles FOR UPDATE TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "sa_delete_custom_roles" ON custom_roles;
CREATE POLICY "sa_delete_custom_roles" ON custom_roles FOR DELETE TO authenticated USING (public.is_super_admin());

CREATE TABLE IF NOT EXISTS custom_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  module text NOT NULL,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (role_id, module)
);

ALTER TABLE custom_role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sa_select_crp" ON custom_role_permissions;
CREATE POLICY "sa_select_crp" ON custom_role_permissions FOR SELECT TO authenticated USING (public.is_super_admin() OR EXISTS (SELECT 1 FROM custom_roles WHERE custom_roles.id = custom_role_permissions.role_id AND custom_roles.is_active = true));
DROP POLICY IF EXISTS "sa_insert_crp" ON custom_role_permissions;
CREATE POLICY "sa_insert_crp" ON custom_role_permissions FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "sa_update_crp" ON custom_role_permissions;
CREATE POLICY "sa_update_crp" ON custom_role_permissions FOR UPDATE TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "sa_delete_crp" ON custom_role_permissions;
CREATE POLICY "sa_delete_crp" ON custom_role_permissions FOR DELETE TO authenticated USING (public.is_super_admin());

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_role_id uuid;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_custom_role_id_fkey') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_custom_role_id_fkey FOREIGN KEY (custom_role_id) REFERENCES custom_roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Seed default custom roles
INSERT INTO custom_roles (name, description, is_system) VALUES
  ('comptable', 'Gestion financiere et comptabilite', true),
  ('gestionnaire_plateforme', 'Supervision et gestion de la plateforme', true),
  ('commercial', 'Suivi commercial et performances ventes', true)
ON CONFLICT (name) DO NOTHING;

-- ─── 4. Founder Super Admin protection ────────────────────
CREATE OR REPLACE FUNCTION public.protect_founder_emails()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.email IN ('vincentnogue@yahoo.com', 'vincentnogue2@gmail.com', 'webdxb1@gmail.com') THEN
    RAISE EXCEPTION 'Cannot delete founder Super Admin email: %', OLD.email;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_founder_emails_trigger ON super_admin_emails;
CREATE TRIGGER protect_founder_emails_trigger
  BEFORE DELETE ON super_admin_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_founder_emails();

-- ─── 5. Trial helper functions ────────────────────────────
CREATE OR REPLACE FUNCTION public.school_trial_days_left(p_school_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT GREATEST(0, EXTRACT(day FROM (trial_ends_at - now()))::integer)
  FROM schools WHERE id = p_school_id;
$$;

CREATE OR REPLACE FUNCTION public.school_trial_expired(p_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT subscription_status = 'trial' AND trial_ends_at < now()
  FROM schools WHERE id = p_school_id;
$$;

-- ─── 6. Audit log columns ─────────────────────────────────
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id uuid;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details jsonb;

-- ─── 7. Sales code performance function ───────────────────
CREATE OR REPLACE FUNCTION public.sales_code_performance(p_code_id uuid)
RETURNS TABLE (schools_count bigint, total_revenue numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COUNT(s.id),
    COALESCE(SUM(p.amount), 0)
  FROM schools s
  LEFT JOIN payments p ON p.school_id = s.id
  WHERE s.sales_code_id = p_code_id;
$$;
