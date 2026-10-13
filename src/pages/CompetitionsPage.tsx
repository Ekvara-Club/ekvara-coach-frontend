import { useEffect, useState } from 'react';
import { getCoachCompetitions, getCompetitionCatalogPaginated, getCompetitionYears } from '../services/coach.api';
import type { CoachCompetitionsListView, CompetitionCatalogItem } from '../types/coach';
import type { CompetitionCatalogScope } from '../types/competition';
import { navigateTo } from '../utils/navigation';
import { LoadingState, ErrorState } from '../components/ui/PageState';
import SectionLabel from '../components/ui/SectionLabel';
import Button from '../components/ui/Button';
import CompetitionListRow from '../components/competitions/CompetitionListRow';
import CatalogCompetitionRow from '../components/competitions/CatalogCompetitionRow';
import PrepareCompetitionModal from '../components/competitions/PrepareCompetitionModal';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

// Filtres de l'explorateur portés par l'URL, même contrat que l'app athlète
// (ticket #18) : /competitions?status=upcoming|past&year=2026. Valeur absente
// ou invalide ⇒ défaut, jamais d'erreur pour une URL modifiée à la main.
type StatusFilter = 'all' | CompetitionCatalogScope;

interface CatalogFilters {
  status: StatusFilter;
  year: number | null;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'upcoming', label: 'À venir' },
  { value: 'past', label: 'Passées' },
];

function readFiltersFromUrl(): CatalogFilters {
  const params = new URLSearchParams(window.location.search);
  const rawStatus = params.get('status');
  const status: StatusFilter = rawStatus === 'upcoming' || rawStatus === 'past' ? rawStatus : 'all';
  const rawYear = params.get('year');
  const year = rawYear !== null && /^\d{4}$/.test(rawYear) ? Number(rawYear) : null;
  return { status, year };
}

