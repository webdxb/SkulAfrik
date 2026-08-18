import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { navigate } from '../lib/router';
import { Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left — form */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="w-full max-w-sm mx-auto">
          <button onClick={() => navigate('/')} className="mb-10">
            <Logo height={40} />
          </button>

          {done ? (
            <div>
              <div className="h-11 w-11 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={22} />
              </div>
              <h1 className="mt-4 font-heading text-2xl font-bold text-slate-900">C'est fait</h1>
              <p className="mt-2 text-sm text-slate-500">Mot de passe mis à jour. Redirection vers votre espace...</p>
            </div>
          ) : (
            <>
              <h1 className="font-heading text-2xl font-bold text-slate-900">Nouveau mot de passe</h1>
              <p className="mt-2 text-sm text-slate-500">Choisissez un nouveau mot de passe pour votre compte.</p>

              <form onSubmit={submit} className="mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nouveau mot de passe</label>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmer le mot de passe</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#009CDE] focus:ring-1 focus:ring-[#009CDE] transition-colors"
                  />
                </div>
                {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#003087] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00457C] disabled:opacity-60 transition-colors shadow-sm shadow-[#003087]/20">
                  {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Right — brand panel */}
      <div className="hidden lg:flex relative flex-col justify-center overflow-hidden bg-[#003087] px-14 py-14">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#009CDE]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-[#0079C1]/20 blur-3xl" />
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <ShieldCheck className="text-[#009CDE]" size={26} />
          </div>
          <p className="mt-6 font-heading text-3xl font-bold text-white leading-tight">
            Votre compte, en sécurité.
          </p>
          <p className="mt-3 text-sm text-[#DCEBFB] max-w-xs">
            Choisissez un mot de passe solide pour protéger les données de votre établissement.
          </p>
        </div>
      </div>
    </div>
  );
}
