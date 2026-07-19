import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, Bus, MapPin } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface Route { id: string; name: string; vehicle_plate: string; driver_name: string; driver_phone: string; capacity: number; price_annual: number }

export function TransportPage() {
  const { school } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('transport_routes').select('*').eq('school_id', school.id).order('name');
    setRoutes((data || []) as Route[]);
    setLoading(false);
  }, [school]);

  useEffect(() => { load(); }, [load]);
  const remove = async (id: string) => { if (confirm('Supprimer cette route ?')) { await supabase.from('transport_routes').delete().eq('id', id); load(); } };

  return (
    <div className="space-y-5">
      <PageHeader title="Transport" subtitle={`${routes.length} route(s)`} action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Ajouter</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : routes.length === 0 ? <EmptyState icon={Bus} message="Aucune route de transport." /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-start justify-between"><div className="flex items-center gap-2"><div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center"><Bus size={18} className="text-indigo-600" /></div><div><p className="font-sans font-bold text-slate-900">{r.name}</p><p className="text-sm text-slate-500">{r.vehicle_plate || '—'}</p></div></div><div className="flex gap-1"><button onClick={() => { setEditing(r); setShowForm(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><Pencil size={15} /></button><button onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button></div></div>
              <div className="mt-3 space-y-1 text-sm text-slate-600"><p>Conducteur : {r.driver_name || '—'}</p><p>Téléphone : {r.driver_phone || '—'}</p><p>Capacité : {r.capacity} places</p><p>Tarif annuel : {r.price_annual?.toLocaleString() || 0}</p></div>
            </div>
          ))}
        </div>
      )}
      {showForm && <RouteForm schoolId={school!.id} route={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function RouteForm({ schoolId, route, onClose, onSaved }: { schoolId: string; route: Route | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: route?.name || '', vehicle_plate: route?.vehicle_plate || '', driver_name: route?.driver_name || '', driver_phone: route?.driver_phone || '', capacity: route?.capacity || 30, price_annual: route?.price_annual || 0 });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { school_id: schoolId, ...form, capacity: Number(form.capacity), price_annual: Number(form.price_annual) };
    const { error } = route ? await supabase.from('transport_routes').update(payload).eq('id', route.id) : await supabase.from('transport_routes').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={route ? 'Modifier' : 'Nouvelle route'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de la route</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Plaque du véhicule</label><input value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Conducteur</label><input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label><input value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} className={inputCls} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Capacité</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Tarif annuel</label><input type="number" value={form.price_annual} onChange={(e) => setForm({ ...form, price_annual: Number(e.target.value) })} className={inputCls} /></div></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
