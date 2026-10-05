import type { CoachDashboardSummary } from '../../types/coach';
import SectionLabel from '../ui/SectionLabel';

interface StatRowProps {
  label: string;
  value: number;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-ekvara-black/70">{label}</span>
      <span className={`font-display text-sm font-bold tabular-nums ${value === 0 ? 'text-ekvara-black/40' : 'text-ekvara-black'}`}>{value}</span>
    </div>
  );
}

function SummaryStats({ summary }: { summary: CoachDashboardSummary }) {
  return (
    <section aria-labelledby="mon-groupe-heading">
      <SectionLabel id="mon-groupe-heading">Mon groupe</SectionLabel>

      <div className="mt-2 flex items-baseline gap-3">
        <p className="font-display text-5xl font-extrabold tracking-tight text-ekvara-black">
          {summary.athleteCount}
        </p>
        <p className="text-sm font-medium text-ekvara-black/70">
          {summary.athleteCount > 1 ? 'athlètes' : 'athlète'}
          {summary.groupCount > 0 && (
            <>
              {' '}
              · {summary.groupCount} {summary.groupCount > 1 ? 'groupes' : 'groupe'}
            </>
          )}
        </p>
      </div>

      <div className="mt-6 grid gap-x-8 gap-y-1 sm:grid-cols-2">
        <div className="divide-y divide-gray-100">
          <p className="pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ekvara-muted">Poids</p>
          <StatRow label="À l'objectif" value={summary.athletesOnTargetWeight} />
          <StatRow label="Au-dessus" value={summary.athletesAboveTargetWeight} />
          <StatRow label="En dessous" value={summary.athletesBelowTargetWeight} />
          <StatRow label="Sans objectif défini" value={summary.athletesWithoutWeightTarget} />
        </div>

        <div className="divide-y divide-gray-100">
          <p className="pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ekvara-muted">Progression</p>
          <StatRow label="Profils en progression" value={summary.athletesImproving} />
          <StatRow label="Profils en baisse" value={summary.athletesDeclining} />
          {/* athletesWithoutRecentMetrics = aucune mesure du tout côté
              backend, jamais "pas récent" (ticket §16). */}
          <StatRow label="Sans données de progression" value={summary.athletesWithoutRecentMetrics} />
          <StatRow label="Compétition à venir" value={summary.athletesWithUpcomingCompetition} />
        </div>
      </div>
    </section>
  );
}

export default SummaryStats;
