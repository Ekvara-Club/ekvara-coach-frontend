import { formatWeekLabel } from '../../utils/week';

interface WeekControlProps {
  monday: Date;
  sunday: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

// Même contrôle de semaine que ActivityPage.tsx (EkvaraFrontend, ticket #4
// §6) : "Aujourd'hui" et les flèches restent discrets, la période reste
// l'élément visuellement fort.
function WeekControl({ monday, sunday, onPrevious, onNext, onToday }: WeekControlProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onToday}
        className="text-xs font-semibold uppercase tracking-wide text-ekvara-muted transition-colors hover:text-ekvara-black"
      >
        Aujourd'hui
      </button>

      <span className="h-4 w-px bg-gray-200" aria-hidden="true" />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrevious}
          aria-label="Semaine précédente"
          className="-mx-2 flex h-11 w-11 items-center justify-center text-ekvara-black/55 transition-colors hover:text-ekvara-black"
        >
          &larr;
        </button>
        <p className="font-display text-lg font-bold uppercase tracking-wide text-ekvara-black">
          {formatWeekLabel(monday, sunday)}
        </p>
        <button
          type="button"
          onClick={onNext}
          aria-label="Semaine suivante"
          className="-mx-2 flex h-11 w-11 items-center justify-center text-ekvara-black/55 transition-colors hover:text-ekvara-black"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}

export default WeekControl;
