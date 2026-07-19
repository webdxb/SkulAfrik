import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, Book, Search } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface BookRow { id: string; title: string; author: string; isbn: string; category: string; copies_total: number; copies_available: number; shelf_location: string }

export function LibraryPage() {
  const { school } = useAuth();
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BookRow | null>(null);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    let q = supabase.from('library_books').select('*').eq('school_id', school.id);
    if (search.trim()) q = q.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
    const { data } = await q.order('title');
    setBooks((data || []) as BookRow[]);
    setLoading(false);
  }, [school, search]);

  useEffect(() => { load(); }, [load]);
  const remove = async (id: string) => { if (confirm('Supprimer ce livre ?')) { await supabase.from('library_books').delete().eq('id', id); load(); } };

  return (
    <div className="space-y-5">
      <PageHeader title="Bibliothèque" subtitle={`${books.length} livre(s)`} action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Ajouter</button>} />
      <div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : books.length === 0 ? <EmptyState icon={Book} message="Aucun livre dans la bibliothèque." /> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Titre</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Auteur</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Catégorie</th><th className="text-center px-4 py-3 font-semibold text-slate-600">Dispo</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{books.map((b) => (<tr key={b.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 font-medium text-slate-900">{b.title}</td><td className="px-4 py-3 text-slate-600">{b.author || '—'}</td><td className="px-4 py-3 text-slate-600">{b.category || '—'}</td><td className="px-4 py-3 text-center text-slate-700">{b.copies_available}/{b.copies_total}</td><td className="px-4 py-3 text-right"><div className="inline-flex gap-1"><button onClick={() => { setEditing(b); setShowForm(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><Pencil size={15} /></button><button onClick={() => remove(b.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button></div></td></tr>))}</tbody></table>
        </div>
      )}
      {showForm && <BookForm schoolId={school!.id} book={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function BookForm({ schoolId, book, onClose, onSaved }: { schoolId: string; book: BookRow | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: book?.title || '', author: book?.author || '', isbn: book?.isbn || '', category: book?.category || '', copies_total: book?.copies_total || 1, shelf_location: book?.shelf_location || '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const copies = Number(form.copies_total);
    const payload = { school_id: schoolId, ...form, copies_total: copies, copies_available: book ? undefined : copies };
    const { error } = book ? await supabase.from('library_books').update({ title: form.title, author: form.author, isbn: form.isbn, category: form.category, copies_total: copies, shelf_location: form.shelf_location }).eq('id', book.id) : await supabase.from('library_books').insert({ school_id: schoolId, ...form, copies_total: copies, copies_available: copies });
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={book ? 'Modifier' : 'Nouveau livre'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Titre</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Auteur</label><input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">ISBN</label><input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Catégorie</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Exemplaires</label><input type="number" min="1" value={form.copies_total} onChange={(e) => setForm({ ...form, copies_total: Number(e.target.value) })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Étagère</label><input value={form.shelf_location} onChange={(e) => setForm({ ...form, shelf_location: e.target.value })} className={inputCls} /></div></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
