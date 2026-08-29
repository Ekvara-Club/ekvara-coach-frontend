import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCoachGroupDashboard, removeAthleteFromGroup, ApiError } from '../services/coach.api';
import type { CoachGroupDashboard } from '../types/coach';
import { athleteName } from '../utils/format';
import { navigateTo, handleNavClick } from '../utils/navigation';
import { LoadingState, ErrorState } from '../components/ui/PageState';
import Button from '../components/ui/Button';
import DropdownMenu from '../components/ui/DropdownMenu';
import SectionLabel from '../components/ui/SectionLabel';
import RenameGroupModal from '../components/groups/RenameGroupModal';
import DeleteGroupModal from '../components/groups/DeleteGroupModal';
import AddGroupMemberModal from '../components/groups/AddGroupMemberModal';
import GroupAthleteRow from '../components/groups/GroupAthleteRow';
import GroupTrainingSection from '../components/groups/GroupTrainingSection';
import GroupCompetitionsSection from '../components/groups/GroupCompetitionsSection';
import AttentionList from '../components/dashboard/AttentionList';

interface GroupDetailPageProps {
  groupId: string;
}

// Seuil au-delà duquel une recherche par nom apparaît (ticket §32) — pas de
// filtre supplémentaire pour V1, uniquement si l'UX le justifie réellement.
const SEARCH_THRESHOLD = 10;
const MAX_ATTENTION_VISIBLE = 5;

// Ticket "Dashboard groupe Coach V1" §15 : uniquement les statuts
// réellement présents dans byStatus, jamais PREPARATION_STATUSES itéré en
// entier (voir CoachGroupPreparationSummary dans types/coach.ts).
const PREPARATION_STATUS_LABELS: Record<string, string> = {
  envisage: 'envisagé',
  selectionne: 'sélectionné',
  pret: 'prêt',
  forfait: 'forfait',
};

