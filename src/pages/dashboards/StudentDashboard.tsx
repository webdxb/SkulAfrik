import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { GraduationCap, BookOpen, Calendar, CheckCircle, TrendingUp, ClipboardList, ChevronRight } from 'lucide-react';
import { Link } from '../../lib/router';

export function StudentDashboard() {
  const { profile, school } = useAuth();
  const [stats, setStats] = useState({ average: '—', rank: '—', attendance: '—', homework: 0 });
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      const [gr, att, hw, cs] = await Promise.all([
        supabase.from('grades').select('score, subjects(name), created_at').eq('student_id', profile.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('attendance').select('status').eq('student_id', profile.id),
        supabase.from('grades').select('id', { count: 'exact', head: true }).eq('student_id', profile.id),
        school ? supabase.from('calendar_events').select('*').eq('school_id', school.id).gte('start_time', new Date().toISOString().split('T')[0]).limit(5) : Promise.resolve({ data: [] }),
      ]);
      const grades = gr.data || [];
      if (grades.length > 0) {
        const avg = grades.reduce((s: number, g: any) => s + Number(g.score), 0) / grades.length;
        setStats((prev) => ({ ...prev, average: avg.toFixed(1) }));
      }
      const attData = att.data || [];
      if (attData.length > 0) {
        const present = attData.filter((a: any) => a.status === 'present').length;
        setStats((prev) => ({ ...prev, attendance: `${Math.round((present / attData.length) * 100)}%` }));
      }
      setStats((prev) => ({ ...prev, homework: hw.count || 0 }));
      setRecentGrades(grades);
      setSchedule(cs.data || []);
      setLoading(false);
    })();
  }, [profile, school]);

  const cards = [
    { label: 'Ma moyenne', value: stats.average, icon: GraduationCap, color: 'border-l-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Rang', value: stats.rank, icon: TrendingUp, color: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Présence', value: stats.attendance, icon: CheckCircle, color: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'Évaluations', value: stats.homework, icon: BookOpen, color: 'border-l-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', iconColor: 'text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Salut, {profile?.first_name || 'Élève'} !</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Voici ta journée scolaire du {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${c.color} border-y border-r border-slate-100 dark:border-slate-800 p-5 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500 dark:text-slate-400">{c.label}</p><p className="mt-1 font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">{c.value}</p></div>
              <div className={`h-11 w-11 rounded-lg ${c.bg} flex items-center justify-center`}><c.icon className={c.iconColor} size={22} /></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">Mes dernières notes</h3>
            <Link to="/dashboard/grades" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">Voir tout <ChevronRight size={14} /></Link>
          </div>
          {loading ? <p className="text-sm text-slate-400">Chargement...</p> : recentGrades.length === 0 ? (
            <div className="flex flex-col items-center py-8"><BookOpen size={32} className="text-slate-300 dark:text-slate-700" /><p className="mt-3 text-sm text-slate-400">Aucune note disponible.</p></div>
          ) : (
            <div className="space-y-2">{recentGrades.map((g, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">{g.subjects?.name || '—'}</p><p className="text-xs text-slate-400">{new Date(g.created_at).toLocaleDateString('fr-FR')}</p></div>
                <span className="font-heading text-lg font-bold text-indigo-600 dark:text-indigo-400">{g.score}/20</span>
              </div>
            ))}</div>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">Prochains cours</h3>
            <Link to="/dashboard/calendar" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">Agenda <ChevronRight size={14} /></Link>
          </div>
          {loading ? <p className="text-sm text-slate-400">Chargement...</p> : schedule.length === 0 ? (
            <div className="flex flex-col items-center py-8"><Calendar size={32} className="text-slate-300 dark:text-slate-700" /><p className="mt-3 text-sm text-slate-400">Aucun cours à venir.</p></div>
          ) : (
            <div className="space-y-3">{schedule.map((e, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0"><Calendar size={18} className="text-indigo-600 dark:text-indigo-400" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{e.title}</p><p className="text-xs text-slate-400">{e.start_time ? new Date(e.start_time).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</p></div>
              </div>
            ))}</div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/dashboard/grades" className="flex items-center gap-3 rounded-xl bg-indigo-600 p-4 text-white shadow-sm hover:shadow-md transition-shadow"><BookOpen size={20} /><span className="text-sm font-semibold">Mes notes</span><ChevronRight size={16} className="ml-auto" /></Link>
        <Link to="/dashboard/attendance" className="flex items-center gap-3 rounded-xl bg-emerald-600 p-4 text-white shadow-sm hover:shadow-md transition-shadow"><CheckCircle size={20} /><span className="text-sm font-semibold">Mes présences</span><ChevronRight size={16} className="ml-auto" /></Link>
        <Link to="/dashboard/calendar" className="flex items-center gap-3 rounded-xl bg-amber-600 p-4 text-white shadow-sm hover:shadow-md transition-shadow"><ClipboardList size={20} /><span className="text-sm font-semibold">Mon emploi du temps</span><ChevronRight size={16} className="ml-auto" /></Link>
      </div>
    </div>
  );
}
