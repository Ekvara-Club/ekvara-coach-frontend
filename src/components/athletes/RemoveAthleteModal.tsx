import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { removeCoachAthlete } from '../../services/coach.api';

interface RemoveAthleteModalProps {
  athleteId: string;
  athleteLabel: string;
  onClose: () => void;
  onRemoved: () => void;
}

// CTA "Retirer l'athlète", jamais "Supprimer" (ticket #2 §10) : le compte
// athlète n'est jamais détruit, seul le lien coach_athlete l'est — le
// backend retire aussi ses memberships de groupe côté coach dans la même
// opération (voir CoachRepository.removeCoachAthlete).
function RemoveAthleteModal({ athleteId, athleteLabel, onClose, onRemoved }: RemoveAthleteModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await removeCoachAthlete(athleteId);
      onRemoved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Retirer ${athleteLabel} du roster ?`} onClose={onClose}>
      <div className="space-y-4 p-5">
        <p className="text-sm text-ekvara-black/70">
          Il/elle ne sera plus rattaché(e) à ton espace coach. Ses données sportives ne seront pas supprimées.
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
            {submitting ? 'Retrait...' : "Retirer l'athlète"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default RemoveAthleteModal;
