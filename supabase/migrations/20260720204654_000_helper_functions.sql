/*
# Skul Afrik — Helper Functions (pre-schema)

Crée les fonctions helper avant les tables pour que les politiques RLS puissent les référencer.
- is_super_admin() : vérifie si l'email courant est dans super_admin_emails
- user_school_id() : retourne le school_id du profil courant
- user_role() : retourne le rôle du profil courant

Note: Ces fonctions sont SECURITY DEFINER et STABLE. Elles référencent des tables
qui seront créées dans la migration suivante. Au moment de la création de la fonction,
la table n'existe pas encore, mais comme c'est du SQL dynamique (LANGUAGE sql),
Postgres ne valide pas les références au moment de la création de la fonction.
*/

CREATE TABLE IF NOT EXISTS public.super_admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admin_emails WHERE email = auth.email());
$$;

CREATE OR REPLACE FUNCTION public.user_school_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

ALTER TABLE public.super_admin_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sa_read" ON public.super_admin_emails;
CREATE POLICY "sa_read" ON public.super_admin_emails FOR SELECT TO authenticated USING (is_super_admin());