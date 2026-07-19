import { useAuth } from '../lib/auth';
import { Link } from '../lib/router';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
import { Check, ArrowLeft, Loader2, Clock, Lock } from 'lucide-react';
import { Logo } from '../components/Logo';

const PLANS = [
  { slug: 'starter', name: 'Starter', price: '19', max: '200 élèves', modules: ['Élèves', 'Enseignants', 'Présences', 'Notes', 'Calendrier', 'Portail parents'] },
  { slug: 'pro', name: 'Pro', price: '69', max: '1000 élèves', modules: ['Tout Starter +', 'Personnel', 'Finances', 'Transport', 'Bibliothèque', 'Messagerie', 'Rapports', 'Discipline'], popular: true },
  { slug: 'premium', name: 'Premium', price: '99', max: '5000 élèves', modules: ['Tout Pro +', 'Examens', 'Alumni', 'Comptabilité', 'Paie', 'Multi-campus'] },
  { slug: 'enterprise', name: 'Enterprise', price: '319', max: 'Illimité', modules: ['Tout Premium +', 'Rôles personnalisés', 'API', 'Marque blanche'] },
];

export function PaywallPage() {
  const { school, user, refresh } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trialEnded = school ? new Date(school.trial_ends_at) <= new Date() : false;

  const choosePlan = async (slug: string) => {
    setSelectedPlan(slug);
    setLoading(true);
    setError(null);
    const { data: plan } = await supabase.from('plans').select('id').eq('slug', slug).maybeSingle();
    if (!plan) { setLoading(false); setError('Plan introuvable.'); return; }
    const { error } = await supabase.from('schools').update({ plan_id: plan.id, subscription_status: 'active' }).eq('id', school!.id);
    setLoading(false);
    if (error) { setError(error.message); return; }
    await refresh();
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/"><Logo size={32} /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={14} /> Accueil</Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          {trialEnded ? (
            <>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 mb-4"><Lock size={26} className="text-rose-600" /></div>
              <h1 className="font-heading text-3xl font-bold text-slate-900">Votre essai est terminé</h1>
              <p className="mt-2 text-slate-600 max-w-xl mx-auto">Choisissez un plan pour continuer à accéder à vos données. Aucune donnée n'a été perdue — elles redeviennent accessibles dès le paiement effectué.</p>
            </>
          ) : (
            <>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 mb-4"><Clock size={26} className="text-amber-600" /></div>
              <h1 className="font-heading text-3xl font-bold text-slate-900">Choisissez votre plan</h1>
              <p className="mt-2 text-slate-600 max-w-xl mx-auto">Sélectionnez l'offre adaptée à votre établissement.</p>
            </>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((p) => (
            <div key={p.slug} className={`relative bg-white rounded-xl border p-6 shadow-sm flex flex-col ${p.popular ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
              {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">Populaire</span>}
              <h3 className="font-heading text-lg font-bold text-slate-900">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1"><span className="font-heading text-2xl font-bold text-slate-900">{p.price}</span><span className="text-sm text-slate-500">€/mois</span></div>
              <p className="mt-1 text-xs text-slate-500">{p.max}</p>
              <ul className="mt-4 space-y-2 flex-1">{p.modules.map((m) => (<li key={m} className="flex items-start gap-2 text-sm text-slate-600"><Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" /><span>{m}</span></li>))}</ul>
              <button onClick={() => choosePlan(p.slug)} disabled={loading && selectedPlan === p.slug} className={`mt-5 w-full text-center text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors inline-flex items-center justify-center gap-2 ${p.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'} disabled:opacity-60`}>
                {loading && selectedPlan === p.slug && <Loader2 size={14} className="animate-spin" />} Choisir {p.name}
              </button>
            </div>
          ))}
        </div>
        {error && <div className="mt-6 text-center text-sm text-rose-600">{error}</div>}
      </div>
    </div>
  );
}
