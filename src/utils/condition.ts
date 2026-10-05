import type { CoachAthleteCondition } from '../types/coach';

// Libellés de l'état de forme déclaré par l'athlète (valeurs backend non
// accentuées). Jamais un jugement : uniquement ce que l'athlète a déclaré.
const LABELS: Record<string, string> = {
  actif: 'Actif',
  malade: 'Malade',
  blesse: 'Blessé',
  absent: 'Absent',
};

export function conditionLabel(status: string): string {
  return LABELS[status] ?? status;
}

export function isUnavailable(condition: CoachAthleteCondition | undefined): boolean {
  return condition !== undefined && condition.status !== 'actif';
}

// Date métier YYYY-MM-DD -> "20 octobre", sans décalage de fuseau.
export function formatConditionReturn(expectedReturn: string): string {
  const [year, month, day] = expectedReturn.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

// "Entorse cheville · retour prévu le 20 octobre" (vide si rien de précisé).
export function conditionDetails(condition: CoachAthleteCondition): string {
  return [condition.note, condition.expectedReturn ? `retour prévu le ${formatConditionReturn(condition.expectedReturn)}` : null]
    .filter(Boolean)
    .join(' · ');
}
