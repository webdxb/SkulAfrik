import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { navigate } from '../../lib/router';
import { PageHeader, Card, EmptyState } from '../../components/ui';
import {
  GraduationCap,
  Users,
  School,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  ClipboardList,
  Calendar,
  FileText,
} from 'lucide-react';

interface Stats {
  students: number;
  teachers: number;
  classes: number;
  revenue: number;
  expenses: number;
}

interface ActivityItem {
  id: string;
  description: string;
  created_at: string;
  type: string;
}

const QUICK_LINKS = [
  { label: 'Élèves', path: '/dashboard/students', icon: GraduationCap },
  { label: 'Enseignants', path: '/dashboard/teachers', icon: Users },
  { label: 'Classes', path: '/dashboard/classes', icon: School },
  { label: 'Finances', path: '/dashboard/finances', icon: Wallet },
  { label: 'Bulletins', path: '/dashboard/bulletins', icon: FileText },
  { label: 'Calendrier', path: '/dashboard/calendar', icon: Calendar },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

export function AdminDashboard() {
  const { school, profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!school) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [studentsRes, teachersRes, classesRes, revenueRes, expensesRes, activityRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('school_id', school.id).eq('role', 'teacher'),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('accounting_entries').select('amount').eq('school_id', school.id).eq('type', 'income').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('accounting_entries').select('amount').eq('school_id', school.id).eq('type', 'expense').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('audit_logs').select('id, action, created_at').eq('school_id', school.id).order('created_at', { ascending: false }).limit(6),
      ]);
      if (cancelled) return;
      const revenue = (revenueRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0);
      const expenses = (expensesRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0);
      setStats({
        students: studentsRes.count || 0,
        teachers: teachersRes.count || 0,
        classes: classesRes.count || 0,
        revenue,
        expenses,
      });
      setActivities((activityRes.data || []).map((a: any) => ({ id: a.id, description: a.action, created_at: a.created_at, type: 'audit' })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [school?.id]);

  if (!school) {
    return (
      <EmptyState
        icon={School}
        message="Aucun établissement associé à votre compte. Contactez l'administrateur."
      />
    );
  }

  const balance = (stats?.revenue || 0) - (stats?.expenses || 0);

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${profile?.first_name || 'Administrateur'}`}
        subtitle={`${school.name} — Vue d'ensemble de l'établissement`}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={GraduationCap}
          label="Élèves"
          value={loading ? '—' : String(stats?.students ?? 0)}
          color="indigo"
        />
        <StatCard
          icon={Users}
          label="Enseignants"
          value={loading ? '—' : String(stats?.teachers ?? 0)}
          color="emerald"
        />
        <StatCard
          icon={School}
          label="Classes"
          value={loading ? '—' : String(stats?.classes ?? 0)}
          color="amber"
        />
        <StatCard
          icon={Wallet}
          label="Solde du mois"
          value={loading ? '—' : formatCurrency(balance)}
          color={balance >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Finance summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2">
              <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenus du mois</span>
          </div>
          <p className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '—' : formatCurrency(stats?.revenue || 0)}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2">
              <TrendingDown className="text-rose-600 dark:text-rose-400" size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Dépenses du mois</span>
          </div>
          <p className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '—' : formatCurrency(stats?.expenses || 0)}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-2">
              <Wallet className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Solde net</span>
          </div>
          <p className={`font-heading text-2xl font-bold ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {loading ? '—' : formatCurrency(balance)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Activité récente
          </h2>
          <Card className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <EmptyState icon={Activity} message="Aucune activité récente à afficher." />
            ) : (
              <ul className="space-y-3">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="mt-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 p-1.5">
                      <Activity className="text-indigo-600 dark:text-indigo-400" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{a.description}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{formatRelativeDate(a.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Quick links */}
        <div>
          <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Accès rapide
          </h2>
          <Card className="p-3">
            <ul className="space-y-1">
              {QUICK_LINKS.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <link.icon className="text-slate-400 dark:text-slate-500" size={18} />
                    <span className="flex-1 text-left">{link.label}</span>
                    <ArrowRight className="text-slate-300 dark:text-slate-600" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="mt-4 p-5">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="text-indigo-600 dark:text-indigo-400" size={18} />
              <h3 className="font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">Actions rapides</h3>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => navigate('/dashboard/students')} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">+ Élève</button>
              <button onClick={() => navigate('/dashboard/teachers')} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">+ Enseignant</button>
              <button onClick={() => navigate('/dashboard/finances')} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">+ Transaction</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400' },
};

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const c = COLOR_MAP[color] || COLOR_MAP.indigo;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`rounded-lg p-2 ${c.bg}`}>
          <Icon className={c.text} size={18} />
        </div>
      </div>
      <p className="mt-3 font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </Card>
  );
}
