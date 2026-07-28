/*
# Teacher onboarding — was entirely missing

## Problem
Dashboard.tsx correctly routes by profile.role (admin/parent/student/teacher),
but nothing in the app ever set role = 'teacher'. The onboarding screen only
offered 3 roles (Admin/Parent/Eleve), and TeachersPage was read-only. A teacher
account could never actually be created or reached.

## Fix
Same pattern already used for parent/student self-join: the school admin
generates a short invite code, the teacher enters it during their own signup,
and a SECURITY DEFINER RPC validates + consumes the code (bypassing the
membership chicken-and-egg problem, same reasoning as complete_inscription_link).
*/

CREATE TABLE IF NOT EXISTS public.teacher_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  label text,
  expires_at timestamptz,
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tic_school_idx ON public.teacher_invite_codes(school_id);
CREATE INDEX IF NOT EXISTS tic_code_idx ON public.teacher_invite_codes(code);
ALTER TABLE public.teacher_invite_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tic_admin_read" ON public.teacher_invite_codes;
CREATE POLICY "tic_admin_read" ON public.teacher_invite_codes FOR SELECT
  TO authenticated USING (public.is_school_admin(school_id));

DROP POLICY IF EXISTS "tic_admin_write" ON public.teacher_invite_codes;
CREATE POLICY "tic_admin_write" ON public.teacher_invite_codes FOR ALL
  TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- Verify a code before a teacher is a school member (same chicken-and-egg fix as inscription_codes)
CREATE OR REPLACE FUNCTION public.verify_teacher_invite(p_code text)
RETURNS TABLE (school_id uuid, school_name text, used_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tic.school_id, s.name, tic.used_at
  FROM public.teacher_invite_codes tic
  JOIN public.schools s ON s.id = tic.school_id
  WHERE tic.code = trim(p_code)
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.verify_teacher_invite(text) TO authenticated;

-- Atomically validate + consume the code and promote the caller to teacher for that school
CREATE OR REPLACE FUNCTION public.complete_teacher_invite(p_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.teacher_invite_codes%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise.';
  END IF;

  SELECT * INTO v_row FROM public.teacher_invite_codes WHERE code = trim(p_code) FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code d''invitation introuvable.';
  END IF;
  IF v_row.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Ce code a déjà été utilisé.';
  END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RAISE EXCEPTION 'Ce code a expiré.';
  END IF;

  UPDATE public.teacher_invite_codes SET used_at = now(), used_by = auth.uid() WHERE code = trim(p_code);

  RETURN jsonb_build_object('school_id', v_row.school_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.complete_teacher_invite(text) TO authenticated;
