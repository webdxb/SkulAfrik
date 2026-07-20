import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Users, GraduationCap, BookOpen, Calendar, Plus, AlertCircle, TrendingUp, CheckCircle, ChevronRight, Wallet, ClipboardList } from 'lucide-react';
import { Link } from '../../lib/router';

export function ParentDashboard() {
  const { profile, school } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      const { data: links } = await supabase.from('parent_eleve').select('eleve_id, students(id, first_name, last_name, class_id, classes(name))').eq('parent_id', profile.id).eq('statut_verifie', true);
      setChildren((links || []).map((l: any) => l.students).filter(Boolean));
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="p-8 text-center text-sm text-slate-400">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Bienvenue, {profile?.first_name || 'Parent'}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Suivez la scolarité de vos enfants.</p>
      </div>
      {children.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-12 text-center">
          <AlertCircle size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucun enfant n'est encore lié à votre compte.</p>
          <Link to="/parent/rejoindre" className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Lier un enfant</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <div key={child.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center"><GraduationCap size={24} className="text-indigo-600 dark:text-indigo-400" /></div>
                  <div><p className="font-heading font-semibold text-slate-900 dark:text-slate-100">{child.first_name} {child.last_name}</p><p className="text-xs text-slate-400">{child.classes?.name || 'Classe non assignée'}</p></div>
                </div>
                <div className="space-y-2">
                  <Link to="/dashboard/grades" className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800"><span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><BookOpen size={14} /> Notes</span><ChevronRight size={14} className="text-slate-400" /></Link>
                  <Link to="/dashboard/attendance" className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800"><span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><CheckCircle size={14} /> Présences</span><ChevronRight size={14} className="text-slate-400" /></Link>
                  <Link to="/dashboard/calendar" className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800"><span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><Calendar size={14} /> Emploi du temps</span><ChevronRight size={14} className="text-slate-400" /></Link>
                  <Link to="/dashboard/finances" className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800"><span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><Wallet size={14} /> Frais de scolarité</span><ChevronRight size={14} className="text-slate-400" /></Link>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/dashboard/messages" className="flex items-center gap-3 rounded-xl bg-indigo-600 p-4 text-white shadow-sm hover:shadow-md transition-shadow"><Users size={20} /><span className="text-sm font-semibold">Messagerie école</span><ChevronRight size={16} className="ml-auto" /></Link>
            <Link to="/dashboard/calendar" className="flex items-center gap-3 rounded-xl bg-emerald-600 p-4 text-white shadow-sm hover:shadow-md transition-shadow"><Calendar size={20} /><span className="text-sm font-semibold">Calendrier</span><ChevronRight size={16} className="ml-auto" /></Link>
            <Link to="/dashboard/support" className="flex items-center gap-3 rounded-xl bg-amber-600 p-4 text-white shadow-sm hover:shadow-md transition-shadow"><AlertCircle size={20} /><span className="text-sm font-semibold">Support</span><ChevronRight size={16} className="ml-auto" /></Link>
          </div>
        </>
      )}
    </div>
  );
}
