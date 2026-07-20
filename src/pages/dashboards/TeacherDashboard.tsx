import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Users, GraduationCap, Calendar, BookOpen, ClipboardCheck, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { Link } from '../../lib/router';

export function TeacherDashboard() {
  const { profile, school } = useAuth();
  const [stats, setStats] = useState({ classes: 0, students: 0, coursesToday: 0, toGrade: 0 });
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!school || !profile) return;
      const [cls, st, cs, gr] = await Promise.all([
        supabase.from('class_subjects').select('class_id, classes(name)').eq('teacher_id', profile.id),
        supabase.from('students').select('id', { count: 'exact', head: true }).in('class_id', (await supabase.from('class_subjects').select('class_id').eq('teacher_id', profile.id)).data?.map((r: any) => r.class_id) || []),
        supabase.from('calendar_events').select('*').eq('school_id', school.id).gte('start_time', new Date().toISOString().split('T')[0]).lt('start_time', new Date(Date.now() + 86400000).toISOString().split('T')[0]).limit(5),
        supabase.from('grades').select('*, students(first_name, last_name), subjects(name)').eq('school_id', school.id).order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({ classes: cls.data?.length || 0, students: st.count || 0, coursesToday: cs.data?.length || 0, toGrade: 0 });
      setTodaySchedule(cs.data || []);
      setRecentGrades(gr.data || []);
      setLoading(false);
    })();
  }, [school, profile]);

  const cards = [
    { label: 'Mes classes', value: stats.classes, icon: Users, color: 'border-l-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Élèves', value: stats.students, icon: GraduationCap, color: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Cours aujourd\'hui', value: stats.coursesToday, icon: Calendar, color: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'À évaluer', value: stats.toGrade, icon: BookOpen, color: 'border-l-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', iconColor: 'text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Bienvenue, {profile?.first_name || 'Prof'}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Voici votre journée du {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
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
            <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">Cours du jour</h3>
            <Link to="/dashboard/calendar" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">Agenda <ChevronRight size={14} /></Link>
          </div>
          {loading ? <p className="text-sm text-slate-400">Chargement...</p> : todaySchedule.length === 0 ? (
            <div className="flex flex-col items-center py-8"><Calendar size={32} className="text-slate-300 dark:text-slate-700" /><p className="mt-3 text-sm text-slate-400">Aucun cours prévu aujourd'hui.</p></div>
          ) : (
            <div className="space-y-3">{todaySchedule.map((e, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0"><Clock size={18} className="text-indigo-600 dark:text-indigo-400" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{e.title}</p><p className="text-xs text-slate-400">{e.start_time ? new Date(e.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}</p></div>
              </div>
            ))}</div>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">Dernières notes saisies</h3>
            <Link to="/dashboard/grades" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">Saisir <ChevronRight size={14} /></Link>
          </div>
          {loading ? <p className="text-sm text-slate-400">Chargement...</p> : recentGrades.length === 0 ? (
            <div className="flex flex-col items-center py-8"><ClipboardCheck size={32} className="text-slate-300 dark:text-slate-700" /><p className="mt-3 text-sm text-slate-400">Aucune note saisie récemment.</p><Link to="/dashboard/grades" className="mt-3 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Saisir des notes</Link></div>
          ) : (
            <div className="space-y-2">{recentGrades.map((g, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">{g.students?.first_name} {g.students?.last_name}</p><p className="text-xs text-slate-400">{g.subjects?.name || '—'}</p></div>
                <span className="font-heading text-lg font-bold text-indigo-600 dark:text-indigo-400">{g.score}/20</span>
              </div>
            ))}</div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickLink to="/dashboard/attendance" icon={ClipboardCheck} label="Faire l'appel" color="bg-emerald-600" />
        <QuickLink to="/dashboard/grades" icon={BookOpen} label="Saisir des notes" color="bg-indigo-600" />
        <QuickLink to="/dashboard/messages" icon={TrendingUp} label="Contacter un parent" color="bg-amber-600" />
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, color }: { to: string; icon: any; label: string; color: string }) {
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-xl ${color} p-4 text-white shadow-sm hover:shadow-md transition-shadow`}>
      <Icon size={20} /><span className="text-sm font-semibold">{label}</span><ChevronRight size={16} className="ml-auto" />
    </Link>
  );
}
