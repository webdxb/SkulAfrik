import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, FileText, Calendar } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface Exam { id: string; name: string; term_key: string; exam_type: string; start_date: string; end_date: string; status: string }

export function ExamsPage() {
  const { school } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('exams').select('*').eq('school_id', school.id).order('start_date', { ascending: false });
    setExams((data || []) as Exam[]);
    setLoading(false);
  }, [school]);

  useEffect(() => { load(); }, [load]);
  const remove = async (id: string) => { if (confirm('Supprimer cet examen ?')) { await supabase.from('exams').delete().eq('id', id); load(); } };

  const statusColor = (s: string) => ({ scheduled: 'bg-amber-50 text-amber-700', in_progress: 'bg-indigo-50 text-indigo-700', completed: 'bg-emerald-50 text-emerald-700' } as Record<string,string>)[s] || 'bg-slate-50 text-slate-600';

  return (
    <div className="space-y-5">
      <PageHeader title="Examens" subtitle={`${exams.length} examen(s)`} action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Créer un examen</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : exams.length === 0 ? <EmptyState icon={FileText} message="Aucun examen planifié." /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((e) => (
            <div key={e.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-start justify-between"><div><p className="font-sans font-bold text-lg text-slate-900 dark:text-slate-100">{e.name}</p><p className="text-sm text-slate-500 capitalize">{e.exam_type} · {e.term_key || '—'}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(e.status)}`}>{e.status}</span></div>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Calendar size={14} /> {e.start_date || '—'} → {e.end_date || '—'}</div>
              <div className="mt-4 flex justify-end gap-1"><button onClick={() => { setEditing(e); setShowForm(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 dark:text-slate-400"><Pencil size={15} /></button><button onClick={() => remove(e.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button></div>
            </div>
          ))}
        </div>
      )}
      {showForm && <ExamForm schoolId={school!.id} exam={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function ExamForm({ schoolId, exam, onClose, onSaved }: { schoolId: string; exam: Exam | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: exam?.name || '', term_key: exam?.term_key || 'T1', exam_type: exam?.exam_type || 'composition', start_date: exam?.start_date || '', end_date: exam?.end_date || '', status: exam?.status || 'scheduled' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { school_id: schoolId, ...form };
    const { error } = exam ? await supabase.from('exams').update(payload).eq('id', exam.id) : await supabase.from('exams').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={exam ? 'Modifier' : 'Nouvel examen'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nom</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Composition Trimestre 1" /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type</label><select value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} className={inputCls}><option value="devoir">Devoir</option><option value="composition">Composition</option><option value="examen">Examen</option></select></div><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Trimestre</label><select value={form.term_key} onChange={(e) => setForm({ ...form, term_key: e.target.value })} className={inputCls}><option value="T1">Trimestre 1</option><option value="T2">Trimestre 2</option><option value="T3">Trimestre 3</option></select></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Début</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fin</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputCls} /></div></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Statut</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}><option value="scheduled">Planifié</option><option value="in_progress">En cours</option><option value="completed">Terminé</option></select></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
