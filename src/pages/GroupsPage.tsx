import { useCallback, useEffect, useState } from 'react';
import { getCoachGroups } from '../services/coach.api';
import type { CoachGroupListItem } from '../types/coach';
import { LoadingState, ErrorState } from '../components/ui/PageState';
import Button from '../components/ui/Button';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import { handleNavClick } from '../utils/navigation';

function GroupsPage() {
  const [groups, setGroups] = useState<CoachGroupListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadGroups = useCallback(() => {
    return getCoachGroups().then(setGroups);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadGroups()
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadGroups]);

  function refreshAfterCreate() {
    loadGroups().catch((err: Error) => setError(err.message));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ekvara-black sm:text-3xl">
            Groupes
          </h1>
          <p className="mt-1 text-sm text-ekvara-black/60">Organise ton roster par groupe d'entraînement.</p>
        </div>
        {groups && groups.length > 0 && (
          <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
            + Nouveau groupe
          </Button>
        )}
      </div>

      <div className="mt-8">
        {error && <ErrorState message={error} />}
        {!error && loading && <LoadingState />}

        {!error && !loading && groups && groups.length === 0 && (
          <div className="py-8">
            <p className="font-display text-lg font-bold text-ekvara-black">Aucun groupe créé.</p>
            <Button variant="primary" className="mt-4" onClick={() => setCreateModalOpen(true)}>
              Créer un groupe
            </Button>
          </div>
        )}

        {!error && !loading && groups && groups.length > 0 && (
          <ol className="mt-2 divide-y divide-gray-100">
            {groups.map((group, index) => (
              <li key={group.id}>
                <a
                  href={`/groups/${group.id}`}
                  onClick={(event) => handleNavClick(event, `/groups/${group.id}`)}
                  className="group flex items-center gap-4 py-4 transition-colors hover:bg-gray-50"
                >
                  <span className="w-6 flex-shrink-0 font-display text-sm text-ekvara-black/30">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 font-display text-base font-bold text-ekvara-black">{group.name}</span>
                  <span className="text-sm text-ekvara-black/60">
                    {group.athleteCount} {group.athleteCount > 1 ? 'athlètes' : 'athlète'}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-ekvara-black/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ekvara-black"
                  >
                    &#8250;
                  </span>
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>

      {createModalOpen && (
        <CreateGroupModal onClose={() => setCreateModalOpen(false)} onCreated={refreshAfterCreate} />
      )}
    </div>
  );
}

export default GroupsPage;
