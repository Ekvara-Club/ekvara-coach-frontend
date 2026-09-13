import type { MetricStatus } from '../types/coach';

// Mêmes libellés que /progress (EkvaraFrontend, MetricsLedger.tsx) : même
// vocabulaire pour le coach et l'athlète.
export const METRIC_STATUS_LABELS: Record<MetricStatus, string> = {
  improved: 'En progression',
  stable: 'Stable',
  regressed: 'En baisse',
  unknown: 'Non évalué',
};

export function formatMetricPercentage(percentage: number): string {
  const sign = percentage > 0 ? '+' : '';
  return `${sign}${percentage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}
