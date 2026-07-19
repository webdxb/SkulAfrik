import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Wallet, Play } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls, StatCard } from '../../components/ui';

interface Run { id: string; period_start: string; period_end: string; status: string; total_amount: number }

export function PayrollPage() {
  const { school } = useAuth();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('payroll_runs').select('*').eq('school_id', school.id).order('period_start', { ascending: false });
    setRuns((data || []) as Run[]);
    setLoading(false);
  }, [school]);

  useEffect(() => { load(); }, [load]);

  const process = async (runId: string) => {
    const { data: staff } = await supabase.from('staff').select('id, salary_base').eq('school_id', school!.id).eq('status', 'active');
    if (!staff || staff.length === 0) { alert('Aucun personnel actif.'); return; }
    const items = staff.map((s: any) => ({ run_id: runId, staff_id: s.id, gross: s.salary_base, deductions: Math.round(s.salary_base * 0.1), net: Math.round(s.salary_base * 0.9), status: 'pending' }));
    await supabase.from('payroll_items').insert(items);
    const total = items.reduce((sum: number, i: any) => sum + i.net, 0);
    await supabase.from('payroll_runs').update({ status: 'processed', total_amount: total }).eq('id', runId);
    load();
  };

  const statusColor = (s: string) => ({ draft: 'bg-slate-50 text-slate-600', processed: 'bg-indigo-50 text-indigo-700', paid: 'bg-emerald-50 text-emerald-700' } as Record<string,string>)[s] || 'bg-slate-50';

  return (
    <div className="space-y-5">
      <PageHeader title="Paie" subtitle={`${runs.length} période(s)`} action={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Nouvelle période</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : runs.length === 0 ? <EmptyState icon={Wallet} message="Aucune période de paie." /> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Période</th><th className="text-center px-4 py-3 font-semibold text-slate-600">Statut</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Total net</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{runs.map((r) => (<tr key={r.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 font-medium text-slate-900">{r.period_start} → {r.period_end}</td><td className="px-4 py-3 text-center"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(r.status)}`}>{r.status}</span></td><td className="px-4 py-3 text-right font-semibold text-slate-900">{Number(r.total_amount).toLocaleString()}</td><td className="px-4 py-3 text-right">{r.status === 'draft' && <button onClick={() => process(r.id)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"><Play size={12} /> Traiter</button>}</td></tr>))}</tbody></table>
        </div>
      )}
      {showForm && <RunForm schoolId={school!.id} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function RunForm({ schoolId, onClose, onSaved }: { schoolId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ period_start: '', period_end: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('payroll_runs').insert({ school_id: schoolId, ...form, status: 'draft' });
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title="Nouvelle période de paie" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Début</label><input type="date" required value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Fin</label><input type="date" required value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} className={inputCls} /></div></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Créer'}</button></div>
      </form>
    </Modal>
  );
}
