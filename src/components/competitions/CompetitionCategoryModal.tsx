import { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import type { CoachCompetitionDetailAthleteView } from '../../types/coach';
import type { CompetitionEntryCategory } from '../../types/competition-entries';
import { athleteName } from '../../utils/format';

// Même seuil que CompetitionEntriesSection côté app athlète (EkvaraFrontend) :
// recherche utile seulement à partir d'un volume réel, jamais affichée pour
// quelques entrées qu'on parcourt directement des yeux.
const SEARCH_MIN_ENTRIES = 20;

const DIACRITICS_PATTERN = new RegExp('[\\u0300-\\u036f]', 'g');

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(DIACRITICS_PATTERN, '');
}

function formatCategoryLabel(ageCategory: string | null, weightCategory: string | null): string {
  return [ageCategory, weightCategory].filter(Boolean).join(' · ') || 'Catégorie non renseignée';
}

interface CompetitionCategoryModalProps {
  ageCategory: string | null;
  weightCategory: string | null;
  ekvaraAthletes: CoachCompetitionDetailAthleteView[];
  entryCategory: CompetitionEntryCategory | null;
  onClose: () => void;
}

// Ouverte au clic sur une carte catégorie (ticket §14) : pas de route
// supplémentaire, une modale suffit. Réutilise le Modal partagé (piège de
// focus + restauration déjà fiabilisés, ticket #6 §28) plutôt qu'un panneau
// ad hoc.
function CompetitionCategoryModal({ ageCategory, weightCategory, ekvaraAthletes, entryCategory, onClose }: CompetitionCategoryModalProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = normalizeSearchText(query);

  const entries = entryCategory?.entries ?? [];
  const filteredEntries = useMemo(() => {
    if (!normalizedQuery) return entries;
    return entries.filter(
      (entry) =>
        normalizeSearchText(entry.name).includes(normalizedQuery) ||
        (entry.club !== null && normalizeSearchText(entry.club).includes(normalizedQuery)),
    );
  }, [entries, normalizedQuery]);

  return (
    <Modal title={formatCategoryLabel(ageCategory, weightCategory)} onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="max-h-[75vh] space-y-6 overflow-y-auto p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">
            {ekvaraAthletes.length} {ekvaraAthletes.length > 1 ? 'athlètes EKVARA' : 'athlète EKVARA'}
          </p>
          <ul className="mt-2 divide-y divide-gray-100">
            {ekvaraAthletes.map((athlete) => (
              <li key={athlete.id} className="py-2 text-sm font-medium text-ekvara-black">
                {athleteName(athlete)}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-100 pt-5">
          {/* Jamais "Adversaires" (ticket §15) : ce sont des inscrits, pas
              des adversaires confirmés — aucune prédiction de combat. */}
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">
            {entryCategory ? `${entryCategory.entries.length} inscrits dans la catégorie` : 'Inscrits dans la catégorie'}
          </p>

          {!entryCategory && (
            <p className="mt-3 text-sm text-ekvara-black/60">Aucun inscrit publié pour le moment.</p>
          )}

          {entryCategory && (
            <>
              {entries.length >= SEARCH_MIN_ENTRIES && (
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un inscrit ou un club..."
                  aria-label="Rechercher un inscrit ou un club"
                  className="mt-3 w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
                />
              )}

              <ul className="mt-3 divide-y divide-gray-100">
                {filteredEntries.length === 0 && (
                  <li className="py-4 text-sm text-ekvara-black/60">Aucun inscrit trouvé.</li>
                )}
                {filteredEntries.map((entry, index) => (
                  <li key={entry.id} className="flex items-baseline gap-3 py-2.5">
                    <span className="w-6 flex-shrink-0 font-display text-sm text-ekvara-black/30">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ekvara-black">{entry.name}</p>
                      {(entry.club || entry.league) && (
                        <p className="truncate text-xs text-ekvara-black/50">
                          {[entry.club, entry.league].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
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

export default CompetitionCategoryModal;
