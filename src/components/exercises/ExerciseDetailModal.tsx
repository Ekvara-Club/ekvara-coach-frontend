import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { CoachExerciseDetail } from '../../types/coach';
import { getExerciseTypeLabel, getExerciseLevelLabel } from '../../utils/exerciseOptions';
import { getVideoEmbedUrl } from '../../utils/video';

interface ExerciseDetailModalProps {
  exercise: CoachExerciseDetail;
  onClose: () => void;
  onEdit: () => void;
  onManagePublication: () => void;
  onDelete: () => void;
}

// Ticket #5 §11-12. Ne fait aucun fetch : reçoit `exercise` déjà chargé par
// ExercisesPage, pour ne jamais imbriquer une seconde <Modal> quand une
// action ouvre ExerciseFormModal/ExerciseAssignmentsModal/
// DeleteExerciseModal (celles-ci REMPLACENT cette modale — même contrainte
// que TrainingDetailModal, ticket #4). Vidéo : même stratégie que
// ExerciseDetailModal côté athlète (getVideoEmbedUrl), aucun placeholder
// "Vidéo indisponible" si videoUrl est null ou non supportée.
function ExerciseDetailModal({ exercise, onClose, onEdit, onManagePublication, onDelete }: ExerciseDetailModalProps) {
  const typeLabel = getExerciseTypeLabel(exercise.type);
  const levelLabel = getExerciseLevelLabel(exercise.level);
  const metaLine = [typeLabel, levelLabel].filter(Boolean).join(' · ');
  const embedUrl = exercise.videoUrl ? getVideoEmbedUrl(exercise.videoUrl) : null;
  const { athleteCount, groups } = exercise.assignments;

  return (
    <Modal title={exercise.title} onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
        {metaLine && <p className="text-xs font-semibold uppercase tracking-wide text-ekvara-muted">{metaLine}</p>}

        {exercise.description && <p className="whitespace-pre-line text-sm text-ekvara-black/80">{exercise.description}</p>}

        {exercise.panelTechnique && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ekvara-muted">Focus technique</p>
            <p className="mt-1 font-display text-base font-bold text-ekvara-black">{exercise.panelTechnique}</p>
          </div>
        )}

        {embedUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-md bg-gray-100">
            <iframe
              src={embedUrl}
              title={exercise.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">
            {athleteCount} {athleteCount > 1 ? 'athlètes concernés' : 'athlète concerné'}
          </p>
          {groups.length > 0 && <p className="mt-1 text-sm text-ekvara-black/70">{groups.map((g) => g.name).join(', ')}</p>}
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variant="secondary" onClick={onEdit}>
            Modifier
          </Button>
          <Button type="button" variant="secondary" onClick={onManagePublication}>
            Gérer la publication
          </Button>
          <Button type="button" variant="ghost" className="text-red-600" onClick={onDelete}>
            Supprimer l'exercice
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ExerciseDetailModal;
