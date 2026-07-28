import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { Link, useRoute, navigate } from '../lib/router';
import { LogOut, Building2, Users, CreditCard, BarChart3, Shield, Settings, Bell, Menu, X } from 'lucide-react';

const SECTIONS = [
  { path: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
  { path: 'schools', label: 'Établissements', icon: Building2 },
  { path: 'users', label: 'Utilisateurs', icon: Users },
  { path: 'billing', label: 'Facturation', icon: CreditCard },
  { path: 'rbac', label: 'Rôles RBAC', icon: Shield },
  { path: 'sales-codes', label: 'Codes commerciaux', icon: CreditCard },
  { path: 'staff', label: 'Performance staff', icon: Users },
  { path: 'audit', label: 'Audit', icon: BarChart3 },
  { path: 'support', label: 'Support', icon: Bell },
  { path: 'settings', label: 'Paramètres', icon: Settings },
];

export function SuperAdminApp() {
  const { profile, signOut } = useAuth();
  const path = useRoute();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const cleanPath = path.replace(/^\/super-admin\/?/, '');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 flex flex-col transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
          <Link to="/super-admin" onClick={() => setSidebarOpen(false)}><Logo height={40} variant="dark" /></Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          {SECTIONS.map((s) => (
            <Link key={s.path} to={`/super-admin/${s.path}`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${(cleanPath === s.path || (cleanPath === '' && s.path === 'overview')) ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <s.icon size={16} /> {s.label}
            </Link>
          ))}
        </nav>
        <div className="px-2 py-4 border-t border-slate-800">
          <div className="px-3 py-2 text-xs text-slate-500">Super Admin — {profile?.email}</div>
          <button onClick={signOut} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 w-full"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600"><Menu size={20} /></button>
            <span className="text-sm font-medium text-slate-500">Super Admin — {profile?.email}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">SA</div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <SuperAdminContent section={cleanPath || 'overview'} />
        </main>
      </div>
    </div>
  );
}

function SuperAdminContent({ section }: { section: string }) {
  switch (section) {
    case 'overview': return <OverviewSection />;
    case 'schools': return <SchoolsSection />;
    case 'users': return <UsersSection />;
    case 'billing': return <BillingSection />;
    case 'rbac': return <RbacSection />;
    case 'sales-codes': return <SalesCodesSection />;
    case 'staff': return <StaffSection />;
    case 'audit': return <AuditSection />;
    case 'support': return <SupportSection />;
    case 'settings': return <SettingsSection />;
    default: return <OverviewSection />;
  }
}

function OverviewSection() {
  const [stats, setStats] = useState({ schools: 0, users: 0, subscriptions: 0, revenue: 0 });
  useEffect(() => {
    (async () => {
      const [s, u, sub] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('schools').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      ]);
      setStats({ schools: s.count || 0, users: u.count || 0, subscriptions: sub.count || 0, revenue: 0 });
    })();
  }, []);

  const cards = [
    { label: 'Établissements', value: stats.schools, color: 'border-l-indigo-500' },
    { label: 'Utilisateurs', value: stats.users, color: 'border-l-emerald-500' },
    { label: 'Abonnements', value: stats.subscriptions, color: 'border-l-amber-500' },
    { label: 'Revenus/mois', value: `${stats.revenue} FCFA`, color: 'border-l-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Vue d'ensemble de la plateforme</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${c.color} border-y border-r border-slate-100 dark:border-slate-800 p-5 shadow-sm`}>
            <p className="text-sm text-slate-500 dark:text-slate-400">{c.label}</p>
            <p className="mt-1 font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchoolsSection() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
      setSchools(data || []); setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Établissements</h1>
      {loading ? <p className="text-sm text-slate-400">Chargement...</p> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Nom</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Pays</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Ville</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Créé le</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {schools.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.country || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.city || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.type || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(data || []); setLoading(false);
    })();
  }, []);

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-rose-100 text-rose-700', admin: 'bg-indigo-100 text-indigo-700',
      teacher: 'bg-emerald-100 text-emerald-700', parent: 'bg-amber-100 text-amber-700', student: 'bg-blue-100 text-blue-700',
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Utilisateurs</h1>
      {loading ? <p className="text-sm text-slate-400">Chargement...</p> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Nom</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Rôle</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Onboarding</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.first_name || ''} {u.last_name || ''}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(u.role)}`}>{u.role}</span></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.onboarding_completed ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BillingSection() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      // Subscriptions live directly on the schools row — there is no separate "subscriptions" table.
      const { data } = await supabase.from('schools').select('id, name, subscription_status, plans(name, price_monthly)').order('created_at', { ascending: false });
      setSubs(data || []); setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Facturation</h1>
      {loading ? <p className="text-sm text-slate-400">Chargement...</p> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">École</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Plan</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Statut</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Prix/mois</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {subs.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.plans?.name || '—'}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.subscription_status}</span></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.plans?.price_monthly || 0} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RbacSection() {
  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Rôles RBAC</h1>
      <p className="text-sm text-slate-500">Les rôles personnalisés sont gérés au niveau de chaque établissement dans Paramètres → Rôles.</p>
    </div>
  );
}

function SalesCodesSection() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('sales_codes').select('*, schools(name)').order('created_at', { ascending: false });
      setCodes(data || []); setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Codes commerciaux</h1>
      {loading ? <p className="text-sm text-slate-400">Chargement...</p> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Code</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">École</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Utilisé</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {codes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">{c.code}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.schools?.name || '—'}</td>
                  <td className="px-4 py-3">{c.used ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StaffSection() { return <div className="space-y-5"><h1 className="font-heading text-2xl font-bold text-slate-900">Performance du staff</h1><p className="text-sm text-slate-500">Statistiques de performance du staff plateforme en cours de développement.</p></div>; }
function AuditSection() { return <div className="space-y-5"><h1 className="font-heading text-2xl font-bold text-slate-900">Journal d'audit</h1><p className="text-sm text-slate-500">Logs d'audit de la plateforme en cours de développement.</p></div>; }
function SupportSection() {
  const [tickets, setTickets] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('support_tickets').select('*, profiles(email)').order('created_at', { ascending: false });
      setTickets(data || []);
    })();
  }, []);
  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Tickets de support</h1>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Sujet</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Utilisateur</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Priorité</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Statut</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{t.subject}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{t.profiles?.email || '—'}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{t.priority}</td>
                <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${t.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function SettingsSection() {
  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Paramètres plateforme</h1>
      <p className="text-sm text-slate-500">Configuration globale de la plateforme Klaso.</p>
    </div>
  );
}
