import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { BookOpen } from 'lucide-react';
import { PageHeader, EmptyState, inputCls } from '../../components/ui';

export function GradesPage() {
  const { school } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      if (!school) return;
      const [c, s] = await Promise.all([
        supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
        supabase.from('subjects').select('id, name').eq('school_id', school.id).order('name'),
      ]);
      setClasses(c.data || []); setSubjects(s.data || []);
    })();
  }, [school]);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;
    const { data } = await supabase.from('students').select('id, first_name, last_name').eq('class_id', selectedClass).order('last_name');
    setStudents(data || []);
    if (selectedSubject) {
      const { data: existing } = await supabase.from('grades').select('student_id, score').eq('class_id', selectedClass).eq('subject_id', selectedSubject);
      const map: Record<string, string> = {};
      (existing || []).forEach((g: any) => { map[g.student_id] = String(g.score); });
      setGrades(map);
    }
  }, [selectedClass, selectedSubject]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const save = async () => {
    if (!selectedSubject) return;
    setSaving(true); setSaved(false);
    const rows = students.filter((s) => grades[s.id] !== undefined && grades[s.id] !== '').map((s) => ({ school_id: school!.id, student_id: s.id, class_id: selectedClass, subject_id: selectedSubject, score: Number(grades[s.id]), term: 'T1' }));
    await supabase.from('grades').delete().eq('class_id', selectedClass).eq('subject_id', selectedSubject).eq('term', 'T1');
    if (rows.length > 0) await supabase.from('grades').insert(rows);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Notes" subtitle="Saisie des évaluations" />
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={inputCls + ' sm:max-w-xs'}><option value="">Classe</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className={inputCls + ' sm:max-w-xs'}><option value="">Matière</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </div>
      </div>
      {selectedClass && selectedSubject && students.length === 0 ? <EmptyState icon={BookOpen} message="Aucun élève dans cette classe." /> : selectedClass && selectedSubject && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"><th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Élève</th><th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Note /20</th></tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">{students.map((s) => (<tr key={s.id}><td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.last_name} {s.first_name}</td><td className="px-4 py-3"><input type="number" min="0" max="20" step="0.25" value={grades[s.id] || ''} onChange={(e) => setGrades({ ...grades, [s.id]: e.target.value })} className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none mx-auto block" /></td></tr>))}</tbody></table>
          <div className="flex items-center justify-between p-4 border-t border-slate-100"><span className="text-sm text-slate-500 dark:text-slate-400">{students.length} élève(s)</span><div className="flex items-center gap-3">{saved && <span className="text-sm text-emerald-600">Enregistré ✓</span>}<button onClick={save} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div></div>
        </div>
      )}
    </div>
  );
}
