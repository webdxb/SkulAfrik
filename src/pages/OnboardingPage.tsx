import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { navigate } from '../lib/router';
import { Logo } from '../components/Logo';
import { Building2, User, GraduationCap, Check, ArrowRight, ArrowLeft } from 'lucide-react';

type Step = 'select' | 'form' | 'done';
type Role = 'admin' | 'parent' | 'student';

export function OnboardingPage() {
  const { user, profile, refresh } = useAuth();
  const [step, setStep] = useState<Step>('select');
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Admin form
  const [schoolName, setSchoolName] = useState('');
  const [country, setCountry] = useState('Côte d\'Ivoire');
  const [city, setCity] = useState('');
  const [schoolType, setSchoolType] = useState('primary');
  const [salesCode, setSalesCode] = useState('');
  const [planId, setPlanId] = useState('00000000-0000-0000-0000-000000000002');

  // Parent/Student form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [linkCode, setLinkCode] = useState('');

  const selectRole = (r: Role) => { setRole(r); setStep('form'); };

  const submitAdmin = async () => {
    setLoading(true); setError('');
    try {
      // Resolve the optional sales/commercial code first (safe RPC, works even before school membership)
      let salesCodeId: string | null = null;
      if (salesCode.trim()) {
        const { data: resolvedId } = await supabase.rpc('resolve_sales_code', { p_code: salesCode.trim() });
        salesCodeId = resolvedId || null;
      }

      // Create school — column is "type" (not "school_type"), "legal_name" is required,
      // and plan/trial fields live directly on the schools row (there is no separate "subscriptions" table).
      const { data: school, error: schErr } = await supabase.from('schools').insert({
        name: schoolName, legal_name: schoolName, country, city, type: schoolType,
        plan_id: planId, subscription_status: 'trial', sales_code_id: salesCodeId,
        trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      }).select().single();
      if (schErr) throw schErr;

      // Update profile
      await supabase.from('profiles').update({ role: 'admin', school_id: school.id, first_name: firstName, last_name: lastName, phone, onboarding_completed: true }).eq('id', user!.id);
      await refresh();
      navigate('/dashboard');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const submitParent = async () => {
    setLoading(true); setError('');
    try {
      // Validate + consume the school's inscription code and create the parent<->student link atomically.
      const { data: result, error: rpcErr } = await supabase.rpc('complete_inscription_link', { p_code: linkCode.trim(), p_role: 'parent' });
      if (rpcErr) throw rpcErr;

      await supabase.from('profiles').update({ role: 'parent', school_id: result.tenant_id, first_name: firstName, last_name: lastName, phone, onboarding_completed: true }).eq('id', user!.id);
      await refresh();
      navigate('/dashboard');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const submitStudent = async () => {
    setLoading(true); setError('');
    try {
      // Validate + consume the inscription code and link this login to the pre-registered student record.
      const { data: result, error: rpcErr } = await supabase.rpc('complete_inscription_link', { p_code: linkCode.trim(), p_role: 'student' });
      if (rpcErr) throw rpcErr;

      await supabase.from('profiles').update({ role: 'student', school_id: result.tenant_id, first_name: firstName, last_name: lastName, phone, onboarding_completed: true }).eq('id', user!.id);
      await refresh();
      navigate('/dashboard');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const submit = () => { if (role === 'admin') submitAdmin(); else if (role === 'parent') submitParent(); else submitStudent(); };

  const roles = [
    { id: 'admin' as Role, icon: Building2, label: 'Admin d\'établissement', desc: 'Je gère une école', color: 'border-indigo-500 bg-indigo-50 hover:bg-indigo-100' },
    { id: 'parent' as Role, icon: User, label: 'Parent', desc: 'Je suis parent d\'élève', color: 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100' },
    { id: 'student' as Role, icon: GraduationCap, label: 'Élève', desc: 'Je suis élève', color: 'border-amber-500 bg-amber-50 hover:bg-amber-100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Logo height={48} />
          <h1 className="mt-6 font-heading text-2xl font-bold text-slate-900">Bienvenue sur Skul Afrik</h1>
          <p className="mt-2 text-sm text-slate-500">Configurons votre compte en quelques étapes.</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-2 w-12 rounded-full ${step === 'select' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          <div className={`h-2 w-12 rounded-full ${step === 'form' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
        </div>

        {step === 'select' && (
          <div className="space-y-4">
            <h2 className="text-center font-heading text-lg font-semibold text-slate-900 mb-6">Qui êtes-vous ?</h2>
            {roles.map((r) => (
              <button key={r.id} onClick={() => selectRole(r.id)} className={`w-full flex items-center gap-4 rounded-xl border-2 p-5 text-left transition ${r.color}`}>
                <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0"><r.icon size={24} className="text-slate-700" /></div>
                <div className="flex-1"><p className="font-heading font-semibold text-slate-900">{r.label}</p><p className="text-sm text-slate-500">{r.desc}</p></div>
                <ArrowRight size={20} className="text-slate-400" />
              </button>
            ))}
          </div>
        )}

        {step === 'form' && role && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <button onClick={() => setStep('select')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"><ArrowLeft size={16} /> Retour</button>

            {role === 'admin' && (
              <div className="space-y-4">
                <h2 className="font-heading text-lg font-bold text-slate-900">Informations de l'établissement</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom</label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nom</label><input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de l'école</label><input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Pays</label><select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none">{['Côte d\'Ivoire','Sénégal','Mali','Burkina Faso','Cameroun','Bénin','Togo','Guinée','Congo','Gabon','Tchad','Niger','Madagascar','RDC','Maroc','Algérie','Tunisie','Ghana','Nigeria','Kenya','Afrique du Sud'].map((c) => <option key={c}>{c}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Ville</label><input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label><select value={schoolType} onChange={(e) => setSchoolType(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"><option value="primary">Primaire</option><option value="secondary">Secondaire</option><option value="university">Université</option><option value="other">Mixte</option></select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Code commercial (optionnel)</label><input value={salesCode} onChange={(e) => setSalesCode(e.target.value)} placeholder="ex: SKUL2026" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Plan d'abonnement</label><select value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"><option value="00000000-0000-0000-0000-000000000001">Essential — 15 000 FCFA/mois</option><option value="00000000-0000-0000-0000-000000000002">Pro — 35 000 FCFA/mois</option><option value="00000000-0000-0000-0000-000000000003">Enterprise — 80 000 FCFA/mois</option></select><p className="mt-1 text-xs text-slate-400">Essai gratuit de 7 jours. Aucune carte requise.</p></div>
              </div>
            )}

            {(role === 'parent' || role === 'student') && (
              <div className="space-y-4">
                <h2 className="font-heading text-lg font-bold text-slate-900">{role === 'parent' ? 'Informations personnelles' : 'Mon profil élève'}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom</label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nom</label><input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Code de liaison {role === 'parent' ? '(fourni par l\'école)' : '(fourni par l\'école)'}</label>
                  <input value={linkCode} onChange={(e) => setLinkCode(e.target.value)} placeholder="ex: SKUL2026" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 uppercase" />
                  <p className="mt-1.5 text-xs text-slate-400">Ce code vous rattache à votre établissement scolaire.</p>
                </div>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

            <button onClick={submit} disabled={loading} className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {loading ? '...' : 'Terminer'} {loading ? null : <Check size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
