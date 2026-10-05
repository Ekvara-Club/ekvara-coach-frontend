import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

// Coquille commune à toutes les modales du ticket #2 (AddAthleteModal,
// ManageGroupsModal, CreateGroupModal, RenameGroupModal, AddGroupMemberModal,
// les confirmations destructives) — porté depuis EkvaraFrontend
// (src/components/ui/Modal.tsx), seule l'habillage visuel change pour
// coller aux tokens déjà utilisés ici (bg-ekvara-surface, pas bg-white —
// voir Header.tsx qui établit déjà cette convention pour un panneau
// flottant). Ne jamais dupliquer cette logique de piège de focus par
// modale (ticket §20).
interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null,
  );
}

function Modal({ title, onClose, children, maxWidthClassName = 'max-w-md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Capturé pendant le rendu initial (pas dans useEffect) : un champ enfant
  // avec autoFocus (ex. TrainingFormModal) reçoit le focus natif du
  // navigateur avant que le useEffect de la modale ne s'exécute, donc lire
  // document.activeElement depuis l'effet capturait le champ autofocus
  // lui-même au lieu du déclencheur (ticket #6 §28 — bug réel trouvé en
  // testant la restauration de focus au clavier).
  const [previouslyFocused] = useState<HTMLElement | null>(() => document.activeElement as HTMLElement | null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (!panel.contains(document.activeElement)) {
      const [first] = getFocusableElements(panel);
      (first ?? panel).focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panel) return;

      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (panel && !panel.contains(event.target as Node)) {
        const [first] = getFocusableElements(panel);
        (first ?? panel).focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previouslyFocused]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ekvara-black/60 px-4 py-8">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex max-h-full w-full ${maxWidthClassName} flex-col overflow-hidden rounded-md border border-gray-200 bg-ekvara-surface shadow-sm`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
          <h2 id={titleId} className="font-display text-lg font-bold text-ekvara-black">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-xl leading-none text-ekvara-black/55 transition-colors hover:bg-gray-100 hover:text-ekvara-black"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
