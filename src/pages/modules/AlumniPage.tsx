import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { PageHeader, Modal, EmptyState, inputCls, Card } from '../../components/ui';
import { Plus, Search, Pencil, Trash2, GraduationCap } from 'lucide-react';

interface Alumni {
  id: string;
  first_name: string;
  last_name: string;
  graduation_year: number;
  current_occupation: string | null;
  email: string | null;
  phone: string | null;
}

const emptyForm = { first_name: '', last_name: '', graduation_year: '', current_occupation: '', email: '', phone: '' };

export function AlumniPage() {
  const { school } = useAuth();
  const { showError } = useToast();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
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
      .from('alumni')
      .select('id, first_name, last_name, graduation_year, current_occupation, email, phone')
      .eq('school_id', school.id)
      .order('graduation_year', { ascending: false });
    setAlumni((data || []) as Alumni[]);
    setLoading(false);
  }

  const filtered = alumni.filter((a) => {
    const q = search.toLowerCase();
    return `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) || String(a.graduation_year).includes(q);
  });

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(a: Alumni) {
    setEditId(a.id);
    setForm({
      first_name: a.first_name,
      last_name: a.last_name,
      graduation_year: String(a.graduation_year),
      current_occupation: a.current_occupation || '',
      email: a.email || '',
      phone: a.phone || '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!school) return;
    setSaving(true);
    const payload = {
      ...form,
      school_id: school.id,
      graduation_year: parseInt(form.graduation_year) || new Date().getFullYear(),
      current_occupation: form.current_occupation || null,
      email: form.email || null,
      phone: form.phone || null,
    };
    if (editId) {
      const { error } = await supabase.from('alumni').update(payload).eq('id', editId);
      if (error) { showError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('alumni').insert(payload);
      if (error) { showError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet ancien élève ?')) return;
    const { error } = await supabase.from('alumni').delete().eq('id', id);
    if (error) { showError(error.message); return; }
    loadData();
  }

  return (
    <div>
      <PageHeader title="Anciens élèves" subtitle="Réseau des anciens élèves de l'établissement" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      } />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher un ancien élève..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} message="Aucun ancien élève trouvé" action={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Ajouter
          </button>
        } />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Nom</th>
                <th className="px-4 py-3 font-semibold">Prénom</th>
                <th className="px-4 py-3 font-semibold">Année de diplomation</th>
                <th className="px-4 py-3 font-semibold">Occupation actuelle</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Téléphone</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{a.last_name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{a.first_name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{a.graduation_year}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{a.current_occupation || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{a.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{a.phone || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => openEdit(a)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(a.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && (
        <Modal title={editId ? 'Modifier l\'ancien élève' : 'Ajouter un ancien élève'} onClose={() => setModalOpen(false)}>
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
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Année de diplomation</label>
              <input type="number" className={inputCls} value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Occupation actuelle</label>
              <input className={inputCls} value={form.current_occupation} onChange={(e) => setForm({ ...form, current_occupation: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Téléphone</label>
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
