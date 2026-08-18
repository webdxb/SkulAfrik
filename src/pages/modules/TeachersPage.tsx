import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { PageHeader, EmptyState, Modal, inputCls, Card } from '../../components/ui';
import { Search, Users, Phone, UserPlus, Copy, Check } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
}

interface InviteCode {
  id: string;
  code: string;
  label: string | null;
  used_at: string | null;
  created_at: string;
}

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function TeachersPage() {
  const { school } = useAuth();
  const { showError } = useToast();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteLabel, setInviteLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

    const { data: inviteRows, error: invErr } = await supabase
      .from('teacher_invite_codes')
      .select('id, code, label, used_at, created_at')
      .eq('school_id', school.id)
      .is('used_at', null)
      .order('created_at', { ascending: false });
    if (invErr) showError(invErr.message);
    setInvites((inviteRows || []) as InviteCode[]);

    setLoading(false);
  }

  async function handleGenerateInvite() {
    if (!school) return;
    setGenerating(true);
    const { error } = await supabase.from('teacher_invite_codes').insert({
      school_id: school.id,
      code: randomCode(),
      label: inviteLabel.trim() || null,
    });
    setGenerating(false);
    if (error) { showError(error.message); return; }
    setInviteLabel('');
    setInviteModalOpen(false);
    loadData();
  }

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return `${t.first_name} ${t.last_name}`.toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader
        title="Enseignants"
        subtitle="Liste des enseignants de l'établissement"
        action={
          <button onClick={() => setInviteModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <UserPlus size={16} /> Inviter un enseignant
          </button>
        }
      />

      {invites.length > 0 && (
        <Card className="mb-4 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Codes d'invitation en attente</p>
          <div className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2">
                <div>
                  <span className="font-mono text-sm font-semibold tracking-wider text-slate-900 dark:text-slate-100">{inv.code}</span>
                  {inv.label && <span className="ml-2 text-xs text-slate-500">{inv.label}</span>}
                </div>
                <button onClick={() => copyCode(inv.id, inv.code)} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  {copiedId === inv.id ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

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

      {inviteModalOpen && (
        <Modal title="Inviter un enseignant" onClose={() => setInviteModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Un code unique sera généré. Transmettez-le à l'enseignant : il devra le saisir lors de son inscription sur Klasoo pour rejoindre votre établissement.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Repère (optionnel, ex: nom de l'enseignant)</label>
              <input className={inputCls} value={inviteLabel} onChange={(e) => setInviteLabel(e.target.value)} placeholder="ex: M. Traoré" />
            </div>
            <button onClick={handleGenerateInvite} disabled={generating} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {generating ? 'Génération...' : 'Générer le code'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
