import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRoute, navigate, Link } from '../lib/router';
import { useAuth } from '../lib/auth';
import { LogOut, Building2, FileText, LifeBuoy, BookOpen, Users, Shield, Wallet, BarChart3, ScrollText, CreditCard, Settings, ChevronRight, Search, Check, X, AlertCircle, TrendingUp, Globe, Server, Lock } from 'lucide-react';
import { inputCls, PageHeader, Modal, StatCard } from '../components/ui';
import { Logo } from '../components/Logo';

const NAV = [
  { to: '/super-admin', label: 'Vue d\'ensemble', icon: BarChart3 },
  { to: '/super-admin/schools', label: 'Écoles', icon: Building2 },
  { to: '/super-admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/super-admin/billing', label: 'Facturation', icon: CreditCard },
  { to: '/super-admin/plans', label: 'Plans & tarifs', icon: Wallet },
  { to: '/super-admin/catalog', label: 'Catalogue académique', icon: BookOpen },
  { to: '/super-admin/audit', label: 'Journal d\'audit', icon: ScrollText },
  { to: '/super-admin/support', label: 'Support', icon: LifeBuoy },
  { to: '/super-admin/settings', label: 'Paramètres', icon: Settings },
];

export function SuperAdminApp() {
  const path = useRoute();
  const cleanPath = path.split('?')[0];
  const { signOut } = useAuth();

  const renderPage = () => {
    if (cleanPath === '/super-admin' || cleanPath === '/super-admin/') return <SuperAdminDashboard />;
    if (cleanPath === '/super-admin/schools') return <SchoolsAdmin />;
    if (cleanPath === '/super-admin/users') return <UsersAdmin />;
    if (cleanPath === '/super-admin/billing') return <BillingAdmin />;
    if (cleanPath === '/super-admin/plans') return <PlansAdmin />;
    if (cleanPath === '/super-admin/catalog') return <CatalogAdmin />;
    if (cleanPath === '/super-admin/audit') return <AuditAdmin />;
    if (cleanPath === '/super-admin/support') return <SupportAdmin />;
    if (cleanPath === '/super-admin/settings') return <SettingsAdmin />;
    return <SuperAdminDashboard />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="sticky top-0 z-40 h-screen w-64 bg-slate-900 flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-800">
          <Link to="/super-admin"><Logo height={32} variant="dark" /></Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supervision</p>
          {NAV.slice(0, 6).map((item) => {
            const active = cleanPath === item.to;
            return (<Link key={item.to} to={item.to} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}><item.icon size={16} /> {item.label}</Link>);
          })}
          <p className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Système</p>
          {NAV.slice(6).map((item) => {
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
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur border-b border-slate-100 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-indigo-600" />
            <p className="text-sm font-semibold text-slate-900">Super Admin</p>
            <span className="hidden sm:inline text-xs text-slate-400">· LIYAH GROUP</span>
          </div>
          <div className="text-xs text-slate-400">Plateforme SKUL AFRIK</div>
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
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-heading text-lg font-semibold text-slate-900 mb-4">Écoles récentes</h3>
          {loading ? <p className="text-sm text-slate-400">Chargement...</p> : recentSchools.length === 0 ? <p className="text-sm text-slate-400">Aucune école.</p> : (
            <div className="space-y-3">{recentSchools.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-slate-900">{s.name}</p><p className="text-xs text-slate-400">{s.city || '—'}, {s.country}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.subscription_status === 'trial' ? 'bg-amber-50 text-amber-700' : s.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>{s.subscription_status}</span>
              </div>
            ))}</div>
          )}
          <Link to="/super-admin/schools" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">Voir toutes les écoles <ChevronRight size={14} /></Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-heading text-lg font-semibold text-slate-900 mb-4">État du système</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Server size={16} className="text-emerald-500" /><span className="text-sm text-slate-600">Base de données</span></div><span className="text-xs font-medium text-emerald-600">Opérationnel</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Lock size={16} className="text-emerald-500" /><span className="text-sm text-slate-600">RLS Multi-tenant</span></div><span className="text-xs font-medium text-emerald-600">Actif</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Globe size={16} className="text-emerald-500" /><span className="text-sm text-slate-600">API Supabase</span></div><span className="text-xs font-medium text-emerald-600">En ligne</span></div>
          </div>
        </div>
      </div>
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
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Pays</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Ville</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Statut</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Abonnement</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{filtered.map((s) => (<tr key={s.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 font-medium text-slate-900">{s.name}</td><td className="px-4 py-3 text-slate-600">{s.country}</td><td className="px-4 py-3 text-slate-600">{s.city || '—'}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{s.verification_status}</span></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-700' : s.subscription_status === 'trial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{s.subscription_status}</span></td><td className="px-4 py-3 text-right space-x-2">{s.verification_status !== 'verified' && <button onClick={() => verify(s.id)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Vérifier</button>}<button onClick={() => toggleStatus(s)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">{s.subscription_status === 'active' ? 'Suspendre' : 'Activer'}</button></td></tr>))}</tbody></table>
        </div>
      )}
    </div>
  );
}

