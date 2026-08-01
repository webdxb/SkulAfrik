import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { useI18n, formatDate, formatDateTime } from '../../lib/i18n';
import { PageHeader, EmptyState, Modal, inputCls, Card } from '../../components/ui';
import { Send, Plus, MessageSquare, Search } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

export function MessagesPage() {
  const { locale } = useI18n();
  const { showError } = useToast();
  const { school, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [compose, setCompose] = useState({ recipient_id: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [openMessage, setOpenMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (school && profile) loadData();
  }, [school, profile]);

  async function loadData() {
    if (!school || !profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, subject, body, read_at, created_at')
      .eq('school_id', school.id)
      .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });
    const list = (data || []) as Message[];
    setMessages(list);

    // Load contact names (for past conversations list display)
    const ids = new Set<string>();
    list.forEach((m) => { ids.add(m.sender_id); ids.add(m.recipient_id); });
    if (ids.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', [...ids]);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { map[p.id] = `${p.last_name} ${p.first_name}`; });
      setContacts(map);
    }

    // Load every school member as a possible recipient (not just people already messaged)
    const { data: schoolMembers } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('school_id', school.id)
      .neq('id', profile.id)
      .order('last_name');
    setMembers((schoolMembers || []).map((m: any) => ({ id: m.id, name: `${m.last_name} ${m.first_name}` })));

    setLoading(false);
  }

  async function openMessageDetail(m: Message) {
    setOpenMessage(m);
    if (!m.read_at && m.recipient_id === profile?.id) {
      const { error } = await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id);
      if (!error) setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, read_at: new Date().toISOString() } : x));
    }
  }

  async function handleSend() {
    if (!school || !profile || !compose.recipient_id) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      school_id: school.id,
      sender_id: profile.id,
      recipient_id: compose.recipient_id,
      subject: compose.subject || null,
      body: compose.body || null,
    });
    if (error) { showError(error.message); setSending(false); return; }
    setSending(false);
    setCompose({ recipient_id: '', subject: '', body: '' });
    setShowCompose(false);
    loadData();
  }

  const filtered = messages.filter((m) => {
    const q = search.toLowerCase();
    return (m.subject || '').toLowerCase().includes(q) || (m.body || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader title="Messagerie" subtitle="Échangez des messages avec les membres de l'établissement" action={
        <button onClick={() => setShowCompose(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Nouveau message
        </button>
      } />

      {!showCompose ? (
        <>
          <Card className="mb-4 p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={`${inputCls} pl-10`} placeholder="Rechercher un message..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </Card>

          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={MessageSquare} message="Aucun message" action={
              <button onClick={() => setShowCompose(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <Send size={16} /> Composer un message
              </button>
            } />
          ) : (
            <div className="space-y-3">
              {filtered.map((m) => {
                const isSent = m.sender_id === profile?.id;
                const otherName = contacts[isSent ? m.recipient_id : m.sender_id] || '—';
                return (
                  <Card key={m.id} onClick={() => openMessageDetail(m)} className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${!m.read_at && !isSent ? 'border-l-4 border-l-indigo-500' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${isSent ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {isSent ? 'Envoyé' : 'Reçu'}
                          </span>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{isSent ? `À: ${otherName}` : `De: ${otherName}`}</span>
                          {!m.read_at && !isSent && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
                        </div>
                        <h3 className="mt-1 font-medium text-slate-900 dark:text-slate-100">{m.subject || '(Sans objet)'}</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{m.body || ''}</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{formatDateTime(m.created_at, locale)}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Nouveau message</h2>
            <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">&times;</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Destinataire</label>
              <select className={inputCls} value={compose.recipient_id} onChange={(e) => setCompose({ ...compose, recipient_id: e.target.value })}>
                <option value="">Sélectionner un destinataire...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Objet</label>
              <input className={inputCls} value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
              <textarea className={inputCls} rows={5} value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSend} disabled={sending || !compose.recipient_id} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                <Send size={16} /> {sending ? 'Envoi...' : 'Envoyer'}
              </button>
              <button onClick={() => setShowCompose(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Annuler
              </button>
            </div>
          </div>
        </Card>
      )}

      {openMessage && (
        <Modal title={openMessage.subject || '(Sans objet)'} onClose={() => setOpenMessage(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              {openMessage.sender_id === profile?.id ? `À: ${contacts[openMessage.recipient_id] || '—'}` : `De: ${contacts[openMessage.sender_id] || '—'}`}
              {' · '}{formatDateTime(openMessage.created_at, locale)}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{openMessage.body || ''}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
