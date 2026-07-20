import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { navigate } from '../../lib/router';
import { PageHeader, Card, EmptyState } from '../../components/ui';
import {
  Users,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  BarChart3,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface ChildRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  class_name: string | null;
  average_grade: number | null;
  attendance_rate: number | null;
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(1)} %`;
}

function formatGrade(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(2);
}

export function ParentDashboard() {
  const { profile } = useAuth();
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);

      // Get verified children via parent_eleve
      const { data: links } = await supabase
        .from('parent_eleve')
        .select('eleve_id, eleve:eleves(id, first_name, last_name, class_id)')
        .eq('parent_id', profile.id)
        .eq('statut_verifie', true);

      if (cancelled) return;
      const childRows = (links || []).map((r: any) => r.eleve).filter(Boolean) as {
        id: string;
        first_name: string | null;
        last_name: string | null;
        class_id: string | null;
      }[];

      // Enrich with class name, average grade, attendance rate
      const enriched: ChildRow[] = [];
      for (const child of childRows) {
        let className: string | null = null;
        let avgGrade: number | null = null;
        let attendanceRate: number | null = null;

        if (child.class_id) {
          const { data: cls } = await supabase
            .from('classes')
            .select('name')
            .eq('id', child.class_id)
            .maybeSingle();
          className = cls?.name || null;
        }

        // Average grade
        const { data: grades } = await supabase
          .from('grades')
          .select('value')
          .eq('eleve_id', child.id);
        if (grades && grades.length > 0) {
          avgGrade = grades.reduce((sum, g) => sum + (g.value || 0), 0) / grades.length;
        }

        // Attendance rate
        const { count: presentCount } = await supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('eleve_id', child.id)
          .eq('status', 'present');
        const { count: totalCount } = await supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('eleve_id', child.id);
        if (totalCount && totalCount > 0) {
          attendanceRate = ((presentCount || 0) / totalCount) * 100;
        }

        enriched.push({
          id: child.id,
          first_name: child.first_name,
          last_name: child.last_name,
          class_name: className,
          average_grade: avgGrade,
          attendance_rate: attendanceRate,
        });
      }

      if (cancelled) return;
      setChildren(enriched);
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
        title={`Bonjour, ${profile.first_name || 'Parent'}`}
        subtitle="Espace parent — Suivez la scolarité de vos enfants"
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          message="Aucun enfant n'est encore lié à votre compte. Utilisez le lien fourni par l'établissement pour rejoindre l'espace parent."
          action={
            <button
              onClick={() => navigate('/parent/rejoindre')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Lier un enfant
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {children.map((child) => (
            <Card key={child.id} className="p-6">
              {/* Child header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/60">
                  <GraduationCap className="text-indigo-600 dark:text-indigo-400" size={24} />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                    {child.first_name || ''} {child.last_name || ''}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {child.class_name || 'Classe non assignée'}
                  </p>
                </div>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <BarChart3 size={14} /> Moyenne
                  </div>
                  <p className="mt-1 font-heading text-xl font-bold text-slate-900 dark:text-slate-100">
                    {formatGrade(child.average_grade)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <ClipboardCheck size={14} /> Assiduité
                  </div>
                  <p className="mt-1 font-heading text-xl font-bold text-slate-900 dark:text-slate-100">
                    {formatPercent(child.attendance_rate)}
                  </p>
                </div>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => navigate('/dashboard/grades')}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={18} />
                  Notes
                </button>
                <button
                  onClick={() => navigate('/dashboard/attendance')}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ClipboardCheck className="text-emerald-600 dark:text-emerald-400" size={18} />
                  Présences
                </button>
                <button
                  onClick={() => navigate('/dashboard/calendar')}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Calendar className="text-amber-600 dark:text-amber-400" size={18} />
                  Calendrier
                </button>
              </div>

              <button
                onClick={() => navigate('/dashboard/bulletins')}
                className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Voir le bulletin <ArrowRight size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
