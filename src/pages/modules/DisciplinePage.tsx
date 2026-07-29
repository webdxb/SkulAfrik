import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { PageHeader, Modal, EmptyState, inputCls, Card } from '../../components/ui';
import { Plus, Search, Trash2, ShieldAlert, Check } from 'lucide-react';

interface Incident {
  id: string;
  student_id: string;
  incident_date: string;
  type: string;
  description: string | null;
  severity: string | null;
  parent_notified: boolean;
}

interface StudentOption { id: string; name: string; }

const emptyForm = { student_id: '', incident_date: new Date().toISOString().slice(0, 10), type: 'warning', description: '', severity: 'low' };

const typeLabels: Record<string, string> = {
  warning: 'Avertissement', detention: 'Retenue', suspension: 'Suspension', expulsion: 'Exclusion', commendation: 'Félicitation',
};
const typeColors: Record<string, string> = {
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  detention: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  suspension: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  expulsion: 'bg-rose-200 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
  commendation: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};
const severityLabels: Record<string, string> = { low: 'Basse', medium: 'Moyenne', high: 'Haute' };

export function DisciplinePage() {
  const { showError, showSuccess } = useToast();
  const { school, profile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (school) loadData();
  }, [school]);

  async function loadData() {
    if (!school) return;
    setLoading(true);
    const [incRes, stuRes] = await Promise.all([
      supabase.from('discipline_incidents').select('id, student_id, incident_date, type, description, severity, parent_notified').eq('school_id', school.id).order('incident_date', { ascending: false }),
      supabase.from('students').select('id, first_name, last_name').eq('school_id', school.id).order('last_name'),
    ]);
    setIncidents((incRes.data || []) as Incident[]);
    setStudents((stuRes.data || []).map((s: any) => ({ id: s.id, name: `${s.last_name} ${s.first_name}` })));
    setLoading(false);
  }

  const studentName = (id: string) => students.find((s) => s.id === id)?.name || '—';

  const filtered = incidents.filter((i) => {
    const q = search.toLowerCase();
    return studentName(i.student_id).toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q) || typeLabels[i.type].toLowerCase().includes(q);
  });

  function openAdd() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!school || !profile || !form.student_id) return;
    setSaving(true);
    const { error } = await supabase.from('discipline_incidents').insert({
      school_id: school.id,
      student_id: form.student_id,
      incident_date: form.incident_date,
      type: form.type,
      description: form.description || null,
      severity: form.severity || null,
      reported_by: profile.id,
    });
    if (error) { showError(error.message); setSaving(false); return; }
    setSaving(false);
    setModalOpen(false);
    showSuccess('Incident enregistré.');
    loadData();
  }

  async function toggleNotified(i: Incident) {
    const { error } = await supabase.from('discipline_incidents').update({ parent_notified: !i.parent_notified }).eq('id', i.id);
    if (error) { showError(error.message); return; }
    setIncidents((prev) => prev.map((x) => x.id === i.id ? { ...x, parent_notified: !x.parent_notified } : x));
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet incident ?')) return;
    const { error } = await supabase.from('discipline_incidents').delete().eq('id', id);
    if (error) { showError(error.message); return; }
    loadData();
  }

  return (
    <div>
      <PageHeader title="Discipline" subtitle="Suivi des incidents et sanctions disciplinaires" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Signaler un incident
        </button>
      } />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher par élève, type, description..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShieldAlert} message="Aucun incident enregistré" action={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Signaler un incident
          </button>
        } />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Élève</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Sévérité</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Parent informé</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{studentName(i.student_id)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{new Date(i.incident_date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[i.type] || typeColors.warning}`}>{typeLabels[i.type] || i.type}</span></td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{i.severity ? severityLabels[i.severity] : '—'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{i.description || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleNotified(i)} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${i.parent_notified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {i.parent_notified && <Check size={12} />} {i.parent_notified ? 'Oui' : 'Non'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(i.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && (
        <Modal title="Signaler un incident" onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Élève</label>
              <select className={inputCls} value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
                <option value="">Sélectionner un élève...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
              <input type="date" className={inputCls} value={form.incident_date} onChange={(e) => setForm({ ...form, incident_date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Sévérité</label>
                <select className={inputCls} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  {Object.entries(severityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Détails de l'incident..." />
            </div>
            <button onClick={handleSave} disabled={saving || !form.student_id} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
