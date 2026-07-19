/*
# SKUL AFRIK — Link academic catalog to tenant tables

## Changes
1. `classes`: add `niveau_id` (FK to niveaux), `filiere_id` (FK to filieres), `section` (fr/en for bilingual).
2. `students`: add `filiere_id`, `section` (fr/en for bilingual schools).
3. `academic_years`: add `terms_config` (jsonb) for configurable term breakdown.
All additive — no data loss.
*/

-- classes: link to catalog
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'niveau_id') THEN
    ALTER TABLE public.classes ADD COLUMN niveau_id uuid REFERENCES public.niveaux(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'filiere_id') THEN
    ALTER TABLE public.classes ADD COLUMN filiere_id uuid REFERENCES public.filieres(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'section') THEN
    ALTER TABLE public.classes ADD COLUMN section text CHECK (section IN ('fr','en') OR section IS NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS classes_niveau_id_idx ON public.classes(niveau_id);

-- students: filiere + section
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'filiere_id') THEN
    ALTER TABLE public.students ADD COLUMN filiere_id uuid REFERENCES public.filieres(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'section') THEN
    ALTER TABLE public.students ADD COLUMN section text CHECK (section IN ('fr','en') OR section IS NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS students_filiere_id_idx ON public.students(filiere_id);

-- academic_years: terms_config
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academic_years' AND column_name = 'terms_config') THEN
    ALTER TABLE public.academic_years ADD COLUMN terms_config jsonb NOT NULL DEFAULT '[{"key":"T1","name":"Trimestre 1"},{"key":"T2","name":"Trimestre 2"},{"key":"T3","name":"Trimestre 3"}]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academic_years' AND column_name = 'system_type') THEN
    ALTER TABLE public.academic_years ADD COLUMN system_type text NOT NULL DEFAULT 'trimester';
  END IF;
END $$;
