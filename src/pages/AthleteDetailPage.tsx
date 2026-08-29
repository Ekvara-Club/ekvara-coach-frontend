import { useCallback, useEffect, useState } from 'react';
import {
  getCoachAthleteDashboard,
  getCoachAthleteMetricsOverview,
  getCoachAthleteGoals,
  ApiError,
} from '../services/coach.api';
import type { CoachAthleteDetailDashboard, Goal, MetricOverviewEntry } from '../types/coach';
import { handleNavClick } from '../utils/navigation';
import { LoadingState, ErrorState } from '../components/ui/PageState';
import AthleteHeader from '../components/athlete-detail/AthleteHeader';
import PreparationSection from '../components/athlete-detail/PreparationSection';
import WeightSection from '../components/athlete-detail/WeightSection';
import ProgressionSection from '../components/athlete-detail/ProgressionSection';
import GoalsSection from '../components/athlete-detail/GoalsSection';
import AttendanceSection from '../components/athlete-detail/AttendanceSection';

interface AthleteDetailPageProps {
  athleteId: string;
}

// Ticket #3 §3 : 3 requêtes pour tout le chargement initial de la page —
// GET .../dashboard (identité, préparation, poids, progression agrégée),
// GET .../metrics/overview (liste détaillée des capacités, absente du
// dashboard), GET .../goals (liste complète avec steps, absente du
// dashboard). GET .../weight et GET .../ (brut) volontairement jamais
// appelés : doublons exacts ou inutiles (voir coach.api.ts). Le détail
// d'une mesure (historique) n'est chargé qu'à l'ouverture de sa modale.
function AthleteDetailPage({ athleteId }: AthleteDetailPageProps) {
  const [dashboard, setDashboard] = useState<CoachAthleteDetailDashboard | null>(null);
  const [metrics, setMetrics] = useState<MetricOverviewEntry[] | null>(null);
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<'forbidden' | 'notfound' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(() => {
    return getCoachAthleteDashboard(athleteId).then(setDashboard);
  }, [athleteId]);

  const loadMetrics = useCallback(() => {
    return getCoachAthleteMetricsOverview(athleteId).then((data) => setMetrics(data.metrics));
  }, [athleteId]);

  const loadGoals = useCallback(() => {
    return getCoachAthleteGoals(athleteId).then(setGoals);
  }, [athleteId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAccessError(null);
    setError(null);

    Promise.all([loadDashboard(), loadMetrics(), loadGoals()])
      .catch((err: unknown) => {
        if (cancelled) return;
        // Ticket §18 : une fiche partielle ne doit jamais s'afficher sur 403/
        // 404 — CoachAthleteAccessGuard renvoie toujours 403 (jamais 404) sur
        // un athlète inconnu ou non assigné (voir coach-athlete-access.guard.
        // ts) ; le cas 404 reste géré pour les erreurs de service (ex. course
        // improbable), jamais atteint en pratique via ce guard.
        if (err instanceof ApiError && err.status === 403) {
          setAccessError('forbidden');
        } else if (err instanceof ApiError && err.status === 404) {
          setAccessError('notfound');
        } else {
          setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [athleteId, loadDashboard, loadMetrics, loadGoals]);

  function refreshAfterWeightChange() {
    loadDashboard().catch((err: Error) => setError(err.message));
  }

  function refreshAfterMeasurement() {
    Promise.all([loadMetrics(), loadDashboard()]).catch((err: Error) => setError(err.message));
  }

  function refreshAfterGoalChange() {
    Promise.all([loadGoals(), loadDashboard()]).catch((err: Error) => setError(err.message));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <a
        href="/athletes"
        onClick={(event) => handleNavClick(event, '/athletes')}
        className="text-sm font-medium text-ekvara-black/60 hover:text-ekvara-black"
      >
        &larr; Athlètes
      </a>

      <div className="mt-4">
        {loading && <LoadingState />}

        {!loading && accessError === 'forbidden' && (
          <p className="py-8 text-sm text-ekvara-black/70">Tu n'as plus accès à cet athlète.</p>
        )}
        {!loading && accessError === 'notfound' && (
          <p className="py-8 text-sm text-ekvara-black/70">Cet athlète est introuvable.</p>
        )}
        {!loading && !accessError && error && <ErrorState message={error} />}

        {!loading && !accessError && !error && dashboard && metrics && goals && (
          <div>
            <AthleteHeader athlete={dashboard} />

            {/* Dossier sportif : sections nettement séparées par un simple
                trait, jamais des cards SaaS empilées (ticket §2/§23). */}
            <div className="mt-8 divide-y divide-gray-100 [&>*]:py-8 [&>*:first-child]:pt-0">
              <PreparationSection athlete={dashboard} />
              <AttendanceSection athleteId={athleteId} />
              <WeightSection athleteId={athleteId} weight={dashboard.weight} onChanged={refreshAfterWeightChange} />
              <ProgressionSection
                athleteId={athleteId}
                progression={dashboard.progression}
                metrics={metrics}
                onMeasurementAdded={refreshAfterMeasurement}
              />
              <GoalsSection athleteId={athleteId} goals={goals} onChanged={refreshAfterGoalChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AthleteDetailPage;
