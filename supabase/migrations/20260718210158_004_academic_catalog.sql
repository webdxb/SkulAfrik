/*
# SKUL AFRIK — Academic Catalog (Addendum)

Configurable academic structure for African school systems (francophone + anglophone).
Super Admin can enrich the catalog without code changes. Onboarding auto-generates
a school's classes/subjects from the catalog based on selected establishment types
and linguistic system.

## New Tables (all catalog tables are GLOBAL — not tenant-scoped)

### systemes
Linguistic systems: Francophone, Anglophone.
- code (fr/en), name

### cycles
Reusable academic cycles (e.g. Primaire, Secondaire 1er cycle général).
- systeme_id, code, name, order_index

### niveaux
Grade levels within a cycle (e.g. 6ème, Form 1).
- cycle_id, code, name, order_index

### filieres
Optional tracks/series attached to a niveau (e.g. Série C, F3, Arts side).
- niveau_id, code, name

### matieres_catalog
Default subjects per niveau (or cycle-level if niveau_id null).
- systeme_id, cycle_id, niveau_id (nullable), name, coefficient

### type_etablissement_cycles
Liaison: which establishment type activates which cycle.
- type_code (e.g. primaire, lycee_general), cycle_id

## Tenant-scoped tables (school overrides)

### school_academic_config
Stores each school's selected establishment types + linguistic system.
- school_id, types (jsonb array), systeme_id

## Security
- Catalog tables: public read (anon + authenticated), super_admin write.
- school_academic_config: school members read, school_admin write.
*/

-- =============================================
-- TABLE: systemes
-- =============================================
CREATE TABLE IF NOT EXISTS public.systemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.systemes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "systemes_read" ON public.systemes;
CREATE POLICY "systemes_read" ON public.systemes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "systemes_super_write" ON public.systemes;
CREATE POLICY "systemes_super_write" ON public.systemes FOR ALL
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- TABLE: cycles
-- =============================================
CREATE TABLE IF NOT EXISTS public.cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  systeme_id uuid NOT NULL REFERENCES public.systemes(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (systeme_id, code)
);
CREATE INDEX IF NOT EXISTS cycles_systeme_id_idx ON public.cycles(systeme_id);
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cycles_read" ON public.cycles;
CREATE POLICY "cycles_read" ON public.cycles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cycles_super_write" ON public.cycles;
CREATE POLICY "cycles_super_write" ON public.cycles FOR ALL
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- TABLE: niveaux
-- =============================================
CREATE TABLE IF NOT EXISTS public.niveaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, code)
);
CREATE INDEX IF NOT EXISTS niveaux_cycle_id_idx ON public.niveaux(cycle_id);
ALTER TABLE public.niveaux ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "niveaux_read" ON public.niveaux;
CREATE POLICY "niveaux_read" ON public.niveaux FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "niveaux_super_write" ON public.niveaux;
CREATE POLICY "niveaux_super_write" ON public.niveaux FOR ALL
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- TABLE: filieres
-- =============================================
CREATE TABLE IF NOT EXISTS public.filieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niveau_id uuid NOT NULL REFERENCES public.niveaux(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (niveau_id, code)
);
CREATE INDEX IF NOT EXISTS filieres_niveau_id_idx ON public.filieres(niveau_id);
ALTER TABLE public.filieres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "filieres_read" ON public.filieres;
CREATE POLICY "filieres_read" ON public.filieres FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "filieres_super_write" ON public.filieres;
CREATE POLICY "filieres_super_write" ON public.filieres FOR ALL
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- TABLE: matieres_catalog
-- =============================================
CREATE TABLE IF NOT EXISTS public.matieres_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  systeme_id uuid NOT NULL REFERENCES public.systemes(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  niveau_id uuid REFERENCES public.niveaux(id) ON DELETE CASCADE,
  name text NOT NULL,
  coefficient numeric(4,2) NOT NULL DEFAULT 1.0,
  is_general boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS matieres_catalog_cycle_idx ON public.matieres_catalog(cycle_id);
CREATE INDEX IF NOT EXISTS matieres_catalog_niveau_idx ON public.matieres_catalog(niveau_id);
ALTER TABLE public.matieres_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "matieres_catalog_read" ON public.matieres_catalog;
CREATE POLICY "matieres_catalog_read" ON public.matieres_catalog FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "matieres_catalog_super_write" ON public.matieres_catalog;
CREATE POLICY "matieres_catalog_super_write" ON public.matieres_catalog FOR ALL
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- TABLE: type_etablissement_cycles
-- =============================================
CREATE TABLE IF NOT EXISTS public.type_etablissement_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code text NOT NULL,
  cycle_id uuid NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type_code, cycle_id)
);
CREATE INDEX IF NOT EXISTS tec_type_code_idx ON public.type_etablissement_cycles(type_code);
ALTER TABLE public.type_etablissement_cycles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tec_read" ON public.type_etablissement_cycles;
CREATE POLICY "tec_read" ON public.type_etablissement_cycles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tec_super_write" ON public.type_etablissement_cycles;
CREATE POLICY "tec_super_write" ON public.type_etablissement_cycles FOR ALL
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================
-- TABLE: school_academic_config (tenant-scoped)
-- =============================================
CREATE TABLE IF NOT EXISTS public.school_academic_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  types jsonb NOT NULL DEFAULT '[]',
  systeme_id uuid REFERENCES public.systemes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id)
);
CREATE INDEX IF NOT EXISTS school_academic_config_school_idx ON public.school_academic_config(school_id);
ALTER TABLE public.school_academic_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sac_member_read" ON public.school_academic_config;
CREATE POLICY "sac_member_read" ON public.school_academic_config FOR SELECT
  TO authenticated USING (public.is_school_member(school_id));
