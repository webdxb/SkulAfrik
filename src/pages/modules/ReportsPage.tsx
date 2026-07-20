import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, Card } from '../../components/ui';
import { Users, BookOpen, School, BarChart3, CheckCircle2, GraduationCap } from 'lucide-react';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  avgGrade: number | null;
  attendanceRate: number | null;
}

export function ReportsPage() {
  const { school } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalStudents: 0, totalTeachers: 0, totalClasses: 0, avgGrade: null, attendanceRate: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (school) loadStats();
  }, [school]);

  async function loadStats() {
    if (!school) return;
    setLoading(true);
    const [stuRes, teaRes, clsRes, gradeRes, attRes] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', school.id),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher').eq('school_id', school.id),
      supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', school.id),
      supabase.from('grades').select('grade_value').eq('school_id', school.id),
      supabase.from('attendance').select('status').eq('school_id', school.id),
    ]);

    const totalStudents = stuRes.count || 0;
    const totalTeachers = teaRes.count || 0;
    const totalClasses = clsRes.count || 0;

    let avgGrade: number | null = null;
    if (gradeRes.data && gradeRes.data.length > 0) {
      const sum = gradeRes.data.reduce((acc: number, g: any) => acc + Number(g.grade_value), 0);
      avgGrade = sum / gradeRes.data.length;
    }

    let attendanceRate: number | null = null;
    if (attRes.data && attRes.data.length > 0) {
      const present = attRes.data.filter((a: any) => a.status === 'present' || a.status === 'late').length;
      attendanceRate = (present / attRes.data.length) * 100;
    }

    setStats({ totalStudents, totalTeachers, totalClasses, avgGrade, attendanceRate });
    setLoading(false);
  }

  const cards = [
    { label: 'Total élèves', value: stats.totalStudents, icon: Users, color: 'indigo', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Total enseignants', value: stats.totalTeachers, icon: GraduationCap, color: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Total classes', value: stats.totalClasses, icon: School, color: 'amber', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    { label: 'Moyenne générale', value: stats.avgGrade !== null ? `${stats.avgGrade.toFixed(2)} / 20` : '—', icon: BarChart3, color: 'rose', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
    { label: 'Taux de présence', value: stats.attendanceRate !== null ? `${stats.attendanceRate.toFixed(1)}%` : '—', icon: CheckCircle2, color: 'cyan', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
  ];

  return (
    <div>
      <PageHeader title="Rapports" subtitle="Statistiques de l'établissement" />

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement des statistiques...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c) => (
            <Card key={c.label} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase text-slate-500 dark:text-slate-400">{c.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{c.value}</p>
                </div>
                <div className={`rounded-xl ${c.bg} p-3`}>
                  <c.icon className={c.text} size={28} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
