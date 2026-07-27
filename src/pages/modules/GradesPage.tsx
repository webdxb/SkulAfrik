import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { PageHeader, EmptyState, inputCls, Card } from '../../components/ui';
import { Save, BarChart3 } from 'lucide-react';

interface ClassItem { id: string; name: string; }
interface Subject { id: string; name: string; }
interface Student { id: string; first_name: string; last_name: string; }

export function GradesPage() {
  const { showError } = useToast();
  const { school, profile } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('T1');
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (school) {
      loadOptions();
    }
  }, [school]);

  async function loadOptions() {
    if (!school) return;
    const [clsRes, subRes] = await Promise.all([
      supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
      supabase.from('subjects').select('id, name').eq('school_id', school.id).order('name'),
    ]);
    setClasses((clsRes.data || []) as ClassItem[]);
    setSubjects((subRes.data || []) as Subject[]);
  }

  useEffect(() => {
    if (selectedClass && school) {
      loadStudents();
    }
  }, [selectedClass, school]);

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

    // Load existing grades for this class + subject + term
    if (selectedSubject) {
      const { data: existing } = await supabase
        .from('grades')
        .select('student_id, grade_value')
        .eq('school_id', school.id)
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubject)
        .eq('term', selectedTerm);
      const map: Record<string, string> = {};
      (existing || []).forEach((g: any) => { map[g.student_id] = String(g.grade_value); });
      setGrades(map);
    } else {
      setGrades({});
    }
    setLoading(false);
  }

  useEffect(() => {
    if (selectedClass && selectedSubject && school) {
      loadStudents();
    }
  }, [selectedSubject, selectedTerm]);

  function setGrade(studentId: string, value: string) {
    const v = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(v);
    if (v === '' || (num >= 0 && num <= 20)) {
      setGrades({ ...grades, [studentId]: v });
    }
  }

  async function handleSave() {
    if (!school || !selectedClass || !selectedSubject || !profile) return;
    setSaving(true);
    const records = students
      .filter((s) => grades[s.id] !== undefined && grades[s.id] !== '')
      .map((s) => ({
        school_id: school.id,
        student_id: s.id,
        subject_id: selectedSubject,
        class_id: selectedClass,
        term: selectedTerm,
        grade_value: parseFloat(grades[s.id]),
        max_value: 20,
        grade_type: 'exam',
        date: new Date().toISOString().split('T')[0],
        recorded_by: profile.id,
      }));

    // Delete existing then insert
    const { error: delErr } = await supabase.from('grades').delete()
      .eq('school_id', school.id)
      .eq('class_id', selectedClass)
      .eq('subject_id', selectedSubject)
      .eq('term', selectedTerm);
    if (delErr) { showError(delErr.message); setSaving(false); return; }
    if (records.length > 0) {
      const { error } = await supabase.from('grades').insert(records);
      if (error) { showError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <PageHeader title="Notes" subtitle="Saisissez les notes par classe et par matière (sur 20)" />

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Classe</label>
            <select className={inputCls} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">Sélectionner...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Matière</label>
            <select className={inputCls} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">Sélectionner...</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Trimestre</label>
            <select className={inputCls} value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
              <option value="T1">Trimestre 1</option>
              <option value="T2">Trimestre 2</option>
              <option value="T3">Trimestre 3</option>
            </select>
          </div>
        </div>
      </Card>

      {!selectedClass || !selectedSubject ? (
        <EmptyState icon={BarChart3} message="Sélectionnez une classe et une matière pour saisir les notes" />
      ) : loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : students.length === 0 ? (
        <EmptyState icon={BarChart3} message="Aucun élève dans cette classe" />
      ) : (
        <>
          <Card className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Élève</th>
                  <th className="px-4 py-3 font-semibold text-center">Note / 20</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.last_name} {s.first_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          className={`${inputCls} w-20 text-center`}
                          value={grades[s.id] || ''}
                          onChange={(e) => setGrade(s.id, e.target.value)}
                          placeholder="—"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="flex items-center gap-4">
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer les notes'}
            </button>
            {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">✓ Notes enregistrées</span>}
          </div>
        </>
      )}
    </div>
  );
}