DROP POLICY IF EXISTS "sac_admin_write" ON public.school_academic_config;
CREATE POLICY "sac_admin_write" ON public.school_academic_config FOR ALL
  TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));

-- =============================================
-- SEED: Systemes
-- =============================================
INSERT INTO public.systemes (code, name) VALUES
  ('fr', 'Francophone'),
  ('en', 'Anglophone')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- SEED: Cycles (Francophone)
-- =============================================
DO $$
DECLARE
  fr_id uuid := (SELECT id FROM public.systemes WHERE code = 'fr');
BEGIN
  INSERT INTO public.cycles (systeme_id, code, name, order_index) VALUES
    (fr_id, 'maternelle', 'Maternelle', 0),
    (fr_id, 'primaire', 'Primaire', 1),
    (fr_id, 'secondaire_1_general', 'Secondaire 1er cycle général', 2),
    (fr_id, 'secondaire_2_general', 'Secondaire 2nd cycle général', 3),
    (fr_id, 'secondaire_1_technique', 'Secondaire 1er cycle technique', 4),
    (fr_id, 'secondaire_2_technique', 'Secondaire 2nd cycle technique', 5),
    (fr_id, 'formation_pro', 'Formation professionnelle', 6)
  ON CONFLICT (systeme_id, code) DO NOTHING;
END $$;

-- =============================================
-- SEED: Cycles (Anglophone)
-- =============================================
DO $$
DECLARE
  en_id uuid := (SELECT id FROM public.systemes WHERE code = 'en');
BEGIN
  INSERT INTO public.cycles (systeme_id, code, name, order_index) VALUES
    (en_id, 'nursery', 'Nursery', 0),
    (en_id, 'primary', 'Primary', 1),
    (en_id, 'secondary_1', 'Secondary 1st cycle', 2),
    (en_id, 'secondary_2', 'Secondary 2nd cycle', 3),
    (en_id, 'technical_1', 'Technical 1st cycle', 4),
    (en_id, 'technical_2', 'Technical 2nd cycle', 5),
    (en_id, 'vocational', 'Vocational Training', 6)
  ON CONFLICT (systeme_id, code) DO NOTHING;
END $$;

-- =============================================
-- SEED: Niveaux (Francophone)
-- =============================================
DO $$
DECLARE
  fr_id uuid := (SELECT id FROM public.systemes WHERE code = 'fr');
  c_mat uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'maternelle');
  c_pri uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'primaire');
  c_s1g uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'secondaire_1_general');
  c_s2g uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'secondaire_2_general');
  c_s1t uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'secondaire_1_technique');
  c_s2t uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'secondaire_2_technique');
  c_fp uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'formation_pro');
