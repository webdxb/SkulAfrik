/*
# Fix RLS infinite recursion on profiles

Root cause: profiles_own_select policy references public.profiles in a subquery,
which re-triggers the same policy → infinite recursion.

Fix: Replace ALL inline subqueries against profiles/schools in policies with
SECURITY DEFINER functions that bypass RLS (no recursion).
*/

-- =============================================
-- SECURITY DEFINER helper functions (bypass RLS → no recursion)
-- =============================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_school_member(check_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (school_id = check_school_id OR role = 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin(check_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND school_id = check_school_id AND role = 'school_admin'
  ) OR public.is_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_school_staff(check_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND school_id = check_school_id
      AND role IN ('school_admin','teacher','staff')
  ) OR public.is_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.current_user_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- =============================================
-- FIX: profiles policies (no self-reference)
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT
  TO authenticated USING (
    id = auth.uid()
    OR public.is_super_admin()
    OR (
      school_id IS NOT NULL
      AND school_id = public.current_user_school_id()
      AND public.current_user_role() IN ('school_admin','teacher','staff')
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
-- FIX: schools policies (use helper functions, no inline profiles subquery)
-- =============================================
DROP POLICY IF EXISTS "schools_member_select" ON public.schools;
CREATE POLICY "schools_member_select" ON public.schools FOR SELECT
  TO authenticated USING (
    owner_user_id = auth.uid()
    OR public.is_super_admin()
    OR public.is_school_member(schools.id)
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

-- =============================================
-- FIX: audit_logs policies (use helper functions)
-- =============================================
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT
  TO authenticated USING (
    public.is_super_admin()
    OR (
      school_id IS NOT NULL
      AND school_id = public.current_user_school_id()
      AND public.current_user_role() = 'school_admin'
    )
  );

-- =============================================
-- FIX: school_documents policies (use helper functions)
-- =============================================
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
-- FIX: promo_codes policies (already use is_super_admin, confirm)
-- =============================================
DROP POLICY IF EXISTS "promo_codes_super_admin_write" ON public.promo_codes;
CREATE POLICY "promo_codes_super_admin_write" ON public.promo_codes FOR ALL
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- FIX: super_admin_emails policies
-- =============================================
DROP POLICY IF EXISTS "super_admin_emails_select" ON public.super_admin_emails;
CREATE POLICY "super_admin_emails_select" ON public.super_admin_emails FOR SELECT
  TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_emails_insert" ON public.super_admin_emails;
CREATE POLICY "super_admin_emails_insert" ON public.super_admin_emails FOR INSERT
  TO authenticated WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_emails_delete" ON public.super_admin_emails;
CREATE POLICY "super_admin_emails_delete" ON public.super_admin_emails FOR DELETE
  TO authenticated USING (public.is_super_admin());
