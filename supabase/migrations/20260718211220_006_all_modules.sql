/*
# SKUL AFRIK — All remaining module tables

## New Tables (tenant-scoped, school_id where applicable)

### parents
Parent/guardian records linked to students.
- school_id, user_id (nullable, for portal login), first_name, last_name, phone, email, occupation, address

### student_parents
Liaison: which parent belongs to which student (many-to-many, with relationship type).
- student_id, parent_id, relationship (père/mère/tuteur)

### staff
Non-teaching personnel: administration, finance, library, transport, etc.
- school_id, user_id (nullable), first_name, last_name, role (admin_staff, finance, librarian, transport, etc.), phone, email, hire_date, salary_base, status

### exams
Examination sessions (mid-term, final, etc.).
- school_id, academic_year_id, name, term_key, exam_type (devoir/composition/examen), start_date, end_date, status

### exam_subjects
Subjects included in an exam, with max_score and date.
- exam_id, subject_id, class_id, max_score, exam_date

### transport_routes
Bus/transport routes with stops and pricing.
- school_id, name, vehicle_plate, driver_name, driver_phone, capacity, price_annual

### transport_stops
Pickup/dropoff points on a route.
- route_id, name, order_index, pickup_time

### student_transport
Student assignments to transport routes.
- student_id, route_id, academic_year_id, paid

### library_books
Book inventory.
- school_id, isbn, title, author, publisher, year, category, copies_total, copies_available, shelf_location

### library_loans
Book loans to students/staff.
- book_id, borrower_type (student/staff), borrower_id, loan_date, due_date, return_date, status

### alumni
Graduated/former students.
- school_id, student_id (nullable, if linked), first_name, last_name, graduation_year, current_occupation, email, phone

### accounting_entries
General ledger entries (income/expense).
- school_id, date, type (income/expense), category, description, amount, reference, created_by

### payroll_runs
Payroll periods.
- school_id, period_start, period_end, status (draft/processed/paid), total_amount

### payroll_items
Individual salary items within a run.
- run_id, staff_id (or teacher_id), gross, deductions, net, status

### messages
Internal messaging between school members.
- school_id, sender_id, recipient_id, subject, body, read_at, parent_message_id (nullable, for threads)

### support_tickets
Support requests from school admins to platform.
- school_id, created_by, subject, description, status (open/in_progress/resolved/closed), priority

### cms_pages
Global CMS pages managed by Super Admin.
- slug, title, content (jsonb), status (draft/published), updated_by, published_at

### bulletins
Generated report cards (bulletins) per student per term.
- school_id, student_id, academic_year_id, term_key, file_url, generated_at, status

## Security
- All tenant tables: school members read, school_admin write (via is_school_member/is_school_admin).
- CMS + support: school members read; super_admin manages CMS.
- Messages: sender + recipient only.
*/

-- =============================================
-- parents
-- =============================================
CREATE TABLE IF NOT EXISTS public.parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  occupation text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS parents_school_id_idx ON public.parents(school_id);
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parents_member_read" ON public.parents;
CREATE POLICY "parents_member_read" ON public.parents FOR SELECT TO authenticated USING (public.is_school_member(school_id));
DROP POLICY IF EXISTS "parents_admin_write" ON public.parents;
CREATE POLICY "parents_admin_write" ON public.parents FOR ALL TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- =============================================
-- student_parents
-- =============================================
CREATE TABLE IF NOT EXISTS public.student_parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'tuteur',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, parent_id)
);
CREATE INDEX IF NOT EXISTS sp_student_idx ON public.student_parents(student_id);
CREATE INDEX IF NOT EXISTS sp_parent_idx ON public.student_parents(parent_id);
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sp_read" ON public.student_parents;
CREATE POLICY "sp_read" ON public.student_parents FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.students s, public.parents p WHERE s.id = student_id AND p.id = parent_id AND public.is_school_member(s.school_id))
);
DROP POLICY IF EXISTS "sp_admin_write" ON public.student_parents;
CREATE POLICY "sp_admin_write" ON public.student_parents FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.students s, public.parents p WHERE s.id = student_id AND p.id = parent_id AND public.is_school_admin(s.school_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.students s, public.parents p WHERE s.id = student_id AND p.id = parent_id AND public.is_school_admin(s.school_id))
);

-- =============================================
-- staff
-- =============================================
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL DEFAULT 'admin_staff',
  phone text,
  email text,
  hire_date date,
  salary_base numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_school_id_idx ON public.staff(school_id);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_member_read" ON public.staff;
