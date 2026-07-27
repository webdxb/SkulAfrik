import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { PageHeader, EmptyState, inputCls, Card } from '../../components/ui';
import { LifeBuoy, Plus, Send, Search } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
}

export function SupportPage() {
  const { showError } = useToast();
  const { school, profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (school && profile) loadData();
  }, [school, profile]);

  async function loadData() {
    if (!school || !profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('id, subject, description, status, priority, created_at')
      .eq('school_id', school.id)
      .eq('created_by', profile.id)
      .order('created_at', { ascending: false });
    setTickets((data || []) as Ticket[]);
    setLoading(false);
  }

  async function handleCreate() {
    if (!school || !profile) return;
    setSaving(true);
    const { error } = await supabase.from('support_tickets').insert({
      school_id: school.id,
      created_by: profile.id,
      subject: form.subject,
      description: form.description || null,
      status: 'open',
      priority: form.priority,
    });
    if (error) { showError(error.message); setSaving(false); return; }
    setSaving(false);
    setForm({ subject: '', description: '', priority: 'medium' });
    setShowForm(false);
    loadData();
  }

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    return t.subject.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
  });

  const statusLabels: Record<string, string> = {
    open: 'Ouvert',
    in_progress: 'En cours',
    resolved: 'Résolu',
    closed: 'Fermé',
  };

  const statusColors: Record<string, string> = {
    open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };

  return (
    <div>
      <PageHeader title="Support" subtitle="Créez et suivez vos tickets de support" action={
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Nouveau ticket
        </button>
      } />

      {showForm ? (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Nouveau ticket</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">&times;</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Sujet</label>
              <input className={inputCls} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Décrivez brièvement le problème" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea className={inputCls} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Donnez plus de détails..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Priorité</label>
              <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCreate} disabled={saving || !form.subject} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                <Send size={16} /> {saving ? 'Création...' : 'Créer le ticket'}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Annuler
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card className="mb-4 p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={`${inputCls} pl-10`} placeholder="Rechercher un ticket..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </Card>

          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={LifeBuoy} message="Aucun ticket de support" action={
              <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <Plus size={16} /> Créer un ticket
              </button>
            } />
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <Card key={t.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[t.status] || statusColors.open}`}>
                          {statusLabels[t.status] || t.status}
                        </span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[t.priority] || priorityColors.medium}`}>
                          {priorityLabels[t.priority] || t.priority}
                        </span>
                      </div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{t.subject}</h3>
                      {t.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.description}</p>}
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{new Date(t.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
