import type { GroupAthleteOverview } from '../../types/coach';
import { athleteName } from '../../utils/format';
import { daysUntil, formatDaysUntil } from '../../utils/date';
import { handleNavClick } from '../../utils/navigation';

// Tendance nette (§29/§46) : même comparaison de counts déjà établie et
// documentée côté backend (buildGroupSummaries/buildSummary,
// coach-dashboard.service.ts — "Tendance nette : simple, symétrique") —
// jamais une nouvelle règle inventée côté frontend, seulement la même
// comparaison appliquée à l'affichage d'une ligne. evaluatedCount === 0 :
// jamais "Stable" par défaut, "Données insuffisantes" explicite (§46).
function progressionLabel(progression: GroupAthleteOverview['progression']): string {
  if (progression.evaluatedCount === 0 && progression.improvedCount === 0 && progression.decliningCount === 0) {
    return 'Données insuffisantes';
  }
  if (progression.improvedCount > progression.decliningCount) return 'En progression';
  if (progression.decliningCount > progression.improvedCount) return 'En baisse';
  return 'Stable';
}

interface GroupAthleteRowProps {
  athlete: GroupAthleteOverview;
  index: number;
  onRemove: (athleteId: string) => void;
  removing: boolean;
}

function GroupAthleteRow({ athlete, index, onRemove, removing }: GroupAthleteRowProps) {
  const { attendance30d, nextCompetition, preparation } = athlete;

  const attendanceLabel =
    attendance30d.recordedSessions === 0 ? 'Aucune présence' : `${Math.round((attendance30d.attendanceRate ?? 0) * 100)}% présence`;

  const competitionLabel = nextCompetition
    ? `${nextCompetition.name} · ${formatDaysUntil(daysUntil(nextCompetition.startDate))}`
    : preparation
      ? preparation.competitionName
      : null;

  return (
    <li className="flex items-center gap-2 py-4">
      <a
        href={`/athletes/${athlete.id}`}
        onClick={(event) => handleNavClick(event, `/athletes/${athlete.id}`)}
        className="group flex min-w-0 flex-1 items-center gap-4"
      >
        <span className="w-6 flex-shrink-0 font-display text-xs font-bold text-ekvara-black/30">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-ekvara-black">{athleteName(athlete)}</p>
          <p className="mt-0.5 text-sm text-ekvara-black/60">
            {attendanceLabel} · {progressionLabel(athlete.progression)}
          </p>
          {competitionLabel && <p className="mt-0.5 truncate text-xs text-ekvara-black/40">{competitionLabel}</p>}
        </span>
        <span
          className="flex-shrink-0 text-ekvara-black/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ekvara-black"
          aria-hidden="true"
        >
          &rarr;
        </span>
      </a>
      <button
        type="button"
        onClick={() => onRemove(athlete.id)}
        disabled={removing}
        className="flex-shrink-0 text-xs text-ekvara-black/40 underline decoration-ekvara-black/20 underline-offset-2 hover:text-ekvara-black disabled:opacity-50"
      >
        {removing ? 'Retrait...' : 'Retirer'}
      </button>
    </li>
  );
}

export default GroupAthleteRow;
