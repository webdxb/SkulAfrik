import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { PageHeader, EmptyState, inputCls, Card } from '../../components/ui';
import { FileText, Send, Search, Award } from 'lucide-react';

interface Bulletin {
  id: string;
  student_id: string;
  term_key: string | null;
  status: string;
  generated_at: string;
  file_url: string | null;
}

interface Student { id: string; first_name: string; last_name: string; }

export function BulletinsPage() {
  const { school, profile } = useAuth();
  const { showError } = useToast();
  const canManage = profile?.role === 'admin' || profile?.role === 'teacher';
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (school) loadData();
  }, [school]);

  async function loadData() {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase
      .from('bulletins')
      .select('id, student_id, term_key, status, generated_at, file_url')
      .eq('school_id', school.id)
      .order('generated_at', { ascending: false });
    const list = (data || []) as Bulletin[];
    setBulletins(list);

    if (list.length > 0) {
      const ids = [...new Set(list.map((b) => b.student_id))];
      const { data: stuData } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .in('id', ids);
      const map: Record<string, Student> = {};
      (stuData || []).forEach((s: any) => { map[s.id] = s; });
      setStudents(map);
    }
    setLoading(false);
  }

  async function handleGenerate() {
    if (!school) return;
    setGenerating(true);
    // Generate bulletins for all active students for T1
    const { data: stuList } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', school.id)
      .eq('status', 'active');
    if (stuList && stuList.length > 0) {
      const records = stuList.map((s: any) => ({
        school_id: school.id,
        student_id: s.id,
        term_key: 'T1',
        status: 'draft',
        generated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('bulletins').insert(records);
      if (error) { showError(error.message); return; }
    }
    setGenerating(false);
    loadData();
  }

  async function handlePublish(id: string) {
    const { error } = await supabase.from('bulletins').update({ status: 'published' }).eq('id', id);
    if (error) { showError(error.message); return; }
    loadData();
  }

  const filtered = bulletins.filter((b) => {
    const s = students[b.student_id];
    const name = s ? `${s.first_name} ${s.last_name}` : '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || (b.term_key || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader title="Bulletins" subtitle="Générez et publiez les bulletins de notes" action={
        canManage ? (
          <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            <FileText size={16} /> {generating ? 'Génération...' : 'Générer (T1)'}
          </button>
        ) : undefined
      } />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher un bulletin..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Award} message="Aucun bulletin généré" action={
          canManage ? (
            <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              <FileText size={16} /> Générer les bulletins
            </button>
          ) : undefined
        } />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Élève</th>
                <th className="px-4 py-3 font-semibold">Trimestre</th>
                <th className="px-4 py-3 font-semibold">Moyenne</th>
                <th className="px-4 py-3 font-semibold">Rang</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((b) => {
                const s = students[b.student_id];
                return (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s ? `${s.last_name} ${s.first_name}` : '—'}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.term_key || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">—</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">—</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${b.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {b.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage && b.status !== 'published' && (
                        <button onClick={() => handlePublish(b.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">
                          <Send size={14} /> Publier
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
