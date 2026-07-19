
/*
# SKUL AFRIK — Phase 2: Academic Schema

## New Tables (all tenant-scoped via school_id with RLS)

### classes
A class/grade within a school (e.g. "6ème A").
- school_id, name, level, capacity, academic_year, homeroom_teacher_id

### subjects
Subjects taught in a school (Mathématiques, Français, etc.).
- school_id, name, code, coefficient

### class_subjects
Many-to-many: which subjects are taught in which class, by which teacher.
- class_id, subject_id, teacher_id

### students
Student records linked to a class and optionally to parent profiles.
- school_id, class_id, first_name, last_name, gender, date_of_birth, place_of_birth,
  admission_number, enrollment_date, status, photo_url, parent_profile_id, address, phone

### attendance
Daily attendance records per student per class per date.
- school_id, class_id, student_id, date, status (present/absent/late/excused), notes, recorded_by

### grades
Grade entries per student per subject per term.
- school_id, student_id, subject_id, class_id, term, grade_value, max_value, grade_type (devoir/controle/examen), date, recorded_by

### academic_years
School year periods with terms.
- school_id, name, start_date, end_date, is_active

### calendar_events
Calendar events (courses, exams, meetings, holidays, events).
- school_id, title, description, event_type, start_at, end_at, target_audience, class_id, created_by

## Security
- RLS enabled on all tables.
- Policies: school members (owner, school_admin, teacher, staff) can read; school_admin and teachers can write (teachers limited to their classes for grades/attendance).
- Parents can read their children's data.
- Students can read their own data.
*/

-- =============================================
-- TABLE: academic_years
-- =============================================
CREATE TABLE IF NOT EXISTS public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academic_years_school_id_idx ON public.academic_years(school_id);
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a member of this school?
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

DROP POLICY IF EXISTS "academic_years_member_read" ON public.academic_years;
CREATE POLICY "academic_years_member_read" ON public.academic_years FOR SELECT
  TO authenticated USING (public.is_school_member(school_id));

DROP POLICY IF EXISTS "academic_years_admin_write" ON public.academic_years;
CREATE POLICY "academic_years_admin_write" ON public.academic_years FOR ALL
  TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- =============================================
-- TABLE: classes
-- =============================================
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  level text,
  capacity integer DEFAULT 40,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  homeroom_teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS classes_school_id_idx ON public.classes(school_id);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classes_member_read" ON public.classes;
CREATE POLICY "classes_member_read" ON public.classes FOR SELECT
  TO authenticated USING (public.is_school_member(school_id));

DROP POLICY IF EXISTS "classes_admin_write" ON public.classes;
CREATE POLICY "classes_admin_write" ON public.classes FOR ALL
  TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- =============================================
-- TABLE: subjects
-- =============================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  coefficient numeric(4,2) NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subjects_school_id_idx ON public.subjects(school_id);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects_member_read" ON public.subjects;
CREATE POLICY "subjects_member_read" ON public.subjects FOR SELECT
  TO authenticated USING (public.is_school_member(school_id));

DROP POLICY IF EXISTS "subjects_admin_write" ON public.subjects;
CREATE POLICY "subjects_admin_write" ON public.subjects FOR ALL
  TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- =============================================
-- TABLE: class_subjects
-- =============================================
CREATE TABLE IF NOT EXISTS public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, subject_id)
);

CREATE INDEX IF NOT EXISTS class_subjects_class_id_idx ON public.class_subjects(class_id);
CREATE INDEX IF NOT EXISTS class_subjects_teacher_id_idx ON public.class_subjects(teacher_id);
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_subjects_member_read" ON public.class_subjects;
CREATE POLICY "class_subjects_member_read" ON public.class_subjects FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_subjects.class_id AND public.is_school_member(c.school_id))
  );

DROP POLICY IF EXISTS "class_subjects_admin_write" ON public.class_subjects;
CREATE POLICY "class_subjects_admin_write" ON public.class_subjects FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_subjects.class_id AND public.is_school_admin(c.school_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_subjects.class_id AND public.is_school_admin(c.school_id))
  );

-- =============================================
-- TABLE: students
-- =============================================
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender text CHECK (gender IN ('M','F','other')),
  date_of_birth date,
  place_of_birth text,
  admission_number text,
  enrollment_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','graduated','transferred')),
  photo_url text,
  parent_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  address text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS students_school_id_idx ON public.students(school_id);
CREATE INDEX IF NOT EXISTS students_class_id_idx ON public.students(class_id);
CREATE INDEX IF NOT EXISTS students_parent_profile_id_idx ON public.students(parent_profile_id);
CREATE INDEX IF NOT EXISTS students_admission_number_idx ON public.students(admission_number);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_member_read" ON public.students;
CREATE POLICY "students_member_read" ON public.students FOR SELECT
  TO authenticated USING (
    public.is_school_member(school_id)
    OR parent_profile_id = auth.uid()
  );

DROP POLICY IF EXISTS "students_admin_write" ON public.students;
CREATE POLICY "students_admin_write" ON public.students FOR ALL
  TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

DROP POLICY IF EXISTS "students_teacher_insert" ON public.students;
CREATE POLICY "students_teacher_insert" ON public.students FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = students.school_id AND p.role = 'teacher')
  );

-- =============================================
-- TABLE: attendance
-- =============================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','excused')),
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);

