/*
# Skul Afrik — Helper Functions

Fonctions helper créées avec LANGUAGE plpgsql pour éviter la validation
des références de colonnes au moment de la création. Les tables seront
créées dans la migration suivante.

- is_super_admin() : vérifie si l'email est dans super_admin_emails
- user_school_id() : retourne le school_id du profil courant
- user_role() : retourne le rôle du profil courant
*/

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.super_admin_emails WHERE email = auth.email());
END;
$$;

CREATE OR REPLACE FUNCTION public.user_school_id()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  result uuid;
BEGIN
  SELECT school_id INTO result FROM public.profiles WHERE id = auth.uid();
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  result text;
BEGIN
  SELECT role INTO result FROM public.profiles WHERE id = auth.uid();
  RETURN result;
END;
$$;