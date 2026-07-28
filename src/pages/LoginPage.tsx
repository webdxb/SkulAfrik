import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { useRoute, navigate } from '../lib/router';
import { Eye, EyeOff, ArrowLeft, MailCheck } from 'lucide-react';

type Mode = 'auth' | 'forgot' | 'forgot_sent';

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
      // After signup, the user is auto-signed-in. Onboarding will be triggered by App.tsx
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
    <div className="min-h-screen flex items-center justify-center bg-[#003087] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo height={56} variant="dark" />
          {mode === 'auth' && (
            <>
              <h1 className="mt-6 font-heading text-2xl font-bold text-white">{isSignup ? 'Créer un compte' : 'Connexion'}</h1>
              <p className="mt-2 text-sm text-[#B8D4F0]">{isSignup ? 'Commencez votre essai gratuit de 7 jours' : 'Connectez-vous à votre espace'}</p>
            </>
          )}
          {mode === 'forgot' && (
            <>
              <h1 className="mt-6 font-heading text-2xl font-bold text-white">Mot de passe oublié</h1>
              <p className="mt-2 text-sm text-[#B8D4F0]">Indiquez votre email, nous vous enverrons un lien de réinitialisation.</p>
            </>
          )}
          {mode === 'forgot_sent' && (
            <>
              <MailCheck className="mx-auto mt-4 text-[#009CDE]" size={40} />
              <h1 className="mt-4 font-heading text-2xl font-bold text-white">Email envoyé</h1>
              <p className="mt-2 text-sm text-[#B8D4F0]">Vérifiez votre boîte de réception ({email}) et suivez le lien pour choisir un nouveau mot de passe.</p>
            </>
          )}
        </div>

        {mode === 'auth' && (
          <>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#B8D4F0] mb-1.5">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#009CDE] focus:ring-1 focus:ring-[#009CDE] outline-none" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-[#B8D4F0]">Mot de passe</label>
                  {!isSignup && (
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-xs font-medium text-[#009CDE] hover:text-white">
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
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/40 focus:border-[#009CDE] focus:ring-1 focus:ring-[#009CDE] outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#009CDE] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0079C1] disabled:opacity-60 transition-colors">
                {loading ? '...' : isSignup ? 'Créer mon compte' : 'Se connecter'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-[#B8D4F0]">
              {isSignup ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
              <a href={isSignup ? '/login' : '/signup'} onClick={(e) => { e.preventDefault(); navigate(isSignup ? '/login' : '/signup'); }} className="font-medium text-[#009CDE] hover:text-white">{isSignup ? 'Se connecter' : 'Créer un compte'}</a>
            </p>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <form onSubmit={submitForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#B8D4F0] mb-1.5">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#009CDE] focus:ring-1 focus:ring-[#009CDE] outline-none" />
              </div>
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#009CDE] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0079C1] disabled:opacity-60 transition-colors">
                {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
              </button>
            </form>
            <button onClick={() => { setMode('auth'); setError(''); }} className="mt-6 flex items-center gap-1.5 mx-auto text-sm font-medium text-[#B8D4F0] hover:text-white">
              <ArrowLeft size={14} /> Retour à la connexion
            </button>
          </>
        )}

        {mode === 'forgot_sent' && (
          <button onClick={() => { setMode('auth'); setError(''); }} className="mt-2 flex items-center gap-1.5 mx-auto text-sm font-medium text-[#B8D4F0] hover:text-white">
            <ArrowLeft size={14} /> Retour à la connexion
          </button>
        )}
      </div>
    </div>
  );
}
