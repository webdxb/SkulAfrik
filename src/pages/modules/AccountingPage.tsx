import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls, StatCard } from '../../components/ui';

interface Entry { id: string; date: string; type: 'income' | 'expense'; category: string; description: string; amount: number }

export function AccountingPage() {
  const { school, user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('accounting_entries').select('*').eq('school_id', school.id).order('date', { ascending: false }).limit(50);
    setEntries((data || []) as Entry[]);
    setLoading(false);
  }, [school]);

  useEffect(() => { load(); }, [load]);

  const totalIncome = entries.filter((e) => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Comptabilité" subtitle="Livre de caisse" action={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Nouvelle écriture</button>} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Recettes" value={totalIncome.toLocaleString()} color="border-l-emerald-500" />
        <StatCard label="Dépenses" value={totalExpense.toLocaleString()} color="border-l-rose-500" />
        <StatCard label="Solde" value={(totalIncome - totalExpense).toLocaleString()} color="border-l-indigo-500" />
      </div>
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : entries.length === 0 ? <EmptyState icon={Calculator} message="Aucune écriture comptable." /> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Catégorie</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Montant</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{entries.map((e) => (<tr key={e.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 text-slate-600">{e.date}</td><td className="px-4 py-3 text-slate-600">{e.category}</td><td className="px-4 py-3 text-slate-700">{e.description || '—'}</td><td className={`px-4 py-3 text-right font-semibold ${e.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{e.type === 'income' ? '+' : '−'}{Number(e.amount).toLocaleString()}</td></tr>))}</tbody></table>
        </div>
      )}
      {showForm && <EntryForm schoolId={school!.id} userId={user!.id} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function EntryForm({ schoolId, userId, onClose, onSaved }: { schoolId: string; userId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'income' as 'income' | 'expense', category: '', description: '', amount: 0 });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('accounting_entries').insert({ school_id: schoolId, created_by: userId, ...form, amount: Number(form.amount) });
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title="Nouvelle écriture" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className={inputCls}><option value="income">Recette</option><option value="expense">Dépense</option></select></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label><input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} /></div></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Catégorie</label><input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} placeholder="Scolarité, Salaires, Fournitures..." /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Montant</label><input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className={inputCls} /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
