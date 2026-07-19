import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Calendar, Check, X, Clock } from 'lucide-react';
import { PageHeader, EmptyState, inputCls } from '../../components/ui';

export function AttendancePage() {
  const { school } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    const { data: existing } = await supabase.from('attendance').select('student_id, status').eq('class_id', selectedClass).eq('date', date);
    const map: Record<string, 'present' | 'absent' | 'late'> = {};
    (existing || []).forEach((a: any) => { map[a.student_id] = a.status; });
    setAttendance(map);
  }, [selectedClass, date]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const save = async () => {
    setSaving(true); setSaved(false);
    const rows = students.map((s) => ({ school_id: school!.id, student_id: s.id, class_id: selectedClass, date, status: attendance[s.id] || 'present' }));
    await supabase.from('attendance').delete().eq('class_id', selectedClass).eq('date', date);
    if (rows.length > 0) await supabase.from('attendance').insert(rows);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Présences" subtitle="Saisie quotidienne" />
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={inputCls + ' sm:max-w-xs'}><option value="">Sélectionner une classe</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls + ' sm:max-w-xs'} />
        </div>
      </div>
      {selectedClass && students.length === 0 ? <EmptyState icon={Calendar} message="Aucun élève dans cette classe." /> : selectedClass && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Élève</th><th className="text-center px-4 py-3 font-semibold text-slate-600">Statut</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{students.map((s) => (<tr key={s.id}><td className="px-4 py-3 font-medium text-slate-900">{s.last_name} {s.first_name}</td><td className="px-4 py-3"><div className="flex justify-center gap-2">{([['present','Présent',Check],['late','Retard',Clock],['absent','Absent',X]] as const).map(([st, lbl, Icon]) => (<button key={st} onClick={() => setAttendance({ ...attendance, [s.id]: st })} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${(attendance[s.id] || 'present') === st ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Icon size={14} /> {lbl}</button>))}</div></td></tr>))}</tbody></table>
          <div className="flex items-center justify-between p-4 border-t border-slate-100"><span className="text-sm text-slate-500">{students.length} élève(s)</span><div className="flex items-center gap-3">{saved && <span className="text-sm text-emerald-600">Enregistré ✓</span>}<button onClick={save} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button></div></div>
        </div>
      )}
    </div>
  );
}
