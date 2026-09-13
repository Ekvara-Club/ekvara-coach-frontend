import { useMemo, useState } from 'react';
import type { CoachAthleteRosterItem, CoachGroupListItem } from '../../types/coach';
import { rosterAthleteName } from '../../utils/format';
import { normalizeForSearch } from '../../utils/search';

interface DestinataireFieldsProps {
  groups: CoachGroupListItem[];
  roster: CoachAthleteRosterItem[];
  membershipMap: Map<string, Set<string>>;
  selectedGroupIds: Set<string>;
  selectedAthleteIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onToggleAthlete: (athleteId: string) => void;
}

// Créé pour le picker de destinataires de Planning (ticket #4 §8-9),
// déplacé ici tel quel pour Exercices (ticket #5 §16) : son API n'a jamais
// été spécifique aux séances (groupes/roster/membershipMap génériques),
// aucune généralisation à écrire, un simple déplacement de fichier. Un
// athlète déjà couvert par un groupe coché reste sélectionnable
// individuellement sans traitement d'erreur (le backend déduplique par
// union, voir CoachDestinataireResolver.resolve — jamais reproduit ici).
// Le compteur est un APERÇU frontend calculé depuis les données déjà
// chargées (groupes + roster) : le backend reste seul juge final.
function DestinataireFields({
  groups,
  roster,
  membershipMap,
  selectedGroupIds,
  selectedAthleteIds,
  onToggleGroup,
  onToggleAthlete,
}: DestinataireFieldsProps) {
  const [query, setQuery] = useState('');

  const previewCount = useMemo(() => {
    const union = new Set<string>(selectedAthleteIds);
    for (const groupId of selectedGroupIds) {
      const members = membershipMap.get(groupId);
      if (members) {
        for (const athleteId of members) union.add(athleteId);
      }
    }
    return union.size;
  }, [selectedGroupIds, selectedAthleteIds, membershipMap]);

  const filteredRoster = useMemo(() => {
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery) return roster;
    return roster.filter((athlete) => normalizeForSearch(rosterAthleteName(athlete)).includes(normalizedQuery));
  }, [roster, query]);

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">Destinataires</p>

      {groups.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-ekvara-black">Groupes</p>
          <ul className="space-y-2">
            {groups.map((group) => (
              <li key={group.id}>
                <label className="flex items-center gap-2.5 text-sm text-ekvara-black">
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.has(group.id)}
                    onChange={() => onToggleGroup(group.id)}
                    className="h-4 w-4 rounded border-ekvara-black/30 text-ekvara-black"
                  />
                  {group.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-sm font-medium text-ekvara-black">Athlètes individuels</p>
        <label htmlFor="destinataire-search" className="sr-only">
          Rechercher un athlète
        </label>
        <input
          id="destinataire-search"
          type="search"
          placeholder="Rechercher un athlète..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
        />
        <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
          {filteredRoster.map((athlete) => (
            <li key={athlete.id}>
              <label className="flex items-center gap-2.5 text-sm text-ekvara-black">
                <input
                  type="checkbox"
                  checked={selectedAthleteIds.has(athlete.id)}
                  onChange={() => onToggleAthlete(athlete.id)}
                  className="h-4 w-4 rounded border-ekvara-black/30 text-ekvara-black"
                />
                {rosterAthleteName(athlete)}
                {athlete.categorieAge && <span className="text-xs text-ekvara-black/50">{athlete.categorieAge}</span>}
              </label>
            </li>
          ))}
          {filteredRoster.length === 0 && <p className="text-sm text-ekvara-black/50">Aucun athlète ne correspond.</p>}
        </ul>
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted">
        {previewCount} {previewCount > 1 ? 'athlètes concernés' : 'athlète concerné'}
      </p>
    </div>
  );
}

export default DestinataireFields;
