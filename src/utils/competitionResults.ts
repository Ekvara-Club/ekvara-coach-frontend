import type { CoachCompetitionResultView } from '../types/coach';

// Portage exact de EkvaraFrontend/src/utils/participationStats.ts
// (hasCompetitionResult/isPodium) — le backend coach n'a jamais implémenté
// cette règle (confirmé par audit direct du backend, ticket #7 §16 :
// "réutiliser les règles existantes, pas de nouveau calcul de podium"), elle
// n'existe que côté frontend athlète. Reproduite ici à l'identique (mêmes
// seuils, même traitement null-vs-zéro) plutôt qu'inventée, puisque les deux
// apps sont des dépôts séparés et ne peuvent pas partager ce fichier.
export function hasCompetitionResult(result: CoachCompetitionResultView): boolean {
  return (
    result.classement !== null ||
    result.medaille !== null ||
    (result.victoires !== null && result.victoires > 0) ||
    (result.defaites !== null && result.defaites > 0)
  );
}

export function isPodium(result: CoachCompetitionResultView): boolean {
  const hasTopClassement = result.classement !== null && result.classement >= 1 && result.classement <= 3;
  return hasTopClassement || result.medaille !== null;
}

export interface CompetitionResultSummary {
  athleteCount: number;
  disputed: number;
  podiums: number;
  wins: number;
  losses: number;
}

// Résumé coach pour une compétition passée (ticket §16 : "3 athlètes, 1
// podium, 7 victoires, 4 défaites") — disputed ne compte que les athlètes
// avec un résultat réellement renseigné, jamais une inscription passée sans
// signal comme une défaite implicite (même règle que computeCareerStats
// côté athlète).
export function summarizeCompetitionResults(
  athletes: { result: CoachCompetitionResultView }[],
): CompetitionResultSummary {
  const disputed = athletes.filter((a) => hasCompetitionResult(a.result));
  return {
    athleteCount: athletes.length,
    disputed: disputed.length,
    podiums: disputed.filter((a) => isPodium(a.result)).length,
    wins: disputed.reduce((sum, a) => sum + (a.result.victoires ?? 0), 0),
    losses: disputed.reduce((sum, a) => sum + (a.result.defaites ?? 0), 0),
  };
}