CREATE POLICY "staff_member_read" ON public.staff FOR SELECT TO authenticated USING (public.is_school_member(school_id));
DROP POLICY IF EXISTS "staff_admin_write" ON public.staff;
CREATE POLICY "staff_admin_write" ON public.staff FOR ALL TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- =============================================
-- exams
-- =============================================
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  name text NOT NULL,
  term_key text,
  exam_type text NOT NULL DEFAULT 'composition',
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exams_school_id_idx ON public.exams(school_id);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exams_member_read" ON public.exams;
CREATE POLICY "exams_member_read" ON public.exams FOR SELECT TO authenticated USING (public.is_school_member(school_id));
DROP POLICY IF EXISTS "exams_staff_write" ON public.exams;
CREATE POLICY "exams_staff_write" ON public.exams FOR ALL TO authenticated USING (public.is_school_staff(school_id)) WITH CHECK (public.is_school_staff(school_id));

-- =============================================
-- exam_subjects
-- =============================================
CREATE TABLE IF NOT EXISTS public.exam_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  max_score numeric(6,2) NOT NULL DEFAULT 20,
  exam_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS es_exam_idx ON public.exam_subjects(exam_id);
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "es_read" ON public.exam_subjects;
CREATE POLICY "es_read" ON public.exam_subjects FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.is_school_member(e.school_id))
);
DROP POLICY IF EXISTS "es_staff_write" ON public.exam_subjects;
CREATE POLICY "es_staff_write" ON public.exam_subjects FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.is_school_staff(e.school_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.is_school_staff(e.school_id))
);

-- =============================================
-- transport_routes
-- =============================================
CREATE TABLE IF NOT EXISTS public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  vehicle_plate text,
  driver_name text,
  driver_phone text,
  capacity integer NOT NULL DEFAULT 30,
  price_annual numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tr_school_idx ON public.transport_routes(school_id);
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tr_member_read" ON public.transport_routes;
CREATE POLICY "tr_member_read" ON public.transport_routes FOR SELECT TO authenticated USING (public.is_school_member(school_id));
DROP POLICY IF EXISTS "tr_admin_write" ON public.transport_routes;
CREATE POLICY "tr_admin_write" ON public.transport_routes FOR ALL TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- =============================================
-- transport_stops
-- =============================================
CREATE TABLE IF NOT EXISTS public.transport_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  pickup_time time,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ts_route_idx ON public.transport_stops(route_id);
ALTER TABLE public.transport_stops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ts_read" ON public.transport_stops;
CREATE POLICY "ts_read" ON public.transport_stops FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.transport_routes r WHERE r.id = route_id AND public.is_school_member(r.school_id))
);
DROP POLICY IF EXISTS "ts_admin_write" ON public.transport_stops;
CREATE POLICY "ts_admin_write" ON public.transport_stops FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.transport_routes r WHERE r.id = route_id AND public.is_school_admin(r.school_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.transport_routes r WHERE r.id = route_id AND public.is_school_admin(r.school_id))
);

-- =============================================
-- student_transport
-- =============================================
CREATE TABLE IF NOT EXISTS public.student_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, route_id, academic_year_id)
);
CREATE INDEX IF NOT EXISTS st_student_idx ON public.student_transport(student_id);
ALTER TABLE public.student_transport ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "st_read" ON public.student_transport;
CREATE POLICY "st_read" ON public.student_transport FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.transport_routes r WHERE r.id = route_id AND public.is_school_member(r.school_id))
);
DROP POLICY IF EXISTS "st_admin_write" ON public.student_transport;
CREATE POLICY "st_admin_write" ON public.student_transport FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.transport_routes r WHERE r.id = route_id AND public.is_school_admin(r.school_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.transport_routes r WHERE r.id = route_id AND public.is_school_admin(r.school_id))
);

-- =============================================
-- library_books
-- =============================================
CREATE TABLE IF NOT EXISTS public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  isbn text,
  title text NOT NULL,
  author text,
  publisher text,
  year integer,
  category text,
  copies_total integer NOT NULL DEFAULT 1,
  copies_available integer NOT NULL DEFAULT 1,
  shelf_location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lb_school_idx ON public.library_books(school_id);
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lb_member_read" ON public.library_books;
CREATE POLICY "lb_member_read" ON public.library_books FOR SELECT TO authenticated USING (public.is_school_member(school_id));
DROP POLICY IF EXISTS "lb_admin_write" ON public.library_books;
CREATE POLICY "lb_admin_write" ON public.library_books FOR ALL TO authenticated USING (public.is_school_staff(school_id)) WITH CHECK (public.is_school_staff(school_id));

-- =============================================
-- library_loans
-- =============================================
CREATE TABLE IF NOT EXISTS public.library_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  borrower_type text NOT NULL DEFAULT 'student',
  borrower_id uuid,
  loan_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  return_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ll_book_idx ON public.library_loans(book_id);
ALTER TABLE public.library_loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ll_read" ON public.library_loans;
CREATE POLICY "ll_read" ON public.library_loans FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.library_books b WHERE b.id = book_id AND public.is_school_member(b.school_id))
);
DROP POLICY IF EXISTS "ll_staff_write" ON public.library_loans;
CREATE POLICY "ll_staff_write" ON public.library_loans FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.library_books b WHERE b.id = book_id AND public.is_school_staff(b.school_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.library_books b WHERE b.id = book_id AND public.is_school_staff(b.school_id))
);

