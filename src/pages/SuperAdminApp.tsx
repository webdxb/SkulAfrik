import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRoute, navigate, Link } from '../lib/router';
import { useAuth } from '../lib/auth';
import { LogOut, Building2, LifeBuoy, BookOpen, Users, Shield, Wallet, BarChart3, ScrollText, CreditCard, Settings, ChevronRight, Search, Check, X, AlertCircle, TrendingUp, Globe, Server, Lock, Plus, Trash2, Edit3, ShieldCheck, UserCircle, Briefcase, GraduationCap, Clock } from 'lucide-react';
import { inputCls, PageHeader, Modal, StatCard, EmptyState } from '../components/ui';
import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';

const NAV = [
  { to: '/super-admin', label: 'Vue d\'ensemble', icon: BarChart3 },
  { to: '/super-admin/platform', label: 'Plateforme SKUL AFRIK', icon: Globe },
  { to: '/super-admin/schools', label: 'Écoles', icon: Building2 },
  { to: '/super-admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/super-admin/roles', label: 'Rôles & Permissions', icon: ShieldCheck },
  { to: '/super-admin/billing', label: 'Facturation', icon: CreditCard },
  { to: '/super-admin/plans', label: 'Plans & tarifs', icon: Wallet },
  { to: '/super-admin/sales', label: 'Codes commerciaux', icon: Briefcase },
  { to: '/super-admin/performance', label: 'Performance staff', icon: TrendingUp },
  { to: '/super-admin/catalog', label: 'Catalogue académique', icon: BookOpen },
  { to: '/super-admin/audit', label: 'Journal d\'audit', icon: ScrollText },
  { to: '/super-admin/support', label: 'Support', icon: LifeBuoy },
  { to: '/super-admin/settings', label: 'Paramètres', icon: Settings },
];

const FOUNDER_EMAILS = ['vincentnogue@yahoo.com', 'vincentnogue2@gmail.com', 'webdxb1@gmail.com'];

