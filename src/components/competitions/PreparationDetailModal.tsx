import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { getCoachAthleteDashboard, createCoachCompetitionPreparation, updateCoachCompetitionPreparation, ApiError } from '../../services/coach.api';
import type { CoachCompetitionDetailAthleteView, CoachCompetitionRef, PreparationStatus } from '../../types/coach';
import { PREPARATION_STATUSES } from '../../types/coach';
import { athleteName, formatWeight } from '../../utils/format';
import { formatDate } from '../../utils/date';
import { LoadingState } from '../ui/PageState';

const STATUS_LABELS: Record<PreparationStatus, string> = {
  envisage: 'Envisagé',
  selectionne: 'Sélectionné',
  pret: 'Prêt',
  forfait: 'Forfait',
};

const inputClass =
  'mt-1 w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40';

interface PreparationDetailModalProps {
  competition: CoachCompetitionRef;
  athlete: CoachCompetitionDetailAthleteView;
  onClose: () => void;
  onSaved: () => void;
  onRequestRemove: () => void;
}

// Ticket §14. Une seule modale directement éditable (jamais un mode
// lecture/édition séparé comme TrainingDetailModal+TrainingFormModal — ici
// les champs modifiables sont peu nombreux et déjà pré-remplis, un
// aller-retour supplémentaire n'apporterait rien). Poids actuel/objectif lus
// depuis GET /coach/athletes/:id/dashboard (ticket §10 : jamais dupliqué
// depuis weight_target, jamais un nouvel endpoint).
//
// Double mode CREATE/UPDATE : un athlète avec une participation officielle
// mais SANS préparation (jamais proposé par "+ Ajouter un athlète", qui
// exclut déjà tout athlète présent sur la fiche) doit quand même pouvoir être
// préparé en cliquant sa ligne dans l'équipe EKVARA — cette modale sert donc
// aussi de point d'entrée pour créer la préparation la première fois.
function PreparationDetailModal({ competition, athlete, onClose, onSaved, onRequestRemove }: PreparationDetailModalProps) {
  const preparation = athlete.preparation;
  const isCreate = preparation === null;

  const [status, setStatus] = useState<string>(preparation?.status ?? 'envisage');
  const [targetAgeCategory, setTargetAgeCategory] = useState(preparation?.targetAgeCategory ?? '');
  const [targetWeightCategory, setTargetWeightCategory] = useState(preparation?.targetWeightCategory ?? '');
  const [objective, setObjective] = useState(preparation?.objective ?? '');
  const [coachNote, setCoachNote] = useState(preparation?.coachNote ?? '');

  const [weight, setWeight] = useState<{ currentWeight: number | null; target: { weight: number; targetDate: string | null } | null } | null>(
    null,
  );
  const [weightLoading, setWeightLoading] = useState(true);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCoachAthleteDashboard(athlete.id)
      .then((dashboard) => {
        if (!cancelled) setWeight(dashboard.weight);
      })
      .catch(() => {
        // Section indépendante (même discipline que les entries Martial
        // Events, ticket §25) : une erreur ici ne bloque jamais l'édition
        // de la préparation elle-même.
      })
      .finally(() => {
        if (!cancelled) setWeightLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [athlete.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const fields = {
        status,
        targetAgeCategory: targetAgeCategory.trim() || undefined,
        targetWeightCategory: targetWeightCategory.trim() || undefined,
        objective: objective.trim() || undefined,
        coachNote: coachNote.trim() || undefined,
      };
      if (isCreate) {
        await createCoachCompetitionPreparation(competition.id, { athleteId: athlete.id, ...fields });
      } else {
        await updateCoachCompetitionPreparation(competition.id, preparation!.id, fields);
      }
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={athleteName(athlete)} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col overflow-y-auto p-5" noValidate>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">Compétition</p>
            <p className="mt-1 text-sm text-ekvara-black">{competition.name}</p>
          </div>

          {athlete.groups.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">Groupe(s)</p>
              <p className="mt-1 text-sm text-ekvara-black">{athlete.groups.map((g) => g.name).join(', ')}</p>
            </div>
          )}

          {/* Distinction préparation/inscription toujours visible (ticket
              §7/§8, jamais présentée comme une inscription confirmée). */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">Participation officielle</p>
            <p className="mt-1 text-sm text-ekvara-black">
              {athlete.hasOfficialParticipation
                ? [athlete.ageCategory, athlete.weightCategory].filter(Boolean).join(' · ') || 'Connue'
                : 'Inscription officielle non confirmée'}
            </p>
          </div>

          {!weightLoading && weight && (weight.currentWeight !== null || weight.target) && (
            <div className="grid grid-cols-2 gap-4">
              {weight.currentWeight !== null && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">Poids actuel</p>
                  <p className="mt-1 text-sm text-ekvara-black">{formatWeight(weight.currentWeight)}</p>
                </div>
              )}
              {weight.target && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">Objectif poids</p>
                  <p className="mt-1 text-sm text-ekvara-black">
                    {formatWeight(weight.target.weight)}
                    {weight.target.targetDate && ` — ${formatDate(weight.target.targetDate)}`}
                  </p>
                </div>
              )}
            </div>
          )}
          {weightLoading && <LoadingState label="Chargement du poids..." />}

          <div className="border-t border-gray-100 pt-4">
            <label htmlFor="prep-status" className="text-sm font-medium text-ekvara-black">
              Statut préparation
            </label>
            <select id="prep-status" value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              {PREPARATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prep-age" className="text-sm font-medium text-ekvara-black">
                Catégorie d'âge prévue
              </label>
              <input
                id="prep-age"
                type="text"
                value={targetAgeCategory}
                onChange={(event) => setTargetAgeCategory(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prep-weight" className="text-sm font-medium text-ekvara-black">
                Catégorie de poids prévue
              </label>
              <input
                id="prep-weight"
                type="text"
                value={targetWeightCategory}
                onChange={(event) => setTargetWeightCategory(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="prep-objective" className="text-sm font-medium text-ekvara-black">
              Objectif compétition
            </label>
            <textarea
              id="prep-objective"
              rows={2}
              placeholder="Ex. Atteindre les quarts, Podium..."
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="prep-note" className="text-sm font-medium text-ekvara-black">
              Note coach
            </label>
            <p className="mt-0.5 text-xs text-ekvara-black/50">Privée — jamais visible de l'athlète ni d'un autre coach.</p>
            <textarea
              id="prep-note"
              rows={3}
              placeholder="Ex. Attention aux débuts de combat."
              value={coachNote}
              onChange={(event) => setCoachNote(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {submitError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {submitError}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          {isCreate ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={onRequestRemove}
              className="text-sm text-red-600 underline decoration-red-600/30 underline-offset-2 hover:decoration-red-600"
            >
              Retirer de la préparation
            </button>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Enregistrement...' : isCreate ? 'Commencer la préparation' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default PreparationDetailModal;
