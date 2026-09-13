import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { addAthleteToGroup, removeAthleteFromGroup } from '../../services/coach.api';
import type { CoachGroupListItem } from '../../types/coach';

interface ManageGroupsModalProps {
  athleteId: string;
  athleteLabel: string;
  groups: CoachGroupListItem[];
  currentGroupIds: string[];
  onClose: () => void;
  onChanged: () => void;
}

// Aucun endpoint batch : recompose un diff avant/après pour n'envoyer que les
// POST/DELETE de membership réellement nécessaires (ticket #2 §17 — ne pas
// créer d'endpoint dédié, ne pas ré-écrire ce qui n'a pas changé).
function ManageGroupsModal({
  athleteId,
  athleteLabel,
  groups,
  currentGroupIds,
  onClose,
  onChanged,
}: ManageGroupsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentGroupIds));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle(groupId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    const original = new Set(currentGroupIds);
    const toAdd = [...selected].filter((id) => !original.has(id));
    const toRemove = [...original].filter((id) => !selected.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all([
        ...toAdd.map((groupId) => addAthleteToGroup(groupId, athleteId)),
        ...toRemove.map((groupId) => removeAthleteFromGroup(groupId, athleteId)),
      ]);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Groupes de ${athleteLabel}`} onClose={onClose}>
      <div className="space-y-4 p-5">
        {groups.length === 0 ? (
          <p className="text-sm text-ekvara-black/60">Aucun groupe créé pour le moment.</p>
        ) : (
          <ul className="space-y-2.5">
            {groups.map((group) => (
              <li key={group.id}>
                <label className="flex items-center gap-2.5 text-sm text-ekvara-black">
                  <input
                    type="checkbox"
                    checked={selected.has(group.id)}
                    onChange={() => toggle(group.id)}
                    className="h-4 w-4 rounded border-ekvara-black/30 text-ekvara-black"
                  />
                  {group.name}
                </label>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="button" variant="primary" onClick={handleSave} disabled={submitting} className="w-full">
          {submitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </Modal>
  );
}

export default ManageGroupsModal;
