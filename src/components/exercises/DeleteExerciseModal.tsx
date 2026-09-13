import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { deleteCoachExercise } from '../../services/coach.api';

interface DeleteExerciseModalProps {
  exerciseId: string;
  exerciseTitle: string;
  onClose: () => void;
  onDeleted: () => void;
}

// Ticket #5 §17 : ici, contrairement à l'annulation de séance (ticket #4),
// le backend fait une VRAIE suppression physique (DELETE /coach/exercises/
// :id, 204, voir CoachExercisesRepository.delete) — le wording le reflète
// ("Supprimer", jamais "Annuler").
function DeleteExerciseModal({ exerciseId, exerciseTitle, onClose, onDeleted }: DeleteExerciseModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await deleteCoachExercise(exerciseId);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Supprimer ${exerciseTitle} ?`} onClose={onClose}>
      <div className="space-y-4 p-5">
        <p className="text-sm text-ekvara-black/70">
          Cet exercice ne sera plus disponible pour les athlètes auxquels il était publié.
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
            {submitting ? 'Suppression...' : "Supprimer l'exercice"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteExerciseModal;
