import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { useI18n, formatDate, formatDateTime } from '../../lib/i18n';
import { PageHeader, Modal, EmptyState, inputCls, Card } from '../../components/ui';
import { Plus, Search, Pencil, Trash2, BookOpen, BookUp, BookCheck } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  category: string | null;
  copies_total: number;
  copies_available: number;
}

interface Loan {
  id: string;
  book_id: string;
  borrower_id: string | null;
  loan_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
}

interface StudentOption { id: string; name: string; }

const emptyForm = { title: '', author: '', isbn: '', category: '', copies_total: '', copies_available: '' };

export function LibraryPage() {
  const { locale } = useI18n();
  const { showError, showSuccess } = useToast();
  const { school } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [tab, setTab] = useState<'catalog' | 'loans'>('catalog');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loanBook, setLoanBook] = useState<Book | null>(null);
  const [loanForm, setLoanForm] = useState({ student_id: '', due_date: '' });

  useEffect(() => {
    if (school) loadData();
  }, [school]);

  async function loadData() {
    if (!school) return;
    setLoading(true);
    const [booksRes, loansRes, studentsRes] = await Promise.all([
      supabase.from('library_books').select('id, title, author, isbn, category, copies_total, copies_available').eq('school_id', school.id).order('title'),
      supabase.from('library_loans').select('id, book_id, borrower_id, loan_date, due_date, return_date, status, library_books!inner(school_id)').eq('library_books.school_id', school.id).order('loan_date', { ascending: false }),
      supabase.from('students').select('id, first_name, last_name').eq('school_id', school.id).order('last_name'),
    ]);
    setBooks((booksRes.data || []) as Book[]);
    setLoans((loansRes.data || []) as any);
    setStudents((studentsRes.data || []).map((s: any) => ({ id: s.id, name: `${s.last_name} ${s.first_name}` })));
    setLoading(false);
  }

  const studentName = (id: string | null) => students.find((s) => s.id === id)?.name || '—';
  const bookTitle = (id: string) => books.find((b) => b.id === id)?.title || '—';

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q) || (b.isbn || '').toLowerCase().includes(q) || (b.category || '').toLowerCase().includes(q);
  });
  const activeLoans = loans.filter((l) => l.status === 'active');

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
      const { error } = await supabase.from('library_books').update(payload).eq('id', editId);
      if (error) { showError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('library_books').insert(payload);
      if (error) { showError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce livre ?')) return;
    const { error } = await supabase.from('library_books').delete().eq('id', id);
    if (error) { showError(error.message); return; }
    loadData();
  }

  function openLoan(b: Book) {
    setLoanBook(b);
    const due = new Date();
    due.setDate(due.getDate() + 14);
    setLoanForm({ student_id: '', due_date: due.toISOString().slice(0, 10) });
  }

  async function handleLoan() {
    if (!loanBook || !loanForm.student_id) return;
    setSaving(true);
    const { error: loanErr } = await supabase.from('library_loans').insert({
      book_id: loanBook.id,
      borrower_type: 'student',
      borrower_id: loanForm.student_id,
      due_date: loanForm.due_date,
      status: 'active',
    });
    if (loanErr) { showError(loanErr.message); setSaving(false); return; }
    const { error: bookErr } = await supabase.from('library_books').update({ copies_available: loanBook.copies_available - 1 }).eq('id', loanBook.id);
    if (bookErr) { showError(bookErr.message); setSaving(false); return; }
    setSaving(false);
    setLoanBook(null);
    showSuccess('Emprunt enregistré.');
    loadData();
  }

  async function handleReturn(loan: Loan) {
    const { error: loanErr } = await supabase.from('library_loans').update({ status: 'returned', return_date: new Date().toISOString().slice(0, 10) }).eq('id', loan.id);
    if (loanErr) { showError(loanErr.message); return; }
    const book = books.find((b) => b.id === loan.book_id);
    if (book) {
      const { error: bookErr } = await supabase.from('library_books').update({ copies_available: Math.min(book.copies_total, book.copies_available + 1) }).eq('id', book.id);
      if (bookErr) { showError(bookErr.message); return; }
    }
    showSuccess('Livre retourné.');
    loadData();
  }

  return (
    <div>
      <PageHeader title="Bibliothèque" subtitle="Catalogue et emprunts" action={
        tab === 'catalog' ? (
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Ajouter
          </button>
        ) : undefined
      } />

      <div className="mb-4 inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-1">
        <button onClick={() => setTab('catalog')} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === 'catalog' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Catalogue</button>
        <button onClick={() => setTab('loans')} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === 'loans' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Emprunts en cours ({activeLoans.length})</button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : tab === 'catalog' ? (
        <>
          <Card className="mb-4 p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={`${inputCls} pl-10`} placeholder="Rechercher un livre..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </Card>

          {filtered.length === 0 ? (
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
                    <th className="px-4 py-3 font-semibold">Catégorie</th>
                    <th className="px-4 py-3 font-semibold">Disponibles</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{b.title}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.author || '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.category || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${b.copies_available > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                          {b.copies_available} / {b.copies_total}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button onClick={() => openLoan(b)} disabled={b.copies_available <= 0} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed" title="Enregistrer un emprunt"><BookUp size={16} /></button>
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
        </>
      ) : (
        activeLoans.length === 0 ? (
          <EmptyState icon={BookCheck} message="Aucun emprunt en cours" />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Livre</th>
                  <th className="px-4 py-3 font-semibold">Emprunteur</th>
                  <th className="px-4 py-3 font-semibold">Emprunté le</th>
                  <th className="px-4 py-3 font-semibold">À rendre le</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeLoans.map((l) => {
                  const overdue = new Date(l.due_date) < new Date();
                  return (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{bookTitle(l.book_id)}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{studentName(l.borrower_id)}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatDate(l.loan_date, locale)}</td>
                      <td className={`px-4 py-3 ${overdue ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>{formatDate(l.due_date, locale)}{overdue ? ' (en retard)' : ''}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleReturn(l)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                          <BookCheck size={14} /> Marquer retourné
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )
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

      {loanBook && (
        <Modal title={`Emprunter : ${loanBook.title}`} onClose={() => setLoanBook(null)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Élève</label>
              <select className={inputCls} value={loanForm.student_id} onChange={(e) => setLoanForm({ ...loanForm, student_id: e.target.value })}>
                <option value="">Sélectionner un élève...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">À rendre le</label>
              <input type="date" className={inputCls} value={loanForm.due_date} onChange={(e) => setLoanForm({ ...loanForm, due_date: e.target.value })} />
            </div>
            <button onClick={handleLoan} disabled={saving || !loanForm.student_id} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Confirmer l\'emprunt'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
