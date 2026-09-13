import type { CoachAttentionReasonType } from '../types/coach';

// Traduction UI des raisons backend (dashboard global ticket §19 + dashboard
// groupe ticket §21-26) — jamais une nouvelle raison inventée côté frontend,
// uniquement le libellé. Jamais de jugement ("mauvais élève", "à risque") :
// uniquement des faits (ticket §26).
const LABELS: Record<CoachAttentionReasonType, string> = {
  WEIGHT_ABOVE_TARGET: "Au-dessus de l'objectif",
  WEIGHT_BELOW_TARGET: "Sous l'objectif",
  NO_WEIGHT_TARGET: 'Objectif de poids non défini',
  METRIC_DECLINING: 'Capacité(s) en baisse',
  NO_METRIC_DATA: 'Pas encore évalué',
  ATTENDANCE_LOW: 'Assiduité faible',
  GOAL_OVERDUE: 'Objectif arrivé à échéance',
  PREPARATION_FORFAIT: 'Préparation : forfait',
};

export function attentionReasonLabel(type: CoachAttentionReasonType): string {
  return LABELS[type];
}
