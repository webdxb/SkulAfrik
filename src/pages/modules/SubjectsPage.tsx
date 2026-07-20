import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Pencil, Trash2, BookOpen } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface Subject { id: string; name: string; code: string | null; coefficient: number }

export function SubjectsPage() {
  const { school } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    let q = supabase.from('subjects').select('*').eq('school_id', school.id);
    if (search.trim()) q = q.ilike('name', `%${search}%`);
    const { data } = await q.order('name');
    setSubjects((data || []) as Subject[]);
    setLoading(false);
  }, [school, search]);

  useEffect(() => { load(); }, [load]);
  const remove = async (id: string) => { if (confirm('Supprimer cette matière ?')) { await supabase.from('subjects').delete().eq('id', id); load(); } };

  return (
    <div className="space-y-5">
      <PageHeader title="Matières" subtitle={`${subjects.length} matière(s)`} action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Ajouter</button>} />
      <div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
      {loading ? <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">Chargement...</div> : subjects.length === 0 ? <EmptyState icon={BookOpen} message="Aucune matière. Les matières sont générées lors de l'onboarding." /> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Matière</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Code</th><th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Coefficient</th><th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">{subjects.map((s) => (<tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"><td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.name}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-400 dark:text-slate-400">{s.code || '—'}</td><td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">{s.coefficient}</td><td className="px-4 py-3 text-right"><div className="inline-flex gap-1"><button onClick={() => { setEditing(s); setShowForm(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 dark:text-slate-400"><Pencil size={15} /></button><button onClick={() => remove(s.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button></div></td></tr>))}</tbody></table>
        </div>
      )}
      {showForm && <SubjectForm schoolId={school!.id} subject={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function SubjectForm({ schoolId, subject, onClose, onSaved }: { schoolId: string; subject: Subject | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: subject?.name || '', code: subject?.code || '', coefficient: subject?.coefficient || 1 });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { school_id: schoolId, name: form.name, code: form.code || null, coefficient: Number(form.coefficient) };
    const { error } = subject ? await supabase.from('subjects').update(payload).eq('id', subject.id) : await supabase.from('subjects').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={subject ? 'Modifier' : 'Nouvelle matière'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nom</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Code</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Coefficient</label><input type="number" step="0.5" value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: Number(e.target.value) })} className={inputCls} /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
