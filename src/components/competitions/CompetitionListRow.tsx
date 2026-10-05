import type { CoachCompetitionGroupView } from '../../types/coach';
import { daysUntil, formatDaysUntil, formatDate } from '../../utils/date';
import { handleNavClick } from '../../utils/navigation';
import { summarizeCompetitionResults } from '../../utils/competitionResults';

function formatShortDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase();
}

function categoriesSummary(group: CoachCompetitionGroupView): string | null {
  const categories = [...new Set(group.athletes.map((a) => a.weightCategory).filter((c): c is string => Boolean(c)))];
  const ages = [...new Set(group.athletes.map((a) => a.ageCategory).filter((c): c is string => Boolean(c)))];
  const parts = [ages.join('/'), categories.length > 0 ? categories.join(' / ') : null].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

interface CompetitionListRowProps {
  group: CoachCompetitionGroupView;
  past?: boolean;
}

// Même convention de ligne navigable que Athletes/Groups (`<a href>` réelle,
// hover+arrow via `group`/`group-hover`, ticket #6 §9) — jamais un <button>
// comme la ligne équivalente côté app athlète (EkvaraFrontend), les deux
// codebases n'ont pas à partager la même convention d'interaction.
function CompetitionListRow({ group, past = false }: CompetitionListRowProps) {
  const { competition, athleteCount, athletes } = group;
  const location = [competition.city, competition.country].filter(Boolean).join(', ');
  const meta = categoriesSummary(group);
  const summary = past ? summarizeCompetitionResults(athletes) : null;

  return (
    <li>
      <a
        href={`/competitions/${competition.id}`}
        onClick={(event) => handleNavClick(event, `/competitions/${competition.id}`)}
        className="group flex items-start gap-4 py-4 transition-colors hover:bg-gray-50"
      >
        <p className="w-14 flex-shrink-0 pt-0.5 font-display text-sm font-bold text-ekvara-black">
          {formatShortDate(competition.startDate)}
        </p>

        <div className="min-w-0 flex-1">
          <p className="text-balance font-display text-base font-bold leading-snug tracking-tight text-ekvara-black">
            {competition.name}
          </p>
          <p className="mt-1 text-sm text-ekvara-black/60">
            {athleteCount} {athleteCount > 1 ? 'athlètes' : 'athlète'}
            {meta && ` · ${meta}`}
          </p>
          <p className="mt-0.5 text-xs text-ekvara-black/40">
            {formatDate(competition.startDate)}
            {location && ` · ${location}`}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 pt-0.5">
          {!past && (
            <span className="whitespace-nowrap text-sm font-semibold text-ekvara-black">
              {formatDaysUntil(daysUntil(competition.startDate))}
            </span>
          )}
          {past && summary && summary.podiums > 0 && (
            <span className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-ekvara-black">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ekvara-lime" aria-hidden="true" />
              {summary.podiums} {summary.podiums > 1 ? 'podiums' : 'podium'}
            </span>
          )}
          <span
            className="text-ekvara-black/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ekvara-black"
            aria-hidden="true"
          >
            →
          </span>
        </div>
      </a>
    </li>
  );
}

export default CompetitionListRow;
