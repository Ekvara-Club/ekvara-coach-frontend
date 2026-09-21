// Libellés coach des statuts de préparation (statut interne du coach, jamais
// une inscription officielle). Vocabulaire réel : PREPARATION_STATUSES.
const PREPARATION_STATUS_LABELS: Record<string, string> = {
  envisage: 'Envisagé',
  selectionne: 'Sélectionné',
  pret: 'Prêt',
  forfait: 'Forfait',
};

export function formatPreparationStatus(status: string): string {
  return PREPARATION_STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

// "Senior · -68kg" : jamais de séparateur flanqué d'une valeur absente.
export function formatPlannedCategories(ageCategory: string | null, weightCategory: string | null): string | null {
  return [ageCategory, weightCategory].filter(Boolean).join(' · ') || null;
}
