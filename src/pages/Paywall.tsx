import { useAuth } from '../lib/auth';
import { Link } from '../lib/router';
import { supabase } from '../lib/supabase';
import { payForPlan } from '../lib/flutterwave';
import { useEffect, useState } from 'react';
import { Check, ArrowLeft, Loader2, Clock, Lock } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';

interface Plan {
  id: string;
  slug: string;
  name: string;
  price_monthly: number;
  features: string[];
}

export function PaywallPage() {
  const { school, profile, refresh } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('plans').select('id, slug, name, price_monthly, features').eq('is_active', true).order('sort_order');
      setPlans((data || []) as Plan[]);
    })();
  }, []);

  const trialEnded = school?.trial_ends_at ? new Date(school.trial_ends_at) <= new Date() : false;

  const choosePlan = async (plan: Plan) => {
    if (!school || !profile) return;
    setSelectedPlan(plan.slug);
    setLoading(true);
    setError(null);
    await payForPlan({
      school: { id: school.id, name: school.name, email: school.email },
      profile: { email: profile.email, first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone },
      plan: { id: plan.id, name: plan.name, price_monthly: plan.price_monthly },
      billingPeriod: 'monthly',
      amount: plan.price_monthly,
      currency: 'USD',
      onSuccess: async () => {
        setLoading(false);
        await refresh();
        window.location.href = '/dashboard';
      },
      onError: (message) => { setLoading(false); setError(message); },
      onClose: () => { setLoading(false); },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/"><Logo height={40} /></Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-2"><ArrowLeft size={14} /> Accueil</Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          {trialEnded ? (
            <>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 mb-4"><Lock size={26} className="text-rose-600 dark:text-rose-400" /></div>
              <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">Votre essai de 14 jours est terminé</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-xl mx-auto">Choisissez un plan pour continuer à accéder à vos données. Aucune donnée n'a été perdue — elles redeviennent accessibles dès le paiement effectué.</p>
            </>
          ) : (
            <>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4"><Clock size={26} className="text-amber-600 dark:text-amber-400" /></div>
              <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">Choisissez votre plan</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-xl mx-auto">Sélectionnez l'offre adaptée à votre établissement. Les parents et élèves n'ont jamais à payer.</p>
            </>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((p) => {
            const popular = p.slug === 'pro';
            return (
              <div key={p.id} className={`relative bg-white dark:bg-slate-900 rounded-xl border p-6 shadow-sm flex flex-col ${popular ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-200 dark:ring-indigo-800' : 'border-slate-200 dark:border-slate-800'}`}>
                {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">Populaire</span>}
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1"><span className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">${p.price_monthly.toFixed(0)}</span><span className="text-sm text-slate-500 dark:text-slate-400">/mois</span></div>
                <ul className="mt-4 space-y-2 flex-1">{(p.features || []).map((m) => (<li key={m} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"><Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" /><span>{m}</span></li>))}</ul>
                <button onClick={() => choosePlan(p)} disabled={loading && selectedPlan === p.slug} className={`mt-5 w-full text-center text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors inline-flex items-center justify-center gap-2 ${popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'} disabled:opacity-60`}>
                  {loading && selectedPlan === p.slug && <Loader2 size={14} className="animate-spin" />} Choisir {p.name}
                </button>
              </div>
            );
          })}
        </div>
        {error && <div className="mt-6 text-center text-sm text-rose-600 dark:text-rose-400">{error}</div>}
      </div>
    </div>
  );
}
