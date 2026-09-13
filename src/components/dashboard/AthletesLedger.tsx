import type { CoachAthleteDashboardSummary } from '../../types/coach';
import { athleteName, formatWeight, formatWeightDifference } from '../../utils/format';
import { formatDaysUntil } from '../../utils/date';
import SectionLabel from '../ui/SectionLabel';

function WeightCell({ weight }: { weight: CoachAthleteDashboardSummary['weight'] }) {
  if (weight.currentWeight === null) {
    return <span className="text-ekvara-black/40">—</span>;
  }
  return (
    <div>
      <p className="font-medium text-ekvara-black">{formatWeight(weight.currentWeight)}</p>
      {weight.target ? (
        <p className="text-xs text-ekvara-black/50">
          objectif {formatWeight(weight.target.weight)}
          {weight.differenceToTarget !== null && (
            <>
              {' '}
              (
              {/* Lime uniquement si exactement à l'objectif (ticket §21) : pas
                  de tolérance inventée, pas de rouge en dessous d'un écart
                  quelconque. */}
              <span className={weight.differenceToTarget === 0 ? 'font-semibold text-ekvara-black' : ''}>
                {weight.differenceToTarget === 0 ? 'à l\'objectif' : formatWeightDifference(weight.differenceToTarget)}
              </span>
              )
            </>
          )}
        </p>
      ) : (
        <p className="text-xs text-ekvara-black/40">Sans objectif</p>
      )}
    </div>
  );
}

function ProgressionCell({ progression }: { progression: CoachAthleteDashboardSummary['progression'] }) {
  if (progression.evaluatedCount === 0) {
    return <span className="text-ekvara-black/40">Pas encore évalué</span>;
  }
  return (
    <span className="text-ekvara-black/80">
      {progression.improvedCount > 0 && <span className="font-medium text-ekvara-black">{progression.improvedCount} ↑</span>}
      {progression.improvedCount > 0 && progression.decliningCount > 0 && ' · '}
      {progression.decliningCount > 0 && <span>{progression.decliningCount} ↓</span>}
      {progression.improvedCount === 0 && progression.decliningCount === 0 && 'Stable'}
    </span>
  );
}

function CompetitionCell({ next }: { next: CoachAthleteDashboardSummary['nextCompetition'] }) {
  if (!next) return <span className="text-ekvara-black/40">—</span>;
  return (
    <div>
      <p className="font-medium text-ekvara-black">{next.name}</p>
      <p className="text-xs text-ekvara-black/50">{formatDaysUntil(next.daysUntil)}</p>
    </div>
  );
}

function AthleteIdentity({ athlete }: { athlete: CoachAthleteDashboardSummary }) {
  const meta = [athlete.ageCategory, athlete.grade].filter(Boolean).join(' · ');
  return (
    <div>
      <p className="font-semibold text-ekvara-black">{athleteName(athlete)}</p>
      {meta && <p className="text-xs text-ekvara-black/50">{meta}</p>}
    </div>
  );
}

function AthletesLedger({ athletes }: { athletes: CoachAthleteDashboardSummary[] }) {
  if (athletes.length === 0) {
    return (
      <section aria-labelledby="ledger-heading">
        <SectionLabel id="ledger-heading">Aperçu du groupe</SectionLabel>
        <p className="mt-3 text-sm text-ekvara-black/60">Aucun athlète pour le moment.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="ledger-heading">
      <SectionLabel id="ledger-heading">Aperçu du groupe</SectionLabel>

      {/* Desktop : tableau éditorial. Mobile : cartes empilées (même
          contenu, mise en page différente) — pas de scroll horizontal. */}
      <table className="mt-2 hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-ekvara-muted">
            <th className="py-2 pr-4 font-medium">Athlète</th>
            <th className="py-2 pr-4 font-medium">Groupe</th>
            <th className="py-2 pr-4 font-medium">Poids</th>
            <th className="py-2 pr-4 font-medium">Progression</th>
            <th className="py-2 font-medium">Prochaine compétition</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {athletes.map((athlete) => (
            <tr key={athlete.id}>
              <td className="py-3 pr-4"><AthleteIdentity athlete={athlete} /></td>
              <td className="py-3 pr-4 text-ekvara-black/70">
                {athlete.groups.length > 0 ? athlete.groups.map((g) => g.name).join(', ') : '—'}
              </td>
              <td className="py-3 pr-4"><WeightCell weight={athlete.weight} /></td>
              <td className="py-3 pr-4"><ProgressionCell progression={athlete.progression} /></td>
              <td className="py-3"><CompetitionCell next={athlete.nextCompetition} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-2 divide-y divide-gray-100 md:hidden">
        {athletes.map((athlete) => (
          <li key={athlete.id} className="space-y-2 py-4">
            <AthleteIdentity athlete={athlete} />
            {athlete.groups.length > 0 && (
              <p className="text-xs text-ekvara-black/50">{athlete.groups.map((g) => g.name).join(', ')}</p>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <WeightCell weight={athlete.weight} />
              <ProgressionCell progression={athlete.progression} />
            </div>
            <CompetitionCell next={athlete.nextCompetition} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default AthletesLedger;
