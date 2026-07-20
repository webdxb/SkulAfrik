-- Seed missing super admin email
INSERT INTO public.super_admin_emails (email) VALUES ('webdxb1@gmail.com') ON CONFLICT (email) DO NOTHING;

-- Ensure all three are present
INSERT INTO public.super_admin_emails (email) VALUES
  ('vincentnogue@yahoo.com'),
  ('vincentnogue2@gmail.com')
ON CONFLICT (email) DO NOTHING;
