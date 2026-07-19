import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRoute, navigate, Link } from '../lib/router';
import { GraduationCap, LogOut, Building2, FileText, LifeBuoy, BookOpen, Users } from 'lucide-react';
import { inputCls, PageHeader, Modal, StatCard } from '../components/ui';

const NAV = [
  { to: '/super-admin', label: 'Vue d\'ensemble', icon: Building2 },
  { to: '/super-admin/schools', label: 'Écoles', icon: Building2 },
  { to: '/super-admin/catalog', label: 'Catalogue académique', icon: BookOpen },
  { to: '/super-admin/cms', label: 'CMS Global', icon: FileText },
  { to: '/super-admin/support', label: 'Support', icon: LifeBuoy },
];

export function SuperAdminApp() {
  const path = useRoute();
  const cleanPath = path.split('?')[0];
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
    })();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); navigate('/'); };

  const renderPage = () => {
    if (cleanPath === '/super-admin' || cleanPath === '/super-admin/') return <SuperAdminDashboard />;
    if (cleanPath === '/super-admin/schools') return <SchoolsAdmin />;
    if (cleanPath === '/super-admin/catalog') return <CatalogAdmin />;
    if (cleanPath === '/super-admin/cms') return <CmsAdmin />;
    if (cleanPath === '/super-admin/support') return <SupportAdmin />;
    return <SuperAdminDashboard />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="sticky top-0 z-40 h-screen w-60 bg-slate-900 flex-shrink-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><GraduationCap size={18} className="text-white" /></div>
          <span className="font-bold text-white">Super Admin</span>
        </div>
        <nav className="p-3 space-y-0.5">
          {NAV.map((item) => {
            const active = cleanPath === item.to;
            return (<Link key={item.to} to={item.to} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}><item.icon size={16} /> {item.label}</Link>);
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800"><button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800"><LogOut size={16} /> Déconnexion</button></div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur border-b border-slate-100 flex items-center px-6"><p className="text-sm text-slate-500">{user?.email || 'Super Admin'}</p></header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{renderPage()}</main>
      </div>
    </div>
  );
}

function SuperAdminDashboard() {
  const [stats, setStats] = useState({ schools: 0, students: 0, teachers: 0, revenue: 0 });
  useEffect(() => {
    (async () => {
      const [s, st, t, p] = await Promise.all([
        supabase.from('schools').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('payments').select('amount'),
      ]);
      const revenue = (p.data || []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);
      setStats({ schools: s.count || 0, students: st.count || 0, teachers: t.count || 0, revenue });
    })();
  }, []);
  return (
    <div className="space-y-6">
      <PageHeader title="Vue d'ensemble" subtitle="Plateforme SKUL AFRIK" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Écoles" value={stats.schools} color="border-l-indigo-500" />
        <StatCard label="Élèves" value={stats.students} color="border-l-emerald-500" />
        <StatCard label="Enseignants" value={stats.teachers} color="border-l-amber-500" />
        <StatCard label="Revenus" value={stats.revenue.toLocaleString()} color="border-l-rose-500" />
      </div>
    </div>
  );
}

function SchoolsAdmin() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    setSchools(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const verify = async (id: string) => { await supabase.from('schools').update({ verification_status: 'verified' }).eq('id', id); load(); };
  return (
    <div className="space-y-5">
      <PageHeader title="Écoles" subtitle={`${schools.length} établissement(s)`} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Pays</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Ville</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Statut</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Abonnement</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{schools.map((s) => (<tr key={s.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 font-medium text-slate-900">{s.name}</td><td className="px-4 py-3 text-slate-600">{s.country}</td><td className="px-4 py-3 text-slate-600">{s.city || '—'}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{s.verification_status}</span></td><td className="px-4 py-3 text-slate-600">{s.subscription_status}</td><td className="px-4 py-3 text-right">{s.verification_status !== 'verified' && <button onClick={() => verify(s.id)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Vérifier</button>}</td></tr>))}</tbody></table>
        </div>
      )}
    </div>
  );
}

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
      <PageHeader title="Catalogue académique" subtitle="Configuration globale" />
      <div className="flex gap-2 border-b border-slate-200">{tabs.map(([key, label]) => (<button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{label}</button>))}</div>
      {tab === 'systemes' && <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Code</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th></tr></thead><tbody className="divide-y divide-slate-50">{systemes.map((s) => (<tr key={s.id}><td className="px-4 py-3 font-medium text-slate-900">{s.code}</td><td className="px-4 py-3 text-slate-600">{s.name}</td></tr>))}</tbody></table></div>}
      {tab === 'cycles' && <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Système</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Code</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th><th className="text-center px-4 py-3 font-semibold text-slate-600">Ordre</th></tr></thead><tbody className="divide-y divide-slate-50">{cycles.map((c) => (<tr key={c.id}><td className="px-4 py-3 text-slate-600">{(c as any).systemes?.name || '—'}</td><td className="px-4 py-3 font-medium text-slate-900">{c.code}</td><td className="px-4 py-3 text-slate-600">{c.name}</td><td className="px-4 py-3 text-center text-slate-700">{c.order_index}</td></tr>))}</tbody></table></div>}
      {tab === 'niveaux' && <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Cycle</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Code</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th></tr></thead><tbody className="divide-y divide-slate-50">{niveaux.map((n) => (<tr key={n.id}><td className="px-4 py-3 text-slate-600">{(n as any).cycles?.name || '—'}</td><td className="px-4 py-3 font-medium text-slate-900">{n.code}</td><td className="px-4 py-3 text-slate-600">{n.name}</td></tr>))}</tbody></table></div>}
      {tab === 'matieres' && <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Système</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Cycle</th><th className="text-center px-4 py-3 font-semibold text-slate-600">Coef.</th></tr></thead><tbody className="divide-y divide-slate-50">{matieres.map((m) => (<tr key={m.id}><td className="px-4 py-3 font-medium text-slate-900">{m.name}</td><td className="px-4 py-3 text-slate-600">{(m as any).systemes?.name || '—'}</td><td className="px-4 py-3 text-slate-600">{(m as any).cycles?.name || '—'}</td><td className="px-4 py-3 text-center text-slate-700">{m.coefficient}</td></tr>))}</tbody></table></div>}
    </div>
  );
}

function CmsAdmin() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('cms_pages').select('*').order('updated_at', { ascending: false });
    setPages(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-5">
      <PageHeader title="CMS Global" subtitle="Pages publiques" action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">+ Nouvelle page</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Slug</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Titre</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Statut</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{pages.map((p) => (<tr key={p.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => { setEditing(p); setShowForm(true); }}><td className="px-4 py-3 font-medium text-slate-900">/{p.slug}</td><td className="px-4 py-3 text-slate-600">{p.title}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>{p.status}</span></td></tr>))}</tbody></table>
        </div>
      )}
      {showForm && <CmsForm page={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function CmsForm({ page, onClose, onSaved }: { page: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ slug: page?.slug || '', title: page?.title || '', content: page?.content || '', status: page?.status || 'draft' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, content: { body: form.content }, published_at: form.status === 'published' ? new Date().toISOString() : null };
    const { error } = page ? await supabase.from('cms_pages').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', page.id) : await supabase.from('cms_pages').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={page ? 'Modifier page' : 'Nouvelle page'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Slug</label><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} placeholder="a-propos" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Titre</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Contenu</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className={inputCls} rows={6} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Statut</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}><option value="draft">Brouillon</option><option value="published">Publié</option></select></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}

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
  const statusColor = (s: string) => ({ open: 'bg-amber-50 text-amber-700', in_progress: 'bg-indigo-50 text-indigo-700', resolved: 'bg-emerald-50 text-emerald-700', closed: 'bg-slate-50 text-slate-600' } as Record<string,string>)[s] || 'bg-slate-50';
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
