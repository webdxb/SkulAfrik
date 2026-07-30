/*
# CRITICAL FIX — profiles.onboarding_completed never existed

## Problem
The entire onboarding routing logic (App.tsx) and every onboarding submit
handler (OnboardingPage.tsx) read/write profiles.onboarding_completed —
but this column was never created in any prior migration. Every update
touching it failed with: "Could not find the 'onboarding_completed' column
of 'profiles' in the schema cache". Since the column never existed, it was
always undefined/null client-side, so the "onboarding not completed" check
was always true for every account, every session.

## Fix
Add the column. Default false for new signups; backfill true for any
existing profile that already has a role/school_id set (i.e. already went
through some form of onboarding, even if the flag itself never persisted).
*/

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Backfill: anyone who already has a role beyond the default 'student' with no
-- school_id is ambiguous, but anyone with a school_id assigned, or a non-default
-- role, has clearly already been through some onboarding step manually.
UPDATE public.profiles
SET onboarding_completed = true
WHERE onboarding_completed = false
  AND (school_id IS NOT NULL OR role IN ('admin', 'teacher', 'super_admin'));
