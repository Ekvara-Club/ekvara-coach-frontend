import type { CoachAthleteNeedingAttention } from '../../types/coach';
import { athleteName } from '../../utils/format';
import { attentionReasonLabel } from '../../utils/attentionReasons';
import SectionLabel from '../ui/SectionLabel';

interface AttentionListProps {
  items: CoachAthleteNeedingAttention[];
  // Ticket "Dashboard groupe Coach V1" §31 : optionnel, jamais utilisé par le
  // dashboard global (comportement exact inchangé, tous les items affichés).
  // Le dashboard groupe passe 5 pour plafonner l'affichage avec une
  // affordance "voir les N athlètes concernés" plutôt qu'une nouvelle route.
  maxVisible?: number;
  onShowAll?: () => void;
  emptyMessage?: string;
}

function AttentionList({ items, maxVisible, onShowAll, emptyMessage = 'Rien à signaler pour le moment.' }: AttentionListProps) {
  if (items.length === 0) {
    return (
      <section aria-labelledby="attention-heading">
        <SectionLabel id="attention-heading">Athlètes à suivre</SectionLabel>
        <p className="mt-3 text-sm text-ekvara-black/60">{emptyMessage}</p>
      </section>
    );
  }

  const visibleItems = maxVisible ? items.slice(0, maxVisible) : items;
  const hiddenCount = items.length - visibleItems.length;

  return (
    <section aria-labelledby="attention-heading">
      <SectionLabel id="attention-heading">Athlètes à suivre</SectionLabel>
      <ul className="mt-2 divide-y divide-gray-100">
        {visibleItems.map((item) => (
          <li key={item.athlete.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-3">
            <span className="text-sm font-semibold text-ekvara-black">{athleteName(item.athlete)}</span>
            <span className="flex flex-wrap gap-1.5">
              {item.reasons.map((reason, index) => (
                // Pas de rouge massif (ticket §19) : neutre, réservé au futur
                // pour une vraie alerte critique.
                <span
                  key={`${reason.type}-${index}`}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-ekvara-black/70"
                >
                  {attentionReasonLabel(reason.type)}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-2 text-sm font-medium text-ekvara-black/60 underline decoration-ekvara-black/20 underline-offset-2 hover:text-ekvara-black"
        >
          Voir les {items.length} athlètes concernés
        </button>
      )}
    </section>
  );
}

export default AttentionList;