CREATE INDEX IF NOT EXISTS attendance_school_id_idx ON public.attendance(school_id);
CREATE INDEX IF NOT EXISTS attendance_class_date_idx ON public.attendance(class_id, date);
CREATE INDEX IF NOT EXISTS attendance_student_id_idx ON public.attendance(student_id);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_member_read" ON public.attendance;
CREATE POLICY "attendance_member_read" ON public.attendance FOR SELECT
  TO authenticated USING (
    public.is_school_member(school_id)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND s.parent_profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "attendance_teacher_write" ON public.attendance;
CREATE POLICY "attendance_teacher_write" ON public.attendance FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = attendance.school_id AND p.role IN ('teacher','school_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = attendance.school_id AND p.role IN ('teacher','school_admin'))
  );

-- =============================================
-- TABLE: grades
-- =============================================
CREATE TABLE IF NOT EXISTS public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  term text NOT NULL DEFAULT 'T1',
  grade_value numeric(6,2) NOT NULL,
  max_value numeric(6,2) NOT NULL DEFAULT 20,
  grade_type text NOT NULL DEFAULT 'devoir' CHECK (grade_type IN ('devoir','controle','examen','projet')),
  title text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS grades_school_id_idx ON public.grades(school_id);
CREATE INDEX IF NOT EXISTS grades_student_id_idx ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS grades_subject_id_idx ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS grades_class_term_idx ON public.grades(class_id, term);
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grades_member_read" ON public.grades;
CREATE POLICY "grades_member_read" ON public.grades FOR SELECT
  TO authenticated USING (
    public.is_school_member(school_id)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = grades.student_id AND (s.parent_profile_id = auth.uid() OR s.id = auth.uid()))
  );

DROP POLICY IF EXISTS "grades_teacher_write" ON public.grades;
CREATE POLICY "grades_teacher_write" ON public.grades FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = grades.school_id AND p.role IN ('teacher','school_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = grades.school_id AND p.role IN ('teacher','school_admin'))
  );

-- =============================================
-- TABLE: calendar_events
-- =============================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'event' CHECK (event_type IN ('course','exam','meeting','holiday','event','deadline')),
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  target_audience text NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all','teachers','parents','students','class')),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_events_school_id_idx ON public.calendar_events(school_id);
CREATE INDEX IF NOT EXISTS calendar_events_start_at_idx ON public.calendar_events(start_at);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_events_member_read" ON public.calendar_events;
CREATE POLICY "calendar_events_member_read" ON public.calendar_events FOR SELECT
  TO authenticated USING (public.is_school_member(school_id));

DROP POLICY IF EXISTS "calendar_events_admin_write" ON public.calendar_events;
CREATE POLICY "calendar_events_admin_write" ON public.calendar_events FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = calendar_events.school_id AND p.role IN ('school_admin','teacher'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = calendar_events.school_id AND p.role IN ('school_admin','teacher'))
  );

-- =============================================
-- TABLE: fees (school fees)
-- =============================================
CREATE TABLE IF NOT EXISTS public.fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  fee_type text NOT NULL DEFAULT 'tuition' CHECK (fee_type IN ('registration','tuition','transport','canteen','uniform','other')),
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  due_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fees_school_id_idx ON public.fees(school_id);
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fees_member_read" ON public.fees;
CREATE POLICY "fees_member_read" ON public.fees FOR SELECT
  TO authenticated USING (public.is_school_member(school_id));

DROP POLICY IF EXISTS "fees_admin_write" ON public.fees;
CREATE POLICY "fees_admin_write" ON public.fees FOR ALL
  TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- =============================================
-- TABLE: payments
-- =============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_id uuid REFERENCES public.fees(id) ON DELETE SET NULL,
  parent_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  payment_method text CHECK (payment_method IN ('stripe','paypal','mtn_momo','orange_money','wave','airtel_money','mpesa','bank_transfer','cash')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','completed','failed','refunded')),
  transaction_id text,
  receipt_number text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_school_id_idx ON public.payments(school_id);
CREATE INDEX IF NOT EXISTS payments_student_id_idx ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS payments_parent_idx ON public.payments(parent_profile_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(payment_status);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_member_read" ON public.payments;
CREATE POLICY "payments_member_read" ON public.payments FOR SELECT
  TO authenticated USING (
    public.is_school_member(school_id)
    OR parent_profile_id = auth.uid()
  );

DROP POLICY IF EXISTS "payments_admin_write" ON public.payments;
CREATE POLICY "payments_admin_write" ON public.payments FOR ALL
  TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

DROP POLICY IF EXISTS "payments_parent_insert" ON public.payments;
CREATE POLICY "payments_parent_insert" ON public.payments FOR INSERT
  TO authenticated WITH CHECK (parent_profile_id = auth.uid());

-- =============================================
-- TABLE: discipline_incidents
-- =============================================
CREATE TABLE IF NOT EXISTS public.discipline_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL DEFAULT 'warning' CHECK (type IN ('warning','detention','suspension','expulsion','commendation')),
  description text,
  severity text CHECK (severity IN ('low','medium','high')),
  reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS discipline_incidents_school_id_idx ON public.discipline_incidents(school_id);
CREATE INDEX IF NOT EXISTS discipline_incidents_student_id_idx ON public.discipline_incidents(student_id);
ALTER TABLE public.discipline_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discipline_member_read" ON public.discipline_incidents;
CREATE POLICY "discipline_member_read" ON public.discipline_incidents FOR SELECT
  TO authenticated USING (
    public.is_school_member(school_id)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = discipline_incidents.student_id AND s.parent_profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "discipline_admin_write" ON public.discipline_incidents;
CREATE POLICY "discipline_admin_write" ON public.discipline_incidents FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = discipline_incidents.school_id AND p.role IN ('school_admin','teacher','staff'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = discipline_incidents.school_id AND p.role IN ('school_admin','teacher','staff'))
  );
