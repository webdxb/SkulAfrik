import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Send, Mail, Inbox } from 'lucide-react';
import { PageHeader, EmptyState, Modal, inputCls } from '../../components/ui';

interface Message { id: string; sender_id: string; recipient_id: string; subject: string; body: string; read_at: string | null; created_at: string }

export function MessagesPage() {
  const { school, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [recipients, setRecipients] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!school || !user) return;
    setLoading(true);
    const { data } = await supabase.from('messages').select('*').eq('school_id', school.id).or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order('created_at', { ascending: false });
    setMessages((data || []) as Message[]);
    const { data: members } = await supabase.from('profiles').select('id, first_name, last_name, email').eq('school_id', school.id).neq('id', user.id);
    setRecipients(members || []);
    setLoading(false);
  }, [school, user]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <PageHeader title="Messagerie" subtitle={`${messages.length} message(s)`} action={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Send size={16} /> Nouveau</button>} />
      {loading ? <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">Chargement...</div> : messages.length === 0 ? <EmptyState icon={Mail} message="Aucun message." /> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
          {messages.map((m) => {
            const isSender = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`p-4 hover:bg-slate-50/50 ${!m.read_at && !isSender ? 'bg-indigo-50/20' : ''}`}>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${isSender ? 'bg-emerald-500' : 'bg-indigo-500'}`} /><span className="font-medium text-slate-900 dark:text-slate-100">{m.subject || '(sans objet)'}</span></div><span className="text-xs text-slate-400 dark:text-slate-500">{new Date(m.created_at).toLocaleDateString()}</span></div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{m.body}</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{isSender ? 'Envoyé' : 'Reçu'}</p>
              </div>
            );
          })}
        </div>
      )}
      {showForm && <MsgForm schoolId={school!.id} senderId={user!.id} recipients={recipients} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function MsgForm({ schoolId, senderId, recipients, onClose, onSaved }: { schoolId: string; senderId: string; recipients: any[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ recipient_id: '', subject: '', body: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('messages').insert({ school_id: schoolId, sender_id: senderId, ...form });
    setSaving(false); if (error) { alert(error.message); return; } onSaved();
  };
  return (
    <Modal title="Nouveau message" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Destinataire</label><select required value={form.recipient_id} onChange={(e) => setForm({ ...form, recipient_id: e.target.value })} className={inputCls}><option value="">Sélectionner...</option>{recipients.map((r) => <option key={r.id} value={r.id}>{r.first_name} {r.last_name} ({r.email})</option>)}</select></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Objet</label><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message</label><textarea required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inputCls} rows={4} /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Envoyer'}</button></div>
      </form>
    </Modal>
  );
}
