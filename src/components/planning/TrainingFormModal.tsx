import { useState, type FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import DestinataireFields from '../shared/DestinataireFields';
import { createCoachTraining, updateCoachTraining } from '../../services/coach.api';
import type { CoachAthleteRosterItem, CoachGroupListItem, CoachTrainingDetail } from '../../types/coach';

interface TrainingFormModalProps {
  mode: 'create' | 'edit';
  training?: CoachTrainingDetail;
  groups: CoachGroupListItem[];
  roster: CoachAthleteRosterItem[];
  membershipMap: Map<string, Set<string>>;
  onClose: () => void;
  onSaved: () => void;
}

// Même liste que AddTrainingModal.tsx (EkvaraFrontend) : pas un enum
// backend (type_seance est un VARCHAR(50) libre, aucune contrainte en base),
// mais reprendre le même référentiel que le flux athlete pour ce champ
// précis évite un vocabulaire divergent entre coach et athlète.
const TRAINING_TYPES: { value: string; label: string }[] = [
  { value: 'taekwondo', label: 'Taekwondo' },
  { value: 'musculation', label: 'Musculation' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'mobilite', label: 'Mobilité' },
  { value: 'recuperation', label: 'Récupération' },
  { value: 'stage', label: 'Stage' },
];

function toIsoFromLocal(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

function splitIsoToLocal(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

const inputClass =
  'mt-1 w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40';

// Modal partagée création/édition (ticket #4 §14 : "réutiliser la modal de
// création si possible avec mode edit"). Les destinataires ne sont montrés
// qu'en mode création : PATCH /coach/trainings/:id ne touche jamais les
// assignations (voir UpdateCoachTrainingDto), c'est le rôle exclusif de PUT
// .../assignments — deux préoccupations, deux endpoints, jamais mélangés
// dans un même formulaire (ticket §15).
function TrainingFormModal({ mode, training, groups, roster, membershipMap, onClose, onSaved }: TrainingFormModalProps) {
  const startSplit = training ? splitIsoToLocal(training.startAt) : null;
  const endSplit = training?.endAt ? splitIsoToLocal(training.endAt) : null;

  const [title, setTitle] = useState(training?.title ?? '');
  const [type, setType] = useState(training?.type ?? '');
  const [subType, setSubType] = useState(training?.subType ?? '');
  const [date, setDate] = useState(startSplit?.date ?? '');
  const [startTime, setStartTime] = useState(startSplit?.time ?? '');
  const [endTime, setEndTime] = useState(endSplit?.time ?? '');
  const [location, setLocation] = useState(training?.location ?? '');
  const [level, setLevel] = useState(training?.level ?? '');
  const [description, setDescription] = useState(training?.description ?? '');

  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set());

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setValidationError('Le titre est obligatoire.');
      return;
    }
    if (!date || !startTime) {
      setValidationError("La date et l'heure de début sont obligatoires.");
      return;
    }
    if (endTime && endTime <= startTime) {
      setValidationError("L'heure de fin doit être après l'heure de début.");
      return;
    }

    if (mode === 'create') {
      const union = new Set<string>(selectedAthleteIds);
      for (const groupId of selectedGroupIds) {
        for (const athleteId of membershipMap.get(groupId) ?? []) union.add(athleteId);
      }
      if (union.size === 0) {
        setValidationError('Sélectionne au moins un groupe ou un athlète.');
        return;
      }
    }

    setValidationError(null);
    setSubmitError(null);
    setSubmitting(true);

    const contentPayload = {
      title: title.trim(),
      type: type || undefined,
      subType: subType.trim() || undefined,
      startAt: toIsoFromLocal(date, startTime),
      endAt: endTime ? toIsoFromLocal(date, endTime) : undefined,
      location: location.trim() || undefined,
      level: level.trim() || undefined,
      description: description.trim() || undefined,
    };

    try {
      if (mode === 'create') {
        await createCoachTraining({
          ...contentPayload,
          groupIds: [...selectedGroupIds],
          athleteIds: [...selectedAthleteIds],
        });
      } else if (training) {
        await updateCoachTraining(training.id, contentPayload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={mode === 'create' ? 'Nouvelle séance' : 'Modifier la séance'} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col overflow-y-auto p-5" noValidate>
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="training-title" className="text-sm font-medium text-ekvara-black">
              Titre
            </label>
            <input
              id="training-title"
              type="text"
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="training-type" className="text-sm font-medium text-ekvara-black">
              Type de séance
            </label>
            <select id="training-type" value={type} onChange={(event) => setType(event.target.value)} className={inputClass}>
              <option value="">—</option>
              {TRAINING_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="training-subtype" className="text-sm font-medium text-ekvara-black">
              Sous-type
            </label>
            <input id="training-subtype" type="text" value={subType} onChange={(event) => setSubType(event.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="training-date" className="text-sm font-medium text-ekvara-black">
                Date
              </label>
              <input id="training-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="training-start" className="text-sm font-medium text-ekvara-black">
                Heure de début
              </label>
              <input id="training-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="training-end" className="text-sm font-medium text-ekvara-black">
                Heure de fin
              </label>
              <input id="training-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="training-location" className="text-sm font-medium text-ekvara-black">
              Lieu
            </label>
            <input id="training-location" type="text" value={location} onChange={(event) => setLocation(event.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="training-level" className="text-sm font-medium text-ekvara-black">
              Niveau
            </label>
            <input id="training-level" type="text" value={level} onChange={(event) => setLevel(event.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="training-description" className="text-sm font-medium text-ekvara-black">
              Description
            </label>
            <textarea id="training-description" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} />
          </div>

          {mode === 'create' && (
            <div className="border-t border-gray-100 pt-4">
              <DestinataireFields
                groups={groups}
                roster={roster}
                membershipMap={membershipMap}
                selectedGroupIds={selectedGroupIds}
                selectedAthleteIds={selectedAthleteIds}
                onToggleGroup={toggleGroup}
                onToggleAthlete={toggleAthlete}
              />
            </div>
          )}
        </div>

        {validationError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {validationError}
          </p>
        )}
        {submitError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {submitError}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? (mode === 'create' ? 'Création...' : 'Enregistrement...') : mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TrainingFormModal;
