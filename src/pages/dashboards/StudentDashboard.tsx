import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { navigate } from '../../lib/router';
import { PageHeader, Card, EmptyState } from '../../components/ui';
import {
  GraduationCap,
  BarChart3,
  ClipboardCheck,
  Calendar,
  TrendingUp,
  Award,
} from 'lucide-react';

interface GradeRow {
  id: string;
  value: number;
  created_at: string;
  subject_name: string | null;
  coefficient: number | null;
}

interface EventRow {
  id: string;
  title: string;
  start_date: string;
  type: string | null;
}

function formatGrade(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(2);
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(1)} %`;
}

function formatEventDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function StudentDashboard() {
  const { profile, school } = useAuth();
  const [averageGrade, setAverageGrade] = useState<number | null>(null);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [recentGrades, setRecentGrades] = useState<GradeRow[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventRow[]>([]);
  const [className, setClassName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);

      // Find the student record linked to this profile
      const { data: eleve } = await supabase
        .from('students')
        .select('id, class_id')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (cancelled) return;

      if (!eleve) {
        setLoading(false);
        return;
      }

      // Class name
      if (eleve.class_id) {
        const { data: cls } = await supabase
          .from('classes')
          .select('name')
          .eq('id', eleve.class_id)
          .maybeSingle();
        if (!cancelled) setClassName(cls?.name || null);
      }

      // Grades
      const { data: grades } = await supabase
        .from('grades')
        .select('id, grade_value, max_value, created_at, subject:subjects(name)')
        .eq('student_id', eleve.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (cancelled) return;
      const gradeRows = (grades || []).map((r: any) => ({
        id: r.id,
        value: r.grade_value,
        created_at: r.created_at,
        subject_name: r.subject?.name || null,
        coefficient: r.max_value || 20,
      }));
      setRecentGrades(gradeRows);

      // Average, normalized to /20 (grades can have different max_value scales)
      const allGrades = (grades || []) as any[];
      if (allGrades.length > 0) {
        const normalized = allGrades.map((g) => ((g.grade_value || 0) / (g.max_value || 20)) * 20);
        setAverageGrade(normalized.reduce((a, b) => a + b, 0) / normalized.length);
      }

      // Attendance rate
      const { count: presentCount } = await supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', eleve.id)
        .eq('status', 'present');
      const { count: totalCount } = await supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', eleve.id);

      if (cancelled) return;
      if (totalCount && totalCount > 0) {
        setAttendanceRate(((presentCount || 0) / totalCount) * 100);
      }

      // Upcoming events
      const nowIso = new Date().toISOString();
      const { data: events } = await supabase
        .from('calendar_events')
        .select('id, title, start_at, event_type')
        .eq('school_id', school?.id)
        .gte('start_at', nowIso)
        .order('start_at', { ascending: true })
        .limit(5);

      if (cancelled) return;
      setUpcomingEvents((events || []).map((e: any) => ({ id: e.id, title: e.title, start_date: e.start_at, type: e.event_type })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [profile?.id, school?.id]);

  if (!profile) {
    return <EmptyState icon={GraduationCap} message="Profil introuvable. Veuillez vous reconnecter." />;
  }

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${profile.first_name || 'Élève'}`}
        subtitle={school?.name ? `${school.name}${className ? ` · ${className}` : ''}` : 'Espace élève'}
      />

      {/* Key stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Moyenne générale</span>
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-2">
              <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={18} />
            </div>
          </div>
          <p className="font-heading text-4xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '—' : formatGrade(averageGrade)}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Sur 20</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Taux de présence</span>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2">
              <ClipboardCheck className="text-emerald-600 dark:text-emerald-400" size={18} />
            </div>
          </div>
          <p className="font-heading text-4xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '—' : formatPercent(attendanceRate)}
          </p>
          <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${attendanceRate || 0}%` }}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent grades */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">
              Notes récentes
            </h2>
            <button
              onClick={() => navigate('/dashboard/grades')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Tout voir
            </button>
          </div>
          <Card className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : recentGrades.length === 0 ? (
              <EmptyState icon={BarChart3} message="Aucune note disponible pour le moment." />
            ) : (
              <ul className="space-y-3">
                {recentGrades.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex h-10 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40">
                      <span className="font-heading text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {g.value.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {g.subject_name || 'Matière'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Sur {g.coefficient || 20}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Upcoming events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">
              Événements à venir
            </h2>
            <button
              onClick={() => navigate('/dashboard/calendar')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Calendrier
            </button>
          </div>
          <Card className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <EmptyState icon={Calendar} message="Aucun événement à venir." />
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                      <Award className="text-amber-600 dark:text-amber-400" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {e.title}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatEventDate(e.start_date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
