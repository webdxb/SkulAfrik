import { useAuth } from '../lib/auth';
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
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Nos plans</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Essential', price: '15 000', features: ['Élèves & parents', 'Classes & matières', 'Présences & notes', 'Messagerie'] },
          { name: 'Pro', price: '35 000', features: ['Tout Essential', 'Enseignants & personnel', 'Examens & bulletins', 'Transport & bibliothèque', 'Finances & rapports'] },
          { name: 'Enterprise', price: '80 000', features: ['Tout Pro', 'Anciens élèves', 'Comptabilité & paie', 'Support prioritaire', 'Stockage étendu'] },
        ].map((p) => (
          <div key={p.name} className="bg-white rounded-xl border border-slate-100 p-6">
            <h3 className="font-heading text-lg font-bold text-slate-900">{p.name}</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{p.price}<span className="text-sm font-normal text-slate-400"> FCFA/mois</span></p>
            <ul className="mt-4 space-y-2">{p.features.map((f) => <li key={f} className="text-sm text-slate-600 flex items-center gap-2"><span className="text-emerald-500">✓</span> {f}</li>)}</ul>
            <button className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Choisir</button>
          </div>
        ))}
      </div>
    </div>
  );
}
