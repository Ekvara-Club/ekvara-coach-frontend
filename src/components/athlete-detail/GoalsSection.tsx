import { useState } from 'react';
import type { Goal, GoalStatus } from '../../types/coach';
import { updateCoachGoalStatus, ApiError } from '../../services/coach.api';
import { formatGoalType, GOAL_STATUS_LABELS } from '../../utils/goal';
import { daysUntil, formatDate, formatDaysUntil } from '../../utils/date';
import Button from '../ui/Button';
import SectionLabel from '../ui/SectionLabel';
import DropdownMenu from '../ui/DropdownMenu';
import GoalRoadmap from './GoalRoadmap';
import CreateGoalModal from './CreateGoalModal';

interface GoalsSectionProps {
  athleteId: string;
  goals: Goal[];
  onChanged: () => void;
}

// Menu "…" (ticket §17) : mêmes 3 transitions que UpdateGoalStatusDto
// (en_cours/atteint/abandonne, voir goals/dto/update-goal-status.dto.ts).
// "Atteint" est terminal ici (aucune transition proposée depuis cet état),
// même restriction que GoalSummaryCard côté athlète (onReactivate uniquement
// depuis "abandonne").
function statusMenuItems(
  statut: GoalStatus,
  onChange: (next: GoalStatus) => void,
): { label: string; onSelect: () => void; destructive?: boolean }[] {
  if (statut === 'en_cours') {
    return [
      { label: 'Marquer atteint', onSelect: () => onChange('atteint') },
      { label: 'Abandonner', onSelect: () => onChange('abandonne'), destructive: true },
    ];
  }
  if (statut === 'abandonne') {
    return [{ label: 'Réactiver', onSelect: () => onChange('en_cours') }];
  }
  return [];
}

