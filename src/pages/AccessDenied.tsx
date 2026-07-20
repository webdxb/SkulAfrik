import { Link } from '../lib/router';
import { Logo } from '../components/Logo';
import { ShieldX, ArrowLeft } from 'lucide-react';

export function AccessDenied() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/"><Logo height={32} /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={14} /> Accueil</Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 mb-5"><ShieldX size={32} className="text-rose-600" /></div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Accès refusé</h1>
          <p className="mt-2 text-sm text-slate-600">Vous n'avez pas les droits nécessaires pour accéder à cette section. Cette zone est réservée au Super Admin de la plateforme.</p>
          <Link to="/dashboard" className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><ArrowLeft size={16} /> Retour à mon dashboard</Link>
        </div>
      </div>
    </div>
  );
}
