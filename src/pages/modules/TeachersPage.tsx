import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface Teacher { id: string; first_name: string; last_name: string; email: string; phone: string; subject: string }

export function TeachersPage() {
  const { school } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('school_id', school.id).eq('role', 'teacher').order('last_name');
    setTeachers((data || []) as Teacher[]);
    setLoading(false);
  }, [school]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => { if (confirm('Supprimer cet enseignant ?')) { await supabase.from('profiles').delete().eq('id', id); load(); } };

  return (
    <div className="space-y-5">
      <PageHeader title="Enseignants" subtitle={`${teachers.length} enseignant(s)`} action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Ajouter</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : teachers.length === 0 ? <EmptyState icon={GraduationCap} message="Aucun enseignant enregistré." /> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Téléphone</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{teachers.map((t) => (<tr key={t.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 font-medium text-slate-900">{t.last_name} {t.first_name}</td><td className="px-4 py-3 text-slate-600">{t.email || '—'}</td><td className="px-4 py-3 text-slate-600">{t.phone || '—'}</td><td className="px-4 py-3 text-right"><div className="inline-flex gap-1"><button onClick={() => { setEditing(t); setShowForm(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><Pencil size={15} /></button><button onClick={() => remove(t.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button></div></td></tr>))}</tbody></table>
        </div>
      )}
      {showForm && <TeacherForm schoolId={school!.id} teacher={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function TeacherForm({ schoolId, teacher, onClose, onSaved }: { schoolId: string; teacher: Teacher | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ first_name: teacher?.first_name || '', last_name: teacher?.last_name || '', email: teacher?.email || '', phone: teacher?.phone || '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { school_id: schoolId, role: 'teacher', ...form };
    const { error } = teacher ? await supabase.from('profiles').update(payload).eq('id', teacher.id) : await supabase.from('profiles').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={teacher ? 'Modifier' : 'Nouvel enseignant'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom</label><input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nom</label><input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} /></div></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
