import { useState, type FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { addCoachGoalStep } from '../../services/coach.api';

interface AddGoalStepModalProps {
  athleteId: string;
  goalId: string;
  onClose: () => void;
  onAdded: () => void;
}

function AddGoalStepModal({ athleteId, goalId, onClose, onAdded }: AddGoalStepModalProps) {
  const [titre, setTitre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = titre.trim();
    if (!trimmed) {
      setError("Le titre de l'étape ne peut pas être vide.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await addCoachGoalStep(athleteId, goalId, { titre: trimmed });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Ajouter une étape" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
        <div>
          <label htmlFor="goal-step-titre" className="mb-1.5 block text-sm font-medium text-ekvara-black">
            Titre de l'étape
          </label>
          <input
            id="goal-step-titre"
            type="text"
            autoFocus
            required
            value={titre}
            onChange={(event) => setTitre(event.target.value)}
            className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={submitting} className="w-full">
          {submitting ? 'Ajout...' : 'Ajouter'}
        </Button>
      </form>
    </Modal>
  );
}

export default AddGoalStepModal;
