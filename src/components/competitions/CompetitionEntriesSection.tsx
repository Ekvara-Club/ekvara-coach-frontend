import { useMemo, useState } from 'react';
import SectionLabel from '../ui/SectionLabel';
import EntryRow from './EntryRow';
import CategoryDisclosureRow from './CategoryDisclosureRow';
import type { CompetitionEntriesResponse, CompetitionEntry } from '../../types/competition-entries';

interface CompetitionEntriesSectionProps {
  // Chargés une seule fois par CompetitionDetailPage (déjà utilisés par
  // "Catégories du groupe") : jamais un second appel /entries.
  entries: CompetitionEntriesResponse | null;
  error: boolean;
}

// Même section "Inscrits" que l'app athlète (EkvaraFrontend,
// CompetitionEntriesSection), sans le bloc "Ma catégorie" : côté coach, le
// rapprochement avec les athlètes de l'équipe vit déjà dans "Catégories du
// groupe". Inscrits publiés par la source, jamais liés à un athlète EKVARA.
const DIACRITICS_PATTERN = /[̀-ͯ]/g;

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(DIACRITICS_PATTERN, '');
}

const SEARCH_MIN_ENTRIES = 20;

function formatEntriesSummary(totalEntries: number, categoryCount: number): string {
  const entriesLabel = totalEntries === 1 ? 'inscrit' : 'inscrits';
  const categoriesLabel = categoryCount === 1 ? 'catégorie' : 'catégories';
  return `${totalEntries} ${entriesLabel} · ${categoryCount} ${categoriesLabel}`;
}

function matchesQuery(entry: CompetitionEntry, normalizedQuery: string): boolean {
  return (
    normalizeSearchText(entry.name).includes(normalizedQuery) ||
    (entry.club !== null && normalizeSearchText(entry.club).includes(normalizedQuery))
  );
}

function CompetitionEntriesSection({ entries, error }: CompetitionEntriesSectionProps) {
  const [expandedRawLabel, setExpandedRawLabel] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const normalizedQuery = normalizeSearchText(query);
  const searchResults = useMemo(() => {
    if (!entries || !normalizedQuery) return null;
    return entries.categories.flatMap((category) =>
      category.entries
        .filter((entry) => matchesQuery(entry, normalizedQuery))
        .map((entry) => ({ entry, categoryLabel: category.rawLabel })),
    );
  }, [entries, normalizedQuery]);

  return (
    <section aria-labelledby="competition-entries-heading" className="border-t border-gray-100 pt-8">
      <SectionLabel id="competition-entries-heading">Inscrits</SectionLabel>

      {!entries && !error && <p className="mt-4 text-sm text-ekvara-black/50">Chargement...</p>}

      {error && <p className="mt-4 text-sm text-red-600">Impossible de charger les inscrits.</p>}

      {!error && entries && (
        <>
          <p className="mt-2 text-sm font-semibold text-ekvara-black/70">
            {formatEntriesSummary(entries.totalEntries, entries.categories.length)}
          </p>

          {entries.totalEntries === 0 && (
            <p className="mt-4 text-sm text-ekvara-black/60">Aucun inscrit publié pour le moment.</p>
          )}

          {entries.totalEntries > 0 && (
            <div className="mt-6">
              {entries.totalEntries >= SEARCH_MIN_ENTRIES && (
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un inscrit..."
                  aria-label="Rechercher un inscrit"
                  className="mb-3 w-full max-w-md rounded-md border border-gray-300 px-4 py-2.5 text-sm"
                />
              )}

              {searchResults ? (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {searchResults.length === 0 && <p className="py-4 text-sm text-ekvara-black/60">Aucun inscrit trouvé.</p>}
                  {searchResults.map(({ entry, categoryLabel }, index) => (
                    <div key={entry.id}>
                      <EntryRow entry={entry} index={index} />
                      <p className="-mt-1 pb-2 pl-9 text-xs text-ekvara-muted">{categoryLabel}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {entries.categories.map((category) => (
                    <CategoryDisclosureRow
                      key={category.rawLabel}
                      category={category}
                      expanded={expandedRawLabel === category.rawLabel}
                      onToggle={() =>
                        setExpandedRawLabel((current) => (current === category.rawLabel ? null : category.rawLabel))
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default CompetitionEntriesSection;
