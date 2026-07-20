import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, EmptyState, inputCls, Card } from '../../components/ui';
import { Search, Users, Phone } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
}

export function TeachersPage() {
  const { school } = useAuth();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (school) loadData();
  }, [school]);

  async function loadData() {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone, role')
      .eq('role', 'teacher')
      .eq('school_id', school.id)
      .order('last_name');
    const list = (data || []) as Profile[];
    setTeachers(list);

    const counts: Record<string, number> = {};
    if (list.length > 0) {
      const { data: links } = await supabase
        .from('class_subjects')
        .select('teacher_id')
        .in('teacher_id', list.map((t) => t.id));
      (links || []).forEach((l: any) => {
        counts[l.teacher_id] = (counts[l.teacher_id] || 0) + 1;
      });
    }
    setClassCounts(counts);
    setLoading(false);
  }

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return `${t.first_name} ${t.last_name}`.toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader title="Enseignants" subtitle="Liste des enseignants de l'établissement" />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher un enseignant..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} message="Aucun enseignant trouvé" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Nom</th>
                <th className="px-4 py-3 font-semibold">Prénom</th>
                <th className="px-4 py-3 font-semibold">Téléphone</th>
                <th className="px-4 py-3 font-semibold">Classes assignées</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{t.last_name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{t.first_name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {t.phone ? (
                      <span className="inline-flex items-center gap-1"><Phone size={14} /> {t.phone}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {classCounts[t.id] || 0} classe(s)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
