
/*
# SKUL AFRIK — Initial Schema (Phase 1)

Foundational multi-tenant schema. Tables: profiles, plans, promo_codes, schools,
audit_logs, school_documents, super_admin_emails. RLS on every table.
Trigger: auto-create profile on auth signup, assign super_admin to whitelisted emails.
*/

-- =============================================
-- TABLE: profiles  (first — referenced by helper)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid,
  role text NOT NULL DEFAULT 'student' CHECK (role IN (
    'super_admin','school_admin','teacher','staff','parent','student'
  )),
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  avatar_url text,
  language text NOT NULL DEFAULT 'fr',
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_school_id_idx ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTION: is_super_admin()
-- =============================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- =============================================
-- TABLE: plans
-- =============================================
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_annual numeric(10,2) NOT NULL DEFAULT 0,
  max_students integer NOT NULL DEFAULT 100,
  max_teachers integer NOT NULL DEFAULT 10,
  max_campus integer NOT NULL DEFAULT 1,
  max_storage_gb integer NOT NULL DEFAULT 5,
  features jsonb NOT NULL DEFAULT '[]',
  modules jsonb NOT NULL DEFAULT '[]',
  notification_channels jsonb NOT NULL DEFAULT '["email"]',
  support_level text NOT NULL DEFAULT 'ticket',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_public_read" ON public.plans;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "plans_super_admin_write" ON public.plans;
CREATE POLICY "plans_super_admin_write" ON public.plans FOR ALL
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- TABLE: promo_codes
-- =============================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  description text,
  discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_codes_public_read" ON public.promo_codes;
CREATE POLICY "promo_codes_public_read" ON public.promo_codes FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "promo_codes_super_admin_write" ON public.promo_codes;
CREATE POLICY "promo_codes_super_admin_write" ON public.promo_codes FOR ALL
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- TABLE: schools (tenants)
-- =============================================
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text NOT NULL,
  type text NOT NULL DEFAULT 'secondary' CHECK (type IN ('primary','secondary','high_school','university','vocational','other')),
  country text NOT NULL,
  region text,
  city text,
  currency text NOT NULL DEFAULT 'XOF',
  timezone text NOT NULL DEFAULT 'Africa/Abidjan',
  phone_prefix text,
  phone text,
  email text,
  website text,
  address text,
  logo_url text,
  cover_url text,
  director_name text,
  director_email text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  verification_notes text,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  subscription_status text NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial','active','past_due','canceled','suspended')),
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  grading_system text NOT NULL DEFAULT 'out_of_20',
  academic_system text NOT NULL DEFAULT 'trimester',
  language text NOT NULL DEFAULT 'fr',
  stripe_customer_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS schools_owner_user_id_idx ON public.schools(owner_user_id);
CREATE INDEX IF NOT EXISTS schools_verification_status_idx ON public.schools(verification_status);
CREATE INDEX IF NOT EXISTS schools_country_idx ON public.schools(country);
CREATE INDEX IF NOT EXISTS schools_subscription_status_idx ON public.schools(subscription_status);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Add FK from profiles to schools (conditional via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_school_id_fkey'
      AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_school_id_fkey
      FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Policies: schools
DROP POLICY IF EXISTS "schools_member_select" ON public.schools;
CREATE POLICY "schools_member_select" ON public.schools FOR SELECT
  TO authenticated USING (
    owner_user_id = auth.uid()
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.school_id = schools.id
    )
  );

