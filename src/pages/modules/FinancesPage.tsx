import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls, StatCard } from '../../components/ui';

interface Fee { id: string; name: string; amount: number; fee_type: string; due_date: string }
interface Payment { id: string; amount: number; payment_date: string; student_id: string }

export function FinancesPage() {
  const { school } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const [f, p] = await Promise.all([
      supabase.from('fees').select('*').eq('school_id', school.id).order('due_date'),
      supabase.from('payments').select('*, students!inner(first_name, last_name)').eq('school_id', school.id).order('payment_date', { ascending: false }).limit(20),
    ]);
    setFees((f.data || []) as Fee[]);
    setPayments((p.data || []) as Payment[]);
    setLoading(false);
  }, [school]);

  useEffect(() => { load(); }, [load]);

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpected = fees.reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Finances" subtitle="Frais de scolarité et paiements" action={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Nouvelle facture</button>} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total collecté" value={totalCollected.toLocaleString()} color="border-l-emerald-500" />
        <StatCard label="Total attendu" value={totalExpected.toLocaleString()} color="border-l-indigo-500" />
        <StatCard label="Solde" value={(totalExpected - totalCollected).toLocaleString()} color="border-l-amber-500" />
      </div>
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="font-semibold text-slate-700">Frais</h3></div>
            {fees.length === 0 ? <div className="p-6 text-center text-sm text-slate-400">Aucun frais</div> : <table className="w-full text-sm"><tbody className="divide-y divide-slate-50">{fees.map((f) => (<tr key={f.id}><td className="px-4 py-3 font-medium text-slate-900">{f.name}</td><td className="px-4 py-3 text-slate-600">{f.fee_type}</td><td className="px-4 py-3 text-right font-semibold text-slate-900">{Number(f.amount).toLocaleString()}</td></tr>))}</tbody></table>}
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="font-semibold text-slate-700">Paiements récents</h3></div>
            {payments.length === 0 ? <div className="p-6 text-center text-sm text-slate-400">Aucun paiement</div> : <table className="w-full text-sm"><tbody className="divide-y divide-slate-50">{payments.map((p) => (<tr key={p.id}><td className="px-4 py-3 font-medium text-slate-900">{(p as any).students?.last_name} {(p as any).students?.first_name}</td><td className="px-4 py-3 text-slate-600">{p.payment_date}</td><td className="px-4 py-3 text-right font-semibold text-emerald-600">+{Number(p.amount).toLocaleString()}</td></tr>))}</tbody></table>}
          </div>
        </div>
      )}
      {showForm && <FeeForm schoolId={school!.id} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function FeeForm({ schoolId, onClose, onSaved }: { schoolId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', amount: 0, fee_type: 'tuition', due_date: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('fees').insert({ school_id: schoolId, ...form, amount: Number(form.amount) });
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title="Nouvelle facture" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Désignation</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label><select value={form.fee_type} onChange={(e) => setForm({ ...form, fee_type: e.target.value })} className={inputCls}><option value="tuition">Scolarité</option><option value="registration">Inscription</option><option value="exam">Examen</option><option value="other">Autre</option></select></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Montant</label><input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className={inputCls} /></div></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Échéance</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputCls} /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
