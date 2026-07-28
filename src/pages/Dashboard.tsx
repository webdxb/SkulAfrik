import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';
import { useRoute, Link } from '../lib/router';
import { DashboardShell } from '../components/DashboardShell';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { TeacherDashboard } from './dashboards/TeacherDashboard';
import { ParentDashboard } from './dashboards/ParentDashboard';
import { StudentDashboard } from './dashboards/StudentDashboard';

// Module pages
import { StudentsPage } from './modules/StudentsPage';
import { ParentsPage } from './modules/ParentsPage';
import { TeachersPage } from './modules/TeachersPage';
import { StaffPage } from './modules/StaffPage';
import { ClassesPage } from './modules/ClassesPage';
import { SubjectsPage } from './modules/SubjectsPage';
import { AttendancePage } from './modules/AttendancePage';
import { GradesPage } from './modules/GradesPage';
import { ExamsPage } from './modules/ExamsPage';
import { BulletinsPage } from './modules/BulletinsPage';
import { CalendarPage } from './modules/CalendarPage';
import { TransportPage } from './modules/TransportPage';
import { LibraryPage } from './modules/LibraryPage';
import { AlumniPage } from './modules/AlumniPage';
import { FinancesPage } from './modules/FinancesPage';
import { AccountingPage } from './modules/AccountingPage';
import { PayrollPage } from './modules/PayrollPage';
import { ReportsPage } from './modules/ReportsPage';
import { MessagesPage } from './modules/MessagesPage';
import { SupportPage } from './modules/SupportPage';
import { SettingsPage } from './modules/SettingsPage';

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
    settings: SettingsPage,
  };

  const renderPage = () => {
    if (cleanPath === '' ) return renderHome();
    if (cleanPath === 'pricing') return <PricingPlaceholder />;
    const Page = pages[cleanPath];
    if (Page) return <Page />;
    return renderHome();
  };

  return <DashboardShell paywall={paywall}>{renderPage()}</DashboardShell>;
}

function PricingPlaceholder() {
  const { school, refresh } = useAuth();
  const { showError, showSuccess } = useToast();
  const [plans, setPlans] = useState<{ id: string; name: string; price_monthly: number; features: string[] }[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('plans').select('id, name, price_monthly, features').eq('is_active', true).order('sort_order');
      setPlans((data || []) as any);
    })();
  }, []);

  async function choosePlan(planId: string) {
    if (!school) return;
    setSaving(planId);
    const { error } = await supabase.from('schools').update({ plan_id: planId }).eq('id', school.id);
    setSaving(null);
    if (error) { showError(error.message); return; }
    showSuccess('Plan mis à jour.');
    await refresh();
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
                onClick={() => choosePlan(p.id)}
                disabled={saving === p.id || school?.plan_id === p.id}
                className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {school?.plan_id === p.id ? 'Plan actuel' : saving === p.id ? 'Activation...' : 'Choisir'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
