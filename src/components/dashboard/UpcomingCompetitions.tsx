import type { CoachUpcomingCompetition } from '../../types/coach';
import { athleteName } from '../../utils/format';
import { daysUntil, formatDate, formatDaysUntil } from '../../utils/date';
import SectionLabel from '../ui/SectionLabel';
import { handleNavClick } from '../../utils/navigation';

function CompetitionRow({ item }: { item: CoachUpcomingCompetition }) {
  const location = [item.competition.city, item.competition.country].filter(Boolean).join(', ');
  const names = item.athletes.slice(0, 3).map(athleteName);
  const remaining = item.athletes.length - names.length;

  return (
    <li className="py-4">
      <div className="flex items-baseline justify-between gap-x-4">
        <a
          href={`/competitions/${item.competition.id}`}
          onClick={(event) => handleNavClick(event, `/competitions/${item.competition.id}`)}
          className="min-w-0 text-balance font-display text-base font-bold text-ekvara-black underline-offset-2 hover:underline"
        >
          {item.competition.name}
        </a>
        <span className="whitespace-nowrap text-sm font-semibold text-ekvara-black">
          {formatDaysUntil(daysUntil(item.competition.startDate))}
        </span>
      </div>
      <p className="mt-0.5 text-sm text-ekvara-black/60">
        {formatDate(item.competition.startDate)}
        {location && ` · ${location}`}
      </p>
      <p className="mt-1.5 text-sm text-ekvara-black/70">
        {item.athleteCount} {item.athleteCount > 1 ? 'athlètes' : 'athlète'}
        {names.length > 0 && (
          <span className="text-ekvara-black/50"> — {names.join(', ')}{remaining > 0 ? ` +${remaining}` : ''}</span>
        )}
      </p>
    </li>
  );
}

function UpcomingCompetitions({ items }: { items: CoachUpcomingCompetition[] }) {
  if (items.length === 0) {
    return (
      <section aria-labelledby="competitions-heading">
        <SectionLabel id="competitions-heading">Prochaines compétitions</SectionLabel>
        <p className="mt-3 text-sm text-ekvara-black/60">Aucune compétition à venir pour le groupe.</p>
      </section>
    );
  }

  const sorted = [...items].sort(
    (a, b) => new Date(a.competition.startDate).getTime() - new Date(b.competition.startDate).getTime(),
  );

  return (
    <section aria-labelledby="competitions-heading">
      <SectionLabel id="competitions-heading">Prochaines compétitions</SectionLabel>
      <ul className="mt-2 divide-y divide-gray-100">
        {sorted.map((item) => (
          <CompetitionRow key={item.competition.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

export default UpcomingCompetitions;
