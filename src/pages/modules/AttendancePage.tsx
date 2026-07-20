import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, EmptyState, inputCls, Card } from '../../components/ui';
import { CheckCircle2, XCircle, Clock, Save, ClipboardCheck } from 'lucide-react';

interface ClassItem { id: string; name: string; }
interface Student { id: string; first_name: string; last_name: string; }

type Status = 'present' | 'absent' | 'late';

export function AttendancePage() {
  const { school, profile } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (school) loadClasses();
  }, [school]);

  async function loadClasses() {
    if (!school) return;
    const { data } = await supabase.from('classes').select('id, name').eq('school_id', school.id).order('name');
    setClasses((data || []) as ClassItem[]);
  }

  useEffect(() => {
    if (selectedClass && selectedDate && school) {
      loadStudents();
    }
  }, [selectedClass, selectedDate, school]);

  async function loadStudents() {
    if (!school || !selectedClass) return;
    setLoading(true);
    setSaved(false);
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .eq('school_id', school.id)
      .eq('class_id', selectedClass)
      .order('last_name');
    const list = (data || []) as Student[];
    setStudents(list);

    // Load existing attendance
    const { data: existing } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('school_id', school.id)
      .eq('class_id', selectedClass)
      .eq('date', selectedDate);
    const map: Record<string, Status> = {};
    (existing || []).forEach((a: any) => { map[a.student_id] = a.status as Status; });
    setAttendance(map);
    setLoading(false);
  }

  function setStatus(studentId: string, status: Status) {
    setAttendance({ ...attendance, [studentId]: status });
  }

  async function handleSave() {
    if (!school || !selectedClass || !profile) return;
    setSaving(true);
    const records = students.map((s) => ({
      school_id: school.id,
      class_id: selectedClass,
      student_id: s.id,
      date: selectedDate,
      status: attendance[s.id] || 'present',
      recorded_by: profile.id,
    }));

    // Delete existing then insert
    await supabase.from('attendance').delete().eq('school_id', school.id).eq('class_id', selectedClass).eq('date', selectedDate);
    if (records.length > 0) {
      await supabase.from('attendance').insert(records);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const statusColors: Record<Status, string> = {
    present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
    absent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-300 dark:border-rose-700',
    late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700',
  };

  const statusLabels: Record<Status, string> = {
    present: 'Présent',
    absent: 'Absent',
    late: 'Retard',
  };

  return (
    <div>
      <PageHeader title="Présences" subtitle="Marquez les présences par classe et par date" />

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Classe</label>
            <select className={inputCls} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">Sélectionner une classe</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
            <input type="date" className={inputCls} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </div>
      </Card>

      {!selectedClass ? (
        <EmptyState icon={ClipboardCheck} message="Sélectionnez une classe et une date pour marquer les présences" />
      ) : loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : students.length === 0 ? (
        <EmptyState icon={ClipboardCheck} message="Aucun élève dans cette classe" />
      ) : (
        <>
          <Card className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Élève</th>
                  <th className="px-4 py-3 font-semibold text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((s) => {
                  const status = attendance[s.id] || 'present';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.last_name} {s.first_name}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          {(['present', 'absent', 'late'] as Status[]).map((st) => (
                            <button
                              key={st}
                              onClick={() => setStatus(s.id, st)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium transition ${status === st ? statusColors[st] : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                              {st === 'present' && <CheckCircle2 size={14} />}
                              {st === 'absent' && <XCircle size={14} />}
                              {st === 'late' && <Clock size={14} />}
                              {statusLabels[st]}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
          <div className="flex items-center gap-4">
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer les présences'}
            </button>
            {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">✓ Présences enregistrées</span>}
          </div>
        </>
      )}
    </div>
  );
}
