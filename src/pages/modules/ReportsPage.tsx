import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { BarChart3, Users, BookOpen, Wallet, TrendingUp } from 'lucide-react';
import { PageHeader, StatCard, Card } from '../../components/ui';

export function ReportsPage() {
  const { school } = useAuth();
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, income: 0, attendance_rate: 0 });

  useEffect(() => {
    (async () => {
      if (!school) return;
      const [s, t, c, p, a] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', school.id).eq('role', 'teacher'),
        supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('payments').select('amount').eq('school_id', school.id),
        supabase.from('attendance').select('status').eq('school_id', school.id),
      ]);
      const income = (p.data || []).reduce((sum: number, row: any) => sum + Number(row.amount), 0);
      const att = (a.data || []) as any[];
      const present = att.filter((r) => r.status === 'present').length;
      const attRate = att.length > 0 ? Math.round((present / att.length) * 100) : 0;
      setStats({ students: s.count || 0, teachers: t.count || 0, classes: c.count || 0, income, attendance_rate: attRate });
    })();
  }, [school]);

  return (
    <div className="space-y-5">
      <PageHeader title="Rapports" subtitle="Vue d'ensemble de l'établissement" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Élèves" value={stats.students} color="border-l-indigo-500" />
        <StatCard label="Enseignants" value={stats.teachers} color="border-l-emerald-500" />
        <StatCard label="Classes" value={stats.classes} color="border-l-amber-500" />
        <StatCard label="Taux présence" value={`${stats.attendance_rate}%`} color="border-l-rose-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-sans font-bold text-lg text-slate-900 mb-4">Évolution des inscriptions</h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {[30, 45, 60, 55, 75, 85, 70, 90].map((h, i) => (<div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-200 to-indigo-500" style={{ height: `${h}%` }} />))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400 dark:text-slate-500"><span>Sep</span><span>Oct</span><span>Nov</span><span>Déc</span><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span></div>
        </Card>
        <Card className="p-6">
          <h3 className="font-sans font-bold text-lg text-slate-900 mb-4">Revenus par mois</h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {[50, 65, 80, 70, 90, 95].map((h, i) => (<div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-200 to-emerald-500" style={{ height: `${h}%` }} />))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400 dark:text-slate-500"><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span></div>
        </Card>
      </div>
      <Card className="p-6">
        <h3 className="font-sans font-bold text-lg text-slate-900 mb-4">Répartition par classe</h3>
        <div className="space-y-3">
          {['6ème A', '5ème B', '4ème C', '3ème A', '2nde S', '1ère D'].map((cls, i) => {
            const pct = [85, 72, 68, 90, 55, 45][i];
            return (<div key={cls} className="flex items-center gap-3"><span className="w-20 text-sm text-slate-600 dark:text-slate-400">{cls}</span><div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} /></div><span className="w-10 text-sm font-medium text-slate-700 text-right">{pct}%</span></div>);
          })}
        </div>
      </Card>
    </div>
  );
}
