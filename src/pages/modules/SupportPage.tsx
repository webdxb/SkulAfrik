import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, LifeBuoy, Clock } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface Ticket { id: string; subject: string; description: string; status: string; priority: string; created_at: string }

export function SupportPage() {
  const { school, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('support_tickets').select('*').eq('school_id', school.id).order('created_at', { ascending: false });
    setTickets((data || []) as Ticket[]);
    setLoading(false);
  }, [school]);

  useEffect(() => { load(); }, [load]);

  const statusColor = (s: string) => ({ open: 'bg-amber-50 text-amber-700', in_progress: 'bg-indigo-50 text-indigo-700', resolved: 'bg-emerald-50 text-emerald-700', closed: 'bg-slate-50 text-slate-600' } as Record<string,string>)[s] || 'bg-slate-50';

  return (
    <div className="space-y-5">
      <PageHeader title="Support" subtitle={`${tickets.length} ticket(s)`} action={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Nouveau ticket</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">Chargement...</div> : tickets.length === 0 ? <EmptyState icon={LifeBuoy} message="Aucun ticket de support." /> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
          {tickets.map((t) => (<div key={t.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(t.status)}`}>{t.status}</span><span className="font-medium text-slate-900 dark:text-slate-100">{t.subject}</span></div><span className="text-xs text-slate-400 dark:text-slate-500">{new Date(t.created_at).toLocaleDateString()}</span></div><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.description}</p></div>))}
        </div>
      )}
      {showForm && <TicketForm schoolId={school!.id} userId={user!.id} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function TicketForm({ schoolId, userId, onClose, onSaved }: { schoolId: string; userId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ subject: '', description: '', priority: 'normal' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('support_tickets').insert({ school_id: schoolId, created_by: userId, ...form });
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title="Nouveau ticket" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sujet</label><input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label><textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} rows={4} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priorité</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputCls}><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Envoyer'}</button></div>
      </form>
    </Modal>
  );
}
