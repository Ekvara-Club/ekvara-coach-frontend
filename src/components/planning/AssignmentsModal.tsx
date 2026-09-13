import { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import DestinataireFields from '../shared/DestinataireFields';
import { replaceCoachTrainingAssignments } from '../../services/coach.api';
import type { CoachAthleteRosterItem, CoachGroupListItem, CoachTrainingDetail } from '../../types/coach';

interface AssignmentsModalProps {
  training: CoachTrainingDetail;
  groups: CoachGroupListItem[];
  roster: CoachAthleteRosterItem[];
  membershipMap: Map<string, Set<string>>;
  onClose: () => void;
  onSaved: () => void;
}

// Ticket #4 §15 : PUT remplace complètement la cible, jamais un diff — l'état
// initial des cases à cocher est reconstruit depuis assignments actuels
// (groupes sources + athlètes assignés), pas depuis un historique qu'on ne
// peut pas connaître (snapshot, voir §10 : le contrat ne distingue pas "ajouté
// via groupe" de "ajouté individuellement" après coup). Un athlète assigné
// déjà couvert par un groupe source sélectionné n'a pas besoin d'une case
// individuelle cochée en plus — reconstruit ici pour rester cohérent au
// premier "Enregistrer" sans rien changer.
function AssignmentsModal({ training, groups, roster, membershipMap, onClose, onSaved }: AssignmentsModalProps) {
  const initial = useMemo(() => {
    const groupIds = new Set(training.assignments.groups.map((g) => g.id));
    const covered = new Set<string>();
    for (const groupId of groupIds) {
      for (const athleteId of membershipMap.get(groupId) ?? []) covered.add(athleteId);
    }
    const athleteIds = new Set(
      training.assignments.athletes.map((a) => a.id).filter((id) => !covered.has(id)),
    );
    return { groupIds, athleteIds };
  }, [training, membershipMap]);

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
      await replaceCoachTrainingAssignments(training.id, {
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
    <Modal title="Modifier les destinataires" onClose={onClose}>
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
          {submitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </Modal>
  );
}

export default AssignmentsModal;
