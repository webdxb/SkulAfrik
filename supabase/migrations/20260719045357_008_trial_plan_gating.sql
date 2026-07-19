/*
# SKUL AFRIK — Trial expiry + plan-based gating (server-side)

## Functions

### school_subscription_active(school_id)
Returns true if the school is in trial period OR has an active paid subscription.
- trial: trial_ends_at > now() AND subscription_status = 'trial'
- active: subscription_status IN ('active', 'lifetime')
- suspended/expired/cancelled: false

### school_plan_modules(school_id)
Returns the modules[] array for the school's current plan.
If no plan_id set, returns NULL (meaning: trial = all modules).

### school_has_module(school_id, module_key)
Returns true if:
- school is in trial (all modules accessible), OR
- school's plan includes the module key.
*/
CREATE OR REPLACE FUNCTION public.school_subscription_active(school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.id = school_id
    AND (
      (s.subscription_status = 'trial' AND s.trial_ends_at > now())
      OR s.subscription_status IN ('active', 'lifetime')
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.school_plan_modules(school_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.modules
  FROM public.schools s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.id = school_id;
$$;

CREATE OR REPLACE FUNCTION public.school_has_module(school_id uuid, module_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- During trial: all modules accessible
    EXISTS (
      SELECT 1 FROM public.schools s
      WHERE s.id = school_id
      AND s.subscription_status = 'trial'
      AND s.trial_ends_at > now()
    )
    OR
    -- After trial: only modules in the paid plan
    (
      EXISTS (
        SELECT 1 FROM public.schools s
        WHERE s.id = school_id
        AND s.subscription_status IN ('active', 'lifetime')
      )
      AND EXISTS (
        SELECT 1
        FROM public.schools s
        JOIN public.plans p ON p.id = s.plan_id
        WHERE s.id = school_id
        AND p.modules ? module_key
      )
    );
$$;

-- Grant execute to authenticated users (they need to check their own school)
GRANT EXECUTE ON FUNCTION public.school_subscription_active(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.school_plan_modules(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.school_has_module(uuid, text) TO authenticated;
