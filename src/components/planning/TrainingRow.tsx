import type { CoachTrainingSummary } from '../../types/coach';
import { formatTime } from '../../utils/date';
import DropdownMenu from '../ui/DropdownMenu';

interface TrainingRowProps {
  training: CoachTrainingSummary;
  onOpenDetail: () => void;
  onRequestCancel: () => void;
}

const CANCELLED_STATUS = 'annule';

// Porté depuis ActivityTrainingCard.tsx (EkvaraFrontend) — bordure gauche
// discrète plutôt qu'une card, pour rester dans l'esprit timeline (ticket #4
// §5/§27 : pas de couleur par groupe, pas de full-calendar). Une séance
// annulée n'est jamais mélangée visuellement (§18) : opacité réduite, badge
// textuel "Annulée" (jamais la couleur seule, §26), aucun menu d'action.
function TrainingRow({ training, onOpenDetail, onRequestCancel }: TrainingRowProps) {
  const isCancelled = training.status === CANCELLED_STATUS;

  return (
    <div className={`relative border-l-2 py-1 pl-2.5 ${isCancelled ? 'border-gray-200 pr-1 opacity-50' : 'border-gray-300 pr-9'}`}>
      <button type="button" onClick={onOpenDetail} className="w-full min-w-0 text-left">
        {/* Colonnes étroites (7 jours) : heure de début en gras, fin en petit
            sur la même ligne — jamais un horaire coupé sur deux lignes. */}
        <p className="whitespace-nowrap font-display text-sm font-bold tabular-nums text-ekvara-black">
          {formatTime(training.startAt)}
          {training.endAt && (
            <span className="ml-1 font-sans text-xs font-normal text-ekvara-black/50">&rarr; {formatTime(training.endAt)}</span>
          )}
        </p>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ekvara-black">{training.title}</p>
        {training.location && (
          <p className="mt-0.5 truncate text-xs text-ekvara-black/50" title={training.location}>
            {training.location}
          </p>
        )}
        {/* GET /coach/trainings (liste) ne renvoie que athleteCount, jamais
            les noms de groupe (voir CoachTrainingsService.toSummaryView) —
            afficher "Élite · 8 athlètes" ici demanderait un GET détail par
            séance visible, donc N requêtes par semaine. Les groupes sources
            apparaissent dans la modale de détail, qui les a réellement. */}
        <p className="mt-0.5 text-xs text-ekvara-black/50">
          {training.athleteCount} {training.athleteCount > 1 ? 'athlètes' : 'athlète'}
        </p>
        {training.seriesId && !isCancelled && (
          <p className="mt-0.5 text-xs text-ekvara-black/50">Récurrente</p>
        )}
        {isCancelled && (
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ekvara-black/60">Annulée</p>
        )}
      </button>

      {!isCancelled && (
        <div className="absolute -right-1.5 -top-2">
          <DropdownMenu
            triggerLabel={`Actions pour la séance ${training.title}`}
            items={[{ label: 'Annuler la séance', onSelect: onRequestCancel, destructive: true }]}
          />
        </div>
      )}
    </div>
  );
}

export default TrainingRow;
