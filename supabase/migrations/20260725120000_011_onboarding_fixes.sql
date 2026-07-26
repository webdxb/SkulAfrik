/*
# SKUL AFRIK — Onboarding flow fixes

## Problem
The onboarding flow (admin / parent / student) referenced tables/columns that
either didn't exist or were unreachable under RLS for a not-yet-onboarded user:
- `sales_codes` has no `school_id`/`used` columns and is Super-Admin-only under RLS.
- `inscription_codes` requires school membership to SELECT, but a joining
  parent/student is by definition not yet a member (chicken-and-egg).
- `students` had no column linking a row to the student's own auth account.

## Fix
1. Add `students.profile_id` to link a student's own login to their record.
2. Extend `students_member_read` so a student can read their own row.
3. Add three SECURITY DEFINER RPCs that safely bypass the membership
   chicken-and-egg problem while still validating the code server-side:
   - `resolve_sales_code(p_code)` — look up an active sales code by its code.
   - `verify_inscription_code(p_code)` — look up an unused inscription code.
   - `complete_inscription_link(p_code, p_role)` — atomically validate +
     consume an inscription code and link the caller (as parent or student).
*/

-- 1. Link a student row to its own login (nullable — most students may not log in themselves)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_profile_id_key ON public.students(profile_id) WHERE profile_id IS NOT NULL;

-- 2. Let a student read their own row
DROP POLICY IF EXISTS "students_member_read" ON public.students;
CREATE POLICY "students_member_read" ON public.students FOR SELECT
  TO authenticated USING (
    public.is_school_member(school_id)
    OR parent_profile_id = auth.uid()
    OR profile_id = auth.uid()
  );

-- 3a. Resolve an optional commercial/sales code entered during admin onboarding.
-- Read-only, only returns id for an active code — safe to expose to any authenticated user.
CREATE OR REPLACE FUNCTION public.resolve_sales_code(p_code text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.sales_codes WHERE code = upper(trim(p_code)) AND is_active = true LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.resolve_sales_code(text) TO authenticated;

-- 3b. Verify an inscription code before a parent/student is a school member.
-- Only exposes what's needed to show a confirmation screen; never exposes other schools' data.
CREATE OR REPLACE FUNCTION public.verify_inscription_code(p_code text)
RETURNS TABLE (eleve_id uuid, tenant_id uuid, phone_hint text, used_at timestamptz, first_name text, last_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ic.eleve_id, ic.tenant_id, ic.phone_hint, ic.used_at, s.first_name, s.last_name
  FROM public.inscription_codes ic
  JOIN public.students s ON s.id = ic.eleve_id
  WHERE ic.code = trim(p_code)
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.verify_inscription_code(text) TO authenticated;

-- 3c. Atomically validate + consume an inscription code and link the calling user.
-- p_role = 'parent' -> creates a parent_eleve link
-- p_role = 'student' -> sets students.profile_id to the caller
CREATE OR REPLACE FUNCTION public.complete_inscription_link(p_code text, p_role text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.inscription_codes%ROWTYPE;
  v_student public.students%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise.';
  END IF;

  SELECT * INTO v_row FROM public.inscription_codes WHERE code = trim(p_code) FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code de liaison introuvable.';
  END IF;
  IF v_row.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Ce code a déjà été utilisé.';
  END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RAISE EXCEPTION 'Ce code a expiré.';
  END IF;

  IF p_role = 'parent' THEN
    INSERT INTO public.parent_eleve (parent_id, eleve_id, tenant_id, type_lien, statut_verifie)
    VALUES (auth.uid(), v_row.eleve_id, v_row.tenant_id, 'tuteur', true)
    ON CONFLICT (parent_id, eleve_id, tenant_id) DO NOTHING;
  ELSIF p_role = 'student' THEN
    UPDATE public.students SET profile_id = auth.uid() WHERE id = v_row.eleve_id AND profile_id IS NULL;
  ELSE
    RAISE EXCEPTION 'Rôle invalide.';
  END IF;

  UPDATE public.inscription_codes SET used_at = now() WHERE code = trim(p_code);

  SELECT * INTO v_student FROM public.students WHERE id = v_row.eleve_id;

  RETURN jsonb_build_object(
    'eleve_id', v_row.eleve_id,
    'tenant_id', v_row.tenant_id,
    'first_name', v_student.first_name,
    'last_name', v_student.last_name
  );
END;
$$;
-- 4. Weekly timetable slots — referenced by the teacher dashboard but never created.
CREATE TABLE IF NOT EXISTS public.schedule_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS schedule_slots_teacher_idx ON public.schedule_slots(teacher_id);
CREATE INDEX IF NOT EXISTS schedule_slots_class_idx ON public.schedule_slots(class_id);
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedule_slots_member_read" ON public.schedule_slots;
CREATE POLICY "schedule_slots_member_read" ON public.schedule_slots FOR SELECT
  TO authenticated USING (public.is_school_member(school_id));

DROP POLICY IF EXISTS "schedule_slots_admin_write" ON public.schedule_slots;
CREATE POLICY "schedule_slots_admin_write" ON public.schedule_slots FOR ALL
  TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));
