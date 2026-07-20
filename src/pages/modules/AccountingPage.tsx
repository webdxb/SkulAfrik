import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, EmptyState, Card } from '../../components/ui';
import { TrendingUp, TrendingDown, Wallet, Calculator } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string | null;
  amount: number;
  date: string;
}

export function AccountingPage() {
  const { school } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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

  const incomeTxns = transactions.filter((t) => t.type === 'income');
  const expenseTxns = transactions.filter((t) => t.type === 'expense');
  const totalIncome = incomeTxns.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = expenseTxns.reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  // Group by category
  const incomeByCategory: Record<string, number> = {};
  incomeTxns.forEach((t) => { incomeByCategory[t.category || 'Autre'] = (incomeByCategory[t.category || 'Autre'] || 0) + Number(t.amount); });
  const expenseByCategory: Record<string, number> = {};
  expenseTxns.forEach((t) => { expenseByCategory[t.category || 'Autre'] = (expenseByCategory[t.category || 'Autre'] || 0) + Number(t.amount); });

  return (
    <div>
      <PageHeader title="Comptabilité" subtitle="Vue d'ensemble des finances de l'établissement" />

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : transactions.length === 0 ? (
        <EmptyState icon={Calculator} message="Aucune transaction enregistrée" />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Total revenus</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalIncome.toLocaleString()} FCFA</p>
                </div>
                <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/30 p-3"><TrendingUp className="text-emerald-600 dark:text-emerald-400" size={24} /></div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Total dépenses</p>
                  <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{totalExpense.toLocaleString()} FCFA</p>
                </div>
                <div className="rounded-xl bg-rose-100 dark:bg-rose-900/30 p-3"><TrendingDown className="text-rose-600 dark:text-rose-400" size={24} /></div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Solde net</p>
                  <p className={`mt-1 text-2xl font-bold ${balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400'}`}>{balance.toLocaleString()} FCFA</p>
                </div>
                <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/30 p-3"><Wallet className="text-indigo-600 dark:text-indigo-400" size={24} /></div>
              </div>
            </Card>
          </div>

          {/* Breakdown by category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="mb-4 font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Revenus par catégorie</h3>
              {Object.keys(incomeByCategory).length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Aucun revenu</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{amount.toLocaleString()} FCFA</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${totalIncome > 0 ? (amount / totalIncome) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Dépenses par catégorie</h3>
              {Object.keys(expenseByCategory).length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Aucune dépense</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                        <span className="font-medium text-rose-600 dark:text-rose-400">{amount.toLocaleString()} FCFA</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-2 rounded-full bg-rose-500" style={{ width: `${totalExpense > 0 ? (amount / totalExpense) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Recent transactions */}
          <Card className="mt-6 overflow-x-auto">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Transactions récentes</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 font-semibold">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.slice(0, 20).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{t.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                        {t.type === 'income' ? 'Revenu' : 'Dépense'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{t.category || '—'}</td>
                    <td className={`px-4 py-3 font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString()} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
