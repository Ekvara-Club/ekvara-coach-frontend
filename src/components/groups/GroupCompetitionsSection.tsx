import type { CoachUpcomingCompetition } from '../../types/coach';
import { daysUntil, formatDaysUntil, formatDate } from '../../utils/date';
import { handleNavClick } from '../../utils/navigation';
import { athleteName } from '../../utils/format';
import SectionLabel from '../ui/SectionLabel';

// Ticket §14/§33 : max 3 dans l'overview (déjà limité côté backend à 10,
// affichage plafonné ici), dédupliquées par competition.id canonique (déjà
// fait côté backend, jamais recalculé ici). Lien vers /competitions/:id,
// jamais de mutation (préparation/résultat) depuis cette page (§78).
function GroupCompetitionsSection({ competitions }: { competitions: CoachUpcomingCompetition[] }) {
  const visible = competitions.slice(0, 3);

  return (
    <section aria-labelledby="group-competitions-heading">
      <SectionLabel id="group-competitions-heading">Compétitions à venir</SectionLabel>

      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-ekvara-black/60">Aucune compétition à venir pour ce groupe.</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100">
          {visible.map(({ competition, athleteCount, athletes }) => (
            <li key={competition.id}>
              <a
                href={`/competitions/${competition.id}`}
                onClick={(event) => handleNavClick(event, `/competitions/${competition.id}`)}
                className="group flex items-start gap-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold uppercase leading-snug tracking-tight text-ekvara-black">
                    {competition.name}
                  </p>
                  <p className="mt-1 text-sm text-ekvara-black/60">
                    {athleteCount} {athleteCount > 1 ? 'athlètes' : 'athlète'} ·{' '}
                    {athletes.map((a) => athleteName(a)).join(', ')}
                  </p>
                  <p className="mt-0.5 text-xs text-ekvara-black/40">{formatDate(competition.startDate)}</p>
                </div>
                <span className="flex-shrink-0 whitespace-nowrap pt-0.5 text-sm font-semibold text-ekvara-black">
                  {formatDaysUntil(daysUntil(competition.startDate))}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default GroupCompetitionsSection;
