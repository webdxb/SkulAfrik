import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { useRoute, navigate } from '../lib/router';

export function LoginPage() {
  const path = useRoute();
  const isSignup = path === '/signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo height={56} variant="dark" />
          <h1 className="mt-6 font-heading text-2xl font-bold text-white">{isSignup ? 'Créer un compte' : 'Connexion'}</h1>
          <p className="mt-2 text-sm text-slate-400">{isSignup ? 'Commencez votre essai gratuit de 7 jours' : 'Connectez-vous à votre espace'}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mot de passe</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{loading ? '...' : isSignup ? 'Créer mon compte' : 'Se connecter'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          {isSignup ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
          <a href={isSignup ? '/login' : '/signup'} onClick={(e) => { e.preventDefault(); navigate(isSignup ? '/login' : '/signup'); }} className="font-medium text-emerald-400 hover:text-emerald-300">{isSignup ? 'Se connecter' : 'Créer un compte'}</a>
        </p>
      </div>
    </div>
  );
}
