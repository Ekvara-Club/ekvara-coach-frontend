import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { searchCompetitions } from '../../services/coach.api';
import type { CompetitionCatalogItem } from '../../types/coach';
import { formatDate } from '../../utils/date';
import { LoadingState, ErrorState } from '../ui/PageState';
import AddAthleteToPreparationModal from './AddAthleteToPreparationModal';

const SEARCH_MIN_LENGTH = 3;

interface PrepareCompetitionModalProps {
  onClose: () => void;
  onPrepared: (competitionId: string) => void;
}

// Ticket §22/§23 : le coach choisit toujours un competition.id canonique du
// catalogue existant, jamais une nouvelle compétition créée côté Coach.
// Étape 1 : recherche + sélection. Étape 2 (réutilise AddAthleteToPreparationModal
// tel quel) : ajouter le premier athlète — c'est cette action qui fait
// réellement "entrer" la compétition dans l'univers Coach (première
// préparation créée), pas la simple sélection dans cette liste.
function PrepareCompetitionModal({ onClose, onPrepared }: PrepareCompetitionModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompetitionCatalogItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CompetitionCatalogItem | null>(null);

  useEffect(() => {
    if (query.trim().length < SEARCH_MIN_LENGTH) {
      setResults(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      searchCompetitions(query.trim())
        .then((data) => {
          if (!cancelled) setResults(data);
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  if (selected) {
    return (
      <AddAthleteToPreparationModal
        competitionId={selected.id}
        excludedAthleteIds={[]}
        onClose={onClose}
        onAdded={() => onPrepared(selected.id)}
      />
    );
  }

  return (
    <Modal title="Préparer une compétition" onClose={onClose}>
      <div className="flex max-h-[70vh] flex-col p-5">
        <label htmlFor="prepare-competition-search" className="sr-only">
          Rechercher une compétition
        </label>
        <input
          id="prepare-competition-search"
          type="search"
          autoFocus
          placeholder="Championnat de France..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full flex-shrink-0 rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
        />

        <div className="mt-4 flex-1 overflow-y-auto">
          {query.trim().length < SEARCH_MIN_LENGTH && (
            <p className="py-4 text-sm text-ekvara-black/60">Tape au moins {SEARCH_MIN_LENGTH} caractères pour chercher.</p>
          )}
          {error && <ErrorState message={error} />}
          {!error && loading && <LoadingState />}
          {!error && !loading && results && results.length === 0 && (
            <p className="py-4 text-sm text-ekvara-black/60">Aucune compétition ne correspond à ta recherche.</p>
          )}
          {!error && !loading && results && results.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {results.map((competition) => (
                <li key={competition.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium uppercase text-ekvara-black">{competition.nom}</p>
                    <p className="truncate text-xs text-ekvara-black/50">
                      {formatDate(competition.date_debut)}
                      {competition.ville && ` · ${competition.ville}`}
                    </p>
                  </div>
                  <Button type="button" variant="secondary" className="flex-shrink-0" onClick={() => setSelected(competition)}>
                    Préparer
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default PrepareCompetitionModal;
