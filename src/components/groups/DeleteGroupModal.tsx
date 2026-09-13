import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { deleteCoachGroup } from '../../services/coach.api';

interface DeleteGroupModalProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onDeleted: () => void;
}

// Le wording ne doit jamais laisser croire que l'historique d'entraînement
// est supprimé — il ne l'est pas (backend ticket #3), seul le groupe l'est
// (ticket #2 §19).
function DeleteGroupModal({ groupId, groupName, onClose, onDeleted }: DeleteGroupModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await deleteCoachGroup(groupId);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Supprimer ${groupName} ?`} onClose={onClose}>
      <div className="space-y-4 p-5">
        <p className="text-sm text-ekvara-black/70">
          Les athlètes resteront rattachés à ton espace coach. Seul le groupe sera supprimé.
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
            {submitting ? 'Suppression...' : 'Supprimer le groupe'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteGroupModal;
