import { useEffect, useState } from 'react';
import { getCoachCompetitions } from '../services/coach.api';
import type { CoachCompetitionsListView } from '../types/coach';
import { navigateTo } from '../utils/navigation';
import { LoadingState, ErrorState } from '../components/ui/PageState';
import SectionLabel from '../components/ui/SectionLabel';
import Button from '../components/ui/Button';
import CompetitionListRow from '../components/competitions/CompetitionListRow';
import PrepareCompetitionModal from '../components/competitions/PrepareCompetitionModal';

// Ticket #7 §3 : liste éditoriale, pas de grille de cards — même discipline
// visuelle que Athletes/Groups/Exercises (ticket #6 §9). Aucune donnée
// n'est recalculée ici : le backend a déjà réparti upcoming/past et dédupliqué
// par competition.id (voir CoachCompetitionsService.getCompetitions).
function CompetitionsPage() {
  const [data, setData] = useState<CoachCompetitionsListView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prepareOpen, setPrepareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCoachCompetitions()
      .then((result) => {
        if (!cancelled) setData(result);
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

  const isEmpty = data && data.upcoming.length === 0 && data.past.length === 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ekvara-black sm:text-3xl">
            Compétitions
          </h1>
          <p className="mt-1 text-sm text-ekvara-black/60">Suis les échéances de tes athlètes.</p>
        </div>
        {/* Ticket §22/§23 : point d'entrée pour préparer une compétition qui
            n'a pas encore de participation officielle connue côté roster. */}
        <Button variant="primary" onClick={() => setPrepareOpen(true)}>
          + Préparer une compétition
        </Button>
      </div>

      <div className="mt-8">
        {error && <ErrorState message={error} />}
        {!error && loading && <LoadingState />}

        {!error && !loading && data && isEmpty && (
          <p className="py-8 text-sm text-ekvara-black/60">Aucune compétition prévue pour ton groupe.</p>
        )}

        {!error && !loading && data && !isEmpty && (
          <div className="space-y-10">
            {data.upcoming.length > 0 && (
              <section aria-labelledby="upcoming-competitions-heading">
                <SectionLabel id="upcoming-competitions-heading">À venir</SectionLabel>
                <ul className="mt-2 divide-y divide-gray-100">
                  {data.upcoming.map((group) => (
                    <CompetitionListRow key={group.competition.id} group={group} />
                  ))}
                </ul>
              </section>
            )}

            {/* Section "Passées" masquée entièrement si vide (ticket §24) :
                jamais un gros bloc vide affiché sous "À venir". */}
            {data.past.length > 0 && (
              <section aria-labelledby="past-competitions-heading">
                <SectionLabel id="past-competitions-heading">Passées</SectionLabel>
                <ul className="mt-2 divide-y divide-gray-100">
                  {data.past.map((group) => (
                    <CompetitionListRow key={group.competition.id} group={group} past />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      {prepareOpen && (
        <PrepareCompetitionModal
          onClose={() => setPrepareOpen(false)}
          onPrepared={(competitionId) => {
            setPrepareOpen(false);
            navigateTo(`/competitions/${competitionId}`);
          }}
        />
      )}
    </div>
  );
}

export default CompetitionsPage;
