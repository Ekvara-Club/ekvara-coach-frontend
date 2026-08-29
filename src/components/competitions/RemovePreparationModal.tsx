import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { deleteCoachCompetitionPreparation, ApiError } from '../../services/coach.api';

interface RemovePreparationModalProps {
  competitionId: string;
  preparationId: string;
  athleteName: string;
  hasOfficialParticipation: boolean;
  onClose: () => void;
  onRemoved: () => void;
}

// CRITIQUE (ticket §15) : "Retirer de la préparation", jamais "Retirer de la
// compétition" — ce wording ne doit jamais laisser croire qu'une inscription
// officielle ou l'appartenance au roster est touchée. Suppression physique
// de la seule ligne coach_competition_preparation (ticket §19).
function RemovePreparationModal({ competitionId, preparationId, athleteName, hasOfficialParticipation, onClose, onRemoved }: RemovePreparationModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await deleteCoachCompetitionPreparation(competitionId, preparationId);
      onRemoved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Retirer ${athleteName} de la préparation ?`} onClose={onClose}>
      <div className="space-y-4 p-5">
        <p className="text-sm text-ekvara-black/70">
          Seule la préparation interne EKVARA sera supprimée.
          {hasOfficialParticipation
            ? " L'inscription officielle de cet athlète à cette compétition n'est pas concernée."
            : " Cet athlète n'a pas d'inscription officielle connue à cette compétition — rien d'autre n'est affecté."}
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting} className="flex-1">
            Annuler
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} disabled={submitting} className="flex-1">
            {submitting ? 'Retrait...' : 'Retirer de la préparation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default RemovePreparationModal;