BEGIN
  -- Maternelle
  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_mat, 'PS', 'Petite Section', 0),
    (c_mat, 'MS', 'Moyenne Section', 1),
    (c_mat, 'GS', 'Grande Section', 2)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  -- Primaire
  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_pri, 'SIL', 'SIL/CP1', 0),
    (c_pri, 'CP2', 'CP2', 1),
    (c_pri, 'CE1', 'CE1', 2),
    (c_pri, 'CE2', 'CE2', 3),
    (c_pri, 'CM1', 'CM1', 4),
    (c_pri, 'CM2', 'CM2', 5)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  -- Secondaire 1er cycle général (commun Collège & Lycée)
  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_s1g, '6E', '6ème', 0),
    (c_s1g, '5E', '5ème', 1),
    (c_s1g, '4E', '4ème', 2),
    (c_s1g, '3E', '3ème', 3)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  -- Secondaire 2nd cycle général (Lycée)
  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_s2g, '2DE', '2nde', 0),
    (c_s2g, '1ERE', '1ère', 1),
    (c_s2g, 'TLE', 'Terminale', 2)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  -- Secondaire 1er cycle technique
  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_s1t, 'TECH1', '1ère année technique', 0),
    (c_s1t, 'TECH2', '2ème année technique', 1),
    (c_s1t, 'TECH3', '3ème année technique', 2),
    (c_s1t, 'TECH4', '4ème année technique', 3)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  -- Secondaire 2nd cycle technique
  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_s2t, 'TECH1BIS', '1ère technique', 0),
    (c_s2t, 'TECH2BIS', '2ème technique', 1),
    (c_s2t, 'TECHTLE', 'Terminale technique', 2)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  -- Formation professionnelle (niveaux génériques)
  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_fp, 'FP1', 'Session 1', 0),
    (c_fp, 'FP2', 'Session 2', 1),
    (c_fp, 'FP3', 'Session 3', 2)
  ON CONFLICT (cycle_id, code) DO NOTHING;
END $$;

-- =============================================
-- SEED: Niveaux (Anglophone)
-- =============================================
DO $$
DECLARE
  en_id uuid := (SELECT id FROM public.systemes WHERE code = 'en');
  c_nurs uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'nursery');
  c_pri uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'primary');
  c_s1 uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'secondary_1');
  c_s2 uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'secondary_2');
  c_t1 uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'technical_1');
  c_t2 uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'technical_2');
  c_voc uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'vocational');
BEGIN
  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_nurs, 'NUR1', 'Nursery 1', 0),
    (c_nurs, 'NUR2', 'Nursery 2', 1)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_pri, 'C1', 'Class 1', 0),
    (c_pri, 'C2', 'Class 2', 1),
    (c_pri, 'C3', 'Class 3', 2),
    (c_pri, 'C4', 'Class 4', 3),
    (c_pri, 'C5', 'Class 5', 4),
    (c_pri, 'C6', 'Class 6', 5)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_s1, 'F1', 'Form 1', 0),
    (c_s1, 'F2', 'Form 2', 1),
    (c_s1, 'F3', 'Form 3', 2),
    (c_s1, 'F4', 'Form 4', 3),
    (c_s1, 'F5', 'Form 5', 4)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_s2, 'L6', 'Lower Sixth', 0),
    (c_s2, 'U6', 'Upper Sixth', 1)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_t1, 'TV1', 'Technical Year 1', 0),
    (c_t1, 'TV2', 'Technical Year 2', 1),
    (c_t1, 'TV3', 'Technical Year 3', 2),
    (c_t1, 'TV4', 'Technical Year 4', 3)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_t2, 'TV5', 'Technical Year 5', 0),
    (c_t2, 'TV6', 'Technical Year 6', 1),
    (c_t2, 'TV7', 'Technical Year 7', 2)
  ON CONFLICT (cycle_id, code) DO NOTHING;

  INSERT INTO public.niveaux (cycle_id, code, name, order_index) VALUES
    (c_voc, 'VOC1', 'Session 1', 0),
    (c_voc, 'VOC2', 'Session 2', 1),
    (c_voc, 'VOC3', 'Session 3', 2)
  ON CONFLICT (cycle_id, code) DO NOTHING;
END $$;

-- =============================================
-- SEED: Filieres (Francophone — Lycée général)
-- =============================================
DO $$
DECLARE
  fr_id uuid := (SELECT id FROM public.systemes WHERE code = 'fr');
  c_s2g uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'secondaire_2_general');
  n_2de uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s2g AND code = '2DE');
  n_1ere uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s2g AND code = '1ERE');
  n_tle uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s2g AND code = 'TLE');
