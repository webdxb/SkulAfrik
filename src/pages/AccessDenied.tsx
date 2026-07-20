import { useAuth } from '../lib/auth';
import { Logo } from '../components/Logo';
import { Link } from '../lib/router';

export function AccessDenied() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <Link to="/"><Logo height={40} /></Link>
        <h1 className="mt-6 font-heading text-2xl font-bold text-slate-900">Accès refusé</h1>
        <p className="mt-2 text-sm text-slate-500">Vous n'avez pas la permission d'accéder à cette page.</p>
        <Link to="/dashboard" className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Retour au tableau de bord</Link>
      </div>
    </div>
  );
}
