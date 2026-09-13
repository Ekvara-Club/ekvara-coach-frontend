import { useState, type FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { addCoachAthlete, ApiError } from '../../services/coach.api';

interface AddAthleteModalProps {
  onClose: () => void;
  onAdded: () => void;
}

// Mappe par code HTTP plutôt que par texte backend brut (ticket #2 §8) :
// les 3 codes gérés correspondent exactement aux 3 exceptions levées par
// CoachService.addAthleteByEmail (404/400/409, voir coach.service.ts).
function mapAddAthleteError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'Aucun compte ne correspond à cet email.';
    if (error.status === 400) return "Ce compte n'a pas de profil athlète.";
    if (error.status === 409) return 'Cet athlète est déjà rattaché à ton espace coach.';
  }
  return 'Une erreur est survenue. Réessaie.';
}

function AddAthleteModal({ onClose, onAdded }: AddAthleteModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await addCoachAthlete(email.trim());
      onAdded();
      onClose();
    } catch (err) {
      setError(mapAddAthleteError(err));
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Ajouter un athlète" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
        <div>
          <label htmlFor="athlete-email" className="mb-1.5 block text-sm font-medium text-ekvara-black">
            Email de l'athlète
          </label>
          <input
            id="athlete-email"
            name="email"
            type="email"
            autoComplete="off"
            autoFocus
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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

export default AddAthleteModal;
