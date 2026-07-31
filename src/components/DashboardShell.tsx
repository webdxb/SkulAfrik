import { useAuth } from '../lib/auth';
import { Link, useRoute, navigate } from '../lib/router';
import { Logo } from './Logo';
import { ReactNode, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Menu, X, Bell } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

const MODULES = [
  { path: 'students', label: 'Élèves', icon: '🎓', roles: ['admin', 'teacher'] },
  { path: 'parents', label: 'Parents', icon: '👨‍👩‍👧', roles: ['admin', 'teacher'] },
  { path: 'teachers', label: 'Enseignants', icon: '📚', roles: ['admin'] },
  { path: 'staff', label: 'Personnel', icon: '👔', roles: ['admin'] },
  { path: 'classes', label: 'Classes', icon: '🏫', roles: ['admin', 'teacher'] },
  { path: 'subjects', label: 'Matières', icon: '📖', roles: ['admin', 'teacher'] },
  { path: 'attendance', label: 'Présences', icon: '✅', roles: ['admin', 'teacher', 'parent', 'student'] },
  { path: 'grades', label: 'Notes', icon: '📊', roles: ['admin', 'teacher', 'parent', 'student'] },
  { path: 'exams', label: 'Examens', icon: '📝', roles: ['admin', 'teacher'] },
  { path: 'bulletins', label: 'Bulletins', icon: '📄', roles: ['admin', 'teacher', 'parent', 'student'] },
  { path: 'discipline', label: 'Discipline', icon: '🚨', roles: ['admin', 'teacher'] },
  { path: 'calendar', label: 'Calendrier', icon: '📅', roles: ['admin', 'teacher', 'parent', 'student'] },
  { path: 'transport', label: 'Transport', icon: '🚌', roles: ['admin'] },
  { path: 'library', label: 'Bibliothèque', icon: '📕', roles: ['admin'] },
  { path: 'alumni', label: 'Anciens', icon: '🎓', roles: ['admin'] },
  { path: 'finances', label: 'Finances', icon: '💰', roles: ['admin', 'parent'] },
  { path: 'accounting', label: 'Comptabilité', icon: '🧾', roles: ['admin'] },
  { path: 'payroll', label: 'Paie', icon: '💳', roles: ['admin'] },
  { path: 'reports', label: 'Rapports', icon: '📈', roles: ['admin'] },
  { path: 'messages', label: 'Messagerie', icon: '💬', roles: ['admin', 'teacher', 'parent', 'student'] },
  { path: 'support', label: 'Support', icon: '🛟', roles: ['admin', 'teacher', 'parent', 'student'] },
  { path: 'settings', label: 'Paramètres', icon: '⚙️', roles: ['admin'] },
];

// Maps a sidebar module path to the key used in plans.modules (jsonb).
// null = core module, always available regardless of plan (not plan-gated).
const PLAN_MODULE_KEY: Record<string, string | null> = {
  students: 'students', parents: 'parents_portal', teachers: 'teachers', staff: 'staff',
  classes: null, subjects: null,
  attendance: 'attendance', grades: 'grades', exams: 'exams', bulletins: null, discipline: 'discipline',
  calendar: 'calendar', transport: 'transport', library: 'library', alumni: 'alumni',
  finances: 'finances', accounting: 'accounting', payroll: 'payroll', reports: 'reports',
  messages: 'messaging', support: null, settings: null,
};

export function DashboardShell({ children, paywall = false }: { children: ReactNode; paywall?: boolean }) {
  const { profile, school, signOut, planModules, subscriptionActive } = useAuth();
  const path = useRoute();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = profile?.role || 'parent';

  // Matches school_has_module() in SQL: during an active trial, every module is accessible
  // regardless of the selected plan — restriction only applies once the trial has ended.
  const inActiveTrial = school?.subscription_status === 'trial' && !!school?.trial_ends_at && new Date(school.trial_ends_at) > new Date();

  const visibleModules = MODULES.filter((m) => {
    if (!m.roles.includes(role)) return false;
    if (inActiveTrial) return true;
    const planKey = PLAN_MODULE_KEY[m.path];
    if (!planKey) return true; // core module, not plan-gated
    if (planModules === null) return true; // still loading, or no plan context (avoid flashing an empty sidebar)
    return planModules.includes(planKey);
  });
  const cleanPath = path.replace(/^\/dashboard\/?/, '');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', profile.id)
        .is('read_at', null);
      if (!cancelled) setUnreadCount(count || 0);
    })();
    return () => { cancelled = true; };
  }, [profile?.id, cleanPath]);

  if (paywall) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Logo height={48} />
          <h1 className="mt-6 font-heading text-2xl font-bold text-slate-900">Essai expiré</h1>
          <p className="mt-2 text-sm text-slate-500">Votre essai gratuit est terminé. Souscrivez à un plan pour continuer à utiliser la plateforme.</p>
          <button onClick={() => navigate('/pricing')} className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Voir les plans</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 flex flex-col transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
          <Link to="/dashboard" onClick={() => setSidebarOpen(false)}><Logo height={40} variant="dark" /></Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${cleanPath === '' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>🏠 Accueil</Link>
          {visibleModules.map((m) => (
            <Link key={m.path} to={`/dashboard/${m.path}`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${cleanPath === m.path ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <span>{m.icon}</span> {m.label}
            </Link>
          ))}
        </nav>
        <div className="px-2 py-4 border-t border-slate-800">
          <div className="px-3 py-2 text-xs text-slate-500">{school?.name || 'Établissement'}</div>
          <button onClick={signOut} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 w-full"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600"><Menu size={20} /></button>
            <span className="text-sm font-medium text-slate-500">{profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <button onClick={() => navigate('/dashboard/messages')} className="relative text-slate-400 hover:text-slate-600" aria-label="Messages non lus">
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500" />}
            </button>
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">{(profile?.first_name?.[0] || profile?.email?.[0] || '?').toUpperCase()}</div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          {role !== 'admin' && !subscriptionActive && (
            <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
              L'abonnement de votre établissement doit être renouvelé. Certaines fonctionnalités peuvent être limitées — contactez l'administration de votre école, vous n'avez rien à payer vous-même.
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
