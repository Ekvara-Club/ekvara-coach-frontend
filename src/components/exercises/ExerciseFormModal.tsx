import { useState, type FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { createCoachExercise, updateCoachExercise } from '../../services/coach.api';
import { EXERCISE_TYPE_OPTIONS, EXERCISE_LEVEL_OPTIONS } from '../../utils/exerciseOptions';
import type { CoachExerciseDetail } from '../../types/coach';

interface ExerciseFormModalProps {
  mode: 'create' | 'edit';
  exercise?: CoachExerciseDetail;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  'mt-1 w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40';

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// Ticket #5 §8/§10 : uniquement les champs réellement acceptés par
// CreateCoachExerciseDto/UpdateCoachExerciseDto (title/type/panelTechnique/
// level/description/videoUrl) — pas de séries/reps/muscles/durée/matériel,
// aucun champ n'existe côté backend pour ça. Jamais de destinataires ici :
// CreateCoachExerciseDto n'a même pas ces champs (confirmé par lecture
// directe du DTO) — la publication est exclusivement gérée par
// ExerciseAssignmentsModal, séparée par design du backend lui-même.
function ExerciseFormModal({ mode, exercise, onClose, onSaved }: ExerciseFormModalProps) {
  const [title, setTitle] = useState(exercise?.title ?? '');
  const [type, setType] = useState(exercise?.type ?? '');
  const [panelTechnique, setPanelTechnique] = useState(exercise?.panelTechnique ?? '');
  const [level, setLevel] = useState(exercise?.level ?? '');
  const [description, setDescription] = useState(exercise?.description ?? '');
  const [videoUrl, setVideoUrl] = useState(exercise?.videoUrl ?? '');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setValidationError('Le titre est obligatoire.');
      return;
    }
    const trimmedVideoUrl = videoUrl.trim();
    if (trimmedVideoUrl && !isValidUrl(trimmedVideoUrl)) {
      setValidationError("L'URL de la vidéo n'est pas valide.");
      return;
    }

    setValidationError(null);
    setSubmitError(null);
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      type: type || undefined,
      panelTechnique: panelTechnique.trim() || undefined,
      level: level || undefined,
      description: description.trim() || undefined,
      videoUrl: trimmedVideoUrl || undefined,
    };

    try {
      if (mode === 'create') {
        await createCoachExercise(payload);
      } else if (exercise) {
        await updateCoachExercise(exercise.id, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={mode === 'create' ? 'Nouvel exercice' : "Modifier l'exercice"} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col overflow-y-auto p-5" noValidate>
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="exercise-title" className="text-sm font-medium text-ekvara-black">
              Titre
            </label>
            <input
              id="exercise-title"
              type="text"
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="exercise-type" className="text-sm font-medium text-ekvara-black">
              Type
            </label>
            <select id="exercise-type" value={type} onChange={(event) => setType(event.target.value)} className={inputClass}>
              <option value="">—</option>
              {EXERCISE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="exercise-panel-technique" className="text-sm font-medium text-ekvara-black">
              Focus technique
            </label>
            <input
              id="exercise-panel-technique"
              type="text"
              value={panelTechnique}
              onChange={(event) => setPanelTechnique(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="exercise-level" className="text-sm font-medium text-ekvara-black">
              Niveau
            </label>
            <select id="exercise-level" value={level} onChange={(event) => setLevel(event.target.value)} className={inputClass}>
              <option value="">—</option>
              {EXERCISE_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="exercise-description" className="text-sm font-medium text-ekvara-black">
              Description
            </label>
            <textarea
              id="exercise-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="exercise-video-url" className="text-sm font-medium text-ekvara-black">
              URL vidéo (optionnel)
            </label>
            <input
              id="exercise-video-url"
              type="url"
              placeholder="https://youtube.com/..."
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              className={inputClass}
            />
          </div>
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

export default ExerciseFormModal;
