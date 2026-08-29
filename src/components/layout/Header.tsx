import { useEffect, useState } from 'react';
import { useCoachAuth } from '../../contexts/CoachAuthContext';
import { handleNavClick } from '../../utils/navigation';

interface NavItem {
  label: string;
  href: string;
}

// Une seule route par item, jamais de lien mort (aucune page non construite
// derrière un lien du Header).
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Athlètes', href: '/athletes' },
  { label: 'Groupes', href: '/groups' },
  { label: 'Planning', href: '/planning' },
  { label: 'Exercices', href: '/exercises' },
  { label: 'Compétitions', href: '/competitions' },
];

function Header() {
  const { coach, logout } = useCoachAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  function handleLogout() {
    setIsMenuOpen(false);
    logout().catch((error: Error) => {
      console.error('Erreur lors de la déconnexion', error);
    });
  }

  const user = coach?.user;
  const initial = user?.prenom?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?';
  const fullName = user ? [user.prenom, user.nom].filter(Boolean).join(' ') : '';
  const identityLabel = fullName || user?.email || '';

  return (
    <header className="border-b border-gray-200 bg-ekvara-surface">
      {/* max-w-4xl : même grille que le contenu de toutes les pages (ticket
          #6 §3) — auparavant max-w-6xl, désaligné visuellement des bords du
          contenu principal. */}
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6">
        {/* Même wordmark EKVARA que l'app athlète, jamais un second logo
            (ticket §4) : "COACH" en discret sous le nom de marque. */}
        <a
          href="/"
          onClick={(event) => handleNavClick(event, '/')}
          className="flex flex-col leading-none"
        >
          <span className="font-display text-xl font-extrabold tracking-tight text-ekvara-black">
            EKVARA
          </span>
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-ekvara-muted">
            Coach
          </span>
        </a>

        {/* flex-wrap + gap réduit (ticket #5) : 5 items ("Exercices" ajouté)
            ne tiennent plus systématiquement sur une seule ligne à 390px —
            wrap sur 2 lignes plutôt qu'un débordement horizontal. */}
        <nav className="order-3 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:order-2 sm:w-auto sm:flex-nowrap sm:gap-x-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(event) => handleNavClick(event, item.href)}
                aria-current={isActive ? 'page' : undefined}
                className={`border-b pb-0.5 text-sm transition-colors ${
                  isActive
                    ? 'border-ekvara-black font-semibold text-ekvara-black'
                    : 'border-transparent font-medium text-ekvara-black/60 hover:text-ekvara-black'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="relative order-2 sm:order-3">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Profil coach"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ekvara-black text-sm font-semibold text-ekvara-surface transition-shadow ${
              isMenuOpen ? 'ring-2 ring-ekvara-black/20 ring-offset-2 ring-offset-ekvara-surface' : ''
            }`}
          >
            {initial}
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-gray-200 bg-ekvara-surface py-2 shadow-sm"
              >
                {identityLabel && (
                  <div className="px-3 py-2.5">
                    <p className="font-display text-sm font-bold text-ekvara-black">{identityLabel}</p>
                    {fullName && user?.email && (
                      <p className="mt-0.5 truncate text-xs text-ekvara-muted">{user.email}</p>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-sm text-ekvara-black hover:bg-gray-50"
                >
                  Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
