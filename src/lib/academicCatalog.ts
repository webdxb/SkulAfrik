import { supabase } from './supabase';

export interface Systeme { id: string; code: string; name: string }
export interface Cycle { id: string; systeme_id: string; code: string; name: string; order_index: number }
export interface Niveau { id: string; cycle_id: string; code: string; name: string; order_index: number }
export interface Filiere { id: string; niveau_id: string; code: string; name: string }
export interface MatiereCatalog {
  id: string; systeme_id: string; cycle_id: string; niveau_id: string | null;
  name: string; coefficient: number; is_general: boolean;
}

export const ESTABLISHMENT_TYPES = [
  { code: 'maternelle', fr: 'Maternelle', en: 'Nursery' },
  { code: 'primaire', fr: 'Primaire', en: 'Primary' },
  { code: 'college_general', fr: 'Collège général', en: 'Secondary School' },
  { code: 'lycee_general', fr: 'Lycée général', en: 'High School' },
  { code: 'college_technique', fr: 'Collège technique', en: 'Technical College' },
  { code: 'lycee_technique', fr: 'Lycée technique', en: 'Technical High School' },
  { code: 'lycee_bilingue', fr: 'Lycée bilingue', en: 'Bilingual High School' },
  { code: 'formation_pro', fr: 'Centre de formation professionnelle', en: 'Vocational Training Center' },
] as const;

export type EstablishmentTypeCode = typeof ESTABLISHMENT_TYPES[number]['code'];

export async function fetchCyclesForTypes(typeCodes: string[], systemeCode: 'fr' | 'en') {
  const { data: tec } = await supabase
    .from('type_etablissement_cycles')
    .select('cycle_id, type_code, cycles!inner(id, systeme_id, code, name, order_index)')
    .in('type_code', typeCodes);
  const sys = await supabase.from('systemes').select('id').eq('code', systemeCode).maybeSingle();
  if (!sys.data) return [];
  const seen = new Set<string>();
  const result: Cycle[] = [];
  (tec || []).forEach((t: any) => {
    const c = t.cycles;
    if (c && c.systeme_id === sys.data!.id && !seen.has(c.id)) {
      seen.add(c.id);
      result.push(c as Cycle);
    }
  });
  return result.sort((a, b) => a.order_index - b.order_index);
}

export async function generateSchoolStructure(
  schoolId: string,
  academicYearId: string,
  typeCodes: string[],
  systemeCode: 'fr' | 'en'
): Promise<{ classesCreated: number; subjectsCreated: number }> {
  const cycles = await fetchCyclesForTypes(typeCodes, systemeCode);
  if (cycles.length === 0) return { classesCreated: 0, subjectsCreated: 0 };

  const { data: niveauxData } = await supabase
    .from('niveaux').select('*').in('cycle_id', cycles.map((c) => c.id)).order('order_index');
  const niveaux = (niveauxData || []) as Niveau[];

  const { data: matieresData } = await supabase
    .from('matieres_catalog').select('*').in('cycle_id', cycles.map((c) => c.id));
  const catalogMatieres = (matieresData || []) as MatiereCatalog[];

  const classRows = niveaux.map((n) => ({
    school_id: schoolId, name: n.name, level: n.code, niveau_id: n.id,
    academic_year_id: academicYearId, capacity: 40,
  }));
  let classesCreated = 0;
  if (classRows.length > 0) {
    const { data: insertedClasses, error } = await supabase.from('classes').insert(classRows).select('id, niveau_id');
    if (!error && insertedClasses) {
      classesCreated = insertedClasses.length;
      const uniqueSubjectNames = new Set<string>();
      catalogMatieres.forEach((m) => uniqueSubjectNames.add(m.name));
      const subjectRows = Array.from(uniqueSubjectNames).map((name) => {
        const m = catalogMatieres.find((mm) => mm.name === name)!;
        return { school_id: schoolId, name, coefficient: m.coefficient };
      });
      const { data: insertedSubjects } = await supabase.from('subjects').insert(subjectRows).select('id, name');
      const subjectsByName = new Map<string, string>();
      (insertedSubjects || []).forEach((s: any) => subjectsByName.set(s.name, s.id));

      const csRows: { class_id: string; subject_id: string }[] = [];
      insertedClasses.forEach((cls: any) => {
        const niveau = niveaux.find((n) => n.id === cls.niveau_id);
        if (!niveau) return;
        const cycleMatieres = catalogMatieres.filter((m) =>
          m.cycle_id === niveau.cycle_id && (m.niveau_id === null || m.niveau_id === niveau.id)
        );
        cycleMatieres.forEach((m) => {
          const subjId = subjectsByName.get(m.name);
          if (subjId) csRows.push({ class_id: cls.id, subject_id: subjId });
        });
      });
      if (csRows.length > 0) await supabase.from('class_subjects').insert(csRows);
      return { classesCreated, subjectsCreated: insertedSubjects?.length || 0 };
    }
  }
  return { classesCreated, subjectsCreated: 0 };
}
