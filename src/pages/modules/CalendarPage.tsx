import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface Event { id: string; title: string; event_type: string; start_date: string; end_date: string; description: string }

export function CalendarPage() {
  const { school } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('calendar_events').select('*').eq('school_id', school.id).order('start_date');
    setEvents((data || []) as Event[]);
    setLoading(false);
  }, [school]);

  useEffect(() => { load(); }, [load]);
  const remove = async (id: string) => { if (confirm('Supprimer cet événement ?')) { await supabase.from('calendar_events').delete().eq('id', id); load(); } };

  const typeColor = (t: string) => ({ holiday: 'bg-rose-50 text-rose-700', exam: 'bg-amber-50 text-amber-700', meeting: 'bg-indigo-50 text-indigo-700', event: 'bg-emerald-50 text-emerald-700' } as Record<string,string>)[t] || 'bg-slate-50 text-slate-600';

  return (
    <div className="space-y-5">
      <PageHeader title="Calendrier" subtitle={`${events.length} événement(s)`} action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Ajouter</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : events.length === 0 ? <EmptyState icon={Calendar} message="Aucun événement." /> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50 dark:divide-slate-800">{events.map((e) => (<div key={e.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"><div className="flex items-center gap-3"><div className={`rounded-lg px-2.5 py-1 text-xs font-medium ${typeColor(e.event_type)}`}>{e.event_type}</div><div><p className="font-medium text-slate-900 dark:text-slate-100">{e.title}</p><p className="text-sm text-slate-500 dark:text-slate-400">{e.start_date} {e.end_date && `→ ${e.end_date}`}</p></div></div><div className="flex gap-1"><button onClick={() => { setEditing(e); setShowForm(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 dark:text-slate-400"><Pencil size={15} /></button><button onClick={() => remove(e.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button></div></div>))}</div>
        </div>
      )}
      {showForm && <EventForm schoolId={school!.id} event={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function EventForm({ schoolId, event, onClose, onSaved }: { schoolId: string; event: Event | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: event?.title || '', event_type: event?.event_type || 'event', start_date: event?.start_date || '', end_date: event?.end_date || '', description: event?.description || '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { school_id: schoolId, ...form };
    const { error } = event ? await supabase.from('calendar_events').update(payload).eq('id', event.id) : await supabase.from('calendar_events').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={event ? 'Modifier' : 'Nouvel événement'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Titre</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type</label><select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className={inputCls}><option value="event">Événement</option><option value="holiday">Vacance</option><option value="exam">Examen</option><option value="meeting">Réunion</option></select></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Début</label><input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fin</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputCls} /></div></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} rows={3} /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
