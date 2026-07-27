import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, Modal, EmptyState, inputCls, Card } from '../../components/ui';
import { Plus, Search, Pencil, Trash2, CreditCard } from 'lucide-react';

interface Staff { id: string; first_name: string; last_name: string; }

interface PayrollRun {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_amount: number;
}

interface PayrollItem {
  id: string;
  run_id: string;
  staff_id: string | null;
  teacher_id: string | null;
  gross: number;
  deductions: number;
  net: number;
  status: string;
}

const emptyForm = { staff_id: '', month: new Date().toISOString().slice(0, 7), base_salary: '', bonuses: '', deductions: '', status: 'pending' };

export function PayrollPage() {
  const { school, profile } = useAuth();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
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
    const [runRes, staffRes] = await Promise.all([
      supabase.from('payroll_runs').select('id, period_start, period_end, status, total_amount').eq('school_id', school.id).order('period_start', { ascending: false }),
      supabase.from('staff').select('id, first_name, last_name').eq('school_id', school.id).order('last_name'),
    ]);
    const runList = (runRes.data || []) as PayrollRun[];
    setRuns(runList);
    setStaff((staffRes.data || []) as Staff[]);
    const sMap: Record<string, string> = {};
    (staffRes.data || []).forEach((s: any) => { sMap[s.id] = `${s.last_name} ${s.first_name}`; });
    setStaffMap(sMap);

    // Load items for all runs
    if (runList.length > 0) {
      const { data: itemList } = await supabase
        .from('payroll_items')
        .select('id, run_id, staff_id, teacher_id, gross, deductions, net, status')
        .in('run_id', runList.map((r) => r.id));
      setItems((itemList || []) as PayrollItem[]);
    } else {
      setItems([]);
    }
    setLoading(false);
  }

  const filtered = items.filter((item) => {
    const name = item.staff_id ? staffMap[item.staff_id] || '' : item.teacher_id ? staffMap[item.teacher_id] || '' : '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q);
  });

  function openAdd() {
    setEditId(null);
    setForm({ ...emptyForm, month: new Date().toISOString().slice(0, 7) });
    setModalOpen(true);
  }

  function openEdit(item: PayrollItem) {
    setEditId(item.id);
    setForm({
      staff_id: item.staff_id || '',
      month: runs.find((r) => r.id === item.run_id)?.period_start || '',
      base_salary: String(item.gross || ''),
      bonuses: '',
      deductions: String(item.deductions || ''),
      status: item.status || 'pending',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!school || !profile) return;
    setSaving(true);
    const baseSalary = parseFloat(form.base_salary) || 0;
    const bonuses = 0; // bonuses stored in form but not in schema
    const deductions = parseFloat(form.deductions) || 0;
    const net = baseSalary + bonuses - deductions;

    // Find or create a payroll run for the month
    const monthStart = form.month ? `${form.month}-01` : new Date().toISOString().split('T')[0];
    let runId: string | null = null;

    const existingRun = runs.find((r) => r.period_start === monthStart);
    if (existingRun) {
      runId = existingRun.id;
    } else {
      const { data: newRun } = await supabase.from('payroll_runs').insert({
        school_id: school.id,
        period_start: monthStart,
        period_end: monthStart,
        status: 'draft',
        total_amount: 0,
      }).select('id').single();
      runId = newRun?.id;
    }

    if (runId) {
      const payload = {
        run_id: runId,
        staff_id: form.staff_id || null,
        teacher_id: null,
        gross: baseSalary,
        deductions,
        net,
        status: form.status,
      };
      if (editId) {
        await supabase.from('payroll_items').update(payload).eq('id', editId);
      } else {
        await supabase.from('payroll_items').insert(payload);
      }
    }

    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette ligne de paie ?')) return;
    await supabase.from('payroll_items').delete().eq('id', id);
    loadData();
  }

  const netCalculated = (parseFloat(form.base_salary) || 0) + (parseFloat(form.bonuses) || 0) - (parseFloat(form.deductions) || 0);

  return (
    <div>
      <PageHeader title="Paie" subtitle="Gérez les fiches de paie du personnel" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      } />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CreditCard} message="Aucune fiche de paie trouvée" action={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Ajouter une fiche
          </button>
        } />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Personnel</th>
                <th className="px-4 py-3 font-semibold">Période</th>
                <th className="px-4 py-3 font-semibold">Salaire brut</th>
                <th className="px-4 py-3 font-semibold">Déductions</th>
                <th className="px-4 py-3 font-semibold">Salaire net</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => {
                const name = item.staff_id ? staffMap[item.staff_id] || '—' : item.teacher_id ? staffMap[item.teacher_id] || '—' : '—';
                const run = runs.find((r) => r.id === item.run_id);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{name}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{run?.period_start || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{Number(item.gross).toLocaleString()} FCFA</td>
                    <td className="px-4 py-3 text-rose-600 dark:text-rose-400">-{Number(item.deductions).toLocaleString()} FCFA</td>
                    <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">{Number(item.net).toLocaleString()} FCFA</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : item.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {item.status === 'paid' ? 'Payé' : item.status === 'pending' ? 'En attente' : item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && (
        <Modal title={editId ? 'Modifier la fiche de paie' : 'Ajouter une fiche de paie'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Membre du personnel</label>
              <select className={inputCls} value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })}>
                <option value="">Sélectionner...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mois</label>
              <input type="month" className={inputCls} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Salaire de base (FCFA)</label>
              <input type="number" className={inputCls} value={form.base_salary} onChange={(e) => setForm({ ...form, base_salary: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Primes (FCFA)</label>
              <input type="number" className={inputCls} value={form.bonuses} onChange={(e) => setForm({ ...form, bonuses: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Déductions (FCFA)</label>
              <input type="number" className={inputCls} value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Salaire net calculé</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{netCalculated.toLocaleString()} FCFA</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Statut</label>
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pending">En attente</option>
                <option value="paid">Payé</option>
              </select>
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