DROP POLICY IF EXISTS "schools_owner_insert" ON public.schools;
CREATE POLICY "schools_owner_insert" ON public.schools FOR INSERT
  TO authenticated WITH CHECK (owner_user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "schools_owner_update" ON public.schools;
CREATE POLICY "schools_owner_update" ON public.schools FOR UPDATE
  TO authenticated USING (owner_user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (owner_user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "schools_super_admin_delete" ON public.schools;
CREATE POLICY "schools_super_admin_delete" ON public.schools FOR DELETE
  TO authenticated USING (public.is_super_admin());

-- Policies: profiles
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT
  TO authenticated USING (
    id = auth.uid()
    OR public.is_super_admin()
    OR (
      school_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.profiles p2
        WHERE p2.id = auth.uid()
          AND p2.school_id = profiles.school_id
          AND p2.role IN ('school_admin','teacher','staff')
      )
    )
  );

DROP POLICY IF EXISTS "profiles_own_insert" ON public.profiles;
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE
  TO authenticated USING (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "profiles_super_admin_delete" ON public.profiles;
CREATE POLICY "profiles_super_admin_delete" ON public.profiles FOR DELETE
  TO authenticated USING (public.is_super_admin());

-- =============================================
-- TABLE: audit_logs
-- =============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_school_id_idx ON public.audit_logs(school_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT
  TO authenticated WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT
  TO authenticated USING (
    public.is_super_admin()
    OR (
      school_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.school_id = audit_logs.school_id
          AND p.role = 'school_admin'
      )
    )
  );

-- =============================================
-- TABLE: school_documents
-- =============================================
CREATE TABLE IF NOT EXISTS public.school_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('authorization','trade_register','other')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS school_documents_school_id_idx ON public.school_documents(school_id);
ALTER TABLE public.school_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_documents_select" ON public.school_documents;
CREATE POLICY "school_documents_select" ON public.school_documents FOR SELECT
  TO authenticated USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = school_documents.school_id AND schools.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "school_documents_insert" ON public.school_documents;
CREATE POLICY "school_documents_insert" ON public.school_documents FOR INSERT
  TO authenticated WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = school_documents.school_id AND schools.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "school_documents_super_admin_update" ON public.school_documents;
CREATE POLICY "school_documents_super_admin_update" ON public.school_documents FOR UPDATE
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- TABLE: super_admin_emails
-- =============================================
CREATE TABLE IF NOT EXISTS public.super_admin_emails (
  email text PRIMARY KEY,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admin_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_emails_select" ON public.super_admin_emails;
CREATE POLICY "super_admin_emails_select" ON public.super_admin_emails FOR SELECT
  TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_emails_insert" ON public.super_admin_emails;
CREATE POLICY "super_admin_emails_insert" ON public.super_admin_emails FOR INSERT
  TO authenticated WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_emails_delete" ON public.super_admin_emails;
CREATE POLICY "super_admin_emails_delete" ON public.super_admin_emails FOR DELETE
  TO authenticated USING (public.is_super_admin());

INSERT INTO public.super_admin_emails (email) VALUES
  ('vincentnogue@yahoo.com'),
  ('vincentnogue2@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- TRIGGER: auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.super_admin_emails WHERE email = NEW.email) THEN
    v_role := 'super_admin';
  ELSE
    v_role := COALESCE(NEW.raw_app_meta_data->>'role', 'student');
  END IF;

  INSERT INTO public.profiles (id, role, first_name, last_name, language)
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'language', 'fr')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN profiles.role = 'super_admin' THEN 'super_admin' ELSE EXCLUDED.role END,
    first_name = CASE WHEN profiles.first_name = '' THEN EXCLUDED.first_name ELSE profiles.first_name END,
    last_name = CASE WHEN profiles.last_name = '' THEN EXCLUDED.last_name ELSE profiles.last_name END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED: Plans
-- =============================================
INSERT INTO public.plans (name, slug, price_monthly, price_annual, max_students, max_teachers, max_campus, max_storage_gb, features, modules, notification_channels, support_level, sort_order)
VALUES
  ('Starter','starter',19.00,182.40,200,15,1,5,
   '["Gestion des élèves","Notes & bulletins","Présences","Calendrier","Portail parents"]',
   '["students","teachers","attendance","grades","calendar","parents_portal"]',
   '["email"]','ticket',1),
  ('Pro','pro',69.00,662.40,1000,60,3,20,
   '["Tout Starter","Finances & paiements","Transport","Bibliothèque","Messagerie interne","SMS & WhatsApp","Exports PDF/CSV"]',
   '["students","teachers","staff","attendance","grades","calendar","parents_portal","students_portal","finances","transport","library","messaging","reports","discipline"]',
   '["email","sms","whatsapp"]','priority',2),
  ('Premium','premium',99.00,950.40,5000,200,10,50,
   '["Tout Pro","Examens avancés","Alumni","Comptabilité","Paie du personnel","Multi-campus"]',
   '["students","teachers","staff","attendance","grades","calendar","parents_portal","students_portal","finances","transport","library","messaging","reports","discipline","exams","alumni","accounting","payroll","campus"]',
   '["email","sms","whatsapp","push"]','priority_phone',3),
  ('Entreprise','enterprise',319.00,3062.40,999999,999999,999,500,
   '["Tout Premium","Élèves illimités","Stockage illimité","Domaine personnalisé","SLA garanti","Account manager dédié"]',
   '["students","teachers","staff","attendance","grades","calendar","parents_portal","students_portal","finances","transport","library","messaging","reports","discipline","exams","alumni","accounting","payroll","campus","custom_roles","api_access","white_label"]',
   '["email","sms","whatsapp","push","custom"]','dedicated_manager',4)
ON CONFLICT (slug) DO NOTHING;