// ─── Users ───────────────────────────────────────────────────
function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*, schools(name)').order('created_at', { ascending: false }).limit(200);
    setUsers(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !`${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const roleLabel = (r: string) => ({ super_admin: 'Super Admin', school_admin: 'Admin École', teacher: 'Enseignant', parent: 'Parent', student: 'Élève', staff: 'Personnel' } as Record<string, string>)[r] || r;

  return (
    <div className="space-y-5">
      <PageHeader title="Utilisateurs" subtitle={`${users.length} utilisateur(s)`} />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className={`${inputCls} pl-9`} /></div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={`${inputCls} sm:w-48`}><option value="all">Tous rôles</option><option value="school_admin">Admin École</option><option value="teacher">Enseignant</option><option value="parent">Parent</option><option value="student">Élève</option><option value="staff">Personnel</option></select>
      </div>
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Rôle</th><th className="text-left px-4 py-3 font-semibold text-slate-600">École</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{filtered.map((u) => (<tr key={u.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 font-medium text-slate-900">{u.first_name} {u.last_name}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">{roleLabel(u.role)}</span></td><td className="px-4 py-3 text-slate-600">{u.schools?.name || '—'}</td></tr>))}</tbody></table>
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
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th><th className="text-left px-4 py-3 font-semibold text-slate-600">École</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Parent</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Montant</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Statut</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{payments.map((p) => (<tr key={p.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 text-slate-600">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td><td className="px-4 py-3 font-medium text-slate-900">{p.schools?.name || '—'}</td><td className="px-4 py-3 text-slate-600">{p.parents ? `${p.parents.first_name} ${p.parents.last_name}` : '—'}</td><td className="px-4 py-3 text-right font-medium text-slate-900">{Number(p.amount).toLocaleString()} FCFA</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{p.status || 'pending'}</span></td></tr>))}</tbody></table>
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
      <PageHeader title="Plans & tarifs" subtitle="Gestion des offres d'abonnement" action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">+ Nouveau plan</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl border p-5 shadow-sm ${p.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
              <div className="flex items-center justify-between"><h3 className="font-heading text-lg font-bold text-slate-900">{p.name}</h3><button onClick={() => toggleActive(p)} className={`h-6 w-11 rounded-full transition ${p.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${p.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} /></button></div>
              <div className="mt-2 flex items-baseline gap-1"><span className="font-heading text-2xl font-bold text-slate-900">{Number(p.price_monthly).toLocaleString()}</span><span className="text-sm text-slate-500">FCFA/mois</span></div>
              <p className="mt-1 text-xs text-slate-500">{p.max_students >= 999999 ? 'Élèves illimités' : `Jusqu'à ${p.max_students} élèves`}</p>
              <div className="mt-3 flex flex-wrap gap-1">{(p.modules || []).slice(0, 4).map((m: string) => <span key={m} className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-500">{m}</span>)}{(p.modules || []).length > 4 && <span className="text-xs text-slate-400">+{p.modules.length - 4}</span>}</div>
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
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nom</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Slug</label><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Prix mensuel (FCFA)</label><input type="number" required value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Max élèves</label><input type="number" required value={form.max_students} onChange={(e) => setForm({ ...form, max_students: Number(e.target.value) })} className={inputCls} /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Modules (séparés par virgules)</label><input value={form.modules} onChange={(e) => setForm({ ...form, modules: e.target.value })} className={inputCls} placeholder="students, teachers, grades" /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
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
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">{tabs.map(([key, label]) => (<button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{label}</button>))}</div>
      {tab === 'systemes' && <SimpleTable headers={['Code', 'Nom']} rows={systemes.map((s) => [s.code, s.name])} />}
      {tab === 'cycles' && <SimpleTable headers={['Système', 'Code', 'Nom', 'Ordre']} rows={cycles.map((c) => [(c as any).systemes?.name || '—', c.code, c.name, c.order_index])} />}
      {tab === 'niveaux' && <SimpleTable headers={['Cycle', 'Code', 'Nom']} rows={niveaux.map((n) => [(n as any).cycles?.name || '—', n.code, n.name])} />}
      {tab === 'matieres' && <SimpleTable headers={['Nom', 'Système', 'Cycle', 'Coef.']} rows={matieres.map((m: any) => [m.name, m.systemes?.name || '—', m.cycles?.name || '—', m.coefficient])} />}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: any[][] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]"><thead><tr className="border-b border-slate-100 bg-slate-50/50">{headers.map((h, i) => <th key={i} className={`px-4 py-3 font-semibold text-slate-600 ${i === headers.length - 1 ? 'text-center' : 'text-left'}`}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-50">{rows.map((row, i) => <tr key={i} className="hover:bg-slate-50/50">{row.map((cell, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-medium text-slate-900' : 'text-slate-600'} ${j === row.length - 1 ? 'text-center' : ''}`}>{cell}</td>)}</tr>)}</tbody></table>
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
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center"><ScrollText size={32} className="mx-auto text-slate-300" /><p className="mt-3 text-sm text-slate-500">Aucune entrée d'audit.</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
          {logs.map((l) => (
            <div key={l.id} className="p-4 flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><ScrollText size={14} className="text-slate-500" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900">{l.action}</p><p className="text-xs text-slate-500">{l.profiles ? `${l.profiles.first_name} ${l.profiles.last_name} (${l.profiles.email})` : 'Système'} · {l.schools?.name || '—'}</p></div>
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
  const statusColor = (s: string) => ({ open: 'bg-amber-50 text-amber-700', in_progress: 'bg-indigo-50 text-indigo-700', resolved: 'bg-emerald-50 text-emerald-700', closed: 'bg-slate-50 text-slate-600' } as Record<string, string>)[s] || 'bg-slate-50';
  return (
    <div className="space-y-5">
      <PageHeader title="Support" subtitle={`${tickets.length} ticket(s)`} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : tickets.length === 0 ? <div className="bg-white rounded-xl border border-slate-100 p-12 text-center"><LifeBuoy size={32} className="mx-auto text-slate-300" /><p className="mt-3 text-sm text-slate-500">Aucun ticket.</p></div> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          {tickets.map((t) => (<div key={t.id} className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(t.status)}`}>{t.status}</span><span className="font-medium text-slate-900">{t.subject}</span><span className="text-xs text-slate-400">— {(t as any).schools?.name || '—'}</span></div><select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs"><option value="open">open</option><option value="in_progress">in_progress</option><option value="resolved">resolved</option><option value="closed">closed</option></select></div><p className="mt-1 text-sm text-slate-600">{t.description}</p></div>))}
        </div>
      )}
    </div>
  );
}

// ─── Settings ───────────────────────────────────────────────
function SettingsAdmin() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('super_admin_emails').select('*').order('email');
    setAdmins(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    await supabase.from('super_admin_emails').insert({ email: newEmail.trim().toLowerCase() });
    setNewEmail(''); load();
  };
  const removeAdmin = async (email: string) => {
    await supabase.from('super_admin_emails').delete().eq('email', email);
    load();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Paramètres" subtitle="Configuration de la plateforme" />
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-1">Emails Super Admin</h3>
        <p className="text-sm text-slate-500 mb-4">Seuls ces emails peuvent accéder au Dashboard Super Admin.</p>
        <form onSubmit={addAdmin} className="flex gap-2 mb-4">
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemple.com" className={inputCls} />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 whitespace-nowrap">+ Ajouter</button>
        </form>
        {loading ? <p className="text-sm text-slate-400">Chargement...</p> : (
          <div className="space-y-2">{admins.map((a) => (
            <div key={a.email} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2.5">
              <span className="text-sm font-medium text-slate-900">{a.email}</span>
              <button onClick={() => removeAdmin(a.email)} className="text-slate-400 hover:text-rose-600"><X size={16} /></button>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}
