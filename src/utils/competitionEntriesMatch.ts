import type { CompetitionEntryCategory } from '../types/competition-entries';

// Portage de EkvaraFrontend/src/utils/competitionEntriesMatch.ts
// (findMyEntryCategory), étendu pour PLUSIEURS catégories simultanées côté
// coach (un roster couvre souvent plusieurs (ageCategory, weightCategory)
// sur une même compétition, ticket §13 — "côté athlete: une seule Ma
// catégorie, côté coach: plusieurs catégories du roster") au lieu d'une
// seule côté athlète. Même prudence strictement conservée : correspondance
// UNIQUEMENT si non ambiguë, jamais un choix arbitraire, jamais le genre
// utilisé comme signal (vocabulaires non directement comparables).
function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase();
}

function fieldsMatch(participationValue: string | null, categoryValue: string | null): boolean {
  if (participationValue === null && categoryValue === null) return true;
  if (participationValue === null || categoryValue === null) return false;
  return normalizeForMatch(participationValue) === normalizeForMatch(categoryValue);
}

export function findEntryCategory(
  categories: CompetitionEntryCategory[],
  ageCategory: string | null,
  weightCategory: string | null,
): CompetitionEntryCategory | null {
  if (ageCategory === null && weightCategory === null) return null;

  const matches = categories.filter(
    (category) => fieldsMatch(ageCategory, category.ageCategory) && fieldsMatch(weightCategory, category.weightCategory),
  );

  return matches.length === 1 ? matches[0] : null;
}

export interface CoachCategoryGroup {
  ageCategory: string | null;
  weightCategory: string | null;
  athleteIds: string[];
}

// Regroupe les athlètes du coach par (ageCategory, weightCategory) distincts
// pour une compétition donnée (ticket §13) — un tuple par carte catégorie,
// jamais un doublon pour deux athlètes de la même catégorie.
export function groupAthletesByCategory(
  athletes: { id: string; ageCategory: string | null; weightCategory: string | null }[],
): CoachCategoryGroup[] {
  const byKey = new Map<string, CoachCategoryGroup>();
  for (const athlete of athletes) {
    const key = `${athlete.ageCategory ?? ''}|${athlete.weightCategory ?? ''}`;
    let group = byKey.get(key);
    if (!group) {
      group = { ageCategory: athlete.ageCategory, weightCategory: athlete.weightCategory, athleteIds: [] };
      byKey.set(key, group);
    }
    group.athleteIds.push(athlete.id);
  }
  return [...byKey.values()];
}
