import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';
import { payForPlan } from '../lib/flutterwave';
import { useRoute, Link } from '../lib/router';
import { DashboardShell } from '../components/DashboardShell';
const AdminDashboard = lazy(() => import('./dashboards/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const TeacherDashboard = lazy(() => import('./dashboards/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard })));
const ParentDashboard = lazy(() => import('./dashboards/ParentDashboard').then((m) => ({ default: m.ParentDashboard })));
const StudentDashboard = lazy(() => import('./dashboards/StudentDashboard').then((m) => ({ default: m.StudentDashboard })));

// Module pages — lazy-loaded so a parent's browser never has to download the
// Payroll/Accounting/SuperAdmin-adjacent code it will never use, and vice versa.
const StudentsPage = lazy(() => import('./modules/StudentsPage').then((m) => ({ default: m.StudentsPage })));
const ParentsPage = lazy(() => import('./modules/ParentsPage').then((m) => ({ default: m.ParentsPage })));
const TeachersPage = lazy(() => import('./modules/TeachersPage').then((m) => ({ default: m.TeachersPage })));
const StaffPage = lazy(() => import('./modules/StaffPage').then((m) => ({ default: m.StaffPage })));
const ClassesPage = lazy(() => import('./modules/ClassesPage').then((m) => ({ default: m.ClassesPage })));
const SubjectsPage = lazy(() => import('./modules/SubjectsPage').then((m) => ({ default: m.SubjectsPage })));
const AttendancePage = lazy(() => import('./modules/AttendancePage').then((m) => ({ default: m.AttendancePage })));
const GradesPage = lazy(() => import('./modules/GradesPage').then((m) => ({ default: m.GradesPage })));
const ExamsPage = lazy(() => import('./modules/ExamsPage').then((m) => ({ default: m.ExamsPage })));
const BulletinsPage = lazy(() => import('./modules/BulletinsPage').then((m) => ({ default: m.BulletinsPage })));
const CalendarPage = lazy(() => import('./modules/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const TransportPage = lazy(() => import('./modules/TransportPage').then((m) => ({ default: m.TransportPage })));
const LibraryPage = lazy(() => import('./modules/LibraryPage').then((m) => ({ default: m.LibraryPage })));
const AlumniPage = lazy(() => import('./modules/AlumniPage').then((m) => ({ default: m.AlumniPage })));
const FinancesPage = lazy(() => import('./modules/FinancesPage').then((m) => ({ default: m.FinancesPage })));
const AccountingPage = lazy(() => import('./modules/AccountingPage').then((m) => ({ default: m.AccountingPage })));
const PayrollPage = lazy(() => import('./modules/PayrollPage').then((m) => ({ default: m.PayrollPage })));
const ReportsPage = lazy(() => import('./modules/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const MessagesPage = lazy(() => import('./modules/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const SupportPage = lazy(() => import('./modules/SupportPage').then((m) => ({ default: m.SupportPage })));
const SettingsPage = lazy(() => import('./modules/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const DisciplinePage = lazy(() => import('./modules/DisciplinePage').then((m) => ({ default: m.DisciplinePage })));

export function Dashboard({ paywall }: { paywall?: boolean }) {
  const { profile } = useAuth();
  const path = useRoute();
  const role = profile?.role || 'parent';
  const cleanPath = path.replace(/^\/dashboard\/?/, '');

  const renderHome = () => {
    if (role === 'teacher') return <TeacherDashboard />;
    if (role === 'parent') return <ParentDashboard />;
    if (role === 'student') return <StudentDashboard />;
    return <AdminDashboard />;
  };

  const pages: Record<string, React.FC> = {
    students: StudentsPage, parents: ParentsPage, teachers: TeachersPage, staff: StaffPage,
    classes: ClassesPage, subjects: SubjectsPage, attendance: AttendancePage, grades: GradesPage,
    exams: ExamsPage, bulletins: BulletinsPage, calendar: CalendarPage, transport: TransportPage,
    library: LibraryPage, alumni: AlumniPage, finances: FinancesPage, accounting: AccountingPage,
    payroll: PayrollPage, reports: ReportsPage, messages: MessagesPage, support: SupportPage,
    settings: SettingsPage, discipline: DisciplinePage,
  };

  const renderPage = () => {
    if (cleanPath === '' ) return renderHome();
    if (cleanPath === 'pricing') return <PricingPlaceholder />;
    const Page = pages[cleanPath];
    if (Page) return <Page />;
    return renderHome();
  };

  return (
    <DashboardShell paywall={paywall}>
      <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-slate-400">Chargement...</div>}>
        {renderPage()}
      </Suspense>
    </DashboardShell>
  );
}

function PricingPlaceholder() {
  const { school, profile, refresh } = useAuth();
  const { showError, showSuccess } = useToast();
  const [plans, setPlans] = useState<{ id: string; name: string; price_monthly: number; features: string[] }[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('plans').select('id, name, price_monthly, features').eq('is_active', true).order('sort_order');
      setPlans((data || []) as any);
    })();
  }, []);

  async function choosePlan(plan: { id: string; name: string; price_monthly: number }) {
    if (!school || !profile) return;
    setSaving(plan.id);
    await payForPlan({
      school: { id: school.id, name: school.name, email: school.email },
      profile: { email: profile.email, first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone },
      plan,
      billingPeriod: 'monthly',
      amount: plan.price_monthly,
      currency: 'USD',
      onSuccess: async () => {
        setSaving(null);
        showSuccess('Plan mis à jour.');
        await refresh();
      },
      onError: (message) => { setSaving(null); showError(message); },
      onClose: () => { setSaving(null); },
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Nos plans</h1>
      {plans.length === 0 ? (
        <p className="text-sm text-slate-400">Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl border p-6 ${school?.plan_id === p.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-100'}`}>
              <h3 className="font-heading text-lg font-bold text-slate-900">{p.name}</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">${p.price_monthly.toFixed(0)}<span className="text-sm font-normal text-slate-400"> /mois</span></p>
              <ul className="mt-4 space-y-2">{(p.features || []).map((f) => <li key={f} className="text-sm text-slate-600 flex items-center gap-2"><span className="text-emerald-500">✓</span> {f}</li>)}</ul>
              <button
                onClick={() => choosePlan(p)}
                disabled={saving === p.id || school?.plan_id === p.id}
                className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {school?.plan_id === p.id ? 'Plan actuel' : saving === p.id ? 'Paiement...' : 'Choisir'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
