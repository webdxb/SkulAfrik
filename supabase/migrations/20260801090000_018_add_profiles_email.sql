/*
# CRITICAL FIX — profiles.email column never existed

## Problem
Several frontend features explicitly select 'email' from public.profiles
(Super Admin → Live Chat, Support tickets list, Users list) — but the column
was never created in any migration, and handle_new_user() never set it.
Queries selecting it directly fail outright ("Could not find the 'email'
column"); the Users table silently showed a blank Email column forever
(SELECT * just omits an absent column, no error, but no data either).

## Fix
Add the column, backfill it from auth.users (the actual source of truth for
email), and keep it in sync going forward via the signup trigger and a
dedicated trigger on auth.users email changes.
*/

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill existing rows from the real source of truth.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Keep handle_new_user() setting email on signup (and on re-trigger via ON CONFLICT).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.super_admin_emails WHERE email = NEW.email) THEN
    v_role := 'super_admin';
  ELSE
    v_role := COALESCE(NEW.raw_app_meta_data->>'role', 'student');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, language)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'language', 'fr')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN profiles.role = 'super_admin' THEN 'super_admin' ELSE EXCLUDED.role END,
    first_name = CASE WHEN profiles.first_name = '' THEN EXCLUDED.first_name ELSE profiles.first_name END,
    last_name = CASE WHEN profiles.last_name = '' THEN EXCLUDED.last_name ELSE profiles.last_name END;

  RETURN NEW;
END;
$$;

-- If a user changes their login email later, keep profiles.email in sync.
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_change();
