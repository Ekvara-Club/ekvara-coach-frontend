import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import { getCoachAthletes, addAthleteToGroup, ApiError } from '../../services/coach.api';
import type { CoachAthleteRosterItem } from '../../types/coach';
import { rosterAthleteName } from '../../utils/format';
import { normalizeForSearch } from '../../utils/search';
import { LoadingState, ErrorState } from '../ui/PageState';

interface AddGroupMemberModalProps {
  groupId: string;
  groupName: string;
  memberIds: string[];
  onClose: () => void;
  onAdded: () => void;
}

// Le coach ne peut ajouter que des athlètes déjà dans son roster (ticket #2
// §15) : pas de champ email ici, juste GET /coach/athletes filtré par ce qui
// n'est pas déjà membre. memberIds vient du parent (état du groupe) et se
// met à jour à chaque ajout réussi sans que cette modale se referme, pour
// permettre d'ajouter plusieurs athlètes d'affilée.
function AddGroupMemberModal({ groupId, groupName, memberIds, onClose, onAdded }: AddGroupMemberModalProps) {
  const [roster, setRoster] = useState<CoachAthleteRosterItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCoachAthletes()
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

  const memberIdSet = useMemo(() => new Set(memberIds), [memberIds]);

  const candidates = useMemo(() => {
    if (!roster) return [];
    const available = roster.filter((athlete) => !memberIdSet.has(athlete.id));
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery) return available;
    return available.filter((athlete) => normalizeForSearch(rosterAthleteName(athlete)).includes(normalizedQuery));
  }, [roster, memberIdSet, query]);

  async function handleAdd(athleteId: string) {
    setActionError(null);
    setAddingId(athleteId);
    try {
      await addAthleteToGroup(groupId, athleteId);
      onAdded();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Une erreur est survenue. Réessaie.');
    } finally {
      setAddingId(null);
    }
  }

  return (
    <Modal title={`Ajouter au groupe ${groupName}`} onClose={onClose}>
      <div className="flex max-h-[70vh] flex-col p-5">
        <label htmlFor="member-search" className="sr-only">
          Rechercher un athlète
        </label>
        <input
          id="member-search"
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
              {roster.length === memberIdSet.size
                ? 'Tous les athlètes du roster sont déjà dans ce groupe.'
                : 'Aucun athlète ne correspond à ta recherche.'}
            </p>
          )}
          {!loadError && candidates.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {candidates.map((athlete) => (
                <li key={athlete.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-ekvara-black">{rosterAthleteName(athlete)}</span>
                  <button
                    type="button"
                    onClick={() => handleAdd(athlete.id)}
                    disabled={addingId === athlete.id}
                    className="text-sm font-medium text-ekvara-black underline decoration-ekvara-black/30 underline-offset-2 hover:decoration-ekvara-black disabled:opacity-50"
                  >
                    {addingId === athlete.id ? 'Ajout...' : 'Ajouter'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default AddGroupMemberModal;
