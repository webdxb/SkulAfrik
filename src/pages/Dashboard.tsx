import { useAuth } from '../lib/auth';
import { useRoute, Link } from '../lib/router';
import { DashboardShell } from '../components/DashboardShell';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { TeacherDashboard } from './dashboards/TeacherDashboard';
import { ParentDashboard } from './dashboards/ParentDashboard';
import { StudentDashboard } from './dashboards/StudentDashboard';
import { PaywallPage } from './Paywall';
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

export function Dashboard({ paywall = false }: { paywall?: boolean }) {
  const { profile, subscriptionActive, planModules } = useAuth();
  const path = useRoute();
  const cleanPath = path.split('?')[0];
  const role = profile?.role || 'admin';

  if (paywall) return <PaywallPage />;

  const isModuleLocked = (mod?: string): boolean => {
    if (!mod) return false;
    if (subscriptionActive && planModules === null) return false;
    if (planModules === null) return true;
    return !planModules.includes(mod);
  };

  const MODULE_MAP: Record<string, string> = {
    '/dashboard/students': 'students', '/dashboard/parents': 'parents_portal', '/dashboard/teachers': 'teachers',
    '/dashboard/staff': 'staff', '/dashboard/classes': 'students', '/dashboard/subjects': 'students',
    '/dashboard/attendance': 'attendance', '/dashboard/grades': 'grades', '/dashboard/exams': 'exams',
    '/dashboard/bulletins': 'grades', '/dashboard/calendar': 'calendar', '/dashboard/transport': 'transport',
    '/dashboard/library': 'library', '/dashboard/alumni': 'alumni', '/dashboard/finances': 'finances',
    '/dashboard/accounting': 'accounting', '/dashboard/payroll': 'payroll', '/dashboard/reports': 'reports',
    '/dashboard/messages': 'messaging',
  };

  if (MODULE_MAP[cleanPath] && isModuleLocked(MODULE_MAP[cleanPath])) return <PaywallPage />;

  const renderHome = () => {
    if (role === 'teacher') return <TeacherDashboard />;
    if (role === 'parent') return <ParentDashboard />;
    if (role === 'student') return <StudentDashboard />;
    return <AdminDashboard />;
  };

  const renderPage = () => {
    if (cleanPath === '/dashboard' || cleanPath === '/dashboard/') return renderHome();
    if (cleanPath === '/pricing') return <PaywallPage />;
    const pages: Record<string, React.FC> = {
      '/dashboard/students': StudentsPage, '/dashboard/parents': ParentsPage, '/dashboard/teachers': TeachersPage,
      '/dashboard/staff': StaffPage, '/dashboard/classes': ClassesPage, '/dashboard/subjects': SubjectsPage,
      '/dashboard/attendance': AttendancePage, '/dashboard/grades': GradesPage, '/dashboard/exams': ExamsPage,
      '/dashboard/bulletins': BulletinsPage, '/dashboard/calendar': CalendarPage, '/dashboard/transport': TransportPage,
      '/dashboard/library': LibraryPage, '/dashboard/alumni': AlumniPage, '/dashboard/finances': FinancesPage,
      '/dashboard/accounting': AccountingPage, '/dashboard/payroll': PayrollPage, '/dashboard/reports': ReportsPage,
      '/dashboard/messages': MessagesPage, '/dashboard/support': SupportPage, '/dashboard/settings': SettingsPage,
    };
    const Page = pages[cleanPath];
    if (Page) return <Page />;
    return <ModulePlaceholder path={cleanPath} />;
  };

  return <DashboardShell>{renderPage()}</DashboardShell>;
}

function ModulePlaceholder({ path }: { path: string }) {
  const label = path.split('/').pop() || 'module';
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold capitalize text-slate-900">{label.replace(/-/g, ' ')}</h1>
        <p className="mt-1 text-sm text-slate-500">Module en cours de configuration.</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
        <p className="text-sm text-slate-400">Ce module sera disponible prochainement.</p>
        <Link to="/dashboard" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Retour au tableau de bord</Link>
      </div>
    </div>
  );
}
