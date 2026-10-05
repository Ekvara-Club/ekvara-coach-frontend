// Séances récurrentes : aperçu PUREMENT présentationnel ("13 séances, du …
// au …") affiché dans TrainingFormModal avant l'envoi. Mêmes règles de
// calendrier que le backend (src/coach/training-series.util.ts : début
// inclus, fin = même quantième N mois plus tard exclue, ramenée au dernier
// jour du mois) — le backend reste la seule source des séances réellement
// créées, jamais ce calcul.

export const SERIES_WEEKDAYS: { value: number; short: string; label: string }[] = [
  { value: 1, short: 'L', label: 'Lundi' },
  { value: 2, short: 'M', label: 'Mardi' },
  { value: 3, short: 'M', label: 'Mercredi' },
  { value: 4, short: 'J', label: 'Jeudi' },
  { value: 5, short: 'V', label: 'Vendredi' },
  { value: 6, short: 'S', label: 'Samedi' },
  { value: 7, short: 'D', label: 'Dimanche' },
];

export const SERIES_DURATIONS: { months: number; label: string }[] = [
  { months: 1, label: '1 mois' },
  { months: 3, label: '3 mois' },
  { months: 6, label: '6 mois' },
  { months: 12, label: '1 an' },
];

const DAY_MS = 86_400_000;

function parseDateOnly(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function addMonthsClamped(startMs: number, months: number): number {
  const start = new Date(startMs);
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const daysInTarget = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(start.getUTCDate(), daysInTarget));
}

// Jour ISO (1 = lundi ... 7 = dimanche) d'une date YYYY-MM-DD.
export function isoWeekdayOf(date: string): number {
  const day = new Date(parseDateOnly(date)).getUTCDay();
  return day === 0 ? 7 : day;
}

export interface SeriesPreview {
  count: number;
  first: Date | null;
  last: Date | null;
}

export function previewSeries(startDate: string, weekdays: number[], durationMonths: number): SeriesPreview {
  const selected = new Set(weekdays);
  const startMs = parseDateOnly(startDate);
  const endExclusive = addMonthsClamped(startMs, durationMonths);
  let count = 0;
  let first: number | null = null;
  let last: number | null = null;
  for (let current = startMs; current < endExclusive; current += DAY_MS) {
    const day = new Date(current).getUTCDay();
    if (!selected.has(day === 0 ? 7 : day)) continue;
    count += 1;
    first ??= current;
    last = current;
  }
  // Dates calendaires (minuit UTC) converties en dates locales pour
  // l'affichage, sans jamais décaler le jour.
  const toLocal = (ms: number | null) => {
    if (ms === null) return null;
    const d = new Date(ms);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };
  return { count, first: toLocal(first), last: toLocal(last) };
}
