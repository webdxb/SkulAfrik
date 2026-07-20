import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Users, BookOpen, Wallet, GraduationCap, AlertCircle, Clock, X, ChevronRight } from 'lucide-react';
import { Link } from '../../lib/router';

export function AdminDashboard() {
  const { profile, school } = useAuth();
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, revenue: 0 });
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const [showTrialModal, setShowTrialModal] = useState(false);

  useEffect(() => {
    (async () => {
      if (!school) return;
      const [st, t, c, p] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', school.id).eq('role', 'teacher'),
        supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('payments').select('amount').eq('school_id', school.id),
      ]);
      const revenue = (p.data || []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);
      setStats({ students: st.count || 0, teachers: t.count || 0, classes: c.count || 0, revenue });

      const { data: daysLeft } = await supabase.rpc('school_trial_days_left', { p_school_id: school.id });
      setTrialDaysLeft(daysLeft ?? null);

      // Show modal at J-2 or J-1
      if (daysLeft !== null && daysLeft <= 2 && daysLeft > 0) {
        const dismissedKey = `trial_modal_dismissed_${school.id}_${daysLeft}`;
        if (!localStorage.getItem(dismissedKey)) setShowTrialModal(true);
      }
    })();
  }, [school]);

  const cards = [
    { label: 'Élèves', labelEn: 'Students', value: stats.students, icon: Users, color: 'border-l-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Enseignants', labelEn: 'Teachers', value: stats.teachers, icon: BookOpen, color: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Classes', labelEn: 'Classes', value: stats.classes, icon: GraduationCap, color: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'Recettes', labelEn: 'Revenue', value: `${stats.revenue.toLocaleString()} FCFA`, icon: Wallet, color: 'border-l-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', iconColor: 'text-rose-600 dark:text-rose-400' },
  ];

  const isTrial = school?.subscription_status === 'trial';
  const trialUrgent = trialDaysLeft !== null && trialDaysLeft <= 2 && trialDaysLeft > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Bienvenue, {profile?.first_name || 'Admin'}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{school?.name || 'Votre établissement'}</p>
      </div>

      {/* Trial countdown banner */}
      {isTrial && trialDaysLeft !== null && showTrialBanner && (
        <div className={`rounded-xl border p-4 flex items-center justify-between ${trialUrgent ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-900/20' : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20'}`}>
          <div className="flex items-center gap-3">
            <Clock size={20} className={trialUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'} />
            <div>
            <p className={`text-sm font-semibold ${trialUrgent ? 'text-rose-800 dark:text-rose-200' : 'text-amber-800 dark:text-amber-200'}`}>
                {trialDaysLeft === 0 ? 'Votre essai gratuit est expiré' : trialDaysLeft === 1 ? 'Dernier jour d\'essai gratuit !' : `Essai gratuit : ${trialDaysLeft} jours restants`}
              </p>
              <p className={`text-xs ${trialUrgent ? 'text-rose-600 dark:text-rose-300' : 'text-amber-600 dark:text-amber-300'}`}>
                {trialDaysLeft === 0 ? 'Choisissez un plan pour continuer à accéder à vos modules.' : 'Choisissez un plan avant la fin de l\'essai pour éviter toute interruption.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/pricing" className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-white ${trialUrgent ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}>Choisir un plan <ChevronRight size={14} /></Link>
            <button onClick={() => setShowTrialBanner(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Trial expiring modal (J-2, J-1) */}
      {showTrialModal && trialDaysLeft !== null && trialDaysLeft > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setShowTrialModal(false); localStorage.setItem(`trial_modal_dismissed_${school!.id}_${trialDaysLeft}`, '1'); }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0"><AlertCircle size={24} className="text-amber-600 dark:text-amber-400" /></div>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Votre essai expire bientôt</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Il vous reste <strong>{trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''}</strong> d'essai gratuit. Pour éviter toute interruption de service, choisissez votre plan dès maintenant.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/pricing" className="flex-1 text-center rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700" onClick={() => setShowTrialModal(false)}>Choisir un plan</Link>
              <button onClick={() => { setShowTrialModal(false); localStorage.setItem(`trial_modal_dismissed_${school!.id}_${trialDaysLeft}`, '1'); }} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Plus tard</button>
            </div>
          </div>
        </div>
      )}

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
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Activité récente</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500">Aucune activité récente à afficher.</p>
      </div>
    </div>
  );
}