BEGIN
  INSERT INTO public.filieres (niveau_id, code, name) VALUES
    (n_2de, 'A', 'Série A (Littéraire)'),
    (n_2de, 'C', 'Série C (Maths-Sciences Physiques)'),
    (n_2de, 'D', 'Série D (Maths-Sciences de la Vie)'),
    (n_2de, 'E', 'Série E (Maths-Technologie)'),
    (n_1ere, 'A', 'Série A (Littéraire)'),
    (n_1ere, 'C', 'Série C (Maths-Sciences Physiques)'),
    (n_1ere, 'D', 'Série D (Maths-Sciences de la Vie)'),
    (n_1ere, 'E', 'Série E (Maths-Technologie)'),
    (n_tle, 'A', 'Série A (Littéraire)'),
    (n_tle, 'C', 'Série C (Maths-Sciences Physiques)'),
    (n_tle, 'D', 'Série D (Maths-Sciences de la Vie)'),
    (n_tle, 'E', 'Série E (Maths-Technologie)')
  ON CONFLICT (niveau_id, code) DO NOTHING;
END $$;

-- =============================================
-- SEED: Filieres (Francophone — Technique)
-- =============================================
DO $$
DECLARE
  fr_id uuid := (SELECT id FROM public.systemes WHERE code = 'fr');
  c_s1t uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'secondaire_1_technique');
  c_s2t uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'secondaire_2_technique');
  n_t1 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s1t AND code = 'TECH1');
  n_t2 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s1t AND code = 'TECH2');
  n_t3 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s1t AND code = 'TECH3');
  n_t4 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s1t AND code = 'TECH4');
  n_tt1 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s2t AND code = 'TECH1BIS');
  n_tt2 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s2t AND code = 'TECH2BIS');
  n_ttle uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s2t AND code = 'TECHTLE');
  tech_filieres text[][] := ARRAY[
    ['F1','Construction Bâtiment'],['F2','Travaux Publics'],['F3','Électrotechnique'],
    ['F4','Mécanique Automobile'],['F5','Fabrication Mécanique'],['F7','Électronique'],
    ['T1','Comptabilité'],['T2','Secrétariat Bureautique'],['G1','G1 (CAP)'],
    ['G2','G2 (CAP)'],['G3','G3 (CAP)'],['ESF','Économie Sociale et Familiale']
  ];
  f text[];
BEGIN
  FOREACH f SLICE 1 IN ARRAY tech_filieres LOOP
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_t1, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_t2, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_t3, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_t4, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_tt1, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_tt2, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_ttle, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- SEED: Filieres (Anglophone — High School)
-- =============================================
DO $$
DECLARE
  en_id uuid := (SELECT id FROM public.systemes WHERE code = 'en');
  c_s2 uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'secondary_2');
  n_l6 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s2 AND code = 'L6');
  n_u6 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_s2 AND code = 'U6');
BEGIN
  INSERT INTO public.filieres (niveau_id, code, name) VALUES
    (n_l6, 'ARTS', 'Arts side'),
    (n_l6, 'SCIENCE', 'Science side'),
    (n_u6, 'ARTS', 'Arts side'),
    (n_u6, 'SCIENCE', 'Science side')
  ON CONFLICT (niveau_id, code) DO NOTHING;
END $$;

-- =============================================
-- SEED: Filieres (Anglophone — Technical)
-- =============================================
DO $$
DECLARE
  en_id uuid := (SELECT id FROM public.systemes WHERE code = 'en');
  c_t1 uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'technical_1');
  c_t2 uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'technical_2');
  n_tv1 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_t1 AND code = 'TV1');
  n_tv2 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_t1 AND code = 'TV2');
  n_tv3 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_t1 AND code = 'TV3');
  n_tv4 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_t1 AND code = 'TV4');
  n_tv5 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_t2 AND code = 'TV5');
  n_tv6 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_t2 AND code = 'TV6');
  n_tv7 uuid := (SELECT id FROM public.niveaux WHERE cycle_id = c_t2 AND code = 'TV7');
  tech_fil text[][] := ARRAY[
    ['BC','Building Construction'],['AE','Automobile Engineering'],['EI','Electrical Installation'],
    ['ACC','Accountancy'],['SEC','Secretarial Studies']
  ];
  f text[];
BEGIN
  FOREACH f SLICE 1 IN ARRAY tech_fil LOOP
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_tv1, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_tv2, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_tv3, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_tv4, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_tv5, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_tv6, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
    INSERT INTO public.filieres (niveau_id, code, name) VALUES (n_tv7, f[1], f[2]) ON CONFLICT (niveau_id, code) DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- SEED: Matieres (Francophone — Primaire)
