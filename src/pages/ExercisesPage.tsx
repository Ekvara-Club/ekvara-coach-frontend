import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCoachExercises,
  getCoachExercise,
  getCoachGroups,
  getCoachDashboardAthletes,
  getCoachAthletes,
} from '../services/coach.api';
import type {
  AthleteGroupRef,
  CoachAthleteRosterItem,
  CoachExerciseDetail,
  CoachExerciseSummary,
  CoachGroupListItem,
} from '../types/coach';
import { normalizeForSearch } from '../utils/search';
import { EXERCISE_TYPE_OPTIONS, EXERCISE_LEVEL_OPTIONS } from '../utils/exerciseOptions';
import { LoadingState, ErrorState } from '../components/ui/PageState';
import Button from '../components/ui/Button';
import SectionLabel from '../components/ui/SectionLabel';
import ExerciseRow from '../components/exercises/ExerciseRow';
import ExerciseFormModal from '../components/exercises/ExerciseFormModal';
import ExerciseDetailModal from '../components/exercises/ExerciseDetailModal';
import ExerciseAssignmentsModal from '../components/exercises/ExerciseAssignmentsModal';
import DeleteExerciseModal from '../components/exercises/DeleteExerciseModal';

const ALL_FILTER_VALUE = 'tous';

type DetailView = 'view' | 'edit' | 'assignments';

function FilterPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-ekvara-lime text-ekvara-black' : 'border border-ekvara-black/15 text-ekvara-black/70 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

