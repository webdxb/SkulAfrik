import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, Modal, EmptyState, inputCls, Card } from '../../components/ui';
import { Plus, Search, Pencil, Trash2, GraduationCap, Users } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  gender: string | null;
  date_of_birth: string | null;
  class_id: string | null;
  status: string;
}

interface ClassItem {
  id: string;
  name: string;
  level: string | null;
}

const emptyForm = { first_name: '', last_name: '', gender: '', date_of_birth: '', class_id: '' };

export function StudentsPage() {
  const { school } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (school) {
      loadData();
    }
  }, [school]);

  async function loadData() {
    if (!school) return;
    setLoading(true);
    const [stuRes, clsRes] = await Promise.all([
      supabase.from('students').select('id, first_name, last_name, gender, date_of_birth, class_id, status').eq('school_id', school.id).order('last_name'),
      supabase.from('classes').select('id, name, level').eq('school_id', school.id).order('name'),
    ]);
    if (stuRes.data) setStudents(stuRes.data as Student[]);
    if (clsRes.data) setClasses(clsRes.data as ClassItem[]);
    setLoading(false);
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
  });

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(s: Student) {
    setEditId(s.id);
    setForm({
      first_name: s.first_name,
      last_name: s.last_name,
      gender: s.gender || '',
      date_of_birth: s.date_of_birth || '',
      class_id: s.class_id || '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!school) return;
    setSaving(true);
    const payload = {
      ...form,
      school_id: school.id,
      date_of_birth: form.date_of_birth || null,
      class_id: form.class_id || null,
      gender: form.gender || null,
    };
    if (editId) {
      await supabase.from('students').update(payload).eq('id', editId);
    } else {
      await supabase.from('students').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet élève ?')) return;
    await supabase.from('students').delete().eq('id', id);
    loadData();
  }

  const className = (id: string | null) => classes.find((c) => c.id === id)?.name || '—';

  return (
    <div>
      <PageHeader title="Élèves" subtitle="Gérez les élèves de votre établissement" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      } />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher un élève..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} message="Aucun élève trouvé" action={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Ajouter un élève
          </button>
        } />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Nom</th>
                <th className="px-4 py-3 font-semibold">Prénom</th>
                <th className="px-4 py-3 font-semibold">Sexe</th>
                <th className="px-4 py-3 font-semibold">Naissance</th>
                <th className="px-4 py-3 font-semibold">Classe</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.last_name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.first_name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.gender === 'M' ? 'Masculin' : s.gender === 'F' ? 'Féminin' : '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.date_of_birth || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{className(s.class_id)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {s.status === 'active' ? 'Actif' : s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && (
        <Modal title={editId ? 'Modifier l\'élève' : 'Ajouter un élève'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prénom</label>
              <input className={inputCls} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom</label>
              <input className={inputCls} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Sexe</label>
              <select className={inputCls} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">—</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date de naissance</label>
              <input type="date" className={inputCls} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Classe</label>
              <select className={inputCls} value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                <option value="">—</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.level ? ` (${c.level})` : ''}</option>
                ))}
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
