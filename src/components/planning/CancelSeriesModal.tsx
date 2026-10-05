import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { cancelCoachTrainingSeriesUpcoming } from '../../services/coach.api';

interface CancelSeriesModalProps {
  seriesId: string;
  trainingTitle: string;
  onClose: () => void;
  onCancelled: () => void;
}

// "Annuler la suite" d'une séance récurrente : même annulation DOUCE que
// CancelTrainingModal, appliquée à toutes les occurrences encore à venir de
// la série — jamais les séances passées ni leurs présences (voir
// CoachTrainingsRepository.cancelUpcomingInSeries).
function CancelSeriesModal({ seriesId, trainingTitle, onClose, onCancelled }: CancelSeriesModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await cancelCoachTrainingSeriesUpcoming(seriesId);
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Annuler la série ${trainingTitle} ?`} onClose={onClose}>
      <div className="space-y-4 p-5">
        <p className="text-sm text-ekvara-black/70">
          Toutes les séances à venir de cette série seront annulées pour les athlètes concernés. Les séances passées et
          leurs présences restent inchangées.
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
            {submitting ? 'Annulation...' : 'Annuler la série'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CancelSeriesModal;