// Ticket #5 §5/§20 : GET /coach/exercises porte déjà athleteCount + groups
// (voir CoachExercisesService.toLibraryView) — jamais de GET détail par
// ligne. Recherche/filtres 100% frontend sur les données déjà chargées.
function ExercisesPage() {
  const [exercises, setExercises] = useState<CoachExerciseSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(ALL_FILTER_VALUE);
  const [levelFilter, setLevelFilter] = useState(ALL_FILTER_VALUE);

  const [groups, setGroups] = useState<CoachGroupListItem[]>([]);
  const [roster, setRoster] = useState<CoachAthleteRosterItem[]>([]);
  const [membershipMap, setMembershipMap] = useState<Map<string, Set<string>>>(new Map());
  const [refDataLoading, setRefDataLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);

  const [detailExerciseId, setDetailExerciseId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<CoachExerciseDetail | null>(null);
  const [detailView, setDetailView] = useState<DetailView>('view');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const loadExercises = useCallback(() => {
    setLoading(true);
    setError(null);
    return getCoachExercises()
      .then(setExercises)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  useEffect(() => {
    let cancelled = false;
    setRefDataLoading(true);

    Promise.all([getCoachGroups(), getCoachDashboardAthletes(), getCoachAthletes()])
      .then(([groupsData, dashboardAthletes, rosterData]) => {
        if (cancelled) return;
        setGroups(groupsData);
        setRoster(rosterData);
        const map = new Map<string, Set<string>>();
        for (const athlete of dashboardAthletes) {
          for (const group of athlete.groups as AthleteGroupRef[]) {
            if (!map.has(group.id)) map.set(group.id, new Set());
            map.get(group.id)!.add(athlete.id);
          }
        }
        setMembershipMap(map);
      })
      .catch(() => {
        // Erreur non bloquante ici : la bibliothèque reste consultable même
        // si le picker de destinataires ne peut pas se charger tout de
        // suite (l'utilisateur ne verra l'erreur que s'il tente de publier).
      })
      .finally(() => {
        if (!cancelled) setRefDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    const normalizedQuery = normalizeForSearch(query);

    return exercises.filter((exercise) => {
      if (typeFilter !== ALL_FILTER_VALUE && exercise.type !== typeFilter) return false;
      if (levelFilter !== ALL_FILTER_VALUE && exercise.level !== levelFilter) return false;

      if (!normalizedQuery) return true;
      const typeLabel = EXERCISE_TYPE_OPTIONS.find((o) => o.value === exercise.type)?.label;
      const levelLabel = EXERCISE_LEVEL_OPTIONS.find((o) => o.value === exercise.level)?.label;
      return [exercise.title, exercise.panelTechnique, exercise.description, typeLabel, levelLabel].some(
        (field) => (field ? normalizeForSearch(field).includes(normalizedQuery) : false),
      );
    });
  }, [exercises, query, typeFilter, levelFilter]);

  const hasActiveFilters = query.trim() !== '' || typeFilter !== ALL_FILTER_VALUE || levelFilter !== ALL_FILTER_VALUE;

  function resetFilters() {
    setQuery('');
    setTypeFilter(ALL_FILTER_VALUE);
    setLevelFilter(ALL_FILTER_VALUE);
  }

  function openDetail(exerciseId: string) {
    setDetailError(null);
    setDetailLoading(true);
    setDetailView('view');
    setDetailExerciseId(exerciseId);
    getCoachExercise(exerciseId)
      .then(setDetailData)
      .catch((err: Error) => setDetailError(err.message))
      .finally(() => setDetailLoading(false));
  }

  function closeDetail() {
    setDetailExerciseId(null);
    setDetailData(null);
    setDetailView('view');
    setDetailError(null);
  }

  function afterMutation() {
    closeDetail();
    setDeleteTarget(null);
    loadExercises();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ekvara-black sm:text-3xl">
            Exercices
          </h1>
          <p className="mt-1 text-sm text-ekvara-black/60">Crée et partage des exercices avec tes athlètes.</p>
        </div>
        {exercises && exercises.length > 0 && (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            + Nouvel exercice
          </Button>
        )}
      </div>

      <div className="mt-6">
        {error && <ErrorState message={error} />}
        {!error && loading && <LoadingState />}

        {!error && !loading && exercises && exercises.length === 0 && (
          <div className="py-8">
            <p className="font-display text-lg font-bold text-ekvara-black">Ta bibliothèque est vide.</p>
            <p className="mt-1 text-sm text-ekvara-black/60">
              Crée ton premier exercice pour commencer à construire ton contenu.
            </p>
            <Button variant="primary" className="mt-4" onClick={() => setCreateOpen(true)}>
              Créer un exercice
            </Button>
          </div>
        )}

        {!error && !loading && exercises && exercises.length > 0 && (
          <>
            <label htmlFor="exercise-search" className="sr-only">
              Rechercher un exercice
            </label>
            <input
              id="exercise-search"
              type="search"
              placeholder="Rechercher un exercice..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full max-w-md rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
            />

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ekvara-muted">Type</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <FilterPill active={typeFilter === ALL_FILTER_VALUE} label="Tous" onClick={() => setTypeFilter(ALL_FILTER_VALUE)} />
                {EXERCISE_TYPE_OPTIONS.map((option) => (
                  <FilterPill
                    key={option.value}
                    active={typeFilter === option.value}
                    label={option.label}
                    onClick={() => setTypeFilter(option.value)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ekvara-muted">Niveau</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <FilterPill active={levelFilter === ALL_FILTER_VALUE} label="Tous" onClick={() => setLevelFilter(ALL_FILTER_VALUE)} />
                {EXERCISE_LEVEL_OPTIONS.map((option) => (
                  <FilterPill
                    key={option.value}
                    active={levelFilter === option.value}
                    label={option.label}
                    onClick={() => setLevelFilter(option.value)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              {filteredExercises.length === 0 ? (
                <div className="flex flex-col items-start gap-3 py-8">
                  <p className="text-sm text-ekvara-black/60">Aucun exercice ne correspond à ta recherche.</p>
                  {hasActiveFilters && (
                    <Button variant="secondary" onClick={resetFilters}>
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <SectionLabel>
                    {filteredExercises.length} {filteredExercises.length > 1 ? 'exercices' : 'exercice'}
                  </SectionLabel>
                  <ul className="mt-2 divide-y divide-gray-100">
                    {filteredExercises.map((exercise, index) => (
                      <ExerciseRow key={exercise.id} exercise={exercise} index={index} onSelect={() => openDetail(exercise.id)} />
                    ))}
                  </ul>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {createOpen && (
        <ExerciseFormModal mode="create" onClose={() => setCreateOpen(false)} onSaved={loadExercises} />
      )}

      {detailExerciseId && detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ekvara-black/60">
          <p className="rounded-md bg-ekvara-surface px-4 py-3 text-sm text-ekvara-black/70">Chargement...</p>
        </div>
      )}

      {detailExerciseId && !detailLoading && detailError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ekvara-black/60 px-4" onClick={closeDetail}>
          <div className="rounded-md bg-ekvara-surface px-4 py-3" onClick={(event) => event.stopPropagation()}>
            <ErrorState message={detailError} />
          </div>
        </div>
      )}

      {detailData && detailView === 'view' && (
        <ExerciseDetailModal
          exercise={detailData}
          onClose={closeDetail}
          onEdit={() => setDetailView('edit')}
          onManagePublication={() => setDetailView('assignments')}
          onDelete={() => {
            const target = { id: detailData.id, title: detailData.title };
            closeDetail();
            setDeleteTarget(target);
          }}
        />
      )}

      {detailData && detailView === 'edit' && (
        <ExerciseFormModal mode="edit" exercise={detailData} onClose={closeDetail} onSaved={afterMutation} />
      )}

      {detailData && detailView === 'assignments' && !refDataLoading && (
        <ExerciseAssignmentsModal
          exercise={detailData}
          groups={groups}
          roster={roster}
          membershipMap={membershipMap}
          onClose={closeDetail}
          onSaved={afterMutation}
        />
      )}

      {deleteTarget && (
        <DeleteExerciseModal
          exerciseId={deleteTarget.id}
          exerciseTitle={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onDeleted={afterMutation}
        />
      )}
    </div>
  );
}

export default ExercisesPage;
