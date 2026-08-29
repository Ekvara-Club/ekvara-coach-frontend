import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import { getCoachDashboardAthletes, createCoachCompetitionPreparation, ApiError } from '../../services/coach.api';
import type { CoachAthleteDashboardSummary, CoachCompetitionPreparationSummary } from '../../types/coach';
import { athleteName } from '../../utils/format';
import { normalizeForSearch } from '../../utils/search';
import { LoadingState, ErrorState } from '../ui/PageState';

interface AddAthleteToPreparationModalProps {
  competitionId: string;
  // Athlètes déjà présents sur la fiche (participation officielle OU
  // préparation existante, ticket §6) : jamais proposés une seconde fois
  // dans le sélecteur — la contrainte unique backend les rejetterait de
  // toute façon (409), mais les exclure ici évite un aller-retour inutile.
  excludedAthleteIds: string[];
  onClose: () => void;
  onAdded: (athleteId: string, preparation: CoachCompetitionPreparationSummary) => void;
}

// "Ajouter un athlète" (ticket §6) : uniquement le roster du coach,
// recherche locale par nom, affiche groupe(s) + catégorie actuelle si
// disponible. Ne crée QU'UNE préparation par athlète sélectionné — jamais de
// participation officielle créée en chemin (ticket §8).
function AddAthleteToPreparationModal({ competitionId, excludedAthleteIds, onClose, onAdded }: AddAthleteToPreparationModalProps) {
  const [roster, setRoster] = useState<CoachAthleteDashboardSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCoachDashboardAthletes()
      .then((data) => {
        if (!cancelled) setRoster(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const excludedSet = useMemo(() => new Set(excludedAthleteIds), [excludedAthleteIds]);

  const candidates = useMemo(() => {
    if (!roster) return [];
    const available = roster.filter((athlete) => !excludedSet.has(athlete.id));
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery) return available;
    return available.filter((athlete) => normalizeForSearch(athleteName(athlete)).includes(normalizedQuery));
  }, [roster, excludedSet, query]);

  async function handleAdd(athleteId: string) {
    setActionError(null);
    setAddingId(athleteId);
    try {
      const preparation = await createCoachCompetitionPreparation(competitionId, { athleteId });
      onAdded(athleteId, preparation);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Une erreur est survenue. Réessaie.');
    } finally {
      setAddingId(null);
    }
  }

  return (
    <Modal title="Ajouter un athlète" onClose={onClose}>
      <div className="flex max-h-[70vh] flex-col p-5">
        <label htmlFor="prep-athlete-search" className="sr-only">
          Rechercher un athlète
        </label>
        <input
          id="prep-athlete-search"
          type="search"
          autoFocus
          placeholder="Rechercher un athlète..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full flex-shrink-0 rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
        />

        {actionError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {actionError}
          </p>
        )}

        <div className="mt-4 flex-1 overflow-y-auto">
          {loadError && <ErrorState message={loadError} />}
          {!loadError && !roster && <LoadingState />}
          {!loadError && roster && candidates.length === 0 && (
            <p className="py-4 text-sm text-ekvara-black/60">
              {roster.length === excludedSet.size
                ? 'Tous les athlètes du roster sont déjà sur cette compétition.'
                : 'Aucun athlète ne correspond à ta recherche.'}
            </p>
          )}
          {!loadError && candidates.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {candidates.map((athlete) => {
                const meta = [athlete.ageCategory, athlete.groups.map((g) => g.name).join(', ')].filter(Boolean).join(' — ');
                return (
                  <li key={athlete.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ekvara-black">{athleteName(athlete)}</p>
                      {meta && <p className="truncate text-xs text-ekvara-black/50">{meta}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(athlete.id)}
                      disabled={addingId === athlete.id}
                      className="flex-shrink-0 text-sm font-medium text-ekvara-black underline decoration-ekvara-black/30 underline-offset-2 hover:decoration-ekvara-black disabled:opacity-50"
                    >
                      {addingId === athlete.id ? 'Ajout...' : 'Ajouter'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default AddAthleteToPreparationModal;
