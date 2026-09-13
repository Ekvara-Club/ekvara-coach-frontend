import { useEffect, useState } from 'react';
import { useCoachAuth } from '../contexts/CoachAuthContext';
import { getCoachDashboard, getCoachDashboardAthletes } from '../services/coach.api';
import type { CoachAthleteDashboardSummary, CoachDashboard } from '../types/coach';
import SummaryStats from '../components/dashboard/SummaryStats';
import UpcomingCompetitions from '../components/dashboard/UpcomingCompetitions';
import AttentionList from '../components/dashboard/AttentionList';
import AthletesLedger from '../components/dashboard/AthletesLedger';
import { LoadingState, ErrorState } from '../components/ui/PageState';
import Button from '../components/ui/Button';
import { navigateTo } from '../utils/navigation';

function DashboardPage() {
  const { coach } = useCoachAuth();
  const [dashboard, setDashboard] = useState<CoachDashboard | null>(null);
  const [athletes, setAthletes] = useState<CoachAthleteDashboardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Exactement 2 requêtes pour toute la page, jamais une par ligne
    // (ticket §32 point 14) : /coach/dashboard pour summary/compétitions/
    // attention, /coach/dashboard/athletes pour l'aperçu détaillé.
    Promise.all([getCoachDashboard(), getCoachDashboardAthletes()])
      .then(([dashboardData, athletesData]) => {
        if (cancelled) return;
        setDashboard(dashboardData);
        setAthletes(athletesData);
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
  }, []);

  const firstName = coach?.user.prenom;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-extrabold text-ekvara-black sm:text-3xl">
        Bonjour{firstName ? ` ${firstName}` : ''}
      </h1>
      <p className="mt-1 text-sm text-ekvara-black/60">Vue d'ensemble de ton groupe.</p>

      <div className="mt-8">
        {/* Erreur dashboard séparée d'une erreur d'auth (ticket §26) :
            l'auth est déjà résolue avant d'arriver ici (voir App.tsx). */}
        {error && <ErrorState message={error} />}
        {!error && loading && <LoadingState label="Chargement du dashboard..." />}

        {!error && !loading && dashboard && (
          <>
            {dashboard.summary.athleteCount === 0 ? (
              <div className="py-8">
                <p className="font-display text-lg font-bold text-ekvara-black">Ton groupe est vide</p>
                <p className="mt-1 text-sm text-ekvara-black/60">
                  Aucun athlète ne t'est encore rattaché.
                </p>
                {/* CTA réel (ticket #6 §11) : le flux d'ajout existe
                    (ticket #2), plus de raison de laisser ce bouton mort. */}
                <Button variant="primary" className="mt-4" onClick={() => navigateTo('/athletes')}>
                  + Ajouter un athlète
                </Button>
              </div>
            ) : (
              // Ordre revu (ticket #6 §10) : ce qui demande l'attention du
              // coach passe avant l'agenda (Athlètes à suivre avant
              // Prochaines compétitions), jamais l'inverse.
              <div className="space-y-10">
                <SummaryStats summary={dashboard.summary} />
                <AttentionList items={dashboard.athletesNeedingAttention} />
                <UpcomingCompetitions items={dashboard.upcomingCompetitions} />
                {/* recentActivity: [] tant qu'aucune source fiable n'existe
                    côté backend (ticket §24) : section entièrement masquée,
                    jamais un bloc vide affiché. */}
                {athletes && <AthletesLedger athletes={athletes} />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
