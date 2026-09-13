import { useState } from 'react';
import type { WeightSummaryView } from '../../types/coach';
import { formatWeight, formatWeightDifference } from '../../utils/format';
import { formatDate } from '../../utils/date';
import Button from '../ui/Button';
import SectionLabel from '../ui/SectionLabel';
import WeightTargetModal from './WeightTargetModal';

interface WeightSectionProps {
  athleteId: string;
  weight: WeightSummaryView;
  onChanged: () => void;
}

// Ticket #3 §6 : affichage strict des champs backend, jamais de tolérance ou
// de couleur recalculée côté frontend (differenceToTarget garde son signe
// brut, jamais de rouge automatique — même principe que AthletesLedger).
function WeightSection({ athleteId, weight, onChanged }: WeightSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const secondaryStats: { label: string; value: string }[] = [];
  if (weight.target) {
    secondaryStats.push({ label: 'Objectif', value: formatWeight(weight.target.weight) });
  }
  if (weight.target && weight.differenceToTarget !== null) {
    secondaryStats.push({ label: 'Écart', value: formatWeightDifference(weight.differenceToTarget) });
  }
  if (weight.weeklyChange !== null) {
    secondaryStats.push({ label: 'Cette semaine', value: formatWeightDifference(weight.weeklyChange) });
  }

  return (
    <section aria-labelledby="weight-heading">
      <SectionLabel id="weight-heading">Poids</SectionLabel>

      {weight.currentWeight === null ? (
        <p className="mt-3 text-sm text-ekvara-black/60">Aucune pesée enregistrée.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-4xl font-extrabold tracking-tight text-ekvara-black">
              {formatWeight(weight.currentWeight)}
            </p>
            {weight.measuredAt && (
              <p className="mt-1 text-sm text-ekvara-black/50">Mesuré le {formatDate(weight.measuredAt)}</p>
            )}
          </div>

          {secondaryStats.length > 0 && (
            <div className="grid grid-cols-2 gap-y-3 sm:grid-cols-3 sm:gap-y-0 sm:divide-x sm:divide-gray-200">
              {secondaryStats.map((stat) => (
                <div key={stat.label} className="sm:px-5 sm:first:pl-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ekvara-muted">{stat.label}</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-ekvara-black">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Button variant="secondary" className="mt-4" onClick={() => setModalOpen(true)}>
        Modifier l'objectif
      </Button>

      {modalOpen && (
        <WeightTargetModal
          athleteId={athleteId}
          currentTarget={weight.target}
          onClose={() => setModalOpen(false)}
          onSaved={onChanged}
        />
      )}
    </section>
  );
}

export default WeightSection;
