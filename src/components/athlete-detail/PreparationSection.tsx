import type { CoachAthleteDetailDashboard } from '../../types/coach';
import { formatDate, formatDaysUntil, formatTime } from '../../utils/date';
import SectionLabel from '../ui/SectionLabel';

// Ticket #3 §5. nextCompetition.daysUntil est déjà calculé par le backend
// (CoachDashboardService) : jamais recalculé côté frontend, contrairement à
// UpcomingCompetitions.tsx (agrégat groupe) qui n'a que startDate brut.
function PreparationSection({ athlete }: { athlete: CoachAthleteDetailDashboard }) {
  const { nextCompetition, nextTraining } = athlete;

  if (!nextCompetition && !nextTraining) {
    return (
      <section aria-labelledby="preparation-heading">
        <SectionLabel id="preparation-heading">Préparation</SectionLabel>
        <p className="mt-3 text-sm text-ekvara-black/60">Rien de prévu pour le moment.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="preparation-heading" className="grid gap-8 sm:grid-cols-2">
      <div>
        <SectionLabel id="preparation-heading">Prochaine compétition</SectionLabel>
        {nextCompetition ? (
          <div className="mt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-display text-base font-bold text-ekvara-black">{nextCompetition.name}</p>
              <span className="whitespace-nowrap text-sm font-semibold text-ekvara-black">
                {formatDaysUntil(nextCompetition.daysUntil)}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-ekvara-black/60">
              {formatDate(nextCompetition.startDate)}
              {[nextCompetition.city, nextCompetition.country].filter(Boolean).length > 0 &&
                ` · ${[nextCompetition.city, nextCompetition.country].filter(Boolean).join(', ')}`}
            </p>
            {nextCompetition.weightCategory && (
              <p className="mt-0.5 text-sm text-ekvara-black/60">{nextCompetition.weightCategory}</p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ekvara-black/60">Aucune compétition à venir.</p>
        )}
      </div>

      <div>
        <SectionLabel>Prochain entraînement</SectionLabel>
        {nextTraining ? (
          <div className="mt-3">
            <p className="font-display text-base font-bold text-ekvara-black">{nextTraining.title}</p>
            <p className="mt-0.5 text-sm text-ekvara-black/60">
              {formatDate(nextTraining.startAt)} · {formatTime(nextTraining.startAt)}
            </p>
            {nextTraining.type && <p className="mt-0.5 text-sm text-ekvara-black/60">{nextTraining.type}</p>}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ekvara-black/60">Aucun entraînement à venir.</p>
        )}
      </div>
    </section>
  );
}

export default PreparationSection;
