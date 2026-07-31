/*
# CRITICAL PRIVACY FIX — parents/students could read every student's records

## Problem
attendance_member_read, grades_member_read, bul_member_read and
discipline_member_read all used `is_school_member(school_id) OR <own record>`
as their SELECT condition. is_school_member() only checks that the caller's
profile.school_id matches — it does not check role. Since parents and students
both have school_id set (same as staff), the first clause alone already grants
them access to EVERY student's grades, attendance, bulletins and disciplinary
record at their school — the narrower "own record" clause was dead code,
since OR only ever widens access, never restricts it.

## Fix
Split the condition properly: staff (admin/teacher/staff) keep full
school-wide read access via is_school_staff(); parents and students are
restricted to their own child's / their own records only.
*/

DROP POLICY IF EXISTS "attendance_member_read" ON public.attendance;
CREATE POLICY "attendance_member_read" ON public.attendance FOR SELECT
  TO authenticated USING (
    public.is_school_staff(school_id)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND (s.parent_profile_id = auth.uid() OR s.profile_id = auth.uid()))
  );

DROP POLICY IF EXISTS "grades_member_read" ON public.grades;
CREATE POLICY "grades_member_read" ON public.grades FOR SELECT
  TO authenticated USING (
    public.is_school_staff(school_id)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = grades.student_id AND (s.parent_profile_id = auth.uid() OR s.profile_id = auth.uid()))
  );

DROP POLICY IF EXISTS "bul_member_read" ON public.bulletins;
CREATE POLICY "bul_member_read" ON public.bulletins FOR SELECT
  TO authenticated USING (
    public.is_school_staff(school_id)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = bulletins.student_id AND (s.parent_profile_id = auth.uid() OR s.profile_id = auth.uid()))
  );

DROP POLICY IF EXISTS "discipline_member_read" ON public.discipline_incidents;
CREATE POLICY "discipline_member_read" ON public.discipline_incidents FOR SELECT
  TO authenticated USING (
    public.is_school_staff(school_id)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = discipline_incidents.student_id AND (s.parent_profile_id = auth.uid() OR s.profile_id = auth.uid()))
  );
