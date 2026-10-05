import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCoachCompetitionDetail, getCompetitionEntries } from '../services/coach.api';
import type { CoachCompetitionDetailAthleteView, CoachCompetitionDetailView, PreparationStatus } from '../types/coach';
import type { CompetitionEntriesResponse } from '../types/competition-entries';
import { athleteName } from '../utils/format';
import { daysUntil, formatDate, formatDaysUntil } from '../utils/date';
import { handleNavClick } from '../utils/navigation';
import { hasCompetitionResult, isPodium, summarizeCompetitionResults } from '../utils/competitionResults';
import { findEntryCategory, groupAthletesByCategory } from '../utils/competitionEntriesMatch';
import { LoadingState, ErrorState } from '../components/ui/PageState';
import SectionLabel from '../components/ui/SectionLabel';
import Button from '../components/ui/Button';
import CompetitionCategoryModal from '../components/competitions/CompetitionCategoryModal';
import AddAthleteToPreparationModal from '../components/competitions/AddAthleteToPreparationModal';
import PreparationDetailModal from '../components/competitions/PreparationDetailModal';
import RemovePreparationModal from '../components/competitions/RemovePreparationModal';

interface CompetitionDetailPageProps {
  competitionId: string;
}

const PREPARATION_STATUS_LABELS: Record<PreparationStatus, string> = {
  envisage: 'Envisagé',
  selectionne: 'Sélectionné',
  pret: 'Prêt',
  forfait: 'Forfait',
};

function formatOrdinal(classement: number): string {
  return classement === 1 ? '1er' : `${classement}e`;
}

