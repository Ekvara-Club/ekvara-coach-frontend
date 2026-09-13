import { useState } from 'react';
import { updateCoachGoalStep } from '../../services/coach.api';
import type { GoalStepView } from '../../types/coach';
import Button from '../ui/Button';
import AddGoalStepModal from './AddGoalStepModal';

interface GoalRoadmapProps {
  athleteId: string;
  goalId: string;
  steps: GoalStepView[];
  finalLabel: string;
  onChanged: () => void;
}

// Porté depuis GoalRoadmap.tsx (EkvaraFrontend, ticket #3 §14 : "même
// langage visuel que /objectifs athlete") : étape complétée = lime, étape à
// venir = neutre, marqueur final noir distinct. Seule différence : le coach
// peut aussi ajouter une étape ("+ Ajouter une étape", ticket §15).
function GoalRoadmap({ athleteId, goalId, steps, finalLabel, onChanged }: GoalRoadmapProps) {
  const [togglingStepId, setTogglingStepId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [addStepOpen, setAddStepOpen] = useState(false);

  function handleToggle(step: GoalStepView) {
    setToggleError(null);
    setTogglingStepId(step.id);

    updateCoachGoalStep(athleteId, goalId, step.id, !step.completed)
      .then(() => onChanged())
      .catch((err: Error) => setToggleError(err.message || "Impossible de mettre à jour l'étape."))
      .finally(() => setTogglingStepId(null));
  }

  return (
    <div>
      <ul className="flex flex-col">
        {steps.map((step) => (
          <li key={step.id} className="relative pb-8 pl-9">
            <span className="absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-px bg-gray-200" aria-hidden="true" />
            <button
              type="button"
              onClick={() => handleToggle(step)}
              disabled={togglingStepId === step.id}
              aria-label={
                step.completed ? `Marquer "${step.titre}" comme non terminée` : `Marquer "${step.titre}" comme terminée`
              }
              className={`absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
                step.completed
                  ? 'border-ekvara-lime bg-ekvara-lime text-ekvara-black'
                  : 'border-gray-300 bg-ekvara-surface text-transparent hover:border-gray-400'
              }`}
            >
              ✓
            </button>
            <p className="text-sm font-semibold text-ekvara-black">{step.titre}</p>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-ekvara-muted">
              {step.completed ? 'Terminée' : 'À venir'}
            </p>
          </li>
        ))}

        <li className="relative pl-9">
          <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ekvara-black bg-ekvara-black text-xs font-bold text-ekvara-surface">
            ◎
          </span>
          <p className="font-display text-base font-bold text-ekvara-black">{finalLabel}</p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ekvara-muted">Objectif final</p>
        </li>
      </ul>

      {toggleError && <p className="mt-2 text-sm text-red-600">{toggleError}</p>}

      <Button type="button" variant="ghost" className="mt-4" onClick={() => setAddStepOpen(true)}>
        + Ajouter une étape
      </Button>

      {addStepOpen && (
        <AddGoalStepModal
          athleteId={athleteId}
          goalId={goalId}
          onClose={() => setAddStepOpen(false)}
          onAdded={onChanged}
        />
      )}
    </div>
  );
}

export default GoalRoadmap;