// pushState : chaque changement de filtre est une entrée d'historique que
// précédent/suivant rejouent. Les paramètres par défaut sont retirés de l'URL.
function writeFiltersToUrl(filters: CatalogFilters): void {
  const params = new URLSearchParams(window.location.search);
  if (filters.status === 'all') params.delete('status');
  else params.set('status', filters.status);
  if (filters.year === null) params.delete('year');
  else params.set('year', String(filters.year));
  const query = params.toString();
  window.history.pushState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

function useUrlFilters(): [CatalogFilters, (next: CatalogFilters) => void] {
  const [filters, setFilters] = useState<CatalogFilters>(readFiltersFromUrl);

  useEffect(() => {
    const onPopState = () => setFilters(readFiltersFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function update(next: CatalogFilters) {
    writeFiltersToUrl(next);
    setFilters(next);
  }

  return [filters, update];
}

// Message vide qui reflète les filtres actifs (jamais un "Aucune compétition"
// trompeur quand c'est le filtre qui vide la liste).
function emptyMessage(scope: CompetitionCatalogScope, year: number | null, search: string): string {
  const base = scope === 'upcoming' ? 'Aucune compétition à venir' : 'Aucune compétition passée';
  return `${base}${year !== null ? ` en ${year}` : ''}${search ? ` pour « ${search} »` : ''}.`;
}

interface CatalogState {
  items: CompetitionCatalogItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  total: number;
  loadMore: () => void;
}

// Recherche + pagination réellement backend : chaque section ("À venir" /
// "Passées") gère son propre catalogue paginé, jamais un filtrage client.
function useCatalogSection(scope: CompetitionCatalogScope, search: string, year: number | null, enabled: boolean): CatalogState {
  const [items, setItems] = useState<CompetitionCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCompetitionCatalogPaginated({ page: 1, limit: PAGE_SIZE, scope, search: search || undefined, year: year ?? undefined })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setPage(1);
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
  }, [scope, search, year, enabled]);

  function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    getCompetitionCatalogPaginated({ page: nextPage, limit: PAGE_SIZE, scope, search: search || undefined, year: year ?? undefined })
      .then((data) => {
        setItems((prev) => [...prev, ...data.items]);
        setPage(nextPage);
        setTotal(data.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingMore(false));
  }

  return { items, loading, loadingMore, error, total, loadMore };
}

function CatalogSection({
  id,
  title,
  scope,
  state,
  search,
  year,
  onReset,
}: {
  id: string;
  title: string;
  scope: CompetitionCatalogScope;
  state: CatalogState;
  search: string;
  year: number | null;
  onReset: (() => void) | null;
}) {
  const hasMore = state.items.length < state.total;

  return (
    <section aria-labelledby={id} className="border-t border-gray-100 pt-8">
      <SectionLabel id={id}>{title}</SectionLabel>

      {state.loading && <LoadingState />}

      {!state.loading && state.error && (
        <p className="mt-4 text-sm text-red-600">Impossible de charger le catalogue.</p>
      )}

      {!state.loading && !state.error && state.items.length === 0 && (
        <div className="mt-4">
          <p className="text-sm text-ekvara-black/60">{emptyMessage(scope, year, search)}</p>
          {onReset && (
            <Button variant="ghost" onClick={onReset} className="mt-2">
              Voir toutes les compétitions →
            </Button>
          )}
        </div>
      )}

      {!state.loading && state.items.length > 0 && (
        <>
          <ul className="mt-2 divide-y divide-gray-100">
            {state.items.map((item) => (
              <CatalogCompetitionRow key={item.id} competition={item} />
            ))}
          </ul>

          {hasMore && (
            <Button variant="ghost" onClick={state.loadMore} disabled={state.loadingMore} className="mt-4">
              {state.loadingMore ? 'Chargement...' : `Voir plus (${state.total - state.items.length} restantes)`}
            </Button>
          )}
        </>
      )}
    </section>
  );
}

// Ticket #24 : même explorateur que l'app athlète (recherche, filtres
// période/année, catalogue paginé) en conservant la vue équipe du coach
// (ticket #7 : upcoming/past déjà répartis et dédupliqués par le backend,
// voir CoachCompetitionsService.getCompetitions) et l'entrée "Préparer".
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

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [filters, setFilters] = useUrlFilters();
  const showUpcoming = filters.status !== 'past';
  const showPast = filters.status !== 'upcoming';
  const upcoming = useCatalogSection('upcoming', search, filters.year, showUpcoming);
  const past = useCatalogSection('past', search, filters.year, showPast);

  // Années du catalogue : si indisponibles, le sélecteur n'offre que "Toutes
  // les années" (et l'année éventuellement présente dans l'URL).
  const [years, setYears] = useState<number[]>([]);
  useEffect(() => {
    let cancelled = false;
    getCompetitionYears()
      .then((result) => {
        if (!cancelled) setYears(result);
      })
      .catch(() => {
        // Sélecteur réduit à "Toutes les années" : l'explorateur reste utilisable.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const yearOptions =
    filters.year !== null && !years.includes(filters.year) ? [...years, filters.year].sort((a, b) => b - a) : years;

  const filtersActive = filters.status !== 'all' || filters.year !== null;
  const resetFilters = filtersActive ? () => setFilters({ status: 'all', year: null }) : null;
  const isEmpty = data && data.upcoming.length === 0 && data.past.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ekvara-black sm:text-3xl">
            Compétitions
          </h1>
          <p className="mt-1 text-sm text-ekvara-black/60">Suis les échéances de tes athlètes et explore le calendrier.</p>
        </div>
        {/* Ticket §22/§23 : point d'entrée pour préparer une compétition qui
            n'a pas encore de participation officielle connue côté roster. */}
        <Button variant="primary" onClick={() => setPrepareOpen(true)}>
          + Préparer une compétition
        </Button>
      </div>

      <div className="mt-6">
        <label htmlFor="competition-search" className="sr-only">
          Rechercher une compétition par nom, ville ou pays
        </label>
        <input
          id="competition-search"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Nom, ville ou pays..."
          className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-ekvara-black placeholder:text-ekvara-muted focus:border-ekvara-black focus:outline-none focus:ring-1 focus:ring-ekvara-black sm:max-w-sm"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div role="group" aria-label="Période" className="flex items-center gap-5">
          {STATUS_OPTIONS.map((option) => {
            const active = filters.status === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (!active) setFilters({ ...filters, status: option.value });
                }}
                className={`border-b py-2.5 text-sm transition-colors ${
                  active
                    ? 'border-ekvara-black font-semibold text-ekvara-black'
                    : 'border-transparent font-medium text-ekvara-black/50 hover:text-ekvara-black'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Année</span>
          <select
            value={filters.year === null ? '' : String(filters.year)}
            onChange={(event) => setFilters({ ...filters, year: event.target.value === '' ? null : Number(event.target.value) })}
            className="border-b border-ekvara-black/20 bg-transparent py-1 pr-1 text-sm font-medium text-ekvara-black focus:border-ekvara-black focus:outline-none"
          >
            <option value="">Toutes les années</option>
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 space-y-10">
        {/* Vue équipe masquée pendant une recherche ou un filtre actif : sinon
            une liste figée (non filtrée) resterait affichée à côté d'un
            catalogue filtré — même règle que "Mes compétitions" côté athlète. */}
        {!search && !filtersActive && (
          <>
            {error && <ErrorState message={error} />}
            {!error && loading && <LoadingState />}

            {!error && !loading && data && isEmpty && (
              <section aria-labelledby="team-competitions-heading">
                <SectionLabel id="team-competitions-heading">Mon équipe</SectionLabel>
                <p className="py-4 text-sm text-ekvara-black/60">Aucune compétition prévue pour ton groupe.</p>
              </section>
            )}

            {!error && !loading && data && data.upcoming.length > 0 && (
              <section aria-labelledby="upcoming-competitions-heading">
                <SectionLabel id="upcoming-competitions-heading">Mon équipe · À venir</SectionLabel>
                <ul className="mt-2 divide-y divide-gray-100">
                  {data.upcoming.map((group) => (
                    <CompetitionListRow key={group.competition.id} group={group} />
                  ))}
                </ul>
              </section>
            )}

            {/* Section "Passées" masquée entièrement si vide (ticket §24). */}
            {!error && !loading && data && data.past.length > 0 && (
              <section aria-labelledby="past-competitions-heading">
                <SectionLabel id="past-competitions-heading">Mon équipe · Passées</SectionLabel>
                <ul className="mt-2 divide-y divide-gray-100">
                  {data.past.map((group) => (
                    <CompetitionListRow key={group.competition.id} group={group} past />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {showUpcoming && (
          <CatalogSection
            id="catalog-upcoming-heading"
            title="Calendrier · À venir"
            scope="upcoming"
            state={upcoming}
            search={search}
            year={filters.year}
            onReset={resetFilters}
          />
        )}
        {showPast && (
          <CatalogSection
            id="catalog-past-heading"
            title="Calendrier · Passées"
            scope="past"
            state={past}
            search={search}
            year={filters.year}
            onReset={resetFilters}
          />
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
