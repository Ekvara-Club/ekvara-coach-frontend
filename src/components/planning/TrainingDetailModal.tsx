import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { CoachTrainingDetail } from '../../types/coach';
import { athleteName } from '../../utils/format';
import { formatDate, formatTime } from '../../utils/date';
import { getCoachTrainingAttendance } from '../../services/coach.api';

interface TrainingDetailModalProps {
  training: CoachTrainingDetail;
  onClose: () => void;
  onEditContent: () => void;
  onEditAssignments: () => void;
  onCancelTraining: () => void;
  onManageAttendance: () => void;
}

const CANCELLED_STATUS = 'annule';

// Ticket #4 §13. Ne fait aucun fetch lui-même : reçoit `training` déjà
// chargé par PlanningPage, pour ne jamais imbriquer une seconde <Modal>
// quand une action ouvre TrainingFormModal/AssignmentsModal/
// CancelTrainingModal (celles-ci REMPLACENT cette modale, ne s'empilent
// jamais dessus — même contrainte que MetricDetailModal, ticket #3).
//
// Exception ticket "Présences Coach V1" §18 : le compteur "X / Y renseignées"
// n'existe dans aucune forme déjà chargée par PlanningPage (CoachTrainingDetail
// ne porte pas l'état des présences) — un fetch léger dédié ici est
// préférable à élargir le contrat GET /coach/trainings/:id partagé par
// l'app athlète pour un simple compteur d'affichage. Seulement pour une
// séance NI future NI annulée (§8/§9 : pas de saisie possible dans ces cas,
// donc pas de compteur pertinent à afficher).
function TrainingDetailModal({ training, onClose, onEditContent, onEditAssignments, onCancelTraining, onManageAttendance }: TrainingDetailModalProps) {
  const isCancelled = training.status === CANCELLED_STATUS;
  const isFuture = new Date(training.startAt).getTime() > Date.now();
  const { athletes, groups, athleteCount } = training.assignments;

  const [recordedCount, setRecordedCount] = useState<number | null>(null);

  useEffect(() => {
    if (isCancelled || isFuture || athleteCount === 0) return;
    let cancelled = false;
    getCoachTrainingAttendance(training.id)
      .then((sheet) => {
        if (!cancelled) setRecordedCount(sheet.athletes.filter((a) => a.attendance !== null).length);
      })
      .catch(() => {
        // Section indépendante (même discipline que les entries Martial
        // Events) : une erreur ici ne bloque jamais le reste de la fiche.
      });
    return () => {
      cancelled = true;
    };
  }, [training.id, isCancelled, isFuture, athleteCount]);

  return (
    <Modal title={training.title} onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
        {isCancelled && (
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-black/60">Séance annulée</p>
        )}

        <div>
          <p className="text-sm text-ekvara-black/70">{formatDate(training.startAt)}</p>
          <p className="font-display text-lg font-bold text-ekvara-black">
            {formatTime(training.startAt)}
            {training.endAt && (
              <>
                {' '}
                <span className="font-sans text-sm font-normal text-ekvara-black/50">&rarr;</span> {formatTime(training.endAt)}
              </>
            )}
          </p>
          {(training.type || training.subType || training.level) && (
            <p className="mt-1 text-sm text-ekvara-black/60">
              {[training.type, training.subType, training.level].filter(Boolean).join(' · ')}
            </p>
          )}
          {training.location && <p className="mt-1 text-sm text-ekvara-black/60">{training.location}</p>}
        </div>

        {training.description && <p className="text-sm text-ekvara-black/70">{training.description}</p>}

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">
            {athleteCount} {athleteCount > 1 ? 'athlètes concernés' : 'athlète concerné'}
          </p>
          {groups.length > 0 && (
            <p className="mt-1 text-sm text-ekvara-black/70">{groups.map((g) => g.name).join(', ')}</p>
          )}
          {athletes.length > 0 && (
            <ul className="mt-2 divide-y divide-gray-100">
              {athletes.map((athlete) => (
                <li key={athlete.id} className="py-1.5 text-sm text-ekvara-black">
                  {athleteName(athlete)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {!isCancelled && athleteCount > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">Présences</p>
            {isFuture ? (
              <p className="mt-1 text-sm text-ekvara-black/60">Présences disponibles le jour de la séance.</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-ekvara-black/70">
                  {recordedCount === null ? '...' : `${recordedCount} / ${athleteCount}`} renseignées
                </p>
                <Button type="button" variant="secondary" className="mt-2" onClick={onManageAttendance}>
                  Gérer les présences
                </Button>
              </>
            )}
          </div>
        )}

        {!isCancelled && (
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="secondary" onClick={onEditContent}>
              Modifier la séance
            </Button>
            <Button type="button" variant="secondary" onClick={onEditAssignments}>
              Modifier les destinataires
            </Button>
            <Button type="button" variant="ghost" className="text-red-600" onClick={onCancelTraining}>
              Annuler la séance
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default TrainingDetailModal;
