import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, Modal, EmptyState, inputCls, Card } from '../../components/ui';
import { Plus, Search, Pencil, Trash2, School } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  level: string | null;
  capacity: number | null;
}

const emptyForm = { name: '', level: '', capacity: '' };

export function ClassesPage() {
  const { school } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
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
      .from('classes')
      .select('id, name, level, capacity')
      .eq('school_id', school.id)
      .order('name');
    setClasses((data || []) as ClassItem[]);
    setLoading(false);
  }

  const filtered = classes.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.level || '').toLowerCase().includes(q);
  });

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(c: ClassItem) {
    setEditId(c.id);
    setForm({ name: c.name, level: c.level || '', capacity: c.capacity ? String(c.capacity) : '' });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!school) return;
    setSaving(true);
    const payload = {
      ...form,
      school_id: school.id,
      level: form.level || null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
    };
    if (editId) {
      await supabase.from('classes').update(payload).eq('id', editId);
    } else {
      await supabase.from('classes').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette classe ?')) return;
    await supabase.from('classes').delete().eq('id', id);
    loadData();
  }

  return (
    <div>
      <PageHeader title="Classes" subtitle="Gérez les classes de votre établissement" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      } />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher une classe..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={School} message="Aucune classe trouvée" action={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Ajouter une classe
          </button>
        } />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Nom</th>
                <th className="px-4 py-3 font-semibold">Niveau</th>
                <th className="px-4 py-3 font-semibold">Capacité</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.level || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.capacity || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && (
        <Modal title={editId ? 'Modifier la classe' : 'Ajouter une classe'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Niveau</label>
              <input className={inputCls} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="Ex: 6ème, CM2, Terminale..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Capacité</label>
              <input type="number" className={inputCls} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
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
