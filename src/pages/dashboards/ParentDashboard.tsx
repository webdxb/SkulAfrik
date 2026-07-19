import { useAuth } from '../../lib/auth';
import { Users, Wallet, BookOpen, Calendar, Plus, AlertCircle } from 'lucide-react';
import { Link } from '../../lib/router';

export function ParentDashboard() {
  const { profile } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">Bienvenue, {profile?.first_name || 'Parent'}</h1>
        <p className="mt-1 text-sm text-slate-500">Suivez la scolarité de vos enfants.</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
        <AlertCircle size={32} className="mx-auto text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">Aucun enfant n'est encore lié à votre compte.</p>
        <Link to="/parent/rejoindre" className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Lier un enfant</Link>
      </div>
    </div>
  );
}
