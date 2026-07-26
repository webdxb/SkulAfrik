import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { navigate } from '../../lib/router';
import { PageHeader, Card, EmptyState } from '../../components/ui';
import {
  School,
  Users,
  ClipboardCheck,
  Calendar,
  GraduationCap,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface ClassRow {
  id: string;
  name: string;
  level: string | null;
  student_count: number;
}

interface ScheduleItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string | null;
  class_name: string | null;
  room: string | null;
}

interface GradeRow {
  id: string;
  value: number;
  created_at: string;
  subject_name: string | null;
  student_name: string | null;
}

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function formatTime(t: string): string {
  if (!t) return '';
  return t.slice(0, 5);
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

export function TeacherDashboard() {
  const { profile, school } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [recentGrades, setRecentGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);

      // Classes assigned to this teacher
      const { data: classRows } = await supabase
        .from('classes')
        .select('id, name, level')
        .eq('homeroom_teacher_id', profile.id);
      const teacherClasses = (classRows || []) as { id: string; name: string; level: string | null }[];

      // Student counts per class
      const classStats: ClassRow[] = [];
      let studentTotal = 0;
      for (const c of teacherClasses) {
        const { count } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', c.id);
        classStats.push({ id: c.id, name: c.name, level: c.level, student_count: count || 0 });
        studentTotal += count || 0;
      }
      if (cancelled) return;
      setClasses(classStats);
      setTotalStudents(studentTotal);

      // Today's schedule
      const today = new Date().getDay();
      const { data: schedRows } = await supabase
        .from('schedule_slots')
        .select('id, day_of_week, start_time, end_time, subject:subjects(name), class:classes(name), room')
        .eq('teacher_id', profile.id)
        .eq('day_of_week', today)
        .order('start_time', { ascending: true });

      if (cancelled) return;
      const sched = (schedRows || []).map((r: any) => ({
        id: r.id,
        day_of_week: r.day_of_week,
        start_time: r.start_time,
        end_time: r.end_time,
        subject: r.subject?.name || null,
        class_name: r.class?.name || null,
        room: r.room || null,
      }));
      setSchedule(sched);

      // Recent grades entered by this teacher
      const { data: gradeRows } = await supabase
        .from('grades')
        .select('id, grade_value, created_at, subject:subjects(name), student:students(first_name, last_name)')
        .eq('recorded_by', profile.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (cancelled) return;
      const grades = (gradeRows || []).map((r: any) => ({
        id: r.id,
        value: r.grade_value,
        created_at: r.created_at,
        subject_name: r.subject?.name || null,
        student_name: r.student ? `${r.student.first_name || ''} ${r.student.last_name || ''}`.trim() || null : null,
      }));
      setRecentGrades(grades);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [profile?.id]);

  if (!profile) {
    return <EmptyState icon={Users} message="Profil introuvable. Veuillez vous reconnecter." />;
  }

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${profile.first_name || 'Professeur'}`}
        subtitle={school?.name ? `${school.name} — Espace enseignant` : 'Espace enseignant'}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Mes classes</span>
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-2">
              <School className="text-indigo-600 dark:text-indigo-400" size={18} />
            </div>
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '—' : classes.length}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total élèves</span>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2">
              <GraduationCap className="text-emerald-600 dark:text-emerald-400" size={18} />
            </div>
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '—' : totalStudents}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Cours aujourd'hui</span>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-2">
              <Clock className="text-amber-600 dark:text-amber-400" size={18} />
            </div>
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '—' : schedule.length}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's schedule */}
        <div>
          <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Cours du jour — {DAYS_FR[new Date().getDay()]}
          </h2>
          <Card className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : schedule.length === 0 ? (
              <EmptyState icon={Calendar} message="Aucun cours prévu aujourd'hui." />
            ) : (
              <ul className="space-y-3">
                {schedule.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex flex-col items-center min-w-[3.5rem]">
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{formatTime(s.start_time)}</span>
                      <span className="text-xs text-slate-400">{formatTime(s.end_time)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {s.subject || 'Matière non définie'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {s.class_name || 'Classe inconnue'}{s.room ? ` · Salle ${s.room}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Recent grades entered */}
        <div>
          <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Notes récemment saisies
          </h2>
          <Card className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : recentGrades.length === 0 ? (
              <EmptyState icon={ClipboardCheck} message="Aucune note saisie récemment." />
            ) : (
              <ul className="space-y-3">
                {recentGrades.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40">
                      <span className="font-heading text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {g.value.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {g.student_name || 'Élève inconnu'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {g.subject_name || '—'} · {formatRelativeDate(g.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* My classes */}
      <div className="mt-6">
        <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Mes classes
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <EmptyState icon={School} message="Aucune classe ne vous est assignée pour le moment." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/dashboard/classes`)}
                className="text-left"
              >
                <Card className="p-5 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading text-base font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{c.level || 'Niveau non défini'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5">
                      <Users className="text-slate-400" size={14} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.student_count}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Voir les détails <ArrowRight size={14} />
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
