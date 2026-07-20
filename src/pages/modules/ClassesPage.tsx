import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface ClassRow { id: string; name: string; level: string; capacity: number; niveau_id: string | null }

export function ClassesPage() {
  const { school } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('classes').select('*').eq('school_id', school.id).order('name');
    setClasses((data || []) as ClassRow[]);
    setLoading(false);
  }, [school]);

  useEffect(() => { load(); }, [load]);
  const remove = async (id: string) => { if (confirm('Supprimer cette classe ?')) { await supabase.from('classes').delete().eq('id', id); load(); } };

  return (
    <div className="space-y-5">
      <PageHeader title="Classes" subtitle={`${classes.length} classe(s)`} action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Ajouter</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : classes.length === 0 ? <EmptyState icon={BookOpen} message="Aucune classe. Les classes sont générées lors de l'onboarding." /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between"><div><p className="font-sans font-bold text-lg text-slate-900 dark:text-slate-100">{c.name}</p><p className="text-sm text-slate-500 dark:text-slate-400">{c.level || '—'} · {c.capacity} places</p></div>
              <div className="inline-flex gap-1"><button onClick={() => { setEditing(c); setShowForm(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 dark:text-slate-400"><Pencil size={15} /></button><button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button></div></div>
            </div>
          ))}
        </div>
      )}
      {showForm && <ClassForm schoolId={school!.id} cls={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function ClassForm({ schoolId, cls, onClose, onSaved }: { schoolId: string; cls: ClassRow | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: cls?.name || '', level: cls?.level || '', capacity: cls?.capacity || 40 });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { school_id: schoolId, ...form, capacity: Number(form.capacity) };
    const { error } = cls ? await supabase.from('classes').update(payload).eq('id', cls.id) : await supabase.from('classes').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={cls ? 'Modifier' : 'Nouvelle classe'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nom</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Niveau</label><input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Capacité</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className={inputCls} /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
