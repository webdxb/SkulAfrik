import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface Parent { id: string; first_name: string; last_name: string; phone: string; email: string; occupation: string }

export function ParentsPage() {
  const { school } = useAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    let q = supabase.from('parents').select('*').eq('school_id', school.id);
    if (search.trim()) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    const { data } = await q.order('last_name');
    setParents((data || []) as Parent[]);
    setLoading(false);
  }, [school, search]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => { if (confirm('Supprimer ce parent ?')) { await supabase.from('parents').delete().eq('id', id); load(); } };

  return (
    <div className="space-y-5">
      <PageHeader title="Parents" subtitle={`${parents.length} parent(s)`} action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Ajouter</button>} />
      <div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : parents.length === 0 ? <EmptyState icon={Users} message="Aucun parent enregistré." /> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Téléphone</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Profession</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{parents.map((p) => (<tr key={p.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 font-medium text-slate-900">{p.last_name} {p.first_name}</td><td className="px-4 py-3 text-slate-600">{p.phone || '—'}</td><td className="px-4 py-3 text-slate-600">{p.email || '—'}</td><td className="px-4 py-3 text-slate-600">{p.occupation || '—'}</td><td className="px-4 py-3 text-right"><div className="inline-flex gap-1"><button onClick={() => { setEditing(p); setShowForm(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><Pencil size={15} /></button><button onClick={() => remove(p.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button></div></td></tr>))}</tbody></table>
        </div>
      )}
      {showForm && <ParentForm schoolId={school!.id} parent={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function ParentForm({ schoolId, parent, onClose, onSaved }: { schoolId: string; parent: Parent | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ first_name: parent?.first_name || '', last_name: parent?.last_name || '', phone: parent?.phone || '', email: parent?.email || '', occupation: parent?.occupation || '', address: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { school_id: schoolId, ...form };
    const { error } = parent ? await supabase.from('parents').update(payload).eq('id', parent.id) : await supabase.from('parents').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={parent ? 'Modifier' : 'Nouveau parent'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom</label><input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nom</label><input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} /></div></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Profession</label><input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputCls} /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
