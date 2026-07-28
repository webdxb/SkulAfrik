import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { navigate } from '../lib/router';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#003087] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo height={56} variant="dark" />
          <h1 className="mt-6 font-heading text-2xl font-bold text-white">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-[#B8D4F0]">Choisissez un nouveau mot de passe pour votre compte.</p>
        </div>

        {done ? (
          <div className="rounded-xl bg-white/10 border border-white/10 p-6 text-center">
            <CheckCircle2 className="mx-auto text-emerald-400" size={40} />
            <p className="mt-3 text-sm text-white">Mot de passe mis à jour. Redirection...</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#B8D4F0] mb-1.5">Nouveau mot de passe</label>
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
            <div>
              <label className="block text-sm font-medium text-[#B8D4F0] mb-1.5">Confirmer le mot de passe</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#009CDE] focus:ring-1 focus:ring-[#009CDE] outline-none"
              />
            </div>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#009CDE] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0079C1] disabled:opacity-60 transition-colors">
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
