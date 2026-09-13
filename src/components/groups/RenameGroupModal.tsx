import { useState, type FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { renameCoachGroup } from '../../services/coach.api';

interface RenameGroupModalProps {
  groupId: string;
  currentName: string;
  onClose: () => void;
  onRenamed: () => void;
}

function RenameGroupModal({ groupId, currentName, onClose, onRenamed }: RenameGroupModalProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Le nom du groupe ne peut pas être vide.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await renameCoachGroup(groupId, trimmedName);
      onRenamed();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Renommer le groupe" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
        <div>
          <label htmlFor="group-rename" className="mb-1.5 block text-sm font-medium text-ekvara-black">
            Nom du groupe
          </label>
          <input
            id="group-rename"
            name="name"
            type="text"
            autoFocus
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={submitting} className="w-full">
          {submitting ? 'Enregistrement...' : 'Renommer'}
        </Button>
      </form>
    </Modal>
  );
}

export default RenameGroupModal;
