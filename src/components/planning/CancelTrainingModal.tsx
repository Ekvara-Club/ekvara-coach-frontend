import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { cancelCoachTraining } from '../../services/coach.api';

interface CancelTrainingModalProps {
  trainingId: string;
  trainingTitle: string;
  onClose: () => void;
  onCancelled: () => void;
}

// Ticket #4 §17 : annulation DOUCE côté backend (DELETE ne supprime rien,
// voir CoachTrainingsRepository.cancel) — le wording ne dit jamais
// "supprimer définitivement".
function CancelTrainingModal({ trainingId, trainingTitle, onClose, onCancelled }: CancelTrainingModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await cancelCoachTraining(trainingId);
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Annuler ${trainingTitle} ?`} onClose={onClose}>
      <div className="space-y-4 p-5">
        <p className="text-sm text-ekvara-black/70">
          Cette séance ne sera plus considérée comme à venir pour les athlètes concernés.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting} className="flex-1">
            Retour
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} disabled={submitting} className="flex-1">
            {submitting ? 'Annulation...' : 'Annuler la séance'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CancelTrainingModal;
