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
    <div className={`flex items-start justify-between gap-2 border-l-2 py-1 pl-3 ${isCancelled ? 'border-gray-200 opacity-50' : 'border-gray-300'}`}>
      <button type="button" onClick={onOpenDetail} className="min-w-0 flex-1 text-left">
        <p className="font-display text-sm font-bold text-ekvara-black">
          {formatTime(training.startAt)}
          {training.endAt && (
            <>
              {' '}
              <span className="font-sans text-xs font-normal text-ekvara-black/50">&rarr;</span>{' '}
              {formatTime(training.endAt)}
            </>
          )}
        </p>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ekvara-black">{training.title}</p>
        {training.location && <p className="mt-0.5 text-xs text-ekvara-black/50">{training.location}</p>}
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
        <DropdownMenu
          triggerLabel={`Actions pour la séance ${training.title}`}
          items={[{ label: 'Annuler la séance', onSelect: onRequestCancel, destructive: true }]}
        />
      )}
    </div>
  );
}

export default TrainingRow;
