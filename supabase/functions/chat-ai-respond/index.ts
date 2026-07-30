// supabase/functions/chat-ai-respond/index.ts
//
// Generates the bot's reply for a support chat conversation using Groq's free-tier
// API (OpenAI-compatible, no cost for reasonable volumes as of writing). Runs
// server-side so the API key is never exposed to the browser.
//
// If the user's message signals they want a human, or the AI call fails, the
// conversation is escalated (status='escalated') instead of getting a bot reply,
// so it shows up in the Super Admin → Support Live dashboard.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function corsResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json',
    },
  });
}

const HUMAN_REQUEST_PATTERNS = [
  /agent humain/i, /parler.{0,15}(quelqu|humain|personne)/i, /support humain/i,
  /human agent/i, /talk to (a |an )?(human|person|agent)/i, /speak to (a |an )?(human|person|agent)/i,
];

const SYSTEM_PROMPT = `Tu es l'assistant support de KLASO, une plateforme internationale de gestion scolaire multi-établissements (développée par LiAfrik).
Réponds de façon brève, utile et amicale, en français par défaut (ou en anglais si l'utilisateur écrit en anglais).
Rappelle si pertinent que seul l'établissement scolaire paie l'abonnement — jamais les parents ou les élèves.
Si tu ne sais pas répondre avec certitude, dis-le honnêtement et propose de transférer à un agent humain plutôt que d'inventer une réponse.
Ne donne jamais de conseil juridique ou financier définitif — oriente vers support@liafrik.com ou cs@liafrik.com pour ces sujets.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse({}, 204);
  if (req.method !== 'POST') return corsResponse({ error: 'Method not allowed' }, 405);

  try {
    const { conversation_id, message } = await req.json();
    if (!conversation_id || !message) return corsResponse({ error: 'conversation_id and message are required' }, 400);

    // Explicit request for a human → escalate immediately, no AI call needed.
    if (HUMAN_REQUEST_PATTERNS.some((p) => p.test(message))) {
      await supabase.from('chat_conversations').update({ status: 'escalated' }).eq('id', conversation_id);
      await supabase.from('chat_messages').insert({
        conversation_id, sender_type: 'bot',
        content: "D'accord, je transmets votre demande à un membre de notre équipe. Un agent humain va prendre le relais sur cette conversation — merci de patienter, la réponse peut prendre un peu de temps.",
      });
      return corsResponse({ escalated: true });
    }

    if (!GROQ_API_KEY) {
      // No AI configured — fail gracefully by escalating rather than pretending to be smart.
      await supabase.from('chat_conversations').update({ status: 'escalated' }).eq('id', conversation_id);
      await supabase.from('chat_messages').insert({
        conversation_id, sender_type: 'bot',
        content: "Notre assistant automatique n'est pas encore configuré. Je transmets votre message à un agent humain.",
      });
      return corsResponse({ escalated: true, ai_configured: false });
    }

    // Pull recent history for context (last 10 messages).
    const { data: history } = await supabase
      .from('chat_messages')
      .select('sender_type, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(10);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).map((m: any) => ({ role: m.sender_type === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: message },
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages, temperature: 0.4, max_tokens: 400 }),
    });

    if (!groqRes.ok) {
      await supabase.from('chat_conversations').update({ status: 'escalated' }).eq('id', conversation_id);
      await supabase.from('chat_messages').insert({
        conversation_id, sender_type: 'bot',
        content: "Désolé, je rencontre un souci technique. Je transmets votre demande à un agent humain.",
      });
      return corsResponse({ escalated: true, ai_configured: true, ai_error: true });
    }

    const groqData = await groqRes.json();
    const reply = groqData?.choices?.[0]?.message?.content?.trim() || "Désolé, je n'ai pas de réponse claire à vous donner. Souhaitez-vous parler à un agent humain ?";

    await supabase.from('chat_messages').insert({ conversation_id, sender_type: 'bot', content: reply });

    return corsResponse({ escalated: false, reply });
  } catch (e) {
    return corsResponse({ error: e instanceof Error ? e.message : 'Erreur inconnue.' }, 500);
  }
});