// Wording aligné sur les statuts réels de `participation.statut` (backend,
// convention interne — voir CoachCompetitionsService) : jamais un libellé
// inventé, "inscrit" reste la valeur brute la plus fréquente et déjà
// lisible telle quelle en français.
function formatParticipationStatus(status: string | null): string | null {
  if (!status || status === 'inscrit') return null;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function AthleteRow({ athlete, past, onOpen }: { athlete: CoachCompetitionDetailAthleteView; past: boolean; onOpen: () => void }) {
  const meta = [athlete.ageCategory, athlete.weightCategory].filter(Boolean).join(' · ');
  const groups = athlete.groups.map((g) => g.name).join(', ');
  const statusLabel = formatParticipationStatus(athlete.participationStatus);
  const preparationLabel = athlete.preparation
    ? PREPARATION_STATUS_LABELS[athlete.preparation.status as PreparationStatus] ?? athlete.preparation.status
    : null;

  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full flex-col py-3 text-left transition-colors hover:bg-gray-50">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-semibold text-ekvara-black">{athleteName(athlete)}</p>
          {!past && statusLabel && <span className="text-sm text-ekvara-black/50">{statusLabel}</span>}
          {past && hasCompetitionResult(athlete.result) && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ekvara-black">
              {isPodium(athlete.result) && (
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ekvara-lime" aria-hidden="true" />
              )}
              {athlete.result.classement !== null && formatOrdinal(athlete.result.classement)}
              {athlete.result.medaille && ` · ${athlete.result.medaille.charAt(0).toUpperCase()}${athlete.result.medaille.slice(1)}`}
            </span>
          )}
          {past && !hasCompetitionResult(athlete.result) && (
            <span className="text-sm text-ekvara-black/40">Résultat non renseigné</span>
          )}
        </div>
        {(meta || groups) && (
          <p className="mt-0.5 text-sm text-ekvara-black/60">{[meta, groups].filter(Boolean).join(' — ')}</p>
        )}

        {/* Distinction préparation/inscription (ticket §7/§8) : jamais
            présentée comme une inscription fédérale confirmée quand ce n'en
            est pas une. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {preparationLabel && <span className="font-medium text-ekvara-black">{preparationLabel}</span>}
          <span className="text-ekvara-black/50">
            {athlete.hasOfficialParticipation ? 'Inscription connue' : 'Inscription officielle non confirmée'}
          </span>
        </div>
        {athlete.preparation?.objective && (
          <p className="mt-1 text-sm text-ekvara-black/70">Objectif : {athlete.preparation.objective}</p>
        )}
      </button>
    </li>
  );
}

function CompetitionDetailPage({ competitionId }: CompetitionDetailPageProps) {
  const [detail, setDetail] = useState<CoachCompetitionDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<CompetitionEntriesResponse | null>(null);
  const [entriesError, setEntriesError] = useState(false);

  const [openCategoryKey, setOpenCategoryKey] = useState<string | null>(null);
  const [addAthleteOpen, setAddAthleteOpen] = useState(false);
  const [openAthleteId, setOpenAthleteId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ preparationId: string; athleteName: string; hasOfficialParticipation: boolean } | null>(
    null,
  );

  const loadDetail = useCallback(() => {
    return getCoachCompetitionDetail(competitionId).then(setDetail);
  }, [competitionId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    loadDetail()
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadDetail]);

  // Section autonome (ticket §25) : une erreur ici ne casse jamais le reste
  // de la fiche (hero, athlètes, résultat déjà chargés indépendamment).
  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    setEntriesError(false);

    getCompetitionEntries(competitionId)
      .then((result) => {
        if (!cancelled) setEntries(result);
      })
      .catch(() => {
        if (!cancelled) setEntriesError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [competitionId]);

  function refresh() {
    loadDetail().catch((err: Error) => setError(err.message));
  }

  const categoryGroups = useMemo(
    () => (detail ? groupAthletesByCategory(detail.athletes) : []),
    [detail],
  );

  const groupBreakdown = useMemo(() => {
    if (!detail) return [];
    const byGroup = new Map<string, { id: string; name: string; count: number }>();
    for (const athlete of detail.athletes) {
      for (const group of athlete.groups) {
        const existing = byGroup.get(group.id);
        if (existing) existing.count++;
        else byGroup.set(group.id, { id: group.id, name: group.name, count: 1 });
      }
    }
    return [...byGroup.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [detail]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <LoadingState />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ErrorState message={error ?? 'Compétition introuvable.'} />
      </div>
    );
  }

  const { competition } = detail;
  const days = daysUntil(competition.startDate);
  const isPast = days < 0;
  const location = [competition.city, competition.country].filter(Boolean).join(', ');
  const resultSummary = isPast ? summarizeCompetitionResults(detail.athletes) : null;
  const openCategory = categoryGroups.find((c) => `${c.ageCategory ?? ''}|${c.weightCategory ?? ''}` === openCategoryKey) ?? null;
  const openAthlete = detail.athletes.find((a) => a.id === openAthleteId) ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <a
        href="/competitions"
        onClick={(event) => handleNavClick(event, '/competitions')}
        className="text-sm font-medium text-ekvara-black/60 hover:text-ekvara-black"
      >
        &larr; Compétitions
      </a>

      {/* Hero noir (ticket §7/§21) : seule grande zone sombre de cette page,
          même traitement que la fiche compétition côté app athlète. */}
      <div className="mt-4 rounded-lg bg-ekvara-black p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Compétition</p>
          {!isPast && (
            <span className="whitespace-nowrap rounded-full bg-ekvara-lime px-3 py-1 font-display text-sm font-extrabold text-ekvara-black">
              {formatDaysUntil(days)}
            </span>
          )}
        </div>

        <h1 className="mt-3 font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-3xl">
          {competition.name}
        </h1>

        <p className="mt-3 text-sm font-semibold text-white/70">{formatDate(competition.startDate)}</p>
        {(location || competition.level) && (
          <p className="mt-1 text-sm text-white/50">{[location, competition.level].filter(Boolean).join(' · ')}</p>
        )}
      </div>

      <div className="mt-10 space-y-10">
        <section aria-labelledby="competition-athletes-heading">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <SectionLabel id="competition-athletes-heading">Équipe EKVARA</SectionLabel>
              <p className="mt-1 text-sm text-ekvara-black/60">
                {detail.athleteCount} {detail.athleteCount > 1 ? 'athlètes' : 'athlète'}
              </p>
            </div>
            {!isPast && (
              <Button variant="secondary" onClick={() => setAddAthleteOpen(true)}>
                + Ajouter un athlète
              </Button>
            )}
          </div>

          {detail.athleteCount === 0 ? (
            <div className="py-8">
              {/* Empty state (ticket §35) */}
              <p className="text-sm text-ekvara-black/60">Aucun athlète sélectionné pour le moment.</p>
              {!isPast && (
                <Button variant="primary" className="mt-4" onClick={() => setAddAthleteOpen(true)}>
                  Ajouter un athlète
                </Button>
              )}
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100">
              {detail.athletes.map((athlete) => (
                <AthleteRow key={athlete.id} athlete={athlete} past={isPast} onOpen={() => setOpenAthleteId(athlete.id)} />
              ))}
            </ul>
          )}
        </section>

        {isPast && resultSummary && resultSummary.athleteCount > 0 && (
          <section aria-labelledby="competition-result-heading" className="border-t border-gray-100 pt-8">
            <SectionLabel id="competition-result-heading">Résultat</SectionLabel>
            {resultSummary.disputed === 0 ? (
              <p className="mt-3 text-sm text-ekvara-black/60">Pas encore de résultat renseigné.</p>
            ) : (
              <p className="mt-2 text-sm text-ekvara-black/70">
                {resultSummary.athleteCount} {resultSummary.athleteCount > 1 ? 'athlètes' : 'athlète'}
                {resultSummary.podiums > 0 && ` · ${resultSummary.podiums} ${resultSummary.podiums > 1 ? 'podiums' : 'podium'}`}
                {` · ${resultSummary.wins} ${resultSummary.wins > 1 ? 'victoires' : 'victoire'}`}
                {` · ${resultSummary.losses} ${resultSummary.losses > 1 ? 'défaites' : 'défaite'}`}
              </p>
            )}
          </section>
        )}

        {groupBreakdown.length > 0 && (
          <section aria-labelledby="competition-groups-heading" className="border-t border-gray-100 pt-8">
            <SectionLabel id="competition-groups-heading">Groupes</SectionLabel>
            <ul className="mt-2 divide-y divide-gray-100">
              {groupBreakdown.map((group) => (
                <li key={group.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-ekvara-black">{group.name}</span>
                  <span className="text-ekvara-black/50">
                    {group.count} {group.count > 1 ? 'athlètes' : 'athlète'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {categoryGroups.length > 0 && (
          <section aria-labelledby="competition-categories-heading" className="border-t border-gray-100 pt-8">
            <SectionLabel id="competition-categories-heading">Catégories du groupe</SectionLabel>
            {entriesError && (
              <p className="mt-2 text-xs text-ekvara-black/40">Inscrits indisponibles pour le moment.</p>
            )}
            <ul className="mt-2 divide-y divide-gray-100">
              {categoryGroups.map((category) => {
                const key = `${category.ageCategory ?? ''}|${category.weightCategory ?? ''}`;
                const matchedEntryCategory = entries
                  ? findEntryCategory(entries.categories, category.ageCategory, category.weightCategory)
                  : null;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setOpenCategoryKey(key)}
                      className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <span className="font-medium text-ekvara-black">
                        {[category.ageCategory, category.weightCategory].filter(Boolean).join(' · ') || 'Catégorie non renseignée'}
                      </span>
                      <span className="flex flex-shrink-0 items-center gap-3 text-sm text-ekvara-black/50">
                        <span>
                          {category.athleteIds.length} {category.athleteIds.length > 1 ? 'athlètes EKVARA' : 'athlète EKVARA'}
                        </span>
                        {matchedEntryCategory && <span>{matchedEntryCategory.entries.length} inscrits</span>}
                        <span aria-hidden="true">→</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {openCategory && (
        <CompetitionCategoryModal
          ageCategory={openCategory.ageCategory}
          weightCategory={openCategory.weightCategory}
          ekvaraAthletes={detail.athletes.filter((a) => openCategory.athleteIds.includes(a.id))}
          entryCategory={entries ? findEntryCategory(entries.categories, openCategory.ageCategory, openCategory.weightCategory) : null}
          onClose={() => setOpenCategoryKey(null)}
        />
      )}

      {addAthleteOpen && (
        <AddAthleteToPreparationModal
          competitionId={competitionId}
          excludedAthleteIds={detail.athletes.map((a) => a.id)}
          onClose={() => setAddAthleteOpen(false)}
          onAdded={() => {
            setAddAthleteOpen(false);
            refresh();
          }}
        />
      )}

      {openAthlete && (
        <PreparationDetailModal
          competition={detail.competition}
          athlete={openAthlete}
          onClose={() => setOpenAthleteId(null)}
          onSaved={() => {
            setOpenAthleteId(null);
            refresh();
          }}
          onRequestRemove={() => {
            if (!openAthlete.preparation) return;
            setOpenAthleteId(null);
            setRemoveTarget({
              preparationId: openAthlete.preparation.id,
              athleteName: athleteName(openAthlete),
              hasOfficialParticipation: openAthlete.hasOfficialParticipation,
            });
          }}
        />
      )}

      {removeTarget && (
        <RemovePreparationModal
          competitionId={competitionId}
          preparationId={removeTarget.preparationId}
          athleteName={removeTarget.athleteName}
          hasOfficialParticipation={removeTarget.hasOfficialParticipation}
          onClose={() => setRemoveTarget(null)}
          onRemoved={refresh}
        />
      )}
    </div>
  );
}

export default CompetitionDetailPage;
