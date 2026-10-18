import { useEffect, useState } from 'react';
import { getCoachAthleteMeasurements } from '../../services/coach.api';
import type { CoachAthleteMeasurements } from '../../types/coach';
import SectionLabel from '../ui/SectionLabel';
import { ErrorState, LoadingState } from '../ui/PageState';

interface MeasurementsSectionProps {
  athleteId: string;
}

// Mensurations déclarées par l'athlète dans son passeport (lecture seule
// pour le coach). Section indépendante et auto-chargée, comme
// AttendanceSection : une erreur ici ne casse jamais le reste de la fiche.
function MeasurementsSection({ athleteId }: MeasurementsSectionProps) {
  const [measurements, setMeasurements] = useState<CoachAthleteMeasurements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCoachAthleteMeasurements(athleteId)
      .then((data) => {
        if (!cancelled) setMeasurements(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [athleteId]);

  const empty = measurements !== null && measurements.tailleCm === null && measurements.longueurBrasCm === null;

  return (
    <section aria-labelledby="measurements-heading">
      <SectionLabel id="measurements-heading">Mensurations</SectionLabel>

      {loading && <LoadingState label="Chargement des mensurations..." />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && measurements && (
        <div className="mt-3">
          {empty ? (
            <p className="text-sm text-ekvara-black/60">Non renseignées par l'athlète.</p>
          ) : (
            <dl className="grid max-w-md grid-cols-2 gap-x-6">
              <div>
                <dt className="text-sm text-ekvara-black/60">Taille</dt>
                <dd className="mt-1 font-display text-3xl font-extrabold text-ekvara-black">
                  {measurements.tailleCm !== null ? `${measurements.tailleCm} cm` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ekvara-black/60">Longueur de bras</dt>
                <dd className="mt-1 font-display text-3xl font-extrabold text-ekvara-black">
                  {measurements.longueurBrasCm !== null ? `${measurements.longueurBrasCm} cm` : '—'}
                </dd>
              </div>
            </dl>
          )}
        </div>
      )}
    </section>
  );
}

export default MeasurementsSection;