export function SuperAdminApp() {
  const path = useRoute();
  const cleanPath = path.split('?')[0];
  const { signOut } = useAuth();

  const renderPage = () => {
    if (cleanPath === '/super-admin' || cleanPath === '/super-admin/') return <SuperAdminDashboard />;
    if (cleanPath === '/super-admin/platform') return <PlatformOverview />;
    if (cleanPath === '/super-admin/schools') return <SchoolsAdmin />;
    if (cleanPath === '/super-admin/users') return <UsersAdmin />;
    if (cleanPath === '/super-admin/roles') return <RolesAdmin />;
    if (cleanPath === '/super-admin/billing') return <BillingAdmin />;
    if (cleanPath === '/super-admin/plans') return <PlansAdmin />;
    if (cleanPath === '/super-admin/sales') return <SalesCodesAdmin />;
    if (cleanPath === '/super-admin/performance') return <StaffPerformance />;
    if (cleanPath === '/super-admin/catalog') return <CatalogAdmin />;
    if (cleanPath === '/super-admin/audit') return <AuditAdmin />;
    if (cleanPath === '/super-admin/support') return <SupportAdmin />;
    if (cleanPath === '/super-admin/settings') return <SettingsAdmin />;
    return <SuperAdminDashboard />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <aside className="sticky top-0 z-40 h-screen w-64 bg-slate-900 flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-800">
          <Link to="/super-admin"><Logo height={40} variant="dark" /></Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supervision</p>
          {NAV.slice(0, 10).map((item) => {
            const active = cleanPath === item.to;
            return (<Link key={item.to} to={item.to} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}><item.icon size={16} /> {item.label}</Link>);
          })}
          <p className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Système</p>
          {NAV.slice(10).map((item) => {
            const active = cleanPath === item.to;
            return (<Link key={item.to} to={item.to} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}><item.icon size={16} /> {item.label}</Link>);
          })}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link to="/" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800"><Globe size={16} /> Site public</Link>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Super Admin</p>
            <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500">· LIYAH GROUP</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{renderPage()}</main>
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────
function SuperAdminDashboard() {
  const [stats, setStats] = useState({ schools: 0, students: 0, teachers: 0, parents: 0, revenue: 0, activeTrials: 0 });
  const [recentSchools, setRecentSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, st, t, pa, p, tr, rs] = await Promise.all([
        supabase.from('schools').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
        supabase.from('payments').select('amount'),
        supabase.from('schools').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trial'),
        supabase.from('schools').select('name, country, city, subscription_status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);
      const revenue = (p.data || []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);
      setStats({ schools: s.count || 0, students: st.count || 0, teachers: t.count || 0, parents: pa.count || 0, revenue, activeTrials: tr.count || 0 });
      setRecentSchools(rs.data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Vue d'ensemble" subtitle="Supervision globale de la plateforme SKUL AFRIK" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Écoles inscrites" value={stats.schools} color="border-l-indigo-500" icon={Building2} />
        <StatCard label="Essais actifs" value={stats.activeTrials} color="border-l-amber-500" icon={TrendingUp} />
        <StatCard label="Élèves" value={stats.students} color="border-l-emerald-500" icon={Users} />
        <StatCard label="Enseignants" value={stats.teachers} color="border-l-sky-500" icon={BookOpen} />
        <StatCard label="Parents" value={stats.parents} color="border-l-violet-500" icon={Users} />
        <StatCard label="Revenus (FCFA)" value={stats.revenue.toLocaleString()} color="border-l-rose-500" icon={Wallet} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Écoles récentes</h3>
          {loading ? <p className="text-sm text-slate-400">Chargement...</p> : recentSchools.length === 0 ? <p className="text-sm text-slate-400">Aucune école.</p> : (
            <div className="space-y-3">{recentSchools.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">{s.name}</p><p className="text-xs text-slate-400">{s.city || '—'}, {s.country}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.subscription_status === 'trial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : s.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{s.subscription_status}</span>
              </div>
            ))}</div>
          )}
          <Link to="/super-admin/schools" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Voir toutes les écoles <ChevronRight size={14} /></Link>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">État du système</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Server size={16} className="text-emerald-500" /><span className="text-sm text-slate-600 dark:text-slate-400">Base de données</span></div><span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Opérationnel</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Lock size={16} className="text-emerald-500" /><span className="text-sm text-slate-600 dark:text-slate-400">RLS Multi-tenant</span></div><span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Actif</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Globe size={16} className="text-emerald-500" /><span className="text-sm text-slate-600 dark:text-slate-400">API Supabase</span></div><span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">En ligne</span></div>
          </div>
          <Link to="/super-admin/platform" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Vue plateforme complète <ChevronRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
}

// ─── Platform Overview ──────────────────────────────────────
function PlatformOverview() {
  const [stats, setStats] = useState({ schools: 0, students: 0, teachers: 0, parents: 0, countries: 0, revenue: 0, trials: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, st, t, pa, c, p, tr, ac] = await Promise.all([
        supabase.from('schools').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
        supabase.from('schools').select('country'),
        supabase.from('payments').select('amount'),
        supabase.from('schools').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trial'),
        supabase.from('schools').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      ]);
      const countries = new Set((c.data || []).map((r: any) => r.country).filter(Boolean));
      const revenue = (p.data || []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);
      setStats({ schools: s.count || 0, students: st.count || 0, teachers: t.count || 0, parents: pa.count || 0, countries: countries.size, revenue, trials: tr.count || 0, active: ac.count || 0 });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Plateforme SKUL AFRIK" subtitle="Vue globale de l'étendue de la plateforme" />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total écoles" value={stats.schools} color="border-l-indigo-500" icon={Building2} />
            <StatCard label="Pays couverts" value={stats.countries} color="border-l-emerald-500" icon={Globe} />
            <StatCard label="Total utilisateurs" value={stats.students + stats.teachers + stats.parents} color="border-l-sky-500" icon={Users} />
            <StatCard label="Revenus totaux (FCFA)" value={stats.revenue.toLocaleString()} color="border-l-rose-500" icon={Wallet} />
            <StatCard label="Écoles actives" value={stats.active} color="border-l-emerald-500" icon={Check} />
            <StatCard label="Essais en cours" value={stats.trials} color="border-l-amber-500" icon={Clock} />
            <StatCard label="Élèves" value={stats.students} color="border-l-violet-500" icon={GraduationCap} />
            <StatCard label="Enseignants + Parents" value={stats.teachers + stats.parents} color="border-l-indigo-500" icon={Users} />
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Répartition par statut</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">Actif</span><span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">Essai</span><span className="text-sm font-bold text-amber-600 dark:text-amber-400">{stats.trials}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-slate-600 dark:text-slate-400">Total écoles</span><span className="text-sm font-bold text-slate-900 dark:text-slate-100">{stats.schools}</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Schools ─────────────────────────────────────────────────
function SchoolsAdmin() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'trial' | 'active' | 'expired'>('all');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    setSchools(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const verify = async (id: string) => { await supabase.from('schools').update({ verification_status: 'verified' }).eq('id', id); load(); };
  const toggleStatus = async (s: any) => {
    const newStatus = s.subscription_status === 'active' ? 'suspended' : 'active';
    await supabase.from('schools').update({ subscription_status: newStatus }).eq('id', s.id); load();
  };

  const filtered = schools.filter((s) => {
    if (filter !== 'all' && s.subscription_status !== filter) return false;
    if (search && !s.name?.toLowerCase().includes(search.toLowerCase()) && !s.country?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Écoles" subtitle={`${schools.length} établissement(s) · ${schools.filter(s => s.subscription_status === 'active').length} actifs`} />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className={`${inputCls} pl-9`} /></div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className={`${inputCls} sm:w-48`}><option value="all">Tous statuts</option><option value="trial">Essai</option><option value="active">Actif</option><option value="expired">Expiré</option></select>
      </div>
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : filtered.length === 0 ? <EmptyState icon={Building2} title="Aucune école" message="Aucune école ne correspond à vos critères." /> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]"><thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Nom</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Pays</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Ville</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Statut</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Abonnement</th><th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">{filtered.map((s) => (<tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"><td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.name}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.country}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.city || '—'}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>{s.verification_status}</span></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : s.subscription_status === 'trial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>{s.subscription_status}</span></td><td className="px-4 py-3 text-right space-x-2">{s.verification_status !== 'verified' && <button onClick={() => verify(s.id)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Vérifier</button>}<button onClick={() => toggleStatus(s)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">{s.subscription_status === 'active' ? 'Suspendre' : 'Activer'}</button></td></tr>))}</tbody></table>
        </div>
      )}
    </div>
  );
}

// ─── Users (differentiated views) ───────────────────────────
function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'super_admin' | 'staff' | 'school_admin' | 'teacher' | 'parent' | 'student'>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*, schools(name), custom_roles(name, description)').order('created_at', { ascending: false }).limit(200);
    setUsers(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    if (typeFilter !== 'all') {
      if (typeFilter === 'staff' && !u.custom_role_id) return false;
      if (typeFilter !== 'staff' && u.role !== typeFilter) return false;
    }
    if (search && !`${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const roleLabel = (r: string) => ({ super_admin: 'Super Admin', school_admin: 'Admin École', teacher: 'Enseignant', parent: 'Parent', student: 'Élève', staff: 'Personnel' } as Record<string, string>)[r] || r;
  const typeIcon = (u: any) => {
    if (u.role === 'super_admin') return Shield;
    if (u.custom_role_id) return Briefcase;
    if (u.role === 'school_admin') return Building2;
    if (u.role === 'teacher') return BookOpen;
    if (u.role === 'parent') return Users;
    if (u.role === 'student') return GraduationCap;
    return UserCircle;
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Utilisateurs" subtitle={`${users.length} utilisateur(s)`} />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className={`${inputCls} pl-9`} /></div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className={`${inputCls} sm:w-48`}><option value="all">Tous types</option><option value="super_admin">Super Admin</option><option value="staff">Staff interne</option><option value="school_admin">Admin École</option><option value="teacher">Enseignant</option><option value="parent">Parent</option><option value="student">Élève</option></select>
      </div>
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : filtered.length === 0 ? <EmptyState icon={Users} title="Aucun utilisateur" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => {
            const Icon = typeIcon(u);
            return (
              <button key={u.id} onClick={() => setSelectedUser(u)} className="text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0"><Icon size={20} className="text-slate-600 dark:text-slate-400" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email || '—'}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className="rounded bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400">{roleLabel(u.role)}</span>
                      {u.custom_roles && <span className="rounded bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-xs text-indigo-600 dark:text-indigo-400">{u.custom_roles.name}</span>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: any; onClose: () => void }) {
  const roleLabel = (r: string) => ({ super_admin: 'Super Admin', school_admin: 'Admin École', teacher: 'Enseignant', parent: 'Parent', student: 'Élève', staff: 'Personnel' } as Record<string, string>)[r] || r;
  const isSuperAdmin = user.role === 'super_admin';
  const isStaff = !!user.custom_role_id;
  const isSchoolAdmin = user.role === 'school_admin';

  return (
    <Modal title="Détails utilisateur" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><UserCircle size={28} className="text-slate-500" /></div>
          <div><p className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">{user.first_name} {user.last_name}</p><p className="text-sm text-slate-500 dark:text-slate-400">{user.email || '—'}</p></div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Rôle</span><span className="font-medium text-slate-900 dark:text-slate-100">{roleLabel(user.role)}</span></div>
          {user.custom_roles && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Rôle personnalisé</span><span className="font-medium text-indigo-600 dark:text-indigo-400">{user.custom_roles.name}</span></div>}
          {user.custom_roles?.description && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Description</span><span className="text-slate-600 dark:text-slate-300 text-right">{user.custom_roles.description}</span></div>}
          {user.schools && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Établissement</span><span className="font-medium text-slate-900 dark:text-slate-100">{user.schools.name}</span></div>}
          {user.phone && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Téléphone</span><span className="text-slate-600 dark:text-slate-300">{user.phone}</span></div>}
          <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Statut</span><span className={`font-medium ${user.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{user.is_active ? 'Actif' : 'Inactif'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Inscrit le</span><span className="text-slate-600 dark:text-slate-300">{new Date(user.created_at).toLocaleDateString('fr-FR')}</span></div>
        </div>
        {/* Role-specific sections */}
        {isSuperAdmin && (
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-3">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5"><Shield size={14} /> Super Admin — Accès total plateforme</p>
          </div>
        )}
        {isStaff && (
          <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 p-3">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5"><Briefcase size={14} /> Staff interne — {user.custom_roles?.name}</p>
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">Permissions définies par le Super Admin via le module Rôles & Permissions.</p>
          </div>
        )}
        {isSchoolAdmin && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5"><Building2 size={14} /> Admin École — {user.schools?.name || 'Établissement non défini'}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Gère son établissement, son équipe et ses finances.</p>
          </div>
        )}
        <button onClick={onClose} className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">Fermer</button>
      </div>
    </Modal>
  );
}

// ─── RBAC Roles & Permissions ───────────────────────────────
function RolesAdmin() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  const MODULES = ['students', 'teachers', 'attendance', 'grades', 'finances', 'transport', 'library', 'messaging', 'reports', 'accounting', 'payroll', 'calendar', 'support', 'settings'];

  const load = async () => {
    setLoading(true);
    const [r, p] = await Promise.all([
      supabase.from('custom_roles').select('*').order('name'),
      supabase.from('custom_role_permissions').select('*, custom_roles(name)'),
    ]);
    setRoles(r.data || []);
    setPermissions(p.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (role: any) => { await supabase.from('custom_roles').update({ is_active: !role.is_active }).eq('id', role.id); load(); };
  const getRolePerms = (roleId: string) => permissions.filter((p) => p.role_id === roleId);
  const updatePerm = async (roleId: string, module: string, field: 'can_read' | 'can_write' | 'can_delete', value: boolean) => {
    const existing = permissions.find((p) => p.role_id === roleId && p.module === module);
    if (existing) { await supabase.from('custom_role_permissions').update({ [field]: value }).eq('id', existing.id); }
    else { await supabase.from('custom_role_permissions').insert({ role_id: roleId, module, [field]: value }); }
    load();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Rôles & Permissions" subtitle="Créez des rôles personnalisés avec permissions granulaires (RBAC)" action={<button onClick={() => { setEditingRole(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Nouveau rôle</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-3">
            {roles.map((r) => (
              <button key={r.id} onClick={() => setSelectedRole(r)} className={`w-full text-left bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm transition ${selectedRole?.id === r.id ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-200 dark:ring-indigo-800' : 'border-slate-100 dark:border-slate-800 hover:shadow-md'}`}>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.name}</p><p className="text-xs text-slate-400 mt-0.5">{r.description || '—'}</p></div>
                  <div className="flex items-center gap-2">
                    {r.is_system && <span className="rounded bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-500">Système</span>}
                    <button onClick={(e) => { e.stopPropagation(); toggleActive(r); }} className={`h-5 w-9 rounded-full transition ${r.is_active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}><span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${r.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} /></button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditingRole(r); setShowForm(true); }} className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"><Edit3 size={12} /> Modifier</button>
                  {!r.is_system && <button onClick={(e) => { e.stopPropagation(); supabase.from('custom_roles').delete().eq('id', r.id).then(() => load()); }} className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1"><Trash2 size={12} /> Supprimer</button>}
                </div>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2">
            {selectedRole ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Permissions — {selectedRole.name}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead><tr className="border-b border-slate-100 dark:border-slate-800"><th className="text-left py-2 font-semibold text-slate-600 dark:text-slate-300">Module</th><th className="text-center py-2 font-semibold text-slate-600 dark:text-slate-300">Lecture</th><th className="text-center py-2 font-semibold text-slate-600 dark:text-slate-300">Écriture</th><th className="text-center py-2 font-semibold text-slate-600 dark:text-slate-300">Suppression</th></tr></thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {MODULES.map((mod) => {
                        const perms = getRolePerms(selectedRole.id).find((p) => p.module === mod);
                        return (
                          <tr key={mod}>
                            <td className="py-2.5 font-medium text-slate-700 dark:text-slate-300 capitalize">{mod}</td>
                            <td className="text-center py-2.5"><input type="checkbox" checked={perms?.can_read || false} onChange={(e) => updatePerm(selectedRole.id, mod, 'can_read', e.target.checked)} className="h-4 w-4 rounded accent-indigo-600" /></td>
                            <td className="text-center py-2.5"><input type="checkbox" checked={perms?.can_write || false} onChange={(e) => updatePerm(selectedRole.id, mod, 'can_write', e.target.checked)} className="h-4 w-4 rounded accent-indigo-600" /></td>
                            <td className="text-center py-2.5"><input type="checkbox" checked={perms?.can_delete || false} onChange={(e) => updatePerm(selectedRole.id, mod, 'can_delete', e.target.checked)} className="h-4 w-4 rounded accent-indigo-600" /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <EmptyState icon={ShieldCheck} title="Sélectionnez un rôle" message="Choisissez un rôle pour voir et modifier ses permissions." />}
          </div>
        </div>
      )}
      {showForm && <RoleForm role={editingRole} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function RoleForm({ role, onClose, onSaved }: { role: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: role?.name || '', description: role?.description || '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = role ? await supabase.from('custom_roles').update(form).eq('id', role.id) : await supabase.from('custom_roles').insert(form);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={role ? 'Modifier rôle' : 'Nouveau rôle'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nom</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}

// ─── Sales Codes ────────────────────────────────────────────
function SalesCodesAdmin() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('sales_codes').select('*').order('created_at', { ascending: false });
    setCodes(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (c: any) => { await supabase.from('sales_codes').update({ is_active: !c.is_active }).eq('id', c.id); load(); };
  const remove = async (id: string) => { await supabase.from('sales_codes').delete().eq('id', id); load(); };

  return (
    <div className="space-y-5">
      <PageHeader title="Codes commerciaux" subtitle="Tracking des ventes et commissions" action={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Nouveau code</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : codes.length === 0 ? <EmptyState icon={Briefcase} title="Aucun code" message="Créez des codes commerciaux pour tracker les ventes." /> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]"><thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Code</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Agent</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Email</th><th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Commission</th><th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Statut</th><th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">{codes.map((c) => (<tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"><td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">{c.code}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.agent_name}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.agent_email || '—'}</td><td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{c.commission_rate}%</td><td className="px-4 py-3 text-center"><button onClick={() => toggleActive(c)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{c.is_active ? 'Actif' : 'Inactif'}</button></td><td className="px-4 py-3 text-right"><button onClick={() => remove(c.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button></td></tr>))}</tbody></table>
        </div>
      )}
      {showForm && <SalesCodeForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function SalesCodeForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ code: '', agent_name: '', agent_email: '', commission_rate: 0 });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('sales_codes').insert({ ...form, commission_rate: Number(form.commission_rate) });
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title="Nouveau code commercial" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Code</label><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={inputCls} placeholder="EX: AFRIK2026" /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nom de l'agent</label><input required value={form.agent_name} onChange={(e) => setForm({ ...form, agent_name: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email de l'agent</label><input type="email" value={form.agent_email} onChange={(e) => setForm({ ...form, agent_email: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Taux de commission (%)</label><input type="number" min="0" max="100" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })} className={inputCls} /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Créer'}</button></div>
      </form>
    </Modal>
  );
}

// ─── Staff Performance ──────────────────────────────────────
function StaffPerformance() {
  const [codes, setCodes] = useState<any[]>([]);
  const [performances, setPerformances] = useState<Record<string, { schools: number; revenue: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('sales_codes').select('*').eq('is_active', true).order('agent_name');
      setCodes(data || []);
      const perfMap: Record<string, { schools: number; revenue: number }> = {};
      for (const c of (data || [])) {
        const { data: schools } = await supabase.from('schools').select('id').eq('sales_code_id', c.id);
        const { data: pays } = await supabase.from('payments').select('amount').in('school_id', (schools || []).map((s: any) => s.id));
        perfMap[c.id] = { schools: schools?.length || 0, revenue: (pays || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0) };
      }
      setPerformances(perfMap);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Performance du staff" subtitle="Suivi des performances par commercial" />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : codes.length === 0 ? <EmptyState icon={TrendingUp} title="Aucune donnée" message="Ajoutez des codes commerciaux pour suivre les performances." /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.map((c) => {
            const perf = performances[c.id] || { schools: 0, revenue: 0 };
            return (
              <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center"><Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" /></div>
                  <div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.agent_name}</p><p className="text-xs text-slate-400 font-mono">{c.code}</p></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-slate-500 dark:text-slate-400">Écoles inscrites</span><span className="text-sm font-bold text-slate-900 dark:text-slate-100">{perf.schools}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-slate-500 dark:text-slate-400">CA généré</span><span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{perf.revenue.toLocaleString()} FCFA</span></div>
                  <div className="flex justify-between"><span className="text-sm text-slate-500 dark:text-slate-400">Commission</span><span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{Math.round(perf.revenue * c.commission_rate / 100).toLocaleString()} FCFA</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Billing ─────────────────────────────────────────────────
function BillingAdmin() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('payments').select('*, schools(name), parents(first_name, last_name)').order('created_at', { ascending: false }).limit(100);
    setPayments(data || []);
    setTotal((data || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Facturation" subtitle="Toutes les transactions de la plateforme" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total encaissé" value={`${total.toLocaleString()} FCFA`} color="border-l-emerald-500" icon={Wallet} />
        <StatCard label="Transactions" value={payments.length} color="border-l-indigo-500" icon={CreditCard} />
        <StatCard label="Moyenne / transaction" value={payments.length ? `${Math.round(total / payments.length).toLocaleString()} FCFA` : '—'} color="border-l-amber-500" icon={TrendingUp} />
      </div>
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : payments.length === 0 ? <EmptyState icon={CreditCard} title="Aucune transaction" /> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]"><thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Date</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">École</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Parent</th><th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Montant</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Statut</th></tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">{payments.map((p) => (<tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"><td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td><td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{p.schools?.name || '—'}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.parents ? `${p.parents.first_name} ${p.parents.last_name}` : '—'}</td><td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">{Number(p.amount).toLocaleString()} FCFA</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>{p.status || 'pending'}</span></td></tr>))}</tbody></table>
        </div>
      )}
    </div>
  );
}

// ─── Plans ───────────────────────────────────────────────────
function PlansAdmin() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('plans').select('*').order('sort_order');
    setPlans(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (p: any) => { await supabase.from('plans').update({ is_active: !p.is_active }).eq('id', p.id); load(); };

  return (
    <div className="space-y-5">
      <PageHeader title="Plans & tarifs" subtitle="Gestion des offres d'abonnement (USD)" action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Nouveau plan</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div key={p.id} className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-sm ${p.is_active ? 'border-slate-200 dark:border-slate-800' : 'border-slate-100 dark:border-slate-800 opacity-60'}`}>
              <div className="flex items-center justify-between"><h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">{p.name}</h3><button onClick={() => toggleActive(p)} className={`h-6 w-11 rounded-full transition ${p.is_active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${p.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} /></button></div>
              <div className="mt-2 flex items-baseline gap-1"><span className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">${Number(p.price_monthly)}</span><span className="text-sm text-slate-500 dark:text-slate-400">/mois</span></div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{p.max_students >= 999999 ? 'Élèves illimités' : `Jusqu'à ${p.max_students} élèves`}</p>
              <div className="mt-3 flex flex-wrap gap-1">{(p.modules || []).slice(0, 4).map((m: string) => <span key={m} className="rounded bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">{m}</span>)}{(p.modules || []).length > 4 && <span className="text-xs text-slate-400">+{p.modules.length - 4}</span>}</div>
              <button onClick={() => { setEditing(p); setShowForm(true); }} className="mt-4 w-full rounded-lg border border-slate-200 dark:border-slate-700 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Modifier</button>
            </div>
          ))}
        </div>
      )}
      {showForm && <PlanForm plan={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function PlanForm({ plan, onClose, onSaved }: { plan: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: plan?.name || '', slug: plan?.slug || '', price_monthly: plan?.price_monthly || 0, max_students: plan?.max_students || 200, modules: (plan?.modules || []).join(', '), is_active: plan?.is_active ?? true });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, price_monthly: Number(form.price_monthly), max_students: Number(form.max_students), modules: form.modules.split(',').map((m: string) => m.trim()).filter(Boolean) };
    const { error } = plan ? await supabase.from('plans').update(payload).eq('id', plan.id) : await supabase.from('plans').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={plan ? 'Modifier plan' : 'Nouveau plan'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nom</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Slug</label><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Prix mensuel ($)</label><input type="number" required value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max élèves</label><input type="number" required value={form.max_students} onChange={(e) => setForm({ ...form, max_students: Number(e.target.value) })} className={inputCls} /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Modules (séparés par virgules)</label><input value={form.modules} onChange={(e) => setForm({ ...form, modules: e.target.value })} className={inputCls} placeholder="students, teachers, grades" /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}

// ─── Catalog ────────────────────────────────────────────────
function CatalogAdmin() {
  const [systemes, setSystemes] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [tab, setTab] = useState<'systemes' | 'cycles' | 'niveaux' | 'matieres'>('systemes');

  useEffect(() => {
    (async () => {
      const [s, c, n, m] = await Promise.all([
        supabase.from('systemes').select('*').order('name'),
        supabase.from('cycles').select('*, systemes(name)').order('order_index'),
        supabase.from('niveaux').select('*, cycles(name)').order('order_index'),
        supabase.from('matieres_catalog').select('*, systemes(name), cycles(name)').order('name'),
      ]);
      setSystemes(s.data || []); setCycles(c.data || []); setNiveaux(n.data || []); setMatieres(m.data || []);
    })();
  }, []);

  const tabs = [['systemes', 'Systèmes'], ['cycles', 'Cycles'], ['niveaux', 'Niveaux'], ['matieres', 'Matières']] as const;

  return (
    <div className="space-y-5">
      <PageHeader title="Catalogue académique" subtitle="Configuration globale des systèmes éducatifs" />
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">{tabs.map(([key, label]) => (<button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === key ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>{label}</button>))}</div>
      {tab === 'systemes' && <SimpleTable headers={['Code', 'Nom']} rows={systemes.map((s: any) => [s.code, s.name])} />}
      {tab === 'cycles' && <SimpleTable headers={['Système', 'Code', 'Nom', 'Ordre']} rows={cycles.map((c: any) => [c.systemes?.name || '—', c.code, c.name, c.order_index])} />}
      {tab === 'niveaux' && <SimpleTable headers={['Cycle', 'Code', 'Nom']} rows={niveaux.map((n: any) => [n.cycles?.name || '—', n.code, n.name])} />}
      {tab === 'matieres' && <SimpleTable headers={['Nom', 'Système', 'Cycle', 'Coef.']} rows={matieres.map((m: any) => [m.name, m.systemes?.name || '—', m.cycles?.name || '—', m.coefficient])} />}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: any[][] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]"><thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">{headers.map((h, i) => <th key={i} className={`px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 ${i === headers.length - 1 ? 'text-center' : 'text-left'}`}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">{rows.map((row, i) => <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">{row.map((cell, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'} ${j === row.length - 1 ? 'text-center' : ''}`}>{cell}</td>)}</tr>)}</tbody></table>
    </div>
  );
}

// ─── Audit ──────────────────────────────────────────────────
function AuditAdmin() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('audit_logs').select('*, profiles(first_name, last_name, email), schools(name)').order('created_at', { ascending: false }).limit(100);
      setLogs(data || []); setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Journal d'audit" subtitle="Traçabilité des actions Super Admin" />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : logs.length === 0 ? <EmptyState icon={ScrollText} title="Aucune entrée" message="Aucune action d'audit enregistrée." /> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm divide-y divide-slate-50 dark:divide-slate-800">
          {logs.map((l) => (
            <div key={l.id} className="p-4 flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0"><ScrollText size={14} className="text-slate-500" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-slate-100">{l.action}</p><p className="text-xs text-slate-500 dark:text-slate-400">{l.profiles ? `${l.profiles.first_name} ${l.profiles.last_name} (${l.profiles.email})` : 'Système'} · {l.schools?.name || '—'}</p></div>
              <p className="text-xs text-slate-400 flex-shrink-0">{new Date(l.created_at).toLocaleString('fr-FR')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Support ────────────────────────────────────────────────
function SupportAdmin() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('support_tickets').select('*, schools(name)').order('created_at', { ascending: false });
    setTickets(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const updateStatus = async (id: string, status: string) => { await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id); load(); };
  const statusColor = (s: string) => ({ open: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', in_progress: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', resolved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', closed: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400' } as Record<string, string>)[s] || 'bg-slate-50 dark:bg-slate-800';
  return (
    <div className="space-y-5">
      <PageHeader title="Support" subtitle={`${tickets.length} ticket(s)`} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : tickets.length === 0 ? <EmptyState icon={LifeBuoy} title="Aucun ticket" /> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
          {tickets.map((t) => (<div key={t.id} className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(t.status)}`}>{t.status}</span><span className="font-medium text-slate-900 dark:text-slate-100">{t.subject}</span><span className="text-xs text-slate-400">— {t.schools?.name || '—'}</span></div><select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs"><option value="open">open</option><option value="in_progress">in_progress</option><option value="resolved">resolved</option><option value="closed">closed</option></select></div><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.description}</p></div>))}
        </div>
      )}
    </div>
  );
}

// ─── Settings (Founder-protected Super Admin management) ────
function SettingsAdmin() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('super_admin_emails').select('*').order('email');
    setAdmins(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setError(null);
    const { error } = await supabase.from('super_admin_emails').insert({ email: newEmail.trim().toLowerCase() });
    if (error) { setError(error.message); return; }
    setNewEmail(''); load();
  };
  const removeAdmin = async (email: string) => {
    setError(null);
    const { error } = await supabase.from('super_admin_emails').delete().eq('email', email);
    if (error) {
      // Founder protection trigger blocks deletion
      setError(`Impossible de supprimer cet email. Les comptes fondateurs sont protégés.`);
      return;
    }
    load();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Paramètres" subtitle="Configuration de la plateforme" />
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
        <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Emails Super Admin</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Seuls ces emails peuvent accéder au Dashboard Super Admin. Les comptes fondateurs sont protégés et ne peuvent pas être supprimés.</p>
        <form onSubmit={addAdmin} className="flex gap-2 mb-4">
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemple.com" className={inputCls} />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 whitespace-nowrap"><Plus size={16} className="inline" /> Ajouter</button>
        </form>
        {error && <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"><AlertCircle size={16} className="flex-shrink-0 mt-0.5" /><span>{error}</span></div>}
        {loading ? <p className="text-sm text-slate-400">Chargement...</p> : (
          <div className="space-y-2">{admins.map((a) => {
            const isFounder = FOUNDER_EMAILS.includes(a.email);
            return (
              <div key={a.email} className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${isFounder ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{a.email}</span>
                  {isFounder && <span className="rounded bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1"><Shield size={10} /> Fondateur</span>}
                </div>
                {!isFounder && <button onClick={() => removeAdmin(a.email)} className="text-slate-400 hover:text-rose-600"><X size={16} /></button>}
              </div>
            );
          })}</div>
        )}
      </div>
    </div>
  );
}