// Pill de statut : lime réservé à "atteint" (ticket §23, "completed" fait
// partie des 3 usages autorisés du lime) ; "abandonné" reste neutre, jamais
// rouge (ce n'est pas une action destructive, juste un état) — le libellé
// texte porte toujours l'information, jamais la couleur seule (ticket §22).
function StatusBadge({ statut }: { statut: GoalStatus }) {
  if (statut === 'atteint') {
    return (
      <span className="whitespace-nowrap rounded-full bg-ekvara-lime px-2.5 py-0.5 text-xs font-semibold text-ekvara-black">
        {GOAL_STATUS_LABELS[statut]}
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-ekvara-black/70">
      {GOAL_STATUS_LABELS[statut]}
    </span>
  );
}

function GoalRow({
  goal,
  onStatusChange,
  statusError,
}: {
  goal: Goal;
  onStatusChange: (goalId: string, next: GoalStatus) => void;
  statusError: string | null;
}) {
  const daysLabel = goal.dateCible && daysUntil(goal.dateCible) >= 0 ? formatDaysUntil(daysUntil(goal.dateCible)) : null;
  const progressLabel =
    goal.progress.percentage === null
      ? 'Aucune étape définie'
      : `${goal.progress.percentage} % · ${goal.progress.completed} / ${goal.progress.total} étapes`;
  const menuItems = statusMenuItems(goal.statut, (next) => onStatusChange(goal.id, next));

  return (
    <li className="py-4">
      {goal.type && (
        <p className="text-xs font-semibold uppercase tracking-wide text-ekvara-muted">{formatGoalType(goal.type)}</p>
      )}
      <div className="mt-1 flex items-start justify-between gap-4">
        <p className="font-display text-base font-bold text-ekvara-black">{goal.titre}</p>
        <div className="flex flex-shrink-0 items-center gap-2">
          <StatusBadge statut={goal.statut} />
          {daysLabel && (
            <span className="whitespace-nowrap rounded-full bg-ekvara-black px-2.5 py-0.5 text-xs font-semibold text-ekvara-surface">
              {daysLabel}
            </span>
          )}
          {menuItems.length > 0 && <DropdownMenu triggerLabel={`Actions pour l'objectif ${goal.titre}`} items={menuItems} />}
        </div>
      </div>
      {goal.dateCible && <p className="mt-1 text-xs text-ekvara-muted">{formatDate(goal.dateCible)}</p>}
      <p className="mt-2 text-sm text-ekvara-muted">{progressLabel}</p>
      {statusError && <p className="mt-1 text-sm text-red-600">{statusError}</p>}
    </li>
  );
}

// Ticket #3 §12-17 : "principal" = le premier objectif en_cours (la liste
// est déjà triée en_cours d'abord par le backend, voir
// GoalsService.findAllForAthlete). Tous les autres objectifs (y compris un
// éventuel 2e en_cours, atteints, abandonnés) vont dans "Autres objectifs" —
// une seule liste, pas 3 sous-sections rigides : le badge de statut porte
// déjà la distinction.
function GoalsSection({ athleteId, goals, onChanged }: GoalsSectionProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({});

  const primaryIndex = goals.findIndex((goal) => goal.statut === 'en_cours');
  const primary = primaryIndex >= 0 ? goals[primaryIndex] : null;
  const others = primary ? goals.filter((goal) => goal.id !== primary.id) : goals;

  function handleStatusChange(goalId: string, statut: GoalStatus) {
    setStatusErrors((current) => ({ ...current, [goalId]: '' }));
    updateCoachGoalStatus(athleteId, goalId, statut)
      .then(() => onChanged())
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : 'Une erreur est survenue. Réessaie.';
        setStatusErrors((current) => ({ ...current, [goalId]: message }));
      });
  }

  const primaryDaysLabel =
    primary?.dateCible && daysUntil(primary.dateCible) >= 0 ? formatDaysUntil(daysUntil(primary.dateCible)) : null;
  const primaryMenuItems = primary ? statusMenuItems(primary.statut, (next) => handleStatusChange(primary.id, next)) : [];

  return (
    <section aria-labelledby="goals-heading">
      <div className="flex items-center justify-between gap-4">
        <SectionLabel id="goals-heading">Objectif principal</SectionLabel>
        <Button type="button" variant="ghost" onClick={() => setCreateOpen(true)}>
          + Nouvel objectif
        </Button>
      </div>

      {primary ? (
        <div className="mt-4">
          {(primary.type || primaryDaysLabel) && (
            <div className="flex items-center justify-between gap-3">
              {primary.type && (
                <p className="text-xs font-semibold uppercase tracking-wide text-ekvara-muted">
                  {formatGoalType(primary.type)}
                </p>
              )}
              {primaryDaysLabel && (
                <span className="flex-shrink-0 whitespace-nowrap rounded-full bg-ekvara-black px-2.5 py-1 text-xs font-semibold text-ekvara-surface">
                  {primaryDaysLabel}
                </span>
              )}
            </div>
          )}

          <div className="mt-1 flex items-start justify-between gap-4">
            <h3 className="text-balance font-display text-xl font-extrabold tracking-tight text-ekvara-black sm:text-2xl">
              {primary.titre}
            </h3>
            {primaryMenuItems.length > 0 && (
              <DropdownMenu triggerLabel={`Actions pour l'objectif ${primary.titre}`} items={primaryMenuItems} />
            )}
          </div>

          {statusErrors[primary.id] && <p className="mt-2 text-sm text-red-600">{statusErrors[primary.id]}</p>}

          {primary.description && <p className="mt-3 text-sm text-ekvara-black/70">{primary.description}</p>}
          {primary.dateCible && <p className="mt-2 text-sm text-ekvara-muted">{formatDate(primary.dateCible)}</p>}

          {primary.progress.percentage === null ? (
            <p className="mt-6 text-sm text-ekvara-muted">Aucune étape définie</p>
          ) : (
            <div className="mt-6">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-3xl font-extrabold text-ekvara-black">
                  {primary.progress.percentage}%
                </span>
                <span className="text-sm text-ekvara-muted">
                  {primary.progress.completed} / {primary.progress.total} étapes
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-ekvara-lime"
                  style={{ width: `${primary.progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ekvara-black/55">Roadmap</h3>
            <div className="mt-4">
              <GoalRoadmap
                athleteId={athleteId}
                goalId={primary.id}
                steps={primary.steps}
                finalLabel={primary.titre}
                onChanged={onChanged}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ekvara-black/60">Aucun objectif en cours pour le moment.</p>
      )}

      {others.length > 0 && (
        <div className="mt-10">
          <SectionLabel>Autres objectifs</SectionLabel>
          <ul className="mt-2 divide-y divide-gray-100">
            {others.map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                onStatusChange={handleStatusChange}
                statusError={statusErrors[goal.id] || null}
              />
            ))}
          </ul>
        </div>
      )}

      {createOpen && (
        <CreateGoalModal athleteId={athleteId} onClose={() => setCreateOpen(false)} onCreated={onChanged} />
      )}
    </section>
  );
}

export default GoalsSection;
