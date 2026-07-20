import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface Staff { id: string; first_name: string; last_name: string; role: string; phone: string; email: string; salary_base: number; status: string; hire_date: string }

export function StaffPage() {
  const { school } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('staff').select('*').eq('school_id', school.id).order('last_name');
    setStaff((data || []) as Staff[]);
    setLoading(false);
  }, [school]);

  useEffect(() => { load(); }, [load]);
  const remove = async (id: string) => { if (confirm('Supprimer ce membre du personnel ?')) { await supabase.from('staff').delete().eq('id', id); load(); } };

  const roleLabel = (r: string) => ({ admin_staff: 'Administration', finance: 'Finance', librarian: 'Bibliothécaire', transport: 'Transport', other: 'Autre' } as Record<string,string>)[r] || r;

  return (
    <div className="space-y-5">
      <PageHeader title="Personnel" subtitle={`${staff.length} membre(s)`} action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Ajouter</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">Chargement...</div> : staff.length === 0 ? <EmptyState icon={Users} message="Aucun personnel enregistré." /> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Nom</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Fonction</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Téléphone</th><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Salaire base</th><th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">{staff.map((s) => (<tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"><td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.last_name} {s.first_name}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-400 dark:text-slate-400">{roleLabel(s.role)}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-400 dark:text-slate-400">{s.phone || '—'}</td><td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.salary_base?.toLocaleString() || 0}</td><td className="px-4 py-3 text-right"><div className="inline-flex gap-1"><button onClick={() => { setEditing(s); setShowForm(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 dark:text-slate-400"><Pencil size={15} /></button><button onClick={() => remove(s.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button></div></td></tr>))}</tbody></table>
        </div>
      )}
      {showForm && <StaffForm schoolId={school!.id} staff={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function StaffForm({ schoolId, staff, onClose, onSaved }: { schoolId: string; staff: Staff | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ first_name: staff?.first_name || '', last_name: staff?.last_name || '', role: staff?.role || 'admin_staff', phone: staff?.phone || '', email: staff?.email || '', salary_base: staff?.salary_base || 0, hire_date: staff?.hire_date || '', status: staff?.status || 'active' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { school_id: schoolId, ...form, salary_base: Number(form.salary_base) };
    const { error } = staff ? await supabase.from('staff').update(payload).eq('id', staff.id) : await supabase.from('staff').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={staff ? 'Modifier' : 'Nouveau personnel'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Prénom</label><input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nom</label><input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} /></div></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fonction</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}><option value="admin_staff">Administration</option><option value="finance">Finance</option><option value="librarian">Bibliothécaire</option><option value="transport">Transport</option><option value="other">Autre</option></select></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Salaire de base</label><input type="number" value={form.salary_base} onChange={(e) => setForm({ ...form, salary_base: Number(e.target.value) })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date d'embauche</label><input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} className={inputCls} /></div></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
