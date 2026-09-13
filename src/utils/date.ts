// Calcul purement présentationnel (ticket §18), même convention que le
// backend (src/coach/dashboard-date.util.ts : comparaison à minuit UTC) —
// jamais une nouvelle règle métier, seulement l'affichage d'une donnée déjà
// fournie par l'API (startDate) là où le backend ne renvoie pas déjà
// daysUntil (cas de upcomingCompetitions, vue groupée).
export function daysUntil(dateIso: string, from: Date = new Date()): number {
  const target = new Date(dateIso);
  const targetMidnight = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const fromMidnight = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return Math.round((targetMidnight - fromMidnight) / (24 * 60 * 60 * 1000));
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return "aujourd'hui";
  if (days < 0) return 'passé';
  return `J-${days}`;
}

export function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Convention horaire unique de l'app (ticket #6 §21) : "20h30", jamais
// "20:30" — auparavant dupliquée à l'identique dans TrainingRow.tsx et
// TrainingDetailModal.tsx, et divergente (format ":", via toLocaleString)
// dans PreparationSection.tsx.
export function formatTime(dateIso: string): string {
  const date = new Date(dateIso);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}h${minutes}`;
}
