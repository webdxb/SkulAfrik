import { ReactNode, useState } from 'react';
import { useAuth } from '../lib/auth';
import { Link, useRoute } from '../lib/router';
import { LogOut, Menu, Users, BookOpen, Calendar, Wallet, BarChart3, Mail, LifeBuoy, Settings, Bus, Library, FileText, ClipboardList, Calculator, Lock, Home, Shield } from 'lucide-react';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

interface NavItem { to: string; label: string; labelEn: string; icon: any; group?: string; groupEn?: string; roles?: string[]; module?: string }

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Tableau de bord', labelEn: 'Dashboard', icon: Home, roles: ['admin','teacher','parent','student','staff'] },
  { to: '/dashboard/students', label: 'Élèves', labelEn: 'Students', icon: Users, group: 'Pédagogie', groupEn: 'Academic', roles: ['admin','staff'], module: 'students' },
  { to: '/dashboard/parents', label: 'Parents', labelEn: 'Parents', icon: Users, group: 'Pédagogie', groupEn: 'Academic', roles: ['admin','staff'], module: 'parents_portal' },
  { to: '/dashboard/teachers', label: 'Enseignants', labelEn: 'Teachers', icon: Users, group: 'Pédagogie', groupEn: 'Academic', roles: ['admin','staff'], module: 'teachers' },
  { to: '/dashboard/staff', label: 'Personnel', labelEn: 'Staff', icon: Users, group: 'Pédagogie', groupEn: 'Academic', roles: ['admin'], module: 'staff' },
  { to: '/dashboard/classes', label: 'Classes', labelEn: 'Classes', icon: BookOpen, group: 'Pédagogie', groupEn: 'Academic', roles: ['admin','staff','teacher'], module: 'students' },
  { to: '/dashboard/subjects', label: 'Matières', labelEn: 'Subjects', icon: BookOpen, group: 'Pédagogie', groupEn: 'Academic', roles: ['admin','staff'], module: 'students' },
  { to: '/dashboard/attendance', label: 'Présences', labelEn: 'Attendance', icon: ClipboardList, group: 'Évaluations', groupEn: 'Assessment', roles: ['admin','staff','teacher'], module: 'attendance' },
  { to: '/dashboard/grades', label: 'Notes', labelEn: 'Grades', icon: BookOpen, group: 'Évaluations', groupEn: 'Assessment', roles: ['admin','staff','teacher'], module: 'grades' },
  { to: '/dashboard/exams', label: 'Examens', labelEn: 'Exams', icon: FileText, group: 'Évaluations', groupEn: 'Assessment', roles: ['admin','staff'], module: 'exams' },
  { to: '/dashboard/bulletins', label: 'Bulletins', labelEn: 'Report Cards', icon: FileText, group: 'Évaluations', groupEn: 'Assessment', roles: ['admin','staff'], module: 'grades' },
  { to: '/dashboard/calendar', label: 'Calendrier', labelEn: 'Calendar', icon: Calendar, group: 'Vie scolaire', groupEn: 'School Life', roles: ['admin','staff','teacher','student','parent'], module: 'calendar' },
  { to: '/dashboard/transport', label: 'Transport', labelEn: 'Transport', icon: Bus, group: 'Vie scolaire', groupEn: 'School Life', roles: ['admin','staff'], module: 'transport' },
  { to: '/dashboard/library', label: 'Bibliothèque', labelEn: 'Library', icon: Library, group: 'Vie scolaire', groupEn: 'School Life', roles: ['admin','staff'], module: 'library' },
  { to: '/dashboard/alumni', label: 'Anciens', labelEn: 'Alumni', icon: Users, group: 'Vie scolaire', groupEn: 'School Life', roles: ['admin','staff'], module: 'alumni' },
  { to: '/dashboard/finances', label: 'Finances', labelEn: 'Finances', icon: Wallet, group: 'Gestion', groupEn: 'Management', roles: ['admin','staff','parent'], module: 'finances' },
  { to: '/dashboard/accounting', label: 'Comptabilité', labelEn: 'Accounting', icon: Calculator, group: 'Gestion', groupEn: 'Management', roles: ['admin'], module: 'accounting' },
  { to: '/dashboard/payroll', label: 'Paie', labelEn: 'Payroll', icon: Wallet, group: 'Gestion', groupEn: 'Management', roles: ['admin'], module: 'payroll' },
  { to: '/dashboard/reports', label: 'Rapports', labelEn: 'Reports', icon: BarChart3, group: 'Gestion', groupEn: 'Management', roles: ['admin'], module: 'reports' },
  { to: '/dashboard/messages', label: 'Messagerie', labelEn: 'Messages', icon: Mail, group: 'Communication', groupEn: 'Communication', roles: ['admin','staff','teacher','parent','student'], module: 'messaging' },
  { to: '/dashboard/support', label: 'Support', labelEn: 'Support', icon: LifeBuoy, group: 'Communication', groupEn: 'Communication', roles: ['admin','staff','teacher','parent','student'] },
  { to: '/dashboard/settings', label: 'Paramètres', labelEn: 'Settings', icon: Settings, group: 'Système', groupEn: 'System', roles: ['admin','staff','teacher','parent','student'] },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const { school, profile, signOut, subscriptionActive, planModules, isSuperAdmin } = useAuth();
  const path = useRoute();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = profile?.role || 'admin';
  const isModuleLocked = (mod?: string): boolean => {
    if (!mod) return false;
    if (subscriptionActive && planModules === null) return false;
    if (planModules === null) return true;
    return !planModules.includes(mod);
  };
  const visibleNav = NAV.filter((n) => !n.roles || n.roles.includes(role));
  const groups = Array.from(new Set(visibleNav.map((n) => n.group || ''))).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-shrink-0 transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center px-5 border-b border-slate-100 dark:border-slate-800">
          <Link to="/dashboard"><Logo height={40} /></Link>
        </div>
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto py-4 px-3 space-y-4">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-3 mb-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{group}</p>
              <div className="space-y-0.5">
                {visibleNav.filter((n) => (n.group || '') === group).map((item) => {
                  const active = path === item.to || (item.to !== '/dashboard' && path.startsWith(item.to));
                  const locked = isModuleLocked(item.module);
                  return (
                    <Link key={item.to} to={locked ? '/pricing' : item.to} onClick={() => setMobileOpen(false)} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active && !locked ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'} ${locked ? 'opacity-60' : ''}`}>
                      <item.icon size={16} className={active && !locked ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                      {item.label}
                      {locked && <Lock size={12} className="ml-auto text-slate-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {isSuperAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="px-3 mb-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Administration</p>
              <Link to="/super-admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Shield size={16} className="text-slate-400 dark:text-slate-500" />
                Dashboard Super Admin
              </Link>
            </div>
          )}
        </nav>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400"><Menu size={20} /></button>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{school?.name || 'SKUL AFRIK'}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{profile?.first_name} {profile?.last_name} · {profile?.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <Link to="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hidden sm:inline ml-2">Accueil</Link>
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
