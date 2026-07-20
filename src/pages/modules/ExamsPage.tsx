import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, Modal, EmptyState, inputCls, Card } from '../../components/ui';
import { Plus, Search, Pencil, Trash2, FileText } from 'lucide-react';

interface Exam {
  id: string;
  name: string;
  term_key: string | null;
  exam_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface ClassItem { id: string; name: string; }
interface Subject { id: string; name: string; }

const emptyForm = { name: '', class_id: '', subject_id: '', exam_date: '', max_score: '20', term: 'T1' };

export function ExamsPage() {
  const { school } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examSubjects, setExamSubjects] = useState<Record<string, { class_name: string; subject_name: string }>>({});
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
    const [exRes, clsRes, subRes] = await Promise.all([
      supabase.from('exams').select('id, name, term_key, exam_type, start_date, end_date, status').eq('school_id', school.id).order('start_date', { ascending: false }),
      supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
      supabase.from('subjects').select('id, name').eq('school_id', school.id).order('name'),
    ]);
    setExams((exRes.data || []) as Exam[]);
    setClasses((clsRes.data || []) as ClassItem[]);
    setSubjects((subRes.data || []) as Subject[]);

    // Load exam_subjects to get class + subject names
    if ((exRes.data || []).length > 0) {
      const { data: es } = await supabase
        .from('exam_subjects')
        .select('exam_id, class_id, subject_id')
        .in('exam_id', (exRes.data || []).map((e: any) => e.id));
      const map: Record<string, { class_name: string; subject_name: string }> = {};
      (es || []).forEach((e: any) => {
        map[e.exam_id] = {
          class_name: (clsRes.data || []).find((c: any) => c.id === e.class_id)?.name || '—',
          subject_name: (subRes.data || []).find((s: any) => s.id === e.subject_id)?.name || '—',
        };
      });
      setExamSubjects(map);
    }
    setLoading(false);
  }

  const filtered = exams.filter((e) => {
    const q = search.toLowerCase();
    return e.name.toLowerCase().includes(q);
  });

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(e: Exam) {
    setEditId(e.id);
    setForm({ name: e.name, class_id: '', subject_id: '', exam_date: e.start_date || '', max_score: '20', term: e.term_key || 'T1' });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!school) return;
    setSaving(true);
    const payload = {
      school_id: school.id,
      name: form.name,
      term_key: form.term,
      exam_type: 'standard',
      start_date: form.exam_date || null,
      end_date: form.exam_date || null,
      status: 'scheduled',
    };
    let examId = editId;
    if (editId) {
      await supabase.from('exams').update(payload).eq('id', editId);
    } else {
      const { data } = await supabase.from('exams').insert(payload).select('id').single();
      examId = data?.id;
    }
    // Link class + subject via exam_subjects
    if (examId && form.class_id && form.subject_id) {
      if (editId) {
        await supabase.from('exam_subjects').delete().eq('exam_id', examId);
      }
      await supabase.from('exam_subjects').insert({
        exam_id: examId,
        class_id: form.class_id,
        subject_id: form.subject_id,
        max_score: parseFloat(form.max_score) || 20,
        exam_date: form.exam_date || null,
      });
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet examen ?')) return;
    await supabase.from('exam_subjects').delete().eq('exam_id', id);
    await supabase.from('exams').delete().eq('id', id);
    loadData();
  }

  return (
    <div>
      <PageHeader title="Examens" subtitle="Gérez les examens et compositions" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      } />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher un examen..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} message="Aucun examen trouvé" action={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Ajouter un examen
          </button>
        } />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Titre</th>
                <th className="px-4 py-3 font-semibold">Classe</th>
                <th className="px-4 py-3 font-semibold">Matière</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Trimestre</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{e.name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{examSubjects[e.id]?.class_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{examSubjects[e.id]?.subject_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{e.start_date || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{e.term_key || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${e.status === 'scheduled' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : e.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {e.status === 'scheduled' ? 'Planifié' : e.status === 'completed' ? 'Terminé' : e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => openEdit(e)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(e.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && (
        <Modal title={editId ? 'Modifier l\'examen' : 'Ajouter un examen'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Titre</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Classe</label>
              <select className={inputCls} value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                <option value="">Sélectionner...</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Matière</label>
              <select className={inputCls} value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                <option value="">Sélectionner...</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date de l'examen</label>
              <input type="date" className={inputCls} value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Note maximale</label>
              <input type="number" className={inputCls} value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Trimestre</label>
              <select className={inputCls} value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}>
                <option value="T1">Trimestre 1</option>
                <option value="T2">Trimestre 2</option>
                <option value="T3">Trimestre 3</option>
              </select>
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
