import type { MouseEvent } from 'react';

// Navigation SPA minimale sans dépendance ajoutée (pas de react-router-dom) —
// même approche que EkvaraFrontend (voir ticket §2 : "navigation maison").
export function navigateTo(path: string, mode: 'push' | 'replace' = 'push'): void {
  if (window.location.pathname === path) return;
  if (mode === 'push') {
    window.history.pushState({}, '', path);
  } else {
    window.history.replaceState({}, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string): void {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
    return;
  }
  event.preventDefault();
  navigateTo(href, 'push');
}
