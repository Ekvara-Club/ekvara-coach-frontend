import { useState, type FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { createCoachGoal } from '../../services/coach.api';

interface CreateGoalModalProps {
  athleteId: string;
  onClose: () => void;
  onCreated: () => void;
}

// Ticket #3 §13 : uniquement titre/type/description/dateCible — les seuls
// champs réellement acceptés par CreateGoalDto (voir goals/dto/create-goal.
// dto.ts). `type` reste un champ texte libre : pas de <select>, aucun enum
// de types n'existe côté backend (colonne VARCHAR(50) libre).
function CreateGoalModal({ athleteId, onClose, onCreated }: CreateGoalModalProps) {
  const [titre, setTitre] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [dateCible, setDateCible] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitre = titre.trim();
    if (!trimmedTitre) {
      setError("Le titre de l'objectif ne peut pas être vide.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload: { titre: string; type?: string; description?: string; dateCible?: string } = {
        titre: trimmedTitre,
      };
      if (type.trim() !== '') payload.type = type.trim();
      if (description.trim() !== '') payload.description = description.trim();
      if (dateCible.trim() !== '') payload.dateCible = dateCible;

      await createCoachGoal(athleteId, payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Nouvel objectif" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
        <div>
          <label htmlFor="goal-titre" className="mb-1.5 block text-sm font-medium text-ekvara-black">
            Titre
          </label>
          <input
            id="goal-titre"
            type="text"
            autoFocus
            required
            value={titre}
            onChange={(event) => setTitre(event.target.value)}
            className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
          />
        </div>

        <div>
          <label htmlFor="goal-type" className="mb-1.5 block text-sm font-medium text-ekvara-black">
            Type (optionnel)
          </label>
          <input
            id="goal-type"
            type="text"
            placeholder="ex. competition, technique..."
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
          />
        </div>

        <div>
          <label htmlFor="goal-description" className="mb-1.5 block text-sm font-medium text-ekvara-black">
            Description (optionnel)
          </label>
          <textarea
            id="goal-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
          />
        </div>

        <div>
          <label htmlFor="goal-date-cible" className="mb-1.5 block text-sm font-medium text-ekvara-black">
            Date cible (optionnel)
          </label>
          <input
            id="goal-date-cible"
            type="date"
            value={dateCible}
            onChange={(event) => setDateCible(event.target.value)}
            className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={submitting} className="w-full">
          {submitting ? 'Création...' : 'Créer'}
        </Button>
      </form>
    </Modal>
  );
}

export default CreateGoalModal;