-- =============================================
DO $$
DECLARE
  fr_id uuid := (SELECT id FROM public.systemes WHERE code = 'fr');
  c_pri uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'primaire');
  subs text[] := ARRAY['Français','Mathématiques','Éducation civique et morale','Découverte du monde/Sciences','Histoire-Géographie','EPS','Arts plastiques','Musique','Anglais (initiation)'];
  s text;
BEGIN
  FOREACH s IN ARRAY subs LOOP
    INSERT INTO public.matieres_catalog (systeme_id, cycle_id, niveau_id, name, coefficient)
    VALUES (fr_id, c_pri, NULL, s, 1.0)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- SEED: Matieres (Francophone — Secondaire général)
-- =============================================
DO $$
DECLARE
  fr_id uuid := (SELECT id FROM public.systemes WHERE code = 'fr');
  c_s1g uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'secondaire_1_general');
  c_s2g uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'secondaire_2_general');
  subs text[] := ARRAY['Français','Anglais','Mathématiques','Physique-Chimie','Sciences de la Vie et de la Terre','Histoire-Géographie','Éducation à la Citoyenneté','EPS','Informatique','Langue vivante 2 (Espagnol/Allemand)','Arts'];
  s text;
BEGIN
  FOREACH s IN ARRAY subs LOOP
    INSERT INTO public.matieres_catalog (systeme_id, cycle_id, niveau_id, name, coefficient)
    VALUES (fr_id, c_s1g, NULL, s, 1.0)
    ON CONFLICT DO NOTHING;
    INSERT INTO public.matieres_catalog (systeme_id, cycle_id, niveau_id, name, coefficient)
    VALUES (fr_id, c_s2g, NULL, s, 1.0)
    ON CONFLICT DO NOTHING;
  END LOOP;
  -- Philosophie dès la 1ère
  INSERT INTO public.matieres_catalog (systeme_id, cycle_id, niveau_id, name, coefficient)
  SELECT fr_id, c_s2g, n.id, 'Philosophie', 2.0
  FROM public.niveaux n WHERE n.cycle_id = c_s2g AND n.code IN ('1ERE','TLE')
  ON CONFLICT DO NOTHING;
END $$;

-- =============================================
-- SEED: Matieres (Anglophone — Primary)
-- =============================================
DO $$
DECLARE
  en_id uuid := (SELECT id FROM public.systemes WHERE code = 'en');
  c_pri uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'primary');
  subs text[] := ARRAY['English Language','Mathematics','Science','Social Studies','Citizenship Education','French (as second language)','Physical Education','Arts','Music'];
  s text;
BEGIN
  FOREACH s IN ARRAY subs LOOP
    INSERT INTO public.matieres_catalog (systeme_id, cycle_id, niveau_id, name, coefficient)
    VALUES (en_id, c_pri, NULL, s, 1.0)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- SEED: Matieres (Anglophone — Secondary)
-- =============================================
DO $$
DECLARE
  en_id uuid := (SELECT id FROM public.systemes WHERE code = 'en');
  c_s1 uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'secondary_1');
  c_s2 uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'secondary_2');
  subs text[] := ARRAY['English Language','Literature in English','French','Mathematics','Physics','Chemistry','Biology','Geography','History','Citizenship Education','Computer Science','Physical Education','Religious Studies'];
  s text;
BEGIN
  FOREACH s IN ARRAY subs LOOP
    INSERT INTO public.matieres_catalog (systeme_id, cycle_id, niveau_id, name, coefficient)
    VALUES (en_id, c_s1, NULL, s, 1.0)
    ON CONFLICT DO NOTHING;
    INSERT INTO public.matieres_catalog (systeme_id, cycle_id, niveau_id, name, coefficient)
    VALUES (en_id, c_s2, NULL, s, 1.0)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- SEED: Matieres (Francophone — Maternelle)
-- =============================================
DO $$
DECLARE
  fr_id uuid := (SELECT id FROM public.systemes WHERE code = 'fr');
  c_mat uuid := (SELECT id FROM public.cycles WHERE systeme_id = fr_id AND code = 'maternelle');
  subs text[] := ARRAY['Éveil au langage','Motricité fine','Activités manuelles','Chants et jeux','Éveil sensoriel'];
  s text;
