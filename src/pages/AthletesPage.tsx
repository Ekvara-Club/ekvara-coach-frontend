import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCoachAthletes,
  getCoachDashboardAthletes,
  getCoachGroups,
  getCoachInvitations,
  revokeCoachInvitation,
} from '../services/coach.api';
import type {
  AthleteGroupRef,
  CoachAthleteRosterItem,
  CoachGroupListItem,
  CoachInvitationListItem,
} from '../types/coach';
import { rosterAthleteName } from '../utils/format';
import { normalizeForSearch } from '../utils/search';
import { handleNavClick } from '../utils/navigation';
import { LoadingState, ErrorState } from '../components/ui/PageState';
import Button from '../components/ui/Button';
import SectionLabel from '../components/ui/SectionLabel';
import DropdownMenu from '../components/ui/DropdownMenu';
import AddAthleteModal from '../components/athletes/AddAthleteModal';
import InviteAthleteModal from '../components/athletes/InviteAthleteModal';
import PendingInvitationsList from '../components/athletes/PendingInvitationsList';
import ManageGroupsModal from '../components/athletes/ManageGroupsModal';
import RemoveAthleteModal from '../components/athletes/RemoveAthleteModal';

// GET /coach/athletes (source du roster — ticket #2 §4) ne porte pas les
// groupes ; GET /coach/dashboard/athletes les porte déjà (AthleteGroupRef[]
// par athlète). Combiner les deux évite d'inventer un endpoint ou de faire
// une requête par athlète : exactement 2 requêtes pour construire la
// correspondance athlète -> groupes, une 3e (GET /coach/groups) pour
// alimenter le catalogue complet utilisé par "Gérer les groupes".
function AthletesPage() {
  const [athletes, setAthletes] = useState<CoachAthleteRosterItem[] | null>(null);
  const [groupsByAthleteId, setGroupsByAthleteId] = useState<Map<string, AthleteGroupRef[]>>(new Map());
  const [allGroups, setAllGroups] = useState<CoachGroupListItem[]>([]);
  const [invitations, setInvitations] = useState<CoachInvitationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(null);
  const [manageGroupsAthlete, setManageGroupsAthlete] = useState<CoachAthleteRosterItem | null>(null);
  const [removeCandidate, setRemoveCandidate] = useState<CoachAthleteRosterItem | null>(null);

  const loadRoster = useCallback(() => {
    return Promise.all([getCoachAthletes(), getCoachDashboardAthletes()]).then(([roster, dashboardAthletes]) => {
      setAthletes(roster);
      const map = new Map<string, AthleteGroupRef[]>();
      for (const athlete of dashboardAthletes) {
        map.set(athlete.id, athlete.groups);
      }
      setGroupsByAthleteId(map);
    });
  }, []);

  const loadInvitations = useCallback(() => {
    return getCoachInvitations().then(setInvitations);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([loadRoster(), getCoachGroups().then(setAllGroups), loadInvitations()])
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadRoster, loadInvitations]);

  function refreshAfterMutation() {
    loadRoster().catch((err: Error) => setError(err.message));
  }

  async function handleRevokeInvitation(invitationId: string) {
    setRevokingInvitationId(invitationId);
    try {
      await revokeCoachInvitation(invitationId);
      await loadInvitations();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRevokingInvitationId(null);
    }
  }

  const pendingInvitations = useMemo(
    () => invitations.filter((invitation) => invitation.status === 'active'),
    [invitations],
  );

  const filteredAthletes = useMemo(() => {
    if (!athletes) return [];
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery) return athletes;
    return athletes.filter((athlete) => normalizeForSearch(rosterAthleteName(athlete)).includes(normalizedQuery));
  }, [athletes, query]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ekvara-black sm:text-3xl">
            Athlètes
          </h1>
          <p className="mt-1 text-sm text-ekvara-black/60">Le roster que tu encadres.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInviteModalOpen(true)}>
            Inviter un athlète
          </Button>
          {athletes && athletes.length > 0 && (
            <Button variant="primary" onClick={() => setAddModalOpen(true)}>
              + Ajouter un athlète
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <SectionLabel>Invitations en attente</SectionLabel>
        <div className="mt-3">
          <PendingInvitationsList
            invitations={pendingInvitations}
            onRevoke={handleRevokeInvitation}
            revokingId={revokingInvitationId}
          />
        </div>
      </div>

      <div className="mt-8">
        {error && <ErrorState message={error} />}
        {!error && loading && <LoadingState />}

        {!error && !loading && athletes && athletes.length === 0 && (
          <div className="py-8">
            <p className="font-display text-lg font-bold text-ekvara-black">Aucun athlète rattaché.</p>
            <Button variant="primary" className="mt-4" onClick={() => setAddModalOpen(true)}>
              Ajouter un athlète
            </Button>
          </div>
        )}

        {!error && !loading && athletes && athletes.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="athlete-search" className="sr-only">
                Rechercher un athlète
              </label>
              <input
                id="athlete-search"
                type="search"
                placeholder="Rechercher un athlète..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full max-w-xs rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
              />
              <SectionLabel>
                {athletes.length} {athletes.length > 1 ? 'athlètes' : 'athlète'}
              </SectionLabel>
            </div>

            {filteredAthletes.length === 0 ? (
              <p className="mt-6 text-sm text-ekvara-black/60">Aucun athlète ne correspond à ta recherche.</p>
            ) : (
              <ol className="mt-4 divide-y divide-gray-100">
                {filteredAthletes.map((athlete, index) => {
                  const meta = [athlete.categorieAge, athlete.grade, athlete.niveauSportif]
                    .filter(Boolean)
                    .join(' · ');
                  const groups = groupsByAthleteId.get(athlete.id) ?? [];
                  const label = rosterAthleteName(athlete);
                  return (
                    <li key={athlete.id} className="flex items-center gap-4 py-4 transition-colors hover:bg-gray-50">
                      <span className="w-6 flex-shrink-0 font-display text-sm text-ekvara-black/30">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <a
                        href={`/athletes/${athlete.id}`}
                        onClick={(event) => handleNavClick(event, `/athletes/${athlete.id}`)}
                        className="min-w-0 flex-1"
                      >
                        <p className="font-semibold text-ekvara-black">{label}</p>
                        {meta && <p className="text-xs text-ekvara-black/50">{meta}</p>}
                        {groups.length > 0 && (
                          <p className="mt-0.5 text-xs text-ekvara-black/50">{groups.map((g) => g.name).join(', ')}</p>
                        )}
                      </a>
                      <DropdownMenu
                        triggerLabel={`Actions pour ${label}`}
                        items={[
                          { label: 'Gérer les groupes', onSelect: () => setManageGroupsAthlete(athlete) },
                          {
                            label: 'Retirer du roster',
                            onSelect: () => setRemoveCandidate(athlete),
                            destructive: true,
                          },
                        ]}
                      />
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </div>

      {addModalOpen && <AddAthleteModal onClose={() => setAddModalOpen(false)} onAdded={refreshAfterMutation} />}

      {inviteModalOpen && (
        <InviteAthleteModal
          groups={allGroups}
          onClose={() => setInviteModalOpen(false)}
          onCreated={() => loadInvitations().catch((err: Error) => setError(err.message))}
        />
      )}

      {manageGroupsAthlete && (
        <ManageGroupsModal
          athleteId={manageGroupsAthlete.id}
          athleteLabel={rosterAthleteName(manageGroupsAthlete)}
          groups={allGroups}
          currentGroupIds={(groupsByAthleteId.get(manageGroupsAthlete.id) ?? []).map((g) => g.id)}
          onClose={() => setManageGroupsAthlete(null)}
          onChanged={refreshAfterMutation}
        />
      )}

      {removeCandidate && (
        <RemoveAthleteModal
          athleteId={removeCandidate.id}
          athleteLabel={rosterAthleteName(removeCandidate)}
          onClose={() => setRemoveCandidate(null)}
          onRemoved={refreshAfterMutation}
        />
      )}
    </div>
  );
}

export default AthletesPage;