-- =============================================
-- alumni
-- =============================================
CREATE TABLE IF NOT EXISTS public.alumni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  graduation_year integer NOT NULL,
  current_occupation text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS al_school_idx ON public.alumni(school_id);
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "al_member_read" ON public.alumni;
CREATE POLICY "al_member_read" ON public.alumni FOR SELECT TO authenticated USING (public.is_school_member(school_id));
DROP POLICY IF EXISTS "al_admin_write" ON public.alumni;
CREATE POLICY "al_admin_write" ON public.alumni FOR ALL TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- =============================================
-- accounting_entries
-- =============================================
CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL CHECK (type IN ('income','expense')),
  category text NOT NULL,
  description text,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  reference text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ae_school_idx ON public.accounting_entries(school_id);
CREATE INDEX IF NOT EXISTS ae_date_idx ON public.accounting_entries(date);
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ae_member_read" ON public.accounting_entries;
CREATE POLICY "ae_member_read" ON public.accounting_entries FOR SELECT TO authenticated USING (public.is_school_member(school_id));
DROP POLICY IF EXISTS "ae_admin_write" ON public.accounting_entries;
CREATE POLICY "ae_admin_write" ON public.accounting_entries FOR ALL TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- =============================================
-- payroll_runs
-- =============================================
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pr_school_idx ON public.payroll_runs(school_id);
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pr_member_read" ON public.payroll_runs;
CREATE POLICY "pr_member_read" ON public.payroll_runs FOR SELECT TO authenticated USING (public.is_school_member(school_id));
DROP POLICY IF EXISTS "pr_admin_write" ON public.payroll_runs;
CREATE POLICY "pr_admin_write" ON public.payroll_runs FOR ALL TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- =============================================
-- payroll_items
-- =============================================
CREATE TABLE IF NOT EXISTS public.payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  gross numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  net numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pi_run_idx ON public.payroll_items(run_id);
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pi_read" ON public.payroll_items;
CREATE POLICY "pi_read" ON public.payroll_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.payroll_runs r WHERE r.id = run_id AND public.is_school_member(r.school_id))
);
DROP POLICY IF EXISTS "pi_admin_write" ON public.payroll_items;
CREATE POLICY "pi_admin_write" ON public.payroll_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.payroll_runs r WHERE r.id = run_id AND public.is_school_admin(r.school_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.payroll_runs r WHERE r.id = run_id AND public.is_school_admin(r.school_id))
);

-- =============================================
-- messages
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  body text,
  read_at timestamptz,
  parent_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS msg_school_idx ON public.messages(school_id);
CREATE INDEX IF NOT EXISTS msg_recipient_idx ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS msg_sender_idx ON public.messages(sender_id);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "msg_read" ON public.messages;
CREATE POLICY "msg_read" ON public.messages FOR SELECT TO authenticated USING (
  public.is_school_member(school_id) AND (auth.uid() = sender_id OR auth.uid() = recipient_id)
);
DROP POLICY IF EXISTS "msg_insert" ON public.messages;
CREATE POLICY "msg_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  public.is_school_member(school_id) AND auth.uid() = sender_id
);

-- =============================================
-- support_tickets
-- =============================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS st_school_idx ON public.support_tickets(school_id);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "st_member_read" ON public.support_tickets;
CREATE POLICY "st_member_read" ON public.support_tickets FOR SELECT TO authenticated USING (public.is_school_member(school_id));
DROP POLICY IF EXISTS "st_member_insert" ON public.support_tickets;
CREATE POLICY "st_member_insert" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (public.is_school_member(school_id));
DROP POLICY IF EXISTS "st_super_update" ON public.support_tickets;
CREATE POLICY "st_super_update" ON public.support_tickets FOR UPDATE TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- cms_pages
-- =============================================
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cms_read" ON public.cms_pages;
CREATE POLICY "cms_read" ON public.cms_pages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cms_super_write" ON public.cms_pages;
CREATE POLICY "cms_super_write" ON public.cms_pages FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- bulletins
-- =============================================
CREATE TABLE IF NOT EXISTS public.bulletins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  term_key text,
  file_url text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'generated',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bul_school_idx ON public.bulletins(school_id);
CREATE INDEX IF NOT EXISTS bul_student_idx ON public.bulletins(student_id);
ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bul_member_read" ON public.bulletins;
CREATE POLICY "bul_member_read" ON public.bulletins FOR SELECT TO authenticated USING (public.is_school_member(school_id));
DROP POLICY IF EXISTS "bul_staff_write" ON public.bulletins;
CREATE POLICY "bul_staff_write" ON public.bulletins FOR ALL TO authenticated USING (public.is_school_staff(school_id)) WITH CHECK (public.is_school_staff(school_id));
