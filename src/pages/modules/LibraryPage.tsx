import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, Modal, EmptyState, inputCls, Card } from '../../components/ui';
import { Plus, Search, Pencil, Trash2, BookOpen } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  category: string | null;
  copies_total: number;
  copies_available: number;
}

const emptyForm = { title: '', author: '', isbn: '', category: '', copies_total: '', copies_available: '' };

export function LibraryPage() {
  const { school } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
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
      .from('library_books')
      .select('id, title, author, isbn, category, copies_total, copies_available')
      .eq('school_id', school.id)
      .order('title');
    setBooks((data || []) as Book[]);
    setLoading(false);
  }

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q) || (b.isbn || '').toLowerCase().includes(q) || (b.category || '').toLowerCase().includes(q);
  });

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(b: Book) {
    setEditId(b.id);
    setForm({ title: b.title, author: b.author || '', isbn: b.isbn || '', category: b.category || '', copies_total: String(b.copies_total || ''), copies_available: String(b.copies_available || '') });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!school) return;
    setSaving(true);
    const total = parseInt(form.copies_total) || 0;
    const available = form.copies_available !== '' ? parseInt(form.copies_available) : total;
    const payload = {
      ...form,
      school_id: school.id,
      author: form.author || null,
      isbn: form.isbn || null,
      category: form.category || null,
      publisher: '',
      copies_total: total,
      copies_available: available,
    };
    if (editId) {
      await supabase.from('library_books').update(payload).eq('id', editId);
    } else {
      await supabase.from('library_books').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce livre ?')) return;
    await supabase.from('library_books').delete().eq('id', id);
    loadData();
  }

  return (
    <div>
      <PageHeader title="Bibliothèque" subtitle="Gérez le catalogue de la bibliothèque" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      } />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher un livre..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} message="Aucun livre trouvé" action={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Ajouter un livre
          </button>
        } />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Titre</th>
                <th className="px-4 py-3 font-semibold">Auteur</th>
                <th className="px-4 py-3 font-semibold">ISBN</th>
                <th className="px-4 py-3 font-semibold">Catégorie</th>
                <th className="px-4 py-3 font-semibold">Exemplaires</th>
                <th className="px-4 py-3 font-semibold">Disponibles</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{b.title}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.author || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.isbn || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.category || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.copies_total}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${b.copies_available > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                      {b.copies_available}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => openEdit(b)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(b.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && (
        <Modal title={editId ? 'Modifier le livre' : 'Ajouter un livre'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Titre</label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Auteur</label>
              <input className={inputCls} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">ISBN</label>
              <input className={inputCls} value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Catégorie</label>
              <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Mathématiques, Romans..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Exemplaires totaux</label>
              <input type="number" className={inputCls} value={form.copies_total} onChange={(e) => setForm({ ...form, copies_total: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Exemplaires disponibles</label>
              <input type="number" className={inputCls} value={form.copies_available} onChange={(e) => setForm({ ...form, copies_available: e.target.value })} placeholder="Laisser vide = total" />
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
