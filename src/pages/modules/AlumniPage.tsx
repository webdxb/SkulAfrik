import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface Alumnus { id: string; first_name: string; last_name: string; graduation_year: number; current_occupation: string; email: string; phone: string }

export function AlumniPage() {
  const { school } = useAuth();
  const [alumni, setAlumni] = useState<Alumnus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Alumnus | null>(null);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('alumni').select('*').eq('school_id', school.id).order('graduation_year', { ascending: false });
    setAlumni((data || []) as Alumnus[]);
    setLoading(false);
  }, [school]);

  useEffect(() => { load(); }, [load]);
  const remove = async (id: string) => { if (confirm('Supprimer cet ancien élève ?')) { await supabase.from('alumni').delete().eq('id', id); load(); } };

  return (
    <div className="space-y-5">
      <PageHeader title="Anciens élèves" subtitle={`${alumni.length} ancien(s)`} action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Ajouter</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : alumni.length === 0 ? <EmptyState icon={GraduationCap} message="Aucun ancien élève enregistré." /> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Promotion</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Occupation</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Contact</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{alumni.map((a) => (<tr key={a.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 font-medium text-slate-900">{a.last_name} {a.first_name}</td><td className="px-4 py-3 text-slate-600">{a.graduation_year}</td><td className="px-4 py-3 text-slate-600">{a.current_occupation || '—'}</td><td className="px-4 py-3 text-slate-600">{a.email || a.phone || '—'}</td><td className="px-4 py-3 text-right"><div className="inline-flex gap-1"><button onClick={() => { setEditing(a); setShowForm(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><Pencil size={15} /></button><button onClick={() => remove(a.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button></div></td></tr>))}</tbody></table>
        </div>
      )}
      {showForm && <AlumnusForm schoolId={school!.id} alumnus={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function AlumnusForm({ schoolId, alumnus, onClose, onSaved }: { schoolId: string; alumnus: Alumnus | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ first_name: alumnus?.first_name || '', last_name: alumnus?.last_name || '', graduation_year: alumnus?.graduation_year || new Date().getFullYear(), current_occupation: alumnus?.current_occupation || '', email: alumnus?.email || '', phone: alumnus?.phone || '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { school_id: schoolId, ...form, graduation_year: Number(form.graduation_year) };
    const { error } = alumnus ? await supabase.from('alumni').update(payload).eq('id', alumnus.id) : await supabase.from('alumni').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={alumnus ? 'Modifier' : 'Nouvel ancien'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom</label><input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nom</label><input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} /></div></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Année de promotion</label><input type="number" required value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: Number(e.target.value) })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Occupation actuelle</label><input value={form.current_occupation} onChange={(e) => setForm({ ...form, current_occupation: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></div></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