BEGIN
  FOREACH s IN ARRAY subs LOOP
    INSERT INTO public.matieres_catalog (systeme_id, cycle_id, niveau_id, name, coefficient)
    VALUES (fr_id, c_mat, NULL, s, 1.0)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- SEED: Matieres (Anglophone — Nursery)
-- =============================================
DO $$
DECLARE
  en_id uuid := (SELECT id FROM public.systemes WHERE code = 'en');
  c_nurs uuid := (SELECT id FROM public.cycles WHERE systeme_id = en_id AND code = 'nursery');
  subs text[] := ARRAY['Language Development','Fine Motor Skills','Handwork','Songs and Games','Sensory Awareness'];
  s text;
BEGIN
  FOREACH s IN ARRAY subs LOOP
    INSERT INTO public.matieres_catalog (systeme_id, cycle_id, niveau_id, name, coefficient)
    VALUES (en_id, c_nurs, NULL, s, 1.0)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- SEED: type_etablissement_cycles
-- =============================================
DO $$
DECLARE
  fr_id uuid := (SELECT id FROM public.systemes WHERE code = 'fr');
  en_id uuid := (SELECT id FROM public.systemes WHERE code = 'en');
BEGIN
  -- Maternelle (FR)
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'maternelle', id FROM public.cycles WHERE systeme_id = fr_id AND code = 'maternelle'
  ON CONFLICT DO NOTHING;
  -- Nursery (EN)
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'nursery', id FROM public.cycles WHERE systeme_id = en_id AND code = 'nursery'
  ON CONFLICT DO NOTHING;
  -- Primaire (FR)
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'primaire', id FROM public.cycles WHERE systeme_id = fr_id AND code = 'primaire'
  ON CONFLICT DO NOTHING;
  -- Primary (EN)
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'primary', id FROM public.cycles WHERE systeme_id = en_id AND code = 'primary'
  ON CONFLICT DO NOTHING;
  -- Collège général (FR) — 1er cycle
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'college_general', id FROM public.cycles WHERE systeme_id = fr_id AND code = 'secondaire_1_general'
  ON CONFLICT DO NOTHING;
  -- Lycée général (FR) — 1er + 2nd cycle
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'lycee_general', id FROM public.cycles WHERE systeme_id = fr_id AND code IN ('secondaire_1_general','secondaire_2_general')
  ON CONFLICT DO NOTHING;
  -- Secondary School (EN) — 1st cycle
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'secondary_school', id FROM public.cycles WHERE systeme_id = en_id AND code = 'secondary_1'
  ON CONFLICT DO NOTHING;
  -- High School (EN) — 1st + 2nd cycle
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'high_school', id FROM public.cycles WHERE systeme_id = en_id AND code IN ('secondary_1','secondary_2')
  ON CONFLICT DO NOTHING;
  -- Collège technique (FR)
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'college_technique', id FROM public.cycles WHERE systeme_id = fr_id AND code = 'secondaire_1_technique'
  ON CONFLICT DO NOTHING;
  -- Lycée technique (FR)
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'lycee_technique', id FROM public.cycles WHERE systeme_id = fr_id AND code IN ('secondaire_1_technique','secondaire_2_technique')
  ON CONFLICT DO NOTHING;
  -- Technical College (EN)
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'technical_college', id FROM public.cycles WHERE systeme_id = en_id AND code = 'technical_1'
  ON CONFLICT DO NOTHING;
  -- Technical High School (EN)
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'technical_high_school', id FROM public.cycles WHERE systeme_id = en_id AND code IN ('technical_1','technical_2')
  ON CONFLICT DO NOTHING;
  -- Lycée bilingue (FR+EN) — both systems, 1st+2nd cycle general
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'lycee_bilingue', id FROM public.cycles WHERE systeme_id = fr_id AND code IN ('secondaire_1_general','secondaire_2_general')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'lycee_bilingue', id FROM public.cycles WHERE systeme_id = en_id AND code IN ('secondary_1','secondary_2')
  ON CONFLICT DO NOTHING;
  -- Formation professionnelle (FR+EN)
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'formation_pro', id FROM public.cycles WHERE systeme_id = fr_id AND code = 'formation_pro'
  ON CONFLICT DO NOTHING;
  INSERT INTO public.type_etablissement_cycles (type_code, cycle_id)
  SELECT 'formation_pro', id FROM public.cycles WHERE systeme_id = en_id AND code = 'vocational'
  ON CONFLICT DO NOTHING;
END $$;
