import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { MessageCircle, X, Send, UserRound, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender_type: 'user' | 'bot' | 'agent';
  content: string;
  created_at: string;
}

export function ChatWidget() {
  const { user, profile, school } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [status, setStatus] = useState<'bot' | 'escalated' | 'closed'>('bot');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Don't show the widget until we know who's asking — avoids a flash on the public landing page.
  if (!user || !profile) return null;

  useEffect(() => {
    if (open && !conversationId) initConversation();
  }, [open]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages((prev) => (prev.some((m) => m.id === (payload.new as any).id) ? prev : [...prev, payload.new as ChatMessage]));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_conversations', filter: `id=eq.${conversationId}` }, (payload) => {
        setStatus((payload.new as any).status);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function initConversation() {
    setLoadingHistory(true);
    // Reuse the most recent non-closed conversation if one exists, otherwise create one.
    const { data: existing } = await supabase
      .from('chat_conversations')
      .select('id, status')
      .eq('user_id', user!.id)
      .neq('status', 'closed')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let convId = existing?.id;
    if (!convId) {
      const { data: created, error } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user!.id, school_id: school?.id || null })
        .select('id')
        .single();
      if (error) { setLoadingHistory(false); return; }
      convId = created.id;
    } else {
      setStatus(existing!.status as any);
    }

    setConversationId(convId);
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('id, sender_type, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (!msgs || msgs.length === 0) {
      // Greet first-time visitors.
      const greeting = `Bonjour ${profile?.first_name || ''} 👋 Je suis l'assistant Klaso. Posez-moi votre question, ou demandez à parler à un agent humain à tout moment.`;
      const { data: greetMsg } = await supabase
        .from('chat_messages')
        .insert({ conversation_id: convId, sender_type: 'bot', content: greeting })
        .select('id, sender_type, content, created_at')
        .single();
      setMessages(greetMsg ? [greetMsg as ChatMessage] : []);
    } else {
      setMessages(msgs as ChatMessage[]);
    }
    setLoadingHistory(false);
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || !conversationId || sending) return;
    setSending(true);
    setInput('');

    const { data: userMsg } = await supabase
      .from('chat_messages')
      .insert({ conversation_id: conversationId, sender_type: 'user', sender_id: user!.id, content })
      .select('id, sender_type, content, created_at')
      .single();
    if (userMsg) setMessages((prev) => [...prev, userMsg as ChatMessage]);

    if (status !== 'escalated') {
      try {
        const { data } = await supabase.functions.invoke('chat-ai-respond', { body: { conversation_id: conversationId, message: content } });
        if (data?.escalated) setStatus('escalated');
      } catch {
        // Silent — the edge function itself posts a fallback message on failure.
      }
    }
    setSending(false);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-[90] w-[calc(100vw-2rem)] sm:w-96 h-[28rem] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="bg-[#003087] px-4 py-3 flex items-center justify-between text-white flex-shrink-0">
            <div>
              <p className="font-heading text-sm font-bold">Support Klaso</p>
              <p className="text-[11px] text-[#B8D4F0]">{status === 'escalated' ? 'Un agent va vous répondre' : 'Assistant automatique'}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white"><X size={18} /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-slate-50 dark:bg-slate-950">
            {loadingHistory ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm"><Loader2 className="animate-spin mr-2" size={16} /> Chargement...</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.sender_type === 'user' ? 'bg-[#009CDE] text-white rounded-br-sm'
                    : m.sender_type === 'agent' ? 'bg-emerald-100 text-emerald-900 rounded-bl-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm'
                  }`}>
                    {m.sender_type === 'agent' && <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 mb-0.5">Agent</p>}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start"><div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-slate-400">...</div></div>
            )}
          </div>

          {status !== 'escalated' && (
            <button onClick={() => sendMessage('Je voudrais parler à un agent humain.')} className="flex-shrink-0 flex items-center justify-center gap-1.5 border-t border-slate-100 dark:border-slate-800 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
              <UserRound size={13} /> Demander un agent humain
            </button>
          )}

          <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 p-2 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Écrivez votre message..."
              className="flex-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-[#009CDE]"
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || sending} className="h-9 w-9 flex-shrink-0 rounded-full bg-[#003087] text-white flex items-center justify-center disabled:opacity-40">
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 sm:right-6 z-[90] h-14 w-14 rounded-full bg-[#003087] text-white shadow-xl flex items-center justify-center hover:bg-[#00457C] transition-colors"
        aria-label="Support"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
