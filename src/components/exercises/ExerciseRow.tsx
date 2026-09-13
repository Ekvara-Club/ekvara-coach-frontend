import type { CoachExerciseSummary } from '../../types/coach';
import { getExerciseTypeLabel, getExerciseLevelLabel } from '../../utils/exerciseOptions';

interface ExerciseRowProps {
  exercise: CoachExerciseSummary;
  index: number;
  onSelect: () => void;
}

// Ledger éditorial (ticket #5 §4/§22), aligné ticket #6 §9 sur la même
// convention numéro/padding/hover que AthletesPage/GroupsPage (auparavant :
// numéro 2x plus grand, py-5 au lieu de py-4, bordure par ligne au lieu de
// divide-y sur le conteneur — trois écarts visuels réels, corrigés ici).
// Toute la ligne est un bouton (§24) — pas de "…" séparé, les 3 actions
// vivent dans la modale de détail (§11), pas sur la ligne elle-même.
function ExerciseRow({ exercise, index, onSelect }: ExerciseRowProps) {
  const typeLabel = getExerciseTypeLabel(exercise.type);
  const levelLabel = getExerciseLevelLabel(exercise.level);
  const metaLine = [typeLabel, levelLabel].filter(Boolean).join(' · ');
  const number = String(index + 1).padStart(2, '0');
  const groupsLabel = exercise.groups.map((g) => g.name).join(' + ');
  const audienceLabel = [groupsLabel || null, `${exercise.athleteCount} ${exercise.athleteCount > 1 ? 'athlètes' : 'athlète'}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="group flex w-full items-start gap-4 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <span className="w-6 flex-shrink-0 font-display text-sm text-ekvara-black/30" aria-hidden="true">
          {number}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold uppercase tracking-tight text-ekvara-black">{exercise.title}</h3>
          {metaLine && <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-ekvara-muted">{metaLine}</p>}
          {exercise.panelTechnique && (
            <p className="text-xs font-semibold uppercase tracking-wide text-ekvara-black/40">{exercise.panelTechnique}</p>
          )}
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ekvara-black/60">{audienceLabel}</p>
        </div>

        <span
          className="flex-shrink-0 self-center text-ekvara-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ekvara-black"
          aria-hidden="true"
        >
          &rarr;
        </span>
      </button>
    </li>
  );
}

export default ExerciseRow;
