/*
# CRITICAL SECURITY FIX — trial/subscription expiry was never enforced server-side

## Problem
school_subscription_active() and school_has_module() existed (GRANT EXECUTE'd
to authenticated) but were never referenced by a single RLS policy anywhere
in the schema. The Paywall screen that blocks the admin after trial expiry is
a pure React rendering choice — nothing stopped a technical user from calling
supabase.from('exams').insert(...) directly from the browser console (or any
HTTP client with their session token) and continuing to write data for free,
forever, regardless of subscription_status.

## Fix
is_school_admin() and is_school_staff() are the gate used by the vast
majority of write policies across the whole schema (students, classes,
grades, attendance, exams, finances, payroll, discipline, transport,
library, messages, custom_roles, teacher_invite_codes, schedule_slots, ...).
Adding a subscription-active check directly inside these two functions closes
the gap everywhere at once, without having to touch dozens of individual
policies one by one.

## What stays unaffected (by design)
- Reading existing data (is_school_member-gated SELECT policies) is untouched —
  a school that stops paying keeps read access to what it already entered;
  only *new writes* are blocked. This matches normal SaaS trial-expiry UX and
  avoids the appearance of "lost data".
- Super admins always bypass this (public.is_super_admin() OR ...).
- Plan activation itself goes through the flutterwave-verify edge function
  using the service role key, which bypasses RLS entirely — so a school can
  always still pay and reactivate even while "locked out" of direct writes.
- schools_owner_update (editing the school's own row, e.g. name/address) is
  intentionally NOT gated by is_school_admin — it already uses its own
  owner_user_id check — so an admin can still see the paywall and take action
  without a chicken-and-egg lockout.
*/

CREATE OR REPLACE FUNCTION public.is_school_admin(check_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND school_id = check_school_id AND role = 'admin'
    )
    AND public.school_subscription_active(check_school_id)
  ) OR public.is_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_school_staff(check_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND school_id = check_school_id
        AND role IN ('admin','teacher','staff')
    )
    AND public.school_subscription_active(check_school_id)
  ) OR public.is_super_admin();
$$;

-- These 4 write policies (added in migration 013) checked the caller's role
-- inline instead of going through is_school_staff() — realign them so they
-- automatically inherit the subscription-active requirement above too,
-- instead of duplicating (and risking drifting from) the same logic inline.
DROP POLICY IF EXISTS "attendance_teacher_write" ON public.attendance;
CREATE POLICY "attendance_teacher_write" ON public.attendance FOR ALL
  TO authenticated USING (public.is_school_staff(school_id)) WITH CHECK (public.is_school_staff(school_id));

DROP POLICY IF EXISTS "grades_teacher_write" ON public.grades;
CREATE POLICY "grades_teacher_write" ON public.grades FOR ALL
  TO authenticated USING (public.is_school_staff(school_id)) WITH CHECK (public.is_school_staff(school_id));

DROP POLICY IF EXISTS "calendar_events_admin_write" ON public.calendar_events;
CREATE POLICY "calendar_events_admin_write" ON public.calendar_events FOR ALL
  TO authenticated USING (public.is_school_staff(school_id)) WITH CHECK (public.is_school_staff(school_id));

DROP POLICY IF EXISTS "discipline_admin_write" ON public.discipline_incidents;
CREATE POLICY "discipline_admin_write" ON public.discipline_incidents FOR ALL
  TO authenticated USING (public.is_school_staff(school_id)) WITH CHECK (public.is_school_staff(school_id));