function GroupDetailPage({ groupId }: GroupDetailPageProps) {
  const [dashboard, setDashboard] = useState<CoachGroupDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const athletesSectionRef = useRef<HTMLDivElement>(null);

  const loadDashboard = useCallback(() => {
    return getCoachGroupDashboard(groupId).then(setDashboard);
  }, [groupId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDashboard(null);

    loadDashboard()
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadDashboard]);

  function refresh() {
    loadDashboard().catch((err: Error) => setError(err.message));
  }

  // Retrait de groupe non destructif pour l'athlète (comportement existant
  // inchangé, ticket #2 §16) — action directe sans modale de confirmation.
  async function handleRemoveMember(athleteId: string) {
    setRowError(null);
    setRemovingId(athleteId);
    try {
      await removeAthleteFromGroup(groupId, athleteId);
      refresh();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Une erreur est survenue. Réessaie.');
    } finally {
      setRemovingId(null);
    }
  }

  const filteredAthletes = useMemo(() => {
    if (!dashboard) return [];
    if (!search.trim()) return dashboard.athletes;
    const needle = search.trim().toLowerCase();
    return dashboard.athletes.filter((a) => athleteName(a).toLowerCase().includes(needle));
  }, [dashboard, search]);

  const preparationStatusEntries = dashboard ? Object.entries(dashboard.preparation.byStatus) : [];

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <LoadingState />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <ErrorState message={error ?? 'Groupe introuvable.'} />
      </div>
    );
  }

  const { group, attendance, training, competitions, preparation, attention, athletes } = dashboard;
  const attendanceRate = attendance.last30Days.attendanceRate;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <a
        href="/groups"
        onClick={(event) => handleNavClick(event, '/groups')}
        className="text-sm font-medium text-ekvara-black/60 hover:text-ekvara-black"
      >
        &larr; Groupes
      </a>

      {/* HERO — design éditorial (ticket §27), pas de cards SaaS ni de graphique. */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ekvara-black sm:text-3xl">
            {group.name}
          </h1>
          <p className="mt-1 text-sm text-ekvara-black/60">
            {group.athleteCount} {group.athleteCount > 1 ? 'athlètes' : 'athlète'}
          </p>
        </div>
        <DropdownMenu
          triggerLabel={`Actions pour le groupe ${group.name}`}
          items={[
            { label: 'Renommer', onSelect: () => setRenameOpen(true) },
            { label: 'Supprimer', onSelect: () => setDeleteOpen(true), destructive: true },
          ]}
        />
      </div>

      {group.athleteCount === 0 ? (
        <div className="mt-8 py-8">
          <p className="text-sm text-ekvara-black/60">Aucun athlète dans ce groupe.</p>
          <Button variant="primary" className="mt-4" onClick={() => setAddMemberOpen(true)}>
            Ajouter un membre
          </Button>
        </div>
      ) : (
        <>
          {/* STATS ESSENTIELLES — grands nombres, jamais 0% si non renseigné (§45). */}
          <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            <div>
              <p className="font-display text-4xl font-extrabold tracking-tight text-ekvara-black">
                {attendance.last30Days.recordedAttendances === 0 ? '—' : `${Math.round((attendanceRate ?? 0) * 100)}%`}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ekvara-muted">Assiduité 30 jours</p>
            </div>
            <div>
              <p className="font-display text-4xl font-extrabold tracking-tight text-ekvara-black">
                {training.completedSessionsLast30Days}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ekvara-muted">Séances réalisées</p>
            </div>
            <div>
              <p className="font-display text-4xl font-extrabold tracking-tight text-ekvara-black">{competitions.length}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ekvara-muted">Compétitions à venir</p>
            </div>
            <div>
              <p className="font-display text-4xl font-extrabold tracking-tight text-ekvara-black">{preparation.activeCount}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ekvara-muted">En préparation</p>
            </div>
          </div>
          {preparationStatusEntries.length > 0 && (
            <p className="mt-2 text-sm text-ekvara-black/60">
              {preparationStatusEntries
                .map(([status, count]) => `${count} ${PREPARATION_STATUS_LABELS[status] ?? status}`)
                .join(' · ')}
            </p>
          )}
          {attendance.last30Days.recordedAttendances === 0 && (
            <p className="mt-2 text-sm text-ekvara-black/60">Aucune présence renseignée sur les 30 derniers jours.</p>
          )}

          <div className="mt-10">
            <AttentionList
              items={attention}
              maxVisible={MAX_ATTENTION_VISIBLE}
              onShowAll={() => athletesSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
            />
          </div>

          {/* ATHLÈTES — ledger, ordre alphabétique (déjà trié côté backend via
              le roster, §30 : jamais trié par "moins bon" ici). */}
          <div ref={athletesSectionRef} className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <SectionLabel id="group-athletes-heading">Athlètes</SectionLabel>
              <Button variant="primary" onClick={() => setAddMemberOpen(true)}>
                + Ajouter un athlète
              </Button>
            </div>

            {rowError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {rowError}
              </p>
            )}

            {athletes.length > SEARCH_THRESHOLD && (
              <label className="mt-4 block">
                <span className="sr-only">Rechercher un athlète</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un athlète..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-ekvara-black focus:outline-none"
                />
              </label>
            )}

            <ul className="mt-2 divide-y divide-gray-100" aria-labelledby="group-athletes-heading">
              {filteredAthletes.map((athlete, index) => (
                <GroupAthleteRow
                  key={athlete.id}
                  athlete={athlete}
                  index={index}
                  onRemove={handleRemoveMember}
                  removing={removingId === athlete.id}
                />
              ))}
            </ul>
            {filteredAthletes.length === 0 && (
              <p className="mt-4 text-sm text-ekvara-black/60">Aucun athlète ne correspond à cette recherche.</p>
            )}
          </div>

          <div className="mt-10">
            <GroupTrainingSection training={training} />
          </div>

          <div className="mt-10">
            <GroupCompetitionsSection competitions={competitions} />
          </div>
        </>
      )}

      {renameOpen && (
        <RenameGroupModal
          groupId={group.id}
          currentName={group.name}
          onClose={() => setRenameOpen(false)}
          onRenamed={refresh}
        />
      )}

      {deleteOpen && (
        <DeleteGroupModal
          groupId={group.id}
          groupName={group.name}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => navigateTo('/groups')}
        />
      )}

      {addMemberOpen && (
        <AddGroupMemberModal
          groupId={group.id}
          groupName={group.name}
          memberIds={athletes.map((a) => a.id)}
          onClose={() => setAddMemberOpen(false)}
          onAdded={refresh}
        />
      )}
    </div>
  );
}

export default GroupDetailPage;
