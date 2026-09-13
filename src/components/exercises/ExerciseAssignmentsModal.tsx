import { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import DestinataireFields from '../shared/DestinataireFields';
import { replaceCoachExerciseAssignments } from '../../services/coach.api';
import type { CoachAthleteRosterItem, CoachExerciseDetail, CoachGroupListItem } from '../../types/coach';

interface ExerciseAssignmentsModalProps {
  exercise: CoachExerciseDetail;
  groups: CoachGroupListItem[];
  roster: CoachAthleteRosterItem[];
  membershipMap: Map<string, Set<string>>;
  onClose: () => void;
  onSaved: () => void;
}

// Ticket #5 §14-15 : même sémantique snapshot que Planning/AssignmentsModal
// (ticket #4 §15) — le PUT remplace complètement la cible, jamais un diff.
// État initial des cases reconstruit depuis groupes sources + athlètes
// assignés actuels (un athlète déjà couvert par un groupe sélectionné n'a
// pas besoin d'une case individuelle en plus).
function ExerciseAssignmentsModal({ exercise, groups, roster, membershipMap, onClose, onSaved }: ExerciseAssignmentsModalProps) {
  const initial = useMemo(() => {
    const groupIds = new Set(exercise.assignments.groups.map((g) => g.id));
    const covered = new Set<string>();
    for (const groupId of groupIds) {
      for (const athleteId of membershipMap.get(groupId) ?? []) covered.add(athleteId);
    }
    const athleteIds = new Set(
      exercise.assignments.athletes.map((a) => a.id).filter((id) => !covered.has(id)),
    );
    return { groupIds, athleteIds };
  }, [exercise, membershipMap]);

  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(initial.groupIds);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(initial.athleteIds);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function toggleAthlete(athleteId: string) {
    setSelectedAthleteIds((current) => {
      const next = new Set(current);
      if (next.has(athleteId)) next.delete(athleteId);
      else next.add(athleteId);
      return next;
    });
  }

  async function handleSave() {
    const union = new Set<string>(selectedAthleteIds);
    for (const groupId of selectedGroupIds) {
      for (const athleteId of membershipMap.get(groupId) ?? []) union.add(athleteId);
    }
    if (union.size === 0) {
      setError('Sélectionne au moins un groupe ou un athlète.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await replaceCoachExerciseAssignments(exercise.id, {
        groupIds: [...selectedGroupIds],
        athleteIds: [...selectedAthleteIds],
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Gérer la publication" onClose={onClose}>
      <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
        <DestinataireFields
          groups={groups}
          roster={roster}
          membershipMap={membershipMap}
          selectedGroupIds={selectedGroupIds}
          selectedAthleteIds={selectedAthleteIds}
          onToggleGroup={toggleGroup}
          onToggleAthlete={toggleAthlete}
        />

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="button" variant="primary" onClick={handleSave} disabled={submitting} className="w-full">
          {submitting ? 'Publication...' : 'Publier'}
        </Button>
      </div>
    </Modal>
  );
}

export default ExerciseAssignmentsModal;
