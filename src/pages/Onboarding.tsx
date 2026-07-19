import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { navigate, Link } from '../lib/router';
import { Loader2, Check, ChevronLeft, ChevronRight, Building2, ArrowLeft, AlertCircle } from 'lucide-react';
import { ESTABLISHMENT_TYPES, generateSchoolStructure } from '../lib/academicCatalog';
import { validateRequired, validateEmail, validatePhone, FieldErrors, hasErrors } from '../lib/validation';
import { inputErrorCls, FieldError as FieldErrorView } from '../components/ui';

const STEPS = ['school', 'location', 'plan', 'review'];

export function OnboardingPage() {
  const { user, refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [estTypes, setEstTypes] = useState<string[]>(['college_general']);
  const [systeme, setSysteme] = useState<'fr' | 'en'>('fr');
  const [form, setForm] = useState({
    name: '', legal_name: '', country: 'CM', region: '', city: '', currency: 'XAF',
    director_name: '', director_email: user?.email || '', address: '', phone: '',
  });
  const [errors, setErrors] = useState<FieldErrors<typeof form>>({});
  const [stepError, setStepError] = useState<string | null>(null);

  const validateStep = (): boolean => {
    setStepError(null);
    const e: typeof errors = {};
    if (step === 0) {
      const n = validateRequired(form.name, 'Le nom commercial'); if (n) e.name = n;
      const ln = validateRequired(form.legal_name, 'La raison sociale'); if (ln) e.legal_name = ln;
      const dn = validateRequired(form.director_name, 'Le nom du directeur'); if (dn) e.director_name = dn;
      if (form.director_email) { const em = validateEmail(form.director_email); if (em) e.director_email = em; }
      if (estTypes.length === 0) setStepError('Sélectionnez au moins un type d\u00e9tablissement.');
      setErrors(e);
      return !hasErrors(e) && estTypes.length > 0;
    }
    if (step === 1) {
      const r = validateRequired(form.region, 'La r\u00e9gion'); if (r) e.region = r;
      const c = validateRequired(form.city, 'La ville'); if (c) e.city = c;
      if (form.phone) { const p = validatePhone(form.phone); if (p) e.phone = p; }
      setErrors(e);
      return !hasErrors(e);
    }
    return true;
  };

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.legal_name.trim() && form.director_name.trim() && estTypes.length > 0;
    if (step === 1) return form.country && form.region && form.city;
    return true;
  };

  const finish = async () => {
    setLoading(true);
    const { data: school, error } = await supabase.from('schools').insert({
      name: form.name, legal_name: form.legal_name, type: estTypes[0] || 'secondary',
      country: form.country, region: form.region, city: form.city, currency: form.currency,
      director_name: form.director_name, director_email: form.director_email,
      address: form.address, phone: form.phone, owner_user_id: user.id,
      language: systeme, verification_status: 'pending', subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    }).select().single();
    if (error) { setLoading(false); setStepError(error.message); return; }

    await supabase.from('audit_logs').insert({
      actor_id: user.id, actor_email: user.email, action: 'school.created',
      target_type: 'school', target_id: school.id, school_id: school.id,
      metadata: { country: form.country, types: estTypes, systeme },
    });

    try {
      const sysRow = await supabase.from('systemes').select('id').eq('code', systeme).maybeSingle();
      if (sysRow.data) {
        await supabase.from('school_academic_config').upsert({ school_id: school.id, types: estTypes, systeme_id: sysRow.data.id });
      }
      const { data: ay } = await supabase.from('academic_years').insert({
        school_id: school.id, name: new Date().getFullYear().toString(),
        start_date: `${new Date().getFullYear()}-09-01`, end_date: `${new Date().getFullYear() + 1}-06-30`, is_active: true,
      }).select('id').single();
      if (ay) await generateSchoolStructure(school.id, ay.id, estTypes, systeme);
    } catch (e) { console.warn('Auto-gen skipped:', e); }

    await refresh();
    setLoading(false);
    navigate('/dashboard');
  };

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none';

  const next = () => { if (validateStep()) setStep((s) => s + 1); };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-3">
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Configurer votre établissement</h1>
          <p className="mt-1 text-sm text-slate-500">Étape {step + 1} sur {STEPS.length}</p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Informations de l'établissement</h2>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nom commercial</label><input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }} className={inputErrorCls(!!errors.name)} placeholder="Lycée Leclerc" />{errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}</div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Raison sociale</label><input value={form.legal_name} onChange={(e) => { setForm({ ...form, legal_name: e.target.value }); if (errors.legal_name) setErrors({ ...errors, legal_name: undefined }); }} className={inputErrorCls(!!errors.legal_name)} />{errors.legal_name && <p className="mt-1 text-xs text-rose-600">{errors.legal_name}</p>}</div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du directeur</label><input value={form.director_name} onChange={(e) => { setForm({ ...form, director_name: e.target.value }); if (errors.director_name) setErrors({ ...errors, director_name: undefined }); }} className={inputErrorCls(!!errors.director_name)} />{errors.director_name && <p className="mt-1 text-xs text-rose-600">{errors.director_name}</p>}</div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Système linguistique</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['fr','Francophone'],['en','Anglophone']] as const).map(([code, label]) => (
                    <button key={code} type="button" onClick={() => setSysteme(code)} className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${systeme === code ? 'border-indigo-500 ring-1 ring-indigo-200 bg-indigo-50/30 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type(s) d'établissement <span className="text-xs text-slate-400">(multi-sélection)</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ESTABLISHMENT_TYPES.map((et) => {
                    const active = estTypes.includes(et.code);
                    return (
                      <button key={et.code} type="button" onClick={() => setEstTypes((p) => active ? p.filter((c) => c !== et.code) : [...p, et.code])} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition ${active ? 'border-indigo-500 ring-1 ring-indigo-200 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${active ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>{active && <Check size={12} className="text-white" />}</div>
                        <span>{systeme === 'fr' ? et.fr : et.en}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-slate-400">Les classes et matières seront générées automatiquement.</p>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Localisation</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Pays</label>
                  <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls}>
                    <option value="CM">Cameroun</option><option value="SN">Sénégal</option><option value="CI">Côte d'Ivoire</option>
                    <option value="ML">Mali</option><option value="BF">Burkina Faso</option><option value="GA">Gabon</option>
                    <option value="CG">Congo</option><option value="CD">RD Congo</option><option value="NG">Nigeria</option><option value="KE">Kenya</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Région</label><input value={form.region} onChange={(e) => { setForm({ ...form, region: e.target.value }); if (errors.region) setErrors({ ...errors, region: undefined }); }} className={inputErrorCls(!!errors.region)} />{errors.region && <p className="mt-1 text-xs text-rose-600">{errors.region}</p>}</div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Ville</label><input value={form.city} onChange={(e) => { setForm({ ...form, city: e.target.value }); if (errors.city) setErrors({ ...errors, city: undefined }); }} className={inputErrorCls(!!errors.city)} />{errors.city && <p className="mt-1 text-xs text-rose-600">{errors.city}</p>}</div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label><input value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: undefined }); }} className={inputErrorCls(!!errors.phone)} placeholder="+237XXXXXXXXX" />{errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}</div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Devise</h2>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Devise</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}>
                  <option value="XAF">FCFA (XAF)</option><option value="XOF">FCFA (XOF)</option><option value="NGN">Naira</option><option value="USD">USD</option>
                </select>
              </div>
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm text-indigo-700">
                Un essai gratuit de 14 jours est activé automatiquement. Aucune carte requise.
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Vérification</h2>
              <dl className="divide-y divide-slate-100 text-sm">
                {[
                  ['Nom', form.name], ['Raison sociale', form.legal_name], ['Directeur', form.director_name],
                  ['Système', systeme === 'fr' ? 'Francophone' : 'Anglophone'],
                  ['Types', estTypes.map((c) => ESTABLISHMENT_TYPES.find((e) => e.code === c)?.fr || c).join(', ')],
                  ['Pays', form.country], ['Ville', form.city], ['Devise', form.currency],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-900 text-right">{v}</dd></div>
                ))}
              </dl>
            </div>
          )}

          {stepError && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-sm text-rose-700 mb-4"><AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{stepError}</div>
          )}

          <div className="flex justify-between mt-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40">
                <ChevronLeft size={16} /> Retour
              </button>
              {step === 0 && <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={14} /> Accueil</Link>}
            </div>
            {step < STEPS.length - 1 ? (
              <button onClick={next} disabled={!canNext()} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">
                Suivant <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={finish} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
                {loading && <Loader2 size={16} className="animate-spin" />} Terminer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
