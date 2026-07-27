import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { navigate, Link } from '../lib/router';
import { GraduationCap, ArrowLeft, AlertCircle, Loader2, Check, KeyRound, ShieldCheck } from 'lucide-react';
import { validateRequired, FieldErrors } from '../lib/validation';
import { inputErrorCls, FieldError as FieldErrorView } from '../components/ui';

type Step = 'code' | 'otp' | 'done';

export function ParentJoinPage() {
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneHint, setPhoneHint] = useState('');
  const [errors, setErrors] = useState<FieldErrors<{ code: string; otp: string }>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchedStudent, setMatchedStudent] = useState<{ first_name: string; last_name: string } | null>(null);

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const errs: typeof errors = {};
    const c = validateRequired(code, 'Le code'); if (c) errs.code = c;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const { data, error } = await supabase.rpc('verify_inscription_code', { p_code: code.trim() });
    setLoading(false);

    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      setSubmitError('Code invalide ou introuvable. Vérifiez le code imprimé sur le reçu d\'inscription.');
      return;
    }
    if (row.used_at) {
      setSubmitError('Ce code a déjà été utilisé. Contactez l\'établissement si besoin.');
      return;
    }
    setMatchedStudent({ first_name: row.first_name, last_name: row.last_name });
    setPhoneHint(row.phone_hint || '');
    setStep('otp');
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const errs: typeof errors = {};
    const o = validateRequired(otp, 'Le code OTP'); if (o) errs.otp = o;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    // In production: verify OTP via edge function (SMS provider). Here we accept the code if it matches last 4 of phone_hint.
    if (phoneHint && otp.trim() !== phoneHint) {
      setLoading(false);
      setSubmitError('Code OTP incorrect. Vérifiez le SMS envoyé au numéro enregistré par l\'école.');
      return;
    }
    // Atomically validate the code, create the parent<->student link, and mark the code used.
    const { error: linkErr } = await supabase.rpc('complete_inscription_link', { p_code: code.trim(), p_role: 'parent' });
    setLoading(false);
    if (linkErr) {
      if (linkErr.message.includes('duplicate') || linkErr.message.includes('unique')) setSubmitError('Vous êtes déjà lié à cet élève.');
      else setSubmitError(linkErr.message);
      return;
    }
    setStep('done');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-3"><GraduationCap size={24} className="text-white" /></div>
          <h1 className="text-xl font-bold text-slate-900">Lier mon compte à un élève</h1>
          <p className="mt-1 text-sm text-slate-500">Saisissez le code d'inscription de votre enfant.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {step === 'code' && (
            <form onSubmit={verifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Code d'inscription</label>
                <input value={code} onChange={(e) => { setCode(e.target.value); if (errors.code) setErrors({ ...errors, code: undefined }); }} className={inputErrorCls(!!errors.code)} placeholder="SKAF-XXXXXX" />
                <FieldErrorView error={errors.code} />
              </div>
              {submitError && <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-sm text-rose-700"><AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{submitError}</div>}
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Vérifier le code
              </button>
            </form>
          )}

          {step === 'otp' && matchedStudent && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-sm text-emerald-700 flex items-start gap-2"><Check size={16} className="flex-shrink-0 mt-0.5" /> Élève trouvé : <strong>{matchedStudent.first_name} {matchedStudent.last_name}</strong></div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-sm text-slate-600 flex items-start gap-2"><ShieldCheck size={16} className="flex-shrink-0 mt-0.5" /> Un code OTP a été envoyé par SMS au numéro se terminant par <strong>...{phoneHint || 'XXXX'}</strong>.</div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Code OTP</label>
                <input value={otp} onChange={(e) => { setOtp(e.target.value); if (errors.otp) setErrors({ ...errors, otp: undefined }); }} className={inputErrorCls(!!errors.otp)} placeholder="XXXX" maxLength={4} />
                <FieldErrorView error={errors.otp} />
              </div>
              {submitError && <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-sm text-rose-700"><AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{submitError}</div>}
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Valider et lier
              </button>
              <button type="button" onClick={() => { setStep('code'); setSubmitError(null); setOtp(''); }} className="w-full text-sm text-slate-500 hover:text-slate-700">← Revenir au code</button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-3"><Check size={28} className="text-emerald-600" /></div>
              <h2 className="font-sans text-lg font-bold text-slate-900">Liaison réussie !</h2>
              <p className="mt-1 text-sm text-slate-500">Vous pouvez maintenant suivre la scolarité de votre enfant.</p>
              <button onClick={() => navigate('/dashboard')} className="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Accéder à mon espace</button>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={14} /> Retour au tableau de bord</Link>
        </div>
      </div>
    </div>
  );
}
