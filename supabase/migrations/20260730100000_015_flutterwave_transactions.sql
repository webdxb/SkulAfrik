/*
# Flutterwave payment tracking

## Why
Paywall.tsx and the /dashboard/pricing page currently activate a plan by having
the CLIENT directly UPDATE schools.subscription_status = 'active' — with
is_school_admin() now correctly matching role='admin' (migration 013), any
school admin can grant themselves a paid plan for free, with no real payment
ever happening. This table + the flutterwave-verify edge function close that
gap: activation only happens server-side, after Flutterwave confirms a real
payment via their verify API (using the secret key, never exposed to the client).
*/

CREATE TABLE IF NOT EXISTS public.flutterwave_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  tx_ref text NOT NULL UNIQUE,
  flw_transaction_id text,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed')),
  billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual')),
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);
CREATE INDEX IF NOT EXISTS flw_tx_school_idx ON public.flutterwave_transactions(school_id);
CREATE INDEX IF NOT EXISTS flw_tx_ref_idx ON public.flutterwave_transactions(tx_ref);
ALTER TABLE public.flutterwave_transactions ENABLE ROW LEVEL SECURITY;

-- The school admin can see their own school's transactions, and create a pending
-- record before redirecting to Flutterwave. They can NEVER set status themselves —
-- only the edge function (using the service role, which bypasses RLS) can mark a
-- transaction 'successful' and activate the plan.
DROP POLICY IF EXISTS "flw_tx_admin_read" ON public.flutterwave_transactions;
CREATE POLICY "flw_tx_admin_read" ON public.flutterwave_transactions FOR SELECT
  TO authenticated USING (public.is_school_admin(school_id));

DROP POLICY IF EXISTS "flw_tx_admin_insert" ON public.flutterwave_transactions;
CREATE POLICY "flw_tx_admin_insert" ON public.flutterwave_transactions FOR INSERT
  TO authenticated WITH CHECK (public.is_school_admin(school_id) AND status = 'pending' AND initiated_by = auth.uid());

-- Deliberately no UPDATE/DELETE policy for regular users: status transitions to
-- 'successful'/'failed' are only ever performed by the edge function via the
-- service role key, which bypasses RLS entirely.

-- Now that real payment verification exists, stop letting the client set
-- subscription_status/plan_id directly on schools — only the edge function
-- (service role) or the school's own owner during onboarding/free-trial setup
-- should touch these. We keep owner_user_id-based access for the initial
-- creation (see schools_owner_update), but subscription activation itself
-- should flow through flutterwave-verify from now on.
--
-- RLS alone can't restrict *which columns* an otherwise-permitted UPDATE
-- touches, so enforce it with a trigger: block any change to plan_id or
-- subscription_status unless the request is running as the service role
-- (edge functions) or during the very first INSERT (onboarding's free trial).
CREATE OR REPLACE FUNCTION public.protect_subscription_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Service role (edge functions) bypasses this check entirely.
  IF coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.plan_id IS DISTINCT FROM OLD.plan_id OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    RAISE EXCEPTION 'Le plan et le statut d''abonnement ne peuvent être modifiés que via un paiement vérifié.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_subscription_fields_trigger ON public.schools;
CREATE TRIGGER protect_subscription_fields_trigger
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.protect_subscription_fields();
