/*
# Live chat support — AI-first, escalates to a human agent (super admin) on request

## Design
- chat_conversations: one thread per user asking for help. status tracks whether
  the bot is still handling it, a human has taken over, or it's closed.
- chat_messages: every message in the thread, tagged by sender_type so the UI
  can render user/bot/agent bubbles differently.
- The bot itself never runs inside Postgres — a Deno edge function (chat-ai-respond)
  calls a free-tier AI provider and inserts the reply as sender_type='bot'.
- Escalation is just a status flip + an agent_id assignment; the super admin
  dashboard reads status='escalated' conversations.
*/

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'bot' CHECK (status IN ('bot', 'escalated', 'closed')),
  agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_conv_user_idx ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS chat_conv_status_idx ON public.chat_conversations(status);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'bot', 'agent')),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_msg_conv_idx ON public.chat_messages(conversation_id);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: the owning user can read/create/update their own; super admin sees all.
DROP POLICY IF EXISTS "chat_conv_owner_read" ON public.chat_conversations;
CREATE POLICY "chat_conv_owner_read" ON public.chat_conversations FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "chat_conv_owner_insert" ON public.chat_conversations;
CREATE POLICY "chat_conv_owner_insert" ON public.chat_conversations FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "chat_conv_update" ON public.chat_conversations;
CREATE POLICY "chat_conv_update" ON public.chat_conversations FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

-- Messages: readable/writable by the conversation owner or super admin.
-- The bot itself writes via the edge function's service role, which bypasses RLS.
DROP POLICY IF EXISTS "chat_msg_read" ON public.chat_messages;
CREATE POLICY "chat_msg_read" ON public.chat_messages FOR SELECT
  TO authenticated USING (
    public.is_super_admin()
    OR EXISTS (SELECT 1 FROM public.chat_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "chat_msg_insert" ON public.chat_messages;
CREATE POLICY "chat_msg_insert" ON public.chat_messages FOR INSERT
  TO authenticated WITH CHECK (
    -- A user can post as themselves in their own conversation...
    (sender_type = 'user' AND sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.chat_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))
    -- ...or a super admin can post as an agent in any conversation.
    OR (sender_type = 'agent' AND sender_id = auth.uid() AND public.is_super_admin())
  );

-- Keep conversations sorted by recent activity.
CREATE OR REPLACE FUNCTION public.touch_chat_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.chat_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS touch_chat_conversation_trigger ON public.chat_messages;
CREATE TRIGGER touch_chat_conversation_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_chat_conversation();

-- Required for the chat widget's live updates (Supabase Realtime postgres_changes
-- subscriptions only fire for tables explicitly added to this publication).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
  END IF;
END $$;
