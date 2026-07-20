import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, Modal, EmptyState, inputCls, Card } from '../../components/ui';
import { Plus, Search, Pencil, Trash2, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_at: string;
  end_at: string | null;
}

const emptyForm = { title: '', description: '', event_type: 'event', start_time: '', end_time: '' };

export function CalendarPage() {
  const { school, profile } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (school) loadData();
  }, [school]);

  async function loadData() {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase
      .from('calendar_events')
      .select('id, title, description, event_type, start_at, end_at')
      .eq('school_id', school.id)
      .order('start_at', { ascending: false });
    setEvents((data || []) as CalendarEvent[]);
    setLoading(false);
  }

  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) || (e.event_type || '').toLowerCase().includes(q);
  });

  function openAdd() {
    setEditId(null);
    const now = new Date().toISOString().slice(0, 16);
    setForm({ ...emptyForm, start_time: now, end_time: now });
    setModalOpen(true);
  }

  function openEdit(e: CalendarEvent) {
    setEditId(e.id);
    setForm({
      title: e.title,
      description: e.description || '',
      event_type: e.event_type || 'event',
      start_time: e.start_at ? e.start_at.slice(0, 16) : '',
      end_time: e.end_at ? e.end_at.slice(0, 16) : '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!school || !profile) return;
    setSaving(true);
    const payload = {
      school_id: school.id,
      title: form.title,
      description: form.description || null,
      event_type: form.event_type,
      start_at: form.start_time ? new Date(form.start_time).toISOString() : null,
      end_at: form.end_time ? new Date(form.end_time).toISOString() : null,
      target_audience: 'all',
      created_by: profile.id,
    };
    if (editId) {
      await supabase.from('calendar_events').update(payload).eq('id', editId);
    } else {
      await supabase.from('calendar_events').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet événement ?')) return;
    await supabase.from('calendar_events').delete().eq('id', id);
    loadData();
  }

  const typeLabels: Record<string, string> = {
    event: 'Événement',
    holiday: 'Férié',
    exam: 'Examen',
    meeting: 'Réunion',
    deadline: 'Échéance',
  };

  const typeColors: Record<string, string> = {
    event: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    holiday: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    exam: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    meeting: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    deadline: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <div>
      <PageHeader title="Calendrier" subtitle="Événements et dates importantes" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      } />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher un événement..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CalendarIcon} message="Aucun événement trouvé" action={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Ajouter un événement
          </button>
        } />
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{e.title}</h3>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[e.event_type] || typeColors.event}`}>
                      {typeLabels[e.event_type] || e.event_type}
                    </span>
                  </div>
                  {e.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{e.description}</p>}
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1"><Clock size={14} /> {new Date(e.start_at).toLocaleString('fr-FR')}</span>
                    {e.end_at && <span className="inline-flex items-center gap-1"><Clock size={14} /> → {new Date(e.end_at).toLocaleString('fr-FR')}</span>}
                  </div>
                </div>
                <div className="inline-flex gap-2">
                  <button onClick={() => openEdit(e)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(e.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editId ? 'Modifier l\'événement' : 'Ajouter un événement'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Titre</label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <select className={inputCls} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
                <option value="event">Événement</option>
                <option value="holiday">Férié</option>
                <option value="exam">Examen</option>
                <option value="meeting">Réunion</option>
                <option value="deadline">Échéance</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Début</label>
              <input type="datetime-local" className={inputCls} value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Fin</label>
              <input type="datetime-local" className={inputCls} value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
