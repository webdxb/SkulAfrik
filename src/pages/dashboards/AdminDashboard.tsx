import { useAuth } from '../../lib/auth';
import { Users, BookOpen, Calendar, Wallet, GraduationCap } from 'lucide-react';

export function AdminDashboard() {
  const { profile, school } = useAuth();
  const cards = [
    { label: 'Élèves', value: 0, icon: Users, color: 'border-l-indigo-500', bg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { label: 'Enseignants', value: 0, icon: BookOpen, color: 'border-l-emerald-500', bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Classes', value: 0, icon: GraduationCap, color: 'border-l-amber-500', bg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { label: 'Recettes du mois', value: '0 FCFA', icon: Wallet, color: 'border-l-rose-500', bg: 'bg-rose-50', iconColor: 'text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">Bienvenue, {profile?.first_name || 'Admin'}</h1>
        <p className="mt-1 text-sm text-slate-500">{school?.name || 'Votre établissement'}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`bg-white rounded-xl border-l-4 ${c.color} border-y border-r border-slate-100 p-5 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500">{c.label}</p><p className="mt-1 font-heading text-2xl font-bold text-slate-900">{c.value}</p></div>
              <div className={`h-11 w-11 rounded-lg ${c.bg} flex items-center justify-center`}><c.icon className={c.iconColor} size={22} /></div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-4">Activité récente</h3>
        <p className="text-sm text-slate-400">Aucune activité récente à afficher.</p>
      </div>
    </div>
  );
}
