import { useEffect, useState, type FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { getCoachAthleteMetricMeasurements, createCoachAthleteMeasurement } from '../../services/coach.api';
import type { MetricMeasurement, MetricOverviewEntry } from '../../types/coach';
import { METRIC_STATUS_LABELS, formatMetricPercentage } from '../../utils/metrics';
import { formatDate } from '../../utils/date';
import { LoadingState, ErrorState } from '../ui/PageState';

interface MetricDetailModalProps {
  athleteId: string;
  metric: MetricOverviewEntry;
  onClose: () => void;
  onMeasurementAdded: () => void;
}

function formatValue(value: number, unit: string | null): string {
  return unit ? `${value} ${unit}` : `${value}`;
}

// Ticket #3 §9-10. Le formulaire d'ajout reste DANS cette modale (pas une
// seconde <Modal> imbriquée) : Modal.tsx (ticket #2) gère un piège de focus
// à un seul niveau — deux modales empilées feraient courir Escape/focus-trap
// l'une sur l'autre. Ne jamais demander l'unité : elle appartient au metric
// type, jamais à la mesure (ticket §10).
function MetricDetailModal({ athleteId, metric, onClose, onMeasurementAdded }: MetricDetailModalProps) {
  const [measurements, setMeasurements] = useState<MetricMeasurement[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [value, setValue] = useState('');
  const [measuredAt, setMeasuredAt] = useState('');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function loadMeasurements() {
    setLoadError(null);
    return getCoachAthleteMetricMeasurements(athleteId, metric.id)
      .then(setMeasurements)
      .catch((err: Error) => setLoadError(err.message));
  }

  useEffect(() => {
    loadMeasurements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId, metric.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedValue = Number(value.trim().replace(',', '.'));
    if (!Number.isFinite(parsedValue)) {
      setFormError('La valeur doit être un nombre.');
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const payload: { value: number; measuredAt?: string; comment?: string } = { value: parsedValue };
      if (measuredAt.trim() !== '') payload.measuredAt = new Date(measuredAt).toISOString();
      if (comment.trim() !== '') payload.comment = comment.trim();

      await createCoachAthleteMeasurement(athleteId, metric.id, payload);
      setValue('');
      setMeasuredAt('');
      setComment('');
      setFormOpen(false);
      onMeasurementAdded();
      await loadMeasurements();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
    } finally {
      setSubmitting(false);
    }
  }

  const { name, currentValue, previousValue, unit, status, percentage, direction } = metric;
  const isImproved = status === 'improved';

  return (
    <Modal title={name} onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="max-h-[75vh] overflow-y-auto p-5">
        {currentValue === null ? (
          <p className="text-sm text-ekvara-black/60">Aucune mesure enregistrée pour cette capacité.</p>
        ) : (
          <div>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <p className="font-display text-4xl font-extrabold leading-none tracking-tight text-ekvara-black">
                {currentValue}
                {unit && <span className="ml-2 font-sans text-base font-medium text-ekvara-black/50">{unit}</span>}
              </p>
              {previousValue !== null && (
                <p className="text-sm text-ekvara-black/50">Précédente : {formatValue(previousValue, unit)}</p>
              )}
            </div>

            {status === 'unknown' ? (
              <p className="mt-3 text-sm text-ekvara-black/60">
                {previousValue === null
                  ? "Pas encore assez de mesures pour évaluer l'évolution."
                  : 'Évolution non calculable.'}
              </p>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ekvara-black">
                {isImproved && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ekvara-lime" aria-hidden="true" />}
                {percentage !== null && `${formatMetricPercentage(percentage)} — `}
                {METRIC_STATUS_LABELS[status]}
              </p>
            )}

            {direction === 'higher' && (
              <p className="mt-2 text-xs text-ekvara-black/50">Une valeur plus élevée indique une progression.</p>
            )}
            {direction === 'lower' && (
              <p className="mt-2 text-xs text-ekvara-black/50">Une valeur plus basse indique une progression.</p>
            )}
          </div>
        )}

        <div className="mt-5">
          <Button type="button" variant="secondary" onClick={() => setFormOpen((open) => !open)}>
            {formOpen ? 'Annuler' : '+ Ajouter une mesure'}
          </Button>

          {formOpen && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-gray-100 pt-4" noValidate>
              <div>
                <label htmlFor="measurement-value" className="mb-1 block text-sm font-medium text-ekvara-black">
                  Valeur{unit ? ` (${unit})` : ''}
                </label>
                <input
                  id="measurement-value"
                  type="number"
                  step="any"
                  autoFocus
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
                />
              </div>
              <div>
                <label htmlFor="measurement-date" className="mb-1 block text-sm font-medium text-ekvara-black">
                  Date (optionnel)
                </label>
                <input
                  id="measurement-date"
                  type="date"
                  value={measuredAt}
                  onChange={(event) => setMeasuredAt(event.target.value)}
                  className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
                />
              </div>
              <div>
                <label htmlFor="measurement-comment" className="mb-1 block text-sm font-medium text-ekvara-black">
                  Commentaire (optionnel)
                </label>
                <input
                  id="measurement-comment"
                  type="text"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
                />
              </div>

              {formError && (
                <p role="alert" className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              <Button type="submit" variant="primary" disabled={submitting} className="w-full">
                {submitting ? 'Ajout...' : 'Ajouter'}
              </Button>
            </form>
          )}
        </div>

        <div className="mt-6 border-t border-gray-100 pt-5">
          {loadError && <ErrorState message={loadError} />}
          {!loadError && !measurements && <LoadingState />}
          {!loadError && measurements && measurements.length > 0 && (
            <>
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">Historique</h3>
              <ul className="mt-3 divide-y divide-gray-100">
                {measurements.map((measurement) => (
                  <li key={measurement.id} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ekvara-black">{formatDate(measurement.measuredAt)}</p>
                      {measurement.comment && <p className="mt-0.5 text-xs text-ekvara-black/50">{measurement.comment}</p>}
                    </div>
                    <p className="flex-shrink-0 font-display text-base font-bold leading-none text-ekvara-black">
                      {measurement.value}
                      {unit && <span className="ml-1 font-sans text-xs font-normal text-ekvara-black/50">{unit}</span>}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default MetricDetailModal;
