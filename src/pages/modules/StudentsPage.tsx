import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface Student { id: string; first_name: string; last_name: string; gender: string; date_of_birth: string; class_id: string | null }
interface ClassRow { id: string; name: string }

export function StudentsPage() {
  const { school } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  const load = useCallback(async () => {
    if (!school) return;
    setLoading(true);
    const { data: cls } = await supabase.from('classes').select('id, name').eq('school_id', school.id);
    setClasses((cls || []) as ClassRow[]);
    let q = supabase.from('students').select('*').eq('school_id', school.id);
    if (search.trim()) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    const { data } = await q.order('last_name');
    setStudents((data || []) as Student[]);
    setLoading(false);
  }, [school, search]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!confirm('Supprimer cet élève ?')) return;
    await supabase.from('students').delete().eq('id', id);
    load();
  };

  const className = (id: string | null) => classes.find((c) => c.id === id)?.name || '—';

  return (
    <div className="space-y-5">
      <PageHeader title="Élèves" subtitle={`${students.length} élève(s)`} action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Ajouter</button>} />
      <div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Chargement...</div> : students.length === 0 ? <EmptyState icon={Users} message="Aucun élève enregistré." /> : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Sexe</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Naissance</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Classe</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{students.map((s) => (<tr key={s.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 font-medium text-slate-900">{s.last_name} {s.first_name}</td><td className="px-4 py-3 text-slate-600">{s.gender || '—'}</td><td className="px-4 py-3 text-slate-600">{s.date_of_birth || '—'}</td><td className="px-4 py-3 text-slate-600">{className(s.class_id)}</td><td className="px-4 py-3 text-right"><div className="inline-flex gap-1"><button onClick={() => { setEditing(s); setShowForm(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><Pencil size={15} /></button><button onClick={() => remove(s.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button></div></td></tr>))}</tbody></table>
        </div>
      )}
      {showForm && <StudentForm schoolId={school!.id} classes={classes} student={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function StudentForm({ schoolId, classes, student, onClose, onSaved }: { schoolId: string; classes: ClassRow[]; student: Student | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ first_name: student?.first_name || '', last_name: student?.last_name || '', gender: student?.gender || 'M', date_of_birth: student?.date_of_birth || '', class_id: student?.class_id || '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { school_id: schoolId, ...form, class_id: form.class_id || null };
    const { error } = student ? await supabase.from('students').update(payload).eq('id', student.id) : await supabase.from('students').insert(payload);
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title={student ? 'Modifier' : 'Nouvel élève'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom</label><input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nom</label><input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Sexe</label><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputCls}><option value="M">M</option><option value="F">F</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Naissance</label><input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className={inputCls} /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Classe</label><select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className={inputCls}><option value="">—</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div>
      </form>
    </Modal>
  );
}
