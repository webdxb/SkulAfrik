/*
# CRITICAL PRIVACY FIX (continued) — staff salaries and student payments were
# readable by any school member

## Problem
Same root cause as migration 017: is_school_member(school_id) checks school
membership only, not role or ownership. Three more tables were affected:

- public.staff: salary_base is stored on the same row as name/phone/position.
  staff_member_read let ANY parent, student, or fellow staff member read
  every staff member's salary.
- public.payroll_items: pi_read let ANY parent, student, or staff member read
  every payroll run's net pay for the whole school.
- public.payments: payments_member_read let ANY parent or student read every
  OTHER family's tuition payment history and amounts.

(public.fees was checked too — it's a shared fee schedule/price list, not
per-student data, so is_school_member there is correct as-is.)

## Fix
staff and payroll_items: restrict read to school admins only — these are HR/
payroll records, not something even fellow teachers should browse. This
matches the app's own sidebar, which already only shows Personnel/Paie to
the admin role.
payments: restrict to staff (admin/teacher/staff) plus the specific
student's own parent/student account.
*/

DROP POLICY IF EXISTS "staff_member_read" ON public.staff;
CREATE POLICY "staff_member_read" ON public.staff FOR SELECT
  TO authenticated USING (public.is_school_admin(school_id));

DROP POLICY IF EXISTS "pi_read" ON public.payroll_items;
CREATE POLICY "pi_read" ON public.payroll_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.payroll_runs r WHERE r.id = run_id AND public.is_school_admin(r.school_id))
);

DROP POLICY IF EXISTS "payments_member_read" ON public.payments;
CREATE POLICY "payments_member_read" ON public.payments FOR SELECT
  TO authenticated USING (
    public.is_school_staff(school_id)
    OR parent_profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = payments.student_id AND s.profile_id = auth.uid())
  );

-- accounting_entries and payroll_runs are only ever surfaced to the admin role
-- in the app's own sidebar (Comptabilité, Paie) — is_school_member let any
-- parent/teacher/student query the school's full financial ledger or payroll
-- run list directly via the API even though the UI never shows it to them.
DROP POLICY IF EXISTS "ae_member_read" ON public.accounting_entries;
CREATE POLICY "ae_member_read" ON public.accounting_entries FOR SELECT
  TO authenticated USING (public.is_school_admin(school_id));

DROP POLICY IF EXISTS "pr_member_read" ON public.payroll_runs;
CREATE POLICY "pr_member_read" ON public.payroll_runs FOR SELECT
  TO authenticated USING (public.is_school_admin(school_id));

-- support_tickets: the UI already filters to "my own tickets" client-side for
-- everyone, but RLS let any member read every ticket school-wide (other
-- families' complaints, other staff's issues). Staff keep full visibility to
-- triage; everyone else is restricted to tickets they created themselves.
DROP POLICY IF EXISTS "st_member_read" ON public.support_tickets;
CREATE POLICY "st_member_read" ON public.support_tickets FOR SELECT
  TO authenticated USING (public.is_school_staff(school_id) OR created_by = auth.uid());
