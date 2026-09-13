import { useEffect, useState } from 'react';

// Généralise le menu contextuel déjà validé dans Header.tsx (bouton
// déclencheur + role="menu" + overlay plein écran pour fermer au clic
// extérieur + Escape) — réutilisé ici pour le menu "…" par athlète
// (/athletes) et le menu "…" de /groups/:groupId (ticket #2 §21 : créer un
// composant partagé seulement s'il est vraiment réutilisé plusieurs fois).
interface DropdownMenuItem {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

interface DropdownMenuProps {
  triggerLabel: string;
  items: DropdownMenuItem[];
}

function DropdownMenu({ triggerLabel, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={triggerLabel}
        aria-haspopup="true"
        aria-expanded={open}
        className="rounded px-2 py-1 text-lg leading-none text-ekvara-black/40 transition-colors hover:text-ekvara-black"
      >
        &#8230;
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-52 rounded-md border border-gray-200 bg-ekvara-surface py-1 shadow-sm"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  item.destructive ? 'text-red-600' : 'text-ekvara-black'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default DropdownMenu;
