import type { CoachAthleteDetailDashboard } from '../../types/coach';
import { athleteName } from '../../utils/format';
import { conditionDetails, conditionLabel, isUnavailable } from '../../utils/condition';

// Ticket #3 §4 : nom + ageCategory/grade/sportLevel + groupes. Jamais
// d'email (déjà absent de cet agrégat dashboard), jamais de photo ou de
// catégorie de poids inventées. Pas d'uppercase sur le nom (ticket #6 §14) :
// un nom propre reste en casse normale, comme group.name sur
// GroupDetailPage — uppercase réservé aux libellés de page statiques
// (ATHLÈTES, GROUPES...), jamais à une donnée dynamique.
function AthleteHeader({ athlete }: { athlete: CoachAthleteDetailDashboard }) {
  const meta = [athlete.ageCategory, athlete.grade, athlete.sportLevel].filter(Boolean).join(' · ');

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ekvara-black sm:text-4xl">
        {athleteName(athlete)}
      </h1>
      {meta && <p className="mt-1 text-sm text-ekvara-black/60">{meta}</p>}
      {isUnavailable(athlete.condition) && (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ekvara-black/70">
          <span className="rounded-full bg-ekvara-black px-2.5 py-0.5 text-xs font-semibold text-ekvara-surface">
            {conditionLabel(athlete.condition.status)}
          </span>
          {conditionDetails(athlete.condition)}
        </p>
      )}
      {athlete.groups.length > 0 && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-black/70">
          {athlete.groups.map((group) => group.name).join(' · ')}
        </p>
      )}
    </div>
  );
}

export default AthleteHeader;
