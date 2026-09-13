export function athleteName(athlete: { firstName: string | null; lastName: string | null }): string {
  return [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') || 'Athlète';
}

// GET /coach/athletes et GET /coach/groups/:id renvoient prenom/nom (champs
// bruts app_user), pas firstName/lastName (forme dashboard) — voir
// CoachAthleteRosterItem/CoachGroupMember dans types/coach.ts.
export function rosterAthleteName(athlete: { prenom: string | null; nom: string | null }): string {
  return [athlete.prenom, athlete.nom].filter(Boolean).join(' ') || 'Athlète';
}

export function formatWeight(kg: number): string {
  return `${kg.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
}

// Signe explicite (+/-), jamais de valeur absolue trompeuse (même principe
// que le backend, WeightsService : la différence garde son signe).
export function formatWeightDifference(diff: number): string {
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
}
