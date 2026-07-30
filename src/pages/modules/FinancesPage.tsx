import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { PageHeader, Modal, EmptyState, inputCls, Card } from '../../components/ui';
import { formatCurrency, getCurrencyForCountryName } from '../../lib/countries';
import { Plus, Search, Pencil, Trash2, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string | null;
  amount: number;
  date: string;
}

const emptyForm = { type: 'income', category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] };

export function FinancesPage() {
  const { showError } = useToast();
  const { school, profile } = useAuth();
  const currency = getCurrencyForCountryName(school?.country);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      .from('accounting_entries')
      .select('id, type, category, description, amount, date')
      .eq('school_id', school.id)
      .order('date', { ascending: false });
    setTransactions((data || []) as Transaction[]);
    setLoading(false);
  }

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    return (t.category || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q) || t.type.toLowerCase().includes(q);
  });

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  function openAdd() {
    setEditId(null);
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditId(t.id);
    setForm({ type: t.type, category: t.category, description: t.description || '', amount: String(t.amount), date: t.date || '' });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!school || !profile) return;
    setSaving(true);
    const payload = {
      school_id: school.id,
      type: form.type,
      category: form.category,
      description: form.description || null,
      amount: parseFloat(form.amount) || 0,
      date: form.date,
      created_by: profile.id,
    };
    if (editId) {
      const { error } = await supabase.from('accounting_entries').update(payload).eq('id', editId);
      if (error) { showError(error.message); return; }
    } else {
      const { error } = await supabase.from('accounting_entries').insert(payload);
      if (error) { showError(error.message); return; }
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette transaction ?')) return;
    const { error } = await supabase.from('accounting_entries').delete().eq('id', id);
    if (error) { showError(error.message); return; }
    loadData();
  }

  return (
    <div>
      <PageHeader title="Finances" subtitle="Gérez les revenus et dépenses" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      } />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Revenus totaux</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome, currency)}</p>
            </div>
            <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/30 p-3"><TrendingUp className="text-emerald-600 dark:text-emerald-400" size={24} /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Dépenses totales</p>
              <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalExpense, currency)}</p>
            </div>
            <div className="rounded-xl bg-rose-100 dark:bg-rose-900/30 p-3"><TrendingDown className="text-rose-600 dark:text-rose-400" size={24} /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Solde</p>
              <p className={`mt-1 text-2xl font-bold ${balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(balance, currency)}</p>
            </div>
            <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/30 p-3"><Wallet className="text-indigo-600 dark:text-indigo-400" size={24} /></div>
          </div>
        </Card>
      </div>

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher une transaction..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wallet} message="Aucune transaction trouvée" action={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Ajouter une transaction
          </button>
        } />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Catégorie</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Montant</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{t.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                      {t.type === 'income' ? 'Revenu' : 'Dépense'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{t.category || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{t.description || '—'}</td>
                  <td className={`px-4 py-3 font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => openEdit(t)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && (
        <Modal title={editId ? 'Modifier la transaction' : 'Ajouter une transaction'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="income">Revenu</option>
                <option value="expense">Dépense</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Catégorie</label>
              <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Frais de scolarité, Salaires..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Montant ({currency})</label>
              <input type="number" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
              <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
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
