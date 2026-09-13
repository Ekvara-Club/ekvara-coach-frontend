// Porté depuis EkvaraFrontend (src/utils/exerciseOptions.ts, ticket #5 §7) :
// mêmes valeurs/libellés que le flux athlete pour type_exercice/niveau —
// varchar libre côté backend (aucun enum Prisma), mais un seul vocabulaire
// pour coach et athlète, jamais deux listes divergentes.
export interface FilterOption {
  value: string;
  label: string;
}

export const EXERCISE_TYPE_OPTIONS: FilterOption[] = [
  { value: 'technique', label: 'Technique' },
  { value: 'physique', label: 'Physique' },
  { value: 'mobilite', label: 'Mobilité' },
  { value: 'reaction', label: 'Réaction' },
  { value: 'force', label: 'Force' },
  { value: 'vitesse', label: 'Vitesse' },
];

export const EXERCISE_LEVEL_OPTIONS: FilterOption[] = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
  { value: 'elite', label: 'Elite' },
];

export function getExerciseTypeLabel(type: string | null): string | null {
  if (!type) return null;
  return EXERCISE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function getExerciseLevelLabel(level: string | null): string | null {
  if (!level) return null;
  return EXERCISE_LEVEL_OPTIONS.find((option) => option.value === level)?.label ?? level;
}
