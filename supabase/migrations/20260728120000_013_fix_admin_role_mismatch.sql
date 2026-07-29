/*
# CRITICAL FIX — role value mismatch: 'school_admin' (schema) vs 'admin' (app)

## Problem
Since the very first migration, profiles.role's CHECK constraint and every RLS
helper function / policy that gates school-admin actions checked for the role
value 'school_admin'. But the entire frontend application — onboarding, role
routing, every dashboard, every module page — has always used 'admin' instead.

Consequences (all silent, no error surfaced until cross-checked against the schema):
- Admin onboarding violated the CHECK constraint on every attempt.
- is_school_admin() always returned false for a real admin, silently blocking
  writes on schools, students, custom_roles, teacher_invite_codes, schedule_slots,
  and every other table gated by this function.
- profiles_own_select never matched for an admin, meaning an admin could never
  see any other profile in their own school (teachers, staff, parents) — this
  alone explains a wide range of "empty list" symptoms across the app.
- attendance, grades, calendar_events and discipline_incidents write policies
  checked role IN (...,'school_admin',...) directly, same problem.

## Fix
Align the database with the value the application has always used: 'admin'.
*/

-- 1. CHECK constraint on profiles.role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin','admin','teacher','staff','parent','student'));

-- 2. Canonical helper functions
CREATE OR REPLACE FUNCTION public.is_school_admin(check_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND school_id = check_school_id AND role = 'admin'
  ) OR public.is_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_school_staff(check_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND school_id = check_school_id
      AND role IN ('admin','teacher','staff')
  ) OR public.is_super_admin();
$$;

-- 3. profiles_own_select — an admin could never see any other profile in their own school
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT
  TO authenticated USING (
    id = auth.uid()
    OR public.is_super_admin()
    OR (
      school_id IS NOT NULL
      AND school_id = public.current_user_school_id()
      AND public.current_user_role() IN ('admin','teacher','staff')
    )
  );

-- 4. audit_logs_select
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT
  TO authenticated USING (
    public.is_super_admin()
    OR (
      school_id IS NOT NULL
      AND school_id = public.current_user_school_id()
      AND public.current_user_role() = 'admin'
    )
  );

-- 5. attendance
DROP POLICY IF EXISTS "attendance_teacher_write" ON public.attendance;
CREATE POLICY "attendance_teacher_write" ON public.attendance FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = attendance.school_id AND p.role IN ('teacher','admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = attendance.school_id AND p.role IN ('teacher','admin'))
  );

-- 6. grades
DROP POLICY IF EXISTS "grades_teacher_write" ON public.grades;
CREATE POLICY "grades_teacher_write" ON public.grades FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = grades.school_id AND p.role IN ('teacher','admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = grades.school_id AND p.role IN ('teacher','admin'))
  );

-- 7. calendar_events
DROP POLICY IF EXISTS "calendar_events_admin_write" ON public.calendar_events;
CREATE POLICY "calendar_events_admin_write" ON public.calendar_events FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = calendar_events.school_id AND p.role IN ('admin','teacher'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = calendar_events.school_id AND p.role IN ('admin','teacher'))
  );

-- 8. discipline_incidents
DROP POLICY IF EXISTS "discipline_admin_write" ON public.discipline_incidents;
CREATE POLICY "discipline_admin_write" ON public.discipline_incidents FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = discipline_incidents.school_id AND p.role IN ('admin','teacher','staff'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = discipline_incidents.school_id AND p.role IN ('admin','teacher','staff'))
  );
