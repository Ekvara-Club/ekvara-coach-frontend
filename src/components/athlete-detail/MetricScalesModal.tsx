import { useEffect, useState, type FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { getClubMetricScales, saveClubMetricScales } from '../../services/coach.api';
import type { ClubMetricScale } from '../../types/coach';

interface MetricScalesModalProps {
  onClose: () => void;
  onSaved: () => void;
}

interface RowState {
  zero: string;
  hundred: string;
}

function toInput(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function parse(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : Number.NaN;
}

function directionHint(direction: string | null): string {
  if (direction === 'lower') return 'plus bas = mieux';
  if (direction === 'higher') return 'plus haut = mieux';
  return '';
}

// Barème de l'étoile de compétences du CLUB : pour chaque capacité, la
// valeur qui vaut 0/100 et celle qui vaut 100/100. Champs vides = barème par
// défaut (affiché en indication). S'applique à tous les athlètes du club.
function MetricScalesModal({ onClose, onSaved }: MetricScalesModalProps) {
  const [scales, setScales] = useState<ClubMetricScale[] | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getClubMetricScales()
      .then((data) => {
        if (cancelled) return;
        setScales(data.scales);
        setRows(
          Object.fromEntries(
            data.scales.map((s) => [s.metricTypeId, { zero: toInput(s.club?.scoreZero), hundred: toInput(s.club?.scoreHundred) }]),
          ),
        );
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message || 'Impossible de charger le barème.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update(metricTypeId: string, field: keyof RowState, value: string) {
    setRows((current) => ({ ...current, [metricTypeId]: { ...current[metricTypeId], [field]: value } }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!scales) return;
    setError(null);

    const payload: { metricTypeId: string; scoreZero: number | null; scoreHundred: number | null }[] = [];
    for (const scale of scales) {
      const zero = parse(rows[scale.metricTypeId].zero);
      const hundred = parse(rows[scale.metricTypeId].hundred);
      if (Number.isNaN(zero) || Number.isNaN(hundred)) {
        setError(`${scale.name} : saisis des nombres.`);
        return;
      }
      if ((zero === null) !== (hundred === null)) {
        setError(`${scale.name} : renseigne les deux valeurs, ou aucune pour le barème par défaut.`);
        return;
      }
      const unchanged = zero === (scale.club?.scoreZero ?? null) && hundred === (scale.club?.scoreHundred ?? null);
      if (!unchanged) payload.push({ metricTypeId: scale.metricTypeId, scoreZero: zero, scoreHundred: hundred });
    }

    if (payload.length === 0) {
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      await saveClubMetricScales(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Barème de l'étoile de compétences" onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col overflow-y-auto p-5" noValidate>
        <p className="text-sm text-ekvara-black/70">
          Pour chaque capacité, la valeur qui vaut 0/100 et celle qui vaut 100/100. Ce barème s'applique à tous les
          athlètes de ton club. Laisse vide pour garder le barème par défaut.
        </p>

        {loadError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {loadError}
          </p>
        )}
        {!loadError && !scales && <p className="mt-3 text-sm text-ekvara-black/60">Chargement...</p>}

        {scales && (
          <div className="mt-4 flex flex-col divide-y divide-gray-100">
            {scales.map((scale) => {
              const unit = scale.unit ? ` (${scale.unit})` : '';
              const row = rows[scale.metricTypeId];
              return (
                <fieldset key={scale.metricTypeId} className="py-3">
                  <legend className="text-sm font-semibold text-ekvara-black">
                    {scale.name}
                    <span className="ml-2 text-xs font-normal text-ekvara-black/60">{directionHint(scale.direction)}</span>
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <label className="text-xs text-ekvara-black/70">
                      0/100{unit}
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.zero}
                        placeholder={scale.default ? String(scale.default.scoreZero) : ''}
                        onChange={(event) => update(scale.metricTypeId, 'zero', event.target.value)}
                        className="mt-1 w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2 text-sm text-ekvara-black"
                      />
                    </label>
                    <label className="text-xs text-ekvara-black/70">
                      100/100{unit}
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.hundred}
                        placeholder={scale.default ? String(scale.default.scoreHundred) : ''}
                        onChange={(event) => update(scale.metricTypeId, 'hundred', event.target.value)}
                        className="mt-1 w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2 text-sm text-ekvara-black"
                      />
                    </label>
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={submitting || !scales}>
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default MetricScalesModal;
