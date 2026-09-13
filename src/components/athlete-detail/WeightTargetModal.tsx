import { useState, type FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { createCoachWeightTarget } from '../../services/coach.api';
import type { WeightSummaryView } from '../../types/coach';

interface WeightTargetModalProps {
  athleteId: string;
  currentTarget: WeightSummaryView['target'];
  onClose: () => void;
  onSaved: () => void;
}

// Ticket #3 §7 : uniquement weight + targetDate. Le vrai contrat backend
// (CreateWeightTargetDto) accepte aussi competitionId, mais aucune liste
// propre des compétitions de l'athlète n'est disponible facilement (le
// dashboard n'expose qu'UNE prochaine compétition, pas la liste des
// participations) — construire un <select> reviendrait à inventer une
// donnée. V1 volontairement limitée à weight + targetDate, comme demandé.
function WeightTargetModal({ athleteId, currentTarget, onClose, onSaved }: WeightTargetModalProps) {
  const [weight, setWeight] = useState(currentTarget ? String(currentTarget.weight) : '');
  const [targetDate, setTargetDate] = useState(currentTarget?.targetDate?.slice(0, 10) ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedWeight = Number(weight.trim().replace(',', '.'));
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setError('Le poids doit être un nombre positif.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload: { weight: number; targetDate?: string } = { weight: parsedWeight };
      if (targetDate.trim() !== '') payload.targetDate = targetDate;

      await createCoachWeightTarget(athleteId, payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Modifier l'objectif de poids" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
        <div>
          <label htmlFor="weight-target-value" className="mb-1.5 block text-sm font-medium text-ekvara-black">
            Poids cible (kg)
          </label>
          <input
            id="weight-target-value"
            type="number"
            min={0.01}
            step="any"
            autoFocus
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            placeholder="74"
            className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
          />
        </div>

        <div>
          <label htmlFor="weight-target-date" className="mb-1.5 block text-sm font-medium text-ekvara-black">
            Date cible (optionnel)
          </label>
          <input
            id="weight-target-date"
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={submitting} className="w-full">
          {submitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </form>
    </Modal>
  );
}

export default WeightTargetModal;
