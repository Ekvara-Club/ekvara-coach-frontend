import { useState } from 'react';
import type { CoachAthleteDetailDashboard, MetricOverviewEntry } from '../../types/coach';
import { METRIC_STATUS_LABELS, formatMetricPercentage } from '../../utils/metrics';
import SectionLabel from '../ui/SectionLabel';
import SkillsRadar from './SkillsRadar';
import MetricDetailModal from './MetricDetailModal';
import MetricScalesModal from './MetricScalesModal';

interface ProgressionSectionProps {
  athleteId: string;
  progression: CoachAthleteDetailDashboard['progression'];
  metrics: MetricOverviewEntry[];
  onMeasurementAdded: () => void;
}

// Ligne "ledger" portée depuis MetricsLedger.tsx (EkvaraFrontend, §8-9) : le
// point lime ne dépend QUE de `status === 'improved'` fourni par le backend,
// jamais du signe de `delta` — un temps de réaction 420 -> 380 ms doit
// rester une progression (ticket §11).
function MetricRow({ metric, onSelect }: { metric: MetricOverviewEntry; onSelect: () => void }) {
  const { currentValue, unit, status, percentage } = metric;
  const isImproved = status === 'improved';

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="grid w-full grid-cols-[16px_1fr] items-center gap-x-3 gap-y-1 border-l-2 border-transparent py-3 pl-3 pr-1 text-left transition-colors hover:bg-gray-50 sm:grid-cols-[16px_1fr_auto_auto] sm:gap-x-6"
      >
        <span
          className={`h-2 w-2 flex-shrink-0 rounded-full ${
            isImproved ? 'bg-ekvara-lime' : 'border border-ekvara-black/20'
          }`}
          aria-hidden="true"
        />
        <p className="text-sm font-semibold uppercase tracking-wide text-ekvara-black">{metric.name}</p>

        {currentValue === null ? (
          <p className="col-start-2 text-sm text-ekvara-black/50 sm:col-start-3">Pas encore évaluée</p>
        ) : (
          <>
            <p className="col-start-2 font-display text-base font-bold text-ekvara-black sm:col-start-3 sm:text-right">
              {currentValue}
              {unit && <span className="ml-1 font-sans text-xs font-normal text-ekvara-black/50">{unit}</span>}
            </p>
            {status === 'unknown' ? (
              <p className="col-start-2 text-xs text-ekvara-black/50 sm:col-start-4">Pas assez de données</p>
            ) : (
              <p className="col-start-2 text-xs text-ekvara-black/70 sm:col-start-4 sm:text-right">
                {percentage !== null && `${formatMetricPercentage(percentage)} · `}
                {METRIC_STATUS_LABELS[status]}
              </p>
            )}
          </>
        )}
      </button>
    </li>
  );
}

function ProgressionSection({ athleteId, progression, metrics, onMeasurementAdded }: ProgressionSectionProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricOverviewEntry | null>(null);
  const [scalesOpen, setScalesOpen] = useState(false);

  return (
    <section aria-labelledby="progression-heading">
      <SectionLabel id="progression-heading">Progression</SectionLabel>

      {progression.evaluatedCount > 0 && (
        <p className="mt-2 text-sm text-ekvara-black/70">
          {progression.improvedCount} {progression.improvedCount > 1 ? 'capacités' : 'capacité'} en progression
          {progression.decliningCount > 0 &&
            ` · ${progression.decliningCount} en baisse`}
        </p>
      )}

      {metrics.length > 0 && (
        <div className="mt-4">
          <SkillsRadar metrics={metrics} />
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setScalesOpen(true)}
              className="text-sm font-medium text-ekvara-black underline-offset-2 hover:underline"
            >
              Barème
            </button>
          </div>
        </div>
      )}

      {scalesOpen && (
        <MetricScalesModal
          onClose={() => setScalesOpen(false)}
          onSaved={() => {
            setScalesOpen(false);
            // Les notes de l'étoile dépendent du barème : même rechargement
            // que l'ajout d'une mesure.
            onMeasurementAdded();
          }}
        />
      )}

      {metrics.length === 0 ? (
        <p className="mt-3 text-sm text-ekvara-black/60">Aucune capacité sportive suivie pour le moment.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
          {metrics.map((metric) => (
            <MetricRow key={metric.id} metric={metric} onSelect={() => setSelectedMetric(metric)} />
          ))}
        </ul>
      )}

      {selectedMetric && (
        <MetricDetailModal
          athleteId={athleteId}
          metric={selectedMetric}
          onClose={() => setSelectedMetric(null)}
          onMeasurementAdded={onMeasurementAdded}
        />
      )}
    </section>
  );
}

export default ProgressionSection;
