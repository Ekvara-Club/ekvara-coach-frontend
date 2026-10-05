import type { CoachAthleteDetailDashboard } from '../../types/coach';
import { formatDate, formatDaysUntil, formatTime } from '../../utils/date';
import { handleNavClick } from '../../utils/navigation';
import { formatPlannedCategories, formatPreparationStatus } from '../../utils/preparation';
import SectionLabel from '../ui/SectionLabel';

// Ticket #3 §5. nextCompetition.daysUntil est déjà calculé par le backend
// (CoachDashboardService) : jamais recalculé côté frontend, contrairement à
// UpcomingCompetitions.tsx (agrégat groupe) qui n'a que startDate brut.
//
// Ticket #15 : nextCompetition peut venir d'une participation OU d'une simple
// préparation de ce coach (règle unique côté backend, partagée avec la vue
// Athlete). Catégories OFFICIELLES (participation) prioritaires, la catégorie
// prévue ne sert que de repli ; une préparation seule n'est jamais présentée
// comme une inscription.
function PreparationSection({ athlete }: { athlete: CoachAthleteDetailDashboard }) {
  const { nextCompetition, nextTraining } = athlete;

  const categories = nextCompetition
    ? formatPlannedCategories(
        nextCompetition.ageCategory ?? nextCompetition.preparation?.targetAgeCategory ?? null,
        nextCompetition.weightCategory ?? nextCompetition.preparation?.targetWeightCategory ?? null,
      )
    : null;

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
            <div className="flex items-baseline justify-between gap-x-4">
              <a
                href={`/competitions/${nextCompetition.id}`}
                onClick={(event) => handleNavClick(event, `/competitions/${nextCompetition.id}`)}
                className="min-w-0 text-balance font-display text-base font-bold text-ekvara-black hover:underline"
              >
                {nextCompetition.name}
              </a>
              <span className="whitespace-nowrap text-sm font-semibold text-ekvara-black">
                {formatDaysUntil(nextCompetition.daysUntil)}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-ekvara-black/60">
              {formatDate(nextCompetition.startDate)}
              {[nextCompetition.city, nextCompetition.country].filter(Boolean).length > 0 &&
                ` · ${[nextCompetition.city, nextCompetition.country].filter(Boolean).join(', ')}`}
            </p>
            {categories && <p className="mt-0.5 text-sm text-ekvara-black/60">{categories}</p>}
            {nextCompetition.preparation && (
              <p className="mt-0.5 text-sm text-ekvara-black/60">
                <span className="font-semibold text-ekvara-black">
                  {formatPreparationStatus(nextCompetition.preparation.status)}
                </span>
                {nextCompetition.source === 'coach_preparation' && (
                  <span className="ml-2">Inscription officielle non confirmée</span>
                )}
              </p>
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
