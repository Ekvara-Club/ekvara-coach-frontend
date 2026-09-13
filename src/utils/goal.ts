import type { GoalStatus } from '../types/coach';

// "long_terme" -> "long terme" : pure présentation, jamais l'underscore brut
// affiché (même choix que PrimaryGoalPanel/GoalSummaryCard, EkvaraFrontend).
// `type` reste un VARCHAR(50) libre côté backend (aucun enum, aucune liste
// fixe en base) : ne jamais construire un <select> de types inventés.
export function formatGoalType(type: string): string {
  return type.replace(/_/g, ' ');
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  en_cours: 'En cours',
  atteint: 'Atteint',
  abandonne: 'Abandonné',
};
