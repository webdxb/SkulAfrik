import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { PageHeader, Modal, EmptyState, inputCls, Card } from '../../components/ui';
import { Plus, Search, Pencil, Trash2, Bus, Users } from 'lucide-react';

interface TransportRoute {
  id: string;
  name: string;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_plate: string | null;
  capacity: number;
}

interface StudentOption { id: string; name: string; }
interface Assignment { id: string; student_id: string; paid: boolean; }

const emptyForm = { name: '', driver_name: '', driver_phone: '', vehicle_plate: '', capacity: '' };

export function TransportPage() {
  const { showError, showSuccess } = useToast();
  const { school } = useAuth();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [ridersRoute, setRidersRoute] = useState<TransportRoute | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newRiderId, setNewRiderId] = useState('');

  useEffect(() => {
    if (school) loadData();
  }, [school]);

  async function loadData() {
    if (!school) return;
    setLoading(true);
    const [routesRes, studentsRes] = await Promise.all([
      supabase.from('transport_routes').select('id, name, driver_name, driver_phone, vehicle_plate, capacity').eq('school_id', school.id).order('name'),
      supabase.from('students').select('id, first_name, last_name').eq('school_id', school.id).order('last_name'),
    ]);
    setRoutes((routesRes.data || []) as TransportRoute[]);
    setStudents((studentsRes.data || []).map((s: any) => ({ id: s.id, name: `${s.last_name} ${s.first_name}` })));
    setLoading(false);
  }

  async function openRiders(r: TransportRoute) {
    setRidersRoute(r);
    setNewRiderId('');
    const { data } = await supabase.from('student_transport').select('id, student_id, paid').eq('route_id', r.id);
    setAssignments((data || []) as Assignment[]);
  }

  async function addRider() {
    if (!ridersRoute || !newRiderId) return;
    const { data, error } = await supabase.from('student_transport').insert({ student_id: newRiderId, route_id: ridersRoute.id, paid: false }).select('id, student_id, paid').single();
    if (error) { showError(error.message); return; }
    setAssignments((prev) => [...prev, data as Assignment]);
    setNewRiderId('');
    showSuccess('Élève ajouté à la route.');
  }

  async function togglePaid(a: Assignment) {
    const { error } = await supabase.from('student_transport').update({ paid: !a.paid }).eq('id', a.id);
    if (error) { showError(error.message); return; }
    setAssignments((prev) => prev.map((x) => x.id === a.id ? { ...x, paid: !x.paid } : x));
  }

  async function removeRider(a: Assignment) {
    const { error } = await supabase.from('student_transport').delete().eq('id', a.id);
    if (error) { showError(error.message); return; }
    setAssignments((prev) => prev.filter((x) => x.id !== a.id));
  }

  const filtered = routes.filter((r) => {
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || (r.driver_name || '').toLowerCase().includes(q) || (r.vehicle_plate || '').toLowerCase().includes(q);
  });

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(r: TransportRoute) {
    setEditId(r.id);
    setForm({ name: r.name, driver_name: r.driver_name || '', driver_phone: r.driver_phone || '', vehicle_plate: r.vehicle_plate || '', capacity: String(r.capacity || '') });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!school) return;
    setSaving(true);
    const payload = {
      ...form,
      school_id: school.id,
      driver_name: form.driver_name || null,
      driver_phone: form.driver_phone || null,
      vehicle_plate: form.vehicle_plate || null,
      capacity: parseInt(form.capacity) || 0,
      price_annual: 0,
    };
    if (editId) {
      const { error } = await supabase.from('transport_routes').update(payload).eq('id', editId);
      if (error) { showError(error.message); return; }
    } else {
      const { error } = await supabase.from('transport_routes').insert(payload);
      if (error) { showError(error.message); return; }
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette route ?')) return;
    const { error } = await supabase.from('transport_routes').delete().eq('id', id);
    if (error) { showError(error.message); return; }
    loadData();
  }

  return (
    <div>
      <PageHeader title="Transport" subtitle="Gérez les itinéraires et véhicules de transport" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      } />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher une route..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bus} message="Aucune route de transport trouvée" action={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Ajouter une route
          </button>
        } />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Nom de la route</th>
                <th className="px-4 py-3 font-semibold">Chauffeur</th>
                <th className="px-4 py-3 font-semibold">Téléphone</th>
                <th className="px-4 py-3 font-semibold">Plaque</th>
                <th className="px-4 py-3 font-semibold">Capacité</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{r.name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.driver_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.driver_phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.vehicle_plate || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.capacity}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => openRiders(r)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" title="Gérer les élèves"><Users size={16} /></button>
                      <button onClick={() => openEdit(r)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && (
        <Modal title={editId ? 'Modifier la route' : 'Ajouter une route'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom de la route</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom du chauffeur</label>
              <input className={inputCls} value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Téléphone du chauffeur</label>
              <input className={inputCls} value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Plaque du véhicule</label>
              <input className={inputCls} value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Capacité</label>
              <input type="number" className={inputCls} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </Modal>
      )}

      {ridersRoute && (
        <Modal title={`Élèves — ${ridersRoute.name}`} onClose={() => setRidersRoute(null)}>
          <div className="space-y-4">
            <div className="flex gap-2">
              <select className={inputCls} value={newRiderId} onChange={(e) => setNewRiderId(e.target.value)}>
                <option value="">Ajouter un élève...</option>
                {students.filter((s) => !assignments.some((a) => a.student_id === s.id)).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button onClick={addRider} disabled={!newRiderId} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap">Ajouter</button>
            </div>
            {assignments.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun élève assigné à cette route pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{students.find((s) => s.id === a.student_id)?.name || '—'}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => togglePaid(a)} className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {a.paid ? 'Payé' : 'Non payé'}
                      </button>
                      <button onClick={() => removeRider(a)} className="text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400">{assignments.length} / {ridersRoute.capacity} places occupées</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
