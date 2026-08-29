import type { CoachGroupTrainingSummary } from '../../types/coach';
import { formatDate, formatTime } from '../../utils/date';
import { handleNavClick } from '../../utils/navigation';
import SectionLabel from '../ui/SectionLabel';

// Ticket §13/§35 : max 3 séances déjà imposé côté backend, lien vers
// /planning — jamais de gestion de présence dupliquée ici (§78).
function GroupTrainingSection({ training }: { training: CoachGroupTrainingSummary }) {
  return (
    <section aria-labelledby="group-training-heading">
      <div className="flex items-center justify-between">
        <SectionLabel id="group-training-heading">Prochaines séances</SectionLabel>
        <a
          href="/planning"
          onClick={(event) => handleNavClick(event, '/planning')}
          className="text-sm font-medium text-ekvara-black/60 underline decoration-ekvara-black/20 underline-offset-2 hover:text-ekvara-black"
        >
          Voir le planning
        </a>
      </div>

      {training.upcomingSessions.length === 0 ? (
        <p className="mt-3 text-sm text-ekvara-black/60">Aucune séance à venir pour ce groupe.</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100">
          {training.upcomingSessions.map((session) => (
            <li key={session.id} className="flex items-center gap-4 py-3">
              <p className="w-20 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-ekvara-black/50">
                {formatDate(session.startAt)}
              </p>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ekvara-black">{session.title}</p>
              <p className="flex-shrink-0 text-sm text-ekvara-black/60">{formatTime(session.startAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default GroupTrainingSection;
