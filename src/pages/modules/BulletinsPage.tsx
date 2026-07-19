import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { FileText, Download, Printer } from 'lucide-react';
import { PageHeader, EmptyState, inputCls } from '../../components/ui';

export function BulletinsPage() {
  const { school } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      if (!school) return;
      const { data } = await supabase.from('classes').select('id, name').eq('school_id', school.id).order('name');
      setClasses(data || []);
    })();
  }, [school]);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;
    const { data } = await supabase.from('students').select('id, first_name, last_name').eq('class_id', selectedClass).order('last_name');
    setStudents(data || []);
  }, [selectedClass]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const generate = async (studentId: string) => {
    const { data } = await supabase.from('bulletins').insert({ school_id: school!.id, student_id: studentId, term_key: 'T1', status: 'generated' }).select().single();
    if (data) setBulletins({ ...bulletins, [studentId]: data });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Bulletins" subtitle="Génération des bulletins de notes" />
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={inputCls + ' sm:max-w-xs'}><option value="">Sélectionner une classe</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>
      {selectedClass && students.length === 0 ? <EmptyState icon={FileText} message="Aucun élève dans cette classe." /> : selectedClass && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Élève</th><th className="text-center px-4 py-3 font-semibold text-slate-600">Statut</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{students.map((s) => (<tr key={s.id}><td className="px-4 py-3 font-medium text-slate-900">{s.last_name} {s.first_name}</td><td className="px-4 py-3 text-center">{bulletins[s.id] ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Généré</span> : <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">En attente</span>}</td><td className="px-4 py-3 text-right"><div className="inline-flex gap-1"><button onClick={() => generate(s.id)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"><FileText size={14} /> Générer</button>{bulletins[s.id] && <button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"><Printer size={14} /> Imprimer</button>}</div></td></tr>))}</tbody></table>
        </div>
      )}
    </div>
  );
}
