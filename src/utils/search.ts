// Recherche 100% frontend (ticket #2 §5) : aucune requête backend par
// frappe. Normalise casse + accents pour que "elea" trouve "Éléa".
const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function normalizeForSearch(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS_REGEX, '').toLowerCase().trim();
}
