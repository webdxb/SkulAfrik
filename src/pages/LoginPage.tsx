import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { navigate, Link } from '../lib/router';
import { Loader2, AlertCircle, ArrowLeft, Mail, Check } from 'lucide-react';
import { validateEmail, validateMinLength, FieldErrors } from '../lib/validation';
import { inputErrorCls, FieldError as FieldErrorView } from '../components/ui';
import { Logo } from '../components/Logo';

type View = 'login' | 'signup' | 'forgot' | 'reset-sent';

export function LoginPage() {
  const { refresh } = useAuth();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<{ email: string; password: string }>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;
    if (view !== 'forgot') {
      const pwErr = validateMinLength(password, 6, 'Le mot de passe');
      if (pwErr) e.password = pwErr;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setLoading(true);

    if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials')) setSubmitError('Email ou mot de passe incorrect.');
        else if (msg.includes('email not confirmed')) setSubmitError('Compte non vérifié. Contactez l\'administrateur.');
        else if (msg.includes('rate limit')) setSubmitError('Trop de tentatives. Réessayez dans quelques minutes.');
        else setSubmitError(error.message);
        return;
      }
      await refresh();
      navigate('/dashboard');
    } else if (view === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered')) setSubmitError('Un compte existe déjà avec cet email. Connectez-vous.');
        else if (msg.includes('rate limit')) setSubmitError('Trop de tentatives. Réessayez dans quelques minutes.');
        else setSubmitError(error.message);
        return;
      }
      await refresh();
      navigate('/dashboard');
    } else if (view === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
      setLoading(false);
      if (error) { setSubmitError('Erreur lors de l\'envoi. Vérifiez l\'email saisi.'); return; }
      setView('reset-sent');
    }
  };

  const resetForm = () => { setEmail(''); setPassword(''); setErrors({}); setSubmitError(null); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8 group">
          <div className="inline-block group-hover:scale-105 transition-transform">
            <Logo height={48} variant="dark" />
          </div>
          <p className="mt-2 text-sm text-slate-400">School management for Africa</p>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {view === 'reset-sent' ? (
            <div className="text-center py-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-4"><Check size={28} className="text-emerald-600" /></div>
              <h2 className="font-heading text-lg font-bold text-slate-900">Email envoyé</h2>
              <p className="mt-2 text-sm text-slate-600">Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte de réception.</p>
              <button onClick={() => { setView('login'); resetForm(); }} className="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Retour à la connexion</button>
            </div>
          ) : (
            <>
              {view !== 'forgot' && (
                <div className="flex gap-2 mb-6">
                  {(['login','signup'] as const).map((m) => (
                    <button key={m} onClick={() => { setView(m); resetForm(); }} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${view === m ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {m === 'login' ? 'Connexion' : 'Inscription'}
                    </button>
                  ))}
                </div>
              )}
              {view === 'forgot' && (
                <div className="mb-6">
                  <h2 className="font-heading text-lg font-bold text-slate-900">Mot de passe oublié</h2>
                  <p className="mt-1 text-sm text-slate-500">Saisissez votre email pour recevoir un lien de réinitialisation.</p>
                </div>
              )}
              <form onSubmit={submit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }} className={inputErrorCls(!!errors.email)} placeholder="vous@exemple.com" />
                  <FieldErrorView error={errors.email} />
                </div>
                {view !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
                      {view === 'login' && <button type="button" onClick={() => { setView('forgot'); resetForm(); }} className="text-xs text-indigo-600 hover:text-indigo-700">Mot de passe oublié ?</button>}
                    </div>
                    <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }} className={inputErrorCls(!!errors.password)} placeholder="Au moins 6 caractères" />
                    <FieldErrorView error={errors.password} />
                  </div>
                )}
                {submitError && (
                  <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-sm text-rose-700">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /><span>{submitError}</span>
                  </div>
                )}
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {view === 'login' ? 'Se connecter' : view === 'signup' ? 'Créer un compte' : <><Mail size={16} /> Envoyer le lien</>}
                </button>
              </form>
              {view === 'forgot' && <button onClick={() => { setView('login'); resetForm(); }} className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-700">← Retour à la connexion</button>}
            </>
          )}
          {view !== 'reset-sent' && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={14} /> Retour à l'accueil</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
