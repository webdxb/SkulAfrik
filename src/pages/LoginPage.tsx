import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { useRoute, navigate } from '../lib/router';
import { Eye, EyeOff, ArrowLeft, MailCheck, Check, Sparkles } from 'lucide-react';

type Mode = 'auth' | 'forgot' | 'forgot_sent';

const HIGHLIGHTS = [
  'Essai gratuit de 14 jours, sans carte bancaire',
  'Élèves, notes, présences, finances réunis',
  'Déployé dans plus de 75 pays',
];

export function LoginPage() {
  const path = useRoute();
  const isSignup = path === '/signup';
  const [mode, setMode] = useState<Mode>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
    }
    navigate('/dashboard');
  };

  const submitForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setMode('forgot_sent');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left — form */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="w-full max-w-sm mx-auto">
          <button onClick={() => navigate('/')} className="mb-10">
            <Logo height={40} />
          </button>

          {mode === 'auth' && (
            <>
              <h1 className="font-heading text-2xl font-bold text-slate-900">{isSignup ? 'Créer un compte' : 'Bon retour'}</h1>
              <p className="mt-2 text-sm text-slate-500">{isSignup ? 'Commencez votre essai gratuit de 14 jours' : 'Connectez-vous à votre espace Klasoo'}</p>
            </>
          )}
          {mode === 'forgot' && (
            <>
              <h1 className="font-heading text-2xl font-bold text-slate-900">Mot de passe oublié</h1>
              <p className="mt-2 text-sm text-slate-500">Indiquez votre email, nous vous enverrons un lien de réinitialisation.</p>
            </>
          )}
          {mode === 'forgot_sent' && (
            <>
              <div className="h-11 w-11 rounded-full bg-[#009CDE]/10 flex items-center justify-center">
                <MailCheck className="text-[#009CDE]" size={22} />
              </div>
              <h1 className="mt-4 font-heading text-2xl font-bold text-slate-900">Email envoyé</h1>
              <p className="mt-2 text-sm text-slate-500">Vérifiez votre boîte de réception ({email}) et suivez le lien pour choisir un nouveau mot de passe.</p>
            </>
          )}

          {mode === 'auth' && (
            <>
              <form onSubmit={submit} className="mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@ecole.com" className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#009CDE] focus:ring-1 focus:ring-[#009CDE] transition-colors" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
                    {!isSignup && (
                      <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-xs font-medium text-[#0079C1] hover:text-[#003087]">
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#009CDE] focus:ring-1 focus:ring-[#009CDE] transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#003087] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00457C] disabled:opacity-60 transition-colors shadow-sm shadow-[#003087]/20">
                  {loading ? '...' : isSignup ? 'Créer mon compte' : 'Se connecter'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-500">
                {isSignup ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
                <a href={isSignup ? '/login' : '/signup'} onClick={(e) => { e.preventDefault(); navigate(isSignup ? '/login' : '/signup'); }} className="font-semibold text-[#0079C1] hover:text-[#003087]">{isSignup ? 'Se connecter' : 'Créer un compte'}</a>
              </p>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <form onSubmit={submitForgotPassword} className="mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@ecole.com" className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#009CDE] focus:ring-1 focus:ring-[#009CDE] transition-colors" />
                </div>
                {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#003087] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00457C] disabled:opacity-60 transition-colors shadow-sm shadow-[#003087]/20">
                  {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>
              <button onClick={() => { setMode('auth'); setError(''); }} className="mt-6 flex items-center gap-1.5 mx-auto text-sm font-medium text-slate-500 hover:text-slate-800">
                <ArrowLeft size={14} /> Retour à la connexion
              </button>
            </>
          )}

          {mode === 'forgot_sent' && (
            <button onClick={() => { setMode('auth'); setError(''); }} className="mt-8 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
              <ArrowLeft size={14} /> Retour à la connexion
            </button>
          )}
        </div>
      </div>

      {/* Right — brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-[#003087] px-14 py-14">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#009CDE]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-[#0079C1]/20 blur-3xl" />

        <div className="relative inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-[#B8D4F0]">
          <Sparkles size={13} /> Plateforme internationale
        </div>

        <div className="relative">
          <p className="font-heading text-3xl font-bold text-white leading-tight">
            La gestion scolaire, réunie dans un seul endroit.
          </p>
          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-3 text-sm text-[#DCEBFB]">
                <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-[#009CDE]/25 flex items-center justify-center">
                  <Check size={12} className="text-[#009CDE]" />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5">
          <div className="flex items-center gap-3">
            {[16, 13.5, 15].map((v, i) => (
              <div key={i} className="flex-1 rounded-xl bg-white/5 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#B8D4F0]/70">{['Élèves', 'Présence', 'Moyenne'][i]}</p>
                <p className="mt-0.5 font-heading text-sm font-bold text-white">{i === 0 ? '1 248' : i === 1 ? '96%' : '14.2/20'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
